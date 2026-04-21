import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Webhook do Mercado Pago: recebe notificacao, busca o pagamento na API,
// atualiza status no DB e ativa PRO quando aprovado.
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    // MP envia { type: 'payment', data: { id } } ou { action: 'payment.updated', data: { id } }
    const paymentId = body?.data?.id || body?.id
    if (!paymentId) return NextResponse.json({ ok: true, msg: 'no payment id' })

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 })
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    if (!mpRes.ok) return NextResponse.json({ ok: true, msg: 'MP fetch failed' })
    const payment = await mpRes.json()

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: record } = await sb.from('mp_payments')
      .select('id,tenant_id,user_id,status,amount')
      .eq('mp_payment_id', String(payment.id)).maybeSingle()

    if (!record) return NextResponse.json({ ok: true, msg: 'payment not registered' })
    if (record.status === payment.status) {
      return NextResponse.json({ ok: true, msg: 'already processed' })
    }

    await sb.from('mp_payments').update({
      status: payment.status,
      updated_at: new Date().toISOString(),
    }).eq('mp_payment_id', String(payment.id))

    if (payment.status === 'approved') {
      // Idempotencia pela external_id
      const { data: existing } = await sb.from('subscriptions')
        .select('id').eq('external_id', String(payment.id)).maybeSingle()
      if (!existing) {
        const expires = new Date()
        expires.setDate(expires.getDate() + 30)

        await sb.from('tenants').update({
          subscription_status: 'active',
        }).eq('id', record.tenant_id)

        await sb.from('subscriptions').insert({
          tenant_id: record.tenant_id,
          status: 'active',
          payment_method: 'pix_mp',
          external_id: String(payment.id),
          total_amount: record.amount,
          starts_at: new Date().toISOString(),
          expires_at: expires.toISOString(),
        })
      }
    }

    return NextResponse.json({ ok: true, status: payment.status })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
