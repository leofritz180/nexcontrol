import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usado pelo polling do frontend. Consulta DB primeiro; se ainda pendente,
// bate no MP pra atualizar o status (cobre caso de webhook atrasado).
export async function POST(req) {
  try {
    const { payment_id } = await req.json().catch(() => ({}))
    return await check(payment_id)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id')
  try {
    return await check(id)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function normalizeStatus(mpStatus) {
  // Normaliza pra os tokens que o frontend espera (compat Asaas: RECEIVED/CONFIRMED)
  if (mpStatus === 'approved') return 'RECEIVED'
  if (mpStatus === 'authorized') return 'CONFIRMED'
  return mpStatus || 'pending'
}

async function check(id) {
  if (!id) return NextResponse.json({ error: 'payment_id obrigatorio' }, { status: 400 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: record } = await sb.from('mp_payments')
    .select('id,tenant_id,user_id,status,amount,operator_count,plan_months')
    .eq('mp_payment_id', String(id)).maybeSingle()

  if (!record) return NextResponse.json({ status: 'unknown' })

  // Se ainda nao aprovado, consulta MP direto (fallback pra webhook atrasado)
  if (record.status !== 'approved' && process.env.MP_ACCESS_TOKEN) {
    try {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      })
      if (r.ok) {
        const pay = await r.json()
        if (pay?.status && pay.status !== record.status) {
          await sb.from('mp_payments').update({
            status: pay.status,
            updated_at: new Date().toISOString(),
          }).eq('mp_payment_id', String(id))

          if (pay.status === 'approved') {
            await activatePro(sb, record, String(id))
          }
          return NextResponse.json({ status: normalizeStatus(pay.status), mp_status: pay.status })
        }
      }
    } catch (e) {
      console.error('[MP check-payment] MP fetch error', e?.message)
    }
  }

  return NextResponse.json({ status: normalizeStatus(record.status), mp_status: record.status })
}

async function activatePro(sb, record, paymentId) {
  // Idempotencia por external_id — se ja existe sub com esse payment_id, nao duplica
  const { data: existingSub } = await sb.from('subscriptions')
    .select('id').eq('external_id', paymentId).maybeSingle()
  if (existingSub) {
    console.log('[MP check-payment] PRO ja ativo pra payment', paymentId)
    return
  }

  const nowDate = new Date()
  const now = nowDate.toISOString()

  // CALCULO DE EXPIRES_AT (mesma logica do webhook — ver comentarios la):
  //   planMonths > 0 → estende ciclo (currentExpires + planMonths) ou cria novo (now + planMonths)
  //   planMonths = 0 → mantem ciclo atual (add-ops)
  const { data: activeSubsCheck } = await sb.from('subscriptions')
    .select('expires_at')
    .eq('tenant_id', record.tenant_id)
    .eq('status', 'active')
  const validExpiriesCheck = (activeSubsCheck || [])
    .map(s => s.expires_at ? new Date(s.expires_at) : null)
    .filter(d => d && d > nowDate)
    .sort((a, b) => b - a) // pega o MAIOR
  const planMonths = Number(record.plan_months) || 0
  const latestExpires = validExpiriesCheck[0]

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

  // Resolve operator_count: prioriza valor desejado salvo na compra.
  // Fallback (pagamentos antigos sem o campo): usa MAX entre count atual+1
  // e operator_count da sub anterior — nunca rebaixa o limite ja contratado.
  let resolvedOpCount = Number(record.operator_count)
  if (!Number.isFinite(resolvedOpCount) || resolvedOpCount <= 0) {
    const { count: currentOps } = await sb.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', record.tenant_id)
      .eq('role', 'operator')
    const { data: prevSub } = await sb.from('subscriptions')
      .select('operator_count')
      .eq('tenant_id', record.tenant_id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    const prevLimit = Number(prevSub?.operator_count || 0)
    resolvedOpCount = Math.max(prevLimit, (currentOps || 0) + 1)
  }

  await sb.from('tenants').update({
    subscription_status: 'active',
  }).eq('id', record.tenant_id)

  await sb.from('subscriptions').insert({
    tenant_id: record.tenant_id,
    status: 'active',
    payment_method: 'pix_mp',
    external_id: paymentId,
    total_amount: record.amount,
    operator_count: resolvedOpCount,
    plan_months: planMonths,
    starts_at: now,
    expires_at: expires.toISOString(),
  })

  // Flag dedicada is_pro — best-effort (se coluna nao existir, ignora)
  try {
    await sb.from('profiles').update({
      is_pro: true,
      pro_activated_at: now,
    }).eq('id', record.user_id)
  } catch (e) {
    console.error('[MP check-payment] is_pro update failed (column may not exist)', e?.message)
  }

  console.log('[MP check-payment] PRO ativado', { tenant: record.tenant_id, payment: paymentId })
}
