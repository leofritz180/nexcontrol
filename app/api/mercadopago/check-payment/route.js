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
    .select('id,tenant_id,user_id,status,amount')
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

  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  const now = new Date().toISOString()

  await sb.from('tenants').update({
    subscription_status: 'active',
  }).eq('id', record.tenant_id)

  await sb.from('subscriptions').insert({
    tenant_id: record.tenant_id,
    status: 'active',
    payment_method: 'pix_mp',
    external_id: paymentId,
    total_amount: record.amount,
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
