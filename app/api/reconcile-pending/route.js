import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../lib/push'
import { maybeCreateCommission } from '../../../lib/affiliate-commission'
import { notifyOwnerOfPayment } from '../../../lib/notify-owner'

// Endpoint publico de reconciliacao rapida — varre mp_payments pending dos
// ultimos 30min, consulta MP e ativa os aprovados. Rate-limited em memoria
// (1 execucao por minuto) pra nao sobrecarregar a API do MP.
//
// Chamado por:
//   - /api/presence (todo ping de admin/operator online)
//   - /owner page mount + polling
//   - /billing-mp checkout success
//
// Diferente do cron diario: roda em segundos, nao tem limite de uso.

export const dynamic = 'force-dynamic'

const OWNER_EMAIL = 'leofritz180@gmail.com'

// Rate limit em memoria: garante no maximo 1 exec/minuto por instancia serverless.
// Em rajada (varios users online), so a primeira chamada efetivamente bate no MP.
let lastRunAt = 0
let lastResult = null
const MIN_INTERVAL_MS = 60 * 1000

async function doReconcile() {
  if (!process.env.MP_ACCESS_TOKEN) return { error: 'MP_ACCESS_TOKEN missing' }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Pendings dos ultimos 30min — janela curta porque eh chamada com frequencia
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: pendings } = await sb.from('mp_payments')
    .select('id,tenant_id,user_id,mp_payment_id,status,amount,operator_count,plan_months,created_at')
    .eq('status', 'pending')
    .gt('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(30)

  const stats = { checked: 0, activated: 0, still_pending: 0, errors: 0, activations: [] }

  for (const rec of pendings || []) {
    stats.checked++
    try {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${rec.mp_payment_id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      })
      if (!r.ok) { stats.errors++; continue }
      const pay = await r.json()
      const mpStatus = pay.status

      if (mpStatus === 'approved') {
        await sb.from('mp_payments').update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        }).eq('mp_payment_id', rec.mp_payment_id)

        const result = await activatePro(sb, rec, rec.mp_payment_id)
        if (result.created) {
          stats.activated++
          stats.activations.push({
            mp_id: rec.mp_payment_id,
            amount: rec.amount,
            tenant_id: rec.tenant_id,
          })
        }
      } else if (mpStatus === 'cancelled' || mpStatus === 'rejected' || mpStatus === 'expired') {
        await sb.from('mp_payments').update({
          status: mpStatus,
          updated_at: new Date().toISOString(),
        }).eq('mp_payment_id', rec.mp_payment_id)
      } else {
        stats.still_pending++
      }
    } catch (e) {
      console.error('[reconcile-pending] erro', rec.mp_payment_id, e?.message)
      stats.errors++
    }
  }

  if (stats.activated > 0) {
    console.log('[reconcile-pending] ATIVADOS:', stats.activated, JSON.stringify(stats.activations))
  }

  return stats
}

async function handler() {
  const now = Date.now()
  if (now - lastRunAt < MIN_INTERVAL_MS) {
    return NextResponse.json({ rate_limited: true, cached: lastResult, next_run_in_ms: MIN_INTERVAL_MS - (now - lastRunAt) })
  }
  lastRunAt = now
  try {
    const result = await doReconcile()
    lastResult = result
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() { return handler() }
export async function POST() { return handler() }

// MESMA logica do webhook MP — duplicada aqui pra independencia
async function activatePro(sb, record, paymentId) {
  const { data: existingSub } = await sb.from('subscriptions')
    .select('id').eq('external_id', String(paymentId)).maybeSingle()
  if (existingSub) return { skipped: true, sub_id: existingSub.id }

  const nowDate = new Date()
  const now = nowDate.toISOString()

  const { data: activeSubs } = await sb.from('subscriptions')
    .select('expires_at').eq('tenant_id', record.tenant_id).eq('status', 'active')
  const validExpiries = (activeSubs || [])
    .map(s => s.expires_at ? new Date(s.expires_at) : null)
    .filter(d => d && d > nowDate)
    .sort((a, b) => b - a)
  const latestExpires = validExpiries[0]
  const planMonths = Number(record.plan_months) || 0

  let expires
  if (planMonths > 0) {
    const baseDate = (latestExpires && latestExpires > nowDate) ? latestExpires : nowDate
    expires = new Date(baseDate)
    expires.setMonth(expires.getMonth() + planMonths)
  } else if (latestExpires && latestExpires > nowDate) {
    expires = latestExpires
  } else {
    expires = new Date(nowDate)
    expires.setMonth(expires.getMonth() + 1)
  }

  let resolvedOpCount = Number(record.operator_count)
  if (!Number.isFinite(resolvedOpCount) || resolvedOpCount <= 0) {
    const { count: currentOps } = await sb.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', record.tenant_id).eq('role', 'operator')
    const { data: prevSub } = await sb.from('subscriptions')
      .select('operator_count').eq('tenant_id', record.tenant_id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    const prevLimit = Number(prevSub?.operator_count || 0)
    resolvedOpCount = Math.max(prevLimit, (currentOps || 0) + 1)
  }

  await sb.from('tenants').update({
    subscription_status: 'active',
  }).eq('id', record.tenant_id)

  const { data: newSub } = await sb.from('subscriptions').insert({
    tenant_id: record.tenant_id,
    status: 'active',
    payment_method: 'pix_mp',
    external_id: String(paymentId),
    total_amount: record.amount,
    operator_count: resolvedOpCount,
    plan_months: planMonths,
    starts_at: now,
    expires_at: expires.toISOString(),
  }).select().single()

  try {
    await sb.from('profiles').update({
      is_pro: true, pro_activated_at: now,
    }).eq('id', record.user_id)
  } catch {}

  try {
    await sendPushToUser(sb, record.user_id, {
      title: 'Pagamento confirmado!',
      body: 'Seu plano PRO foi ativado · acesso liberado',
      url: '/admin',
      tag: 'pro-activated',
    })
  } catch {}

  await maybeCreateCommission(sb, {
    tenantId: record.tenant_id,
    paymentId: paymentId,
    amount: record.amount,
  })

  await notifyOwnerOfPayment(sb, {
    tenantId: record.tenant_id,
    paymentId: paymentId,
    amount: record.amount,
    planMonths,
  })

  return { created: true, sub_id: newSub?.id, expires: expires.toISOString() }
}
