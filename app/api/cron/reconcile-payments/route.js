import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'

// Reconcile pagamentos: pega TODOS mp_payments com status='pending' criados
// ha mais de 10 min, consulta o MP e:
//   - se approved → ativa sub (mesma logica do webhook)
//   - se cancelled/rejected/expired → sincroniza status
//
// Roda de hora em hora. Cobre casos onde o webhook do MP falhou/atrasou.
//
// GET /api/cron/reconcile-payments?secret=YOUR_SECRET

const OWNER_EMAIL = 'leofritz180@gmail.com'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Pega pendings com >10min (pra dar tempo do webhook normal chegar primeiro)
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: pendings } = await sb.from('mp_payments')
    .select('id,tenant_id,user_id,mp_payment_id,status,amount,operator_count,plan_months,created_at')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(200) // safety cap

  const stats = {
    checked: 0,
    activated: 0,
    cancelled_sync: 0,
    still_pending: 0,
    errors: 0,
    activations: [], // pra log
  }

  for (const rec of pendings || []) {
    stats.checked++
    try {
      // Consulta MP
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${rec.mp_payment_id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      })
      if (!r.ok) {
        console.error('[reconcile] MP fetch fail', rec.mp_payment_id, r.status)
        stats.errors++
        continue
      }
      const pay = await r.json()
      const mpStatus = pay.status

      if (mpStatus === 'approved') {
        // 1) Atualiza mp_payments
        await sb.from('mp_payments').update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        }).eq('mp_payment_id', rec.mp_payment_id)

        // 2) Ativa sub (idempotente)
        const result = await activatePro(sb, rec, rec.mp_payment_id)
        if (result.created) {
          stats.activated++
          stats.activations.push({
            mp_id: rec.mp_payment_id,
            amount: rec.amount,
            tenant_id: rec.tenant_id,
            sub_id: result.sub_id,
          })
          console.log('[reconcile] ✅ ativado:', rec.mp_payment_id, 'R$', rec.amount)
        }
      } else if (mpStatus === 'cancelled' || mpStatus === 'rejected' || mpStatus === 'expired') {
        await sb.from('mp_payments').update({
          status: mpStatus,
          updated_at: new Date().toISOString(),
        }).eq('mp_payment_id', rec.mp_payment_id)
        stats.cancelled_sync++
      } else {
        stats.still_pending++
      }
    } catch (e) {
      console.error('[reconcile] erro processando', rec.mp_payment_id, e.message)
      stats.errors++
    }
  }

  // Se ativou algo, notifica o owner via push
  if (stats.activated > 0) {
    try {
      const { data: owner } = await sb.from('profiles').select('id').eq('email', OWNER_EMAIL).maybeSingle()
      if (owner?.id) {
        const totalR = stats.activations.reduce((s, a) => s + Number(a.amount || 0), 0)
        await sendPushToUser(sb, owner.id, {
          title: `Reconcile: ${stats.activated} pagamento(s) recuperado(s)`,
          body: `R$ ${totalR.toFixed(2).replace('.', ',')} ativados (webhooks perdidos)`,
          url: '/owner',
          tag: 'reconcile-payments',
        })
      }
    } catch (e) {
      console.error('[reconcile] push owner falhou', e.message)
    }
  }

  console.log('[reconcile] resumo:', JSON.stringify(stats))
  return NextResponse.json({ ok: true, ...stats })
}

// MESMA logica do webhook MP — extende ciclo quando planMonths > 0
async function activatePro(sb, record, paymentId) {
  // Idempotencia
  const { data: existingSub } = await sb.from('subscriptions')
    .select('id').eq('external_id', String(paymentId)).maybeSingle()
  if (existingSub) {
    return { skipped: true, sub_id: existingSub.id }
  }

  const nowDate = new Date()
  const now = nowDate.toISOString()

  const { data: activeSubs } = await sb.from('subscriptions')
    .select('expires_at')
    .eq('tenant_id', record.tenant_id)
    .eq('status', 'active')
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

  // Resolve operator_count
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

  // Notifica o cliente que a sub foi liberada
  try {
    await sendPushToUser(sb, record.user_id, {
      title: 'Pagamento confirmado!',
      body: 'Seu plano PRO foi ativado · acesso liberado',
      url: '/admin',
      tag: 'pro-activated',
    })
  } catch {}

  return { created: true, sub_id: newSub.id, expires: expires.toISOString() }
}
