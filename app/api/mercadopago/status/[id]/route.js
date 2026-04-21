import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usado pelo polling do frontend. Consulta DB primeiro; se ainda pendente,
// bate no MP pra atualizar o status (cobre o caso de webhook atrasado).
export async function GET(_req, { params }) {
  try {
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: record } = await sb.from('mp_payments')
      .select('id,tenant_id,status,amount')
      .eq('mp_payment_id', String(id)).maybeSingle()

    if (!record) return NextResponse.json({ status: 'unknown' })

    // Se ainda nao aprovado, consulta MP diretamente
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
            return NextResponse.json({ status: pay.status })
          }
        }
      } catch {}
    }

    return NextResponse.json({ status: record.status })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function activatePro(sb, record, paymentId) {
  // Idempotencia: se ja existe subscription ativa com esse external_id, nao duplica
  const { data: existing } = await sb.from('subscriptions')
    .select('id').eq('external_id', paymentId).maybeSingle()
  if (existing) return

  const expires = new Date()
  expires.setDate(expires.getDate() + 30)

  await sb.from('tenants').update({
    subscription_status: 'active',
  }).eq('id', record.tenant_id)

  await sb.from('subscriptions').insert({
    tenant_id: record.tenant_id,
    status: 'active',
    payment_method: 'pix_mp',
    external_id: paymentId,
    total_amount: record.amount,
    starts_at: new Date().toISOString(),
    expires_at: expires.toISOString(),
  })
}
