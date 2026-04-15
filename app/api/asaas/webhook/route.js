import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    // Validate webhook token
    const token = req.headers.get('asaas-access-token')
    if (process.env.ASAAS_WEBHOOK_SECRET && token !== process.env.ASAAS_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const event = body.event
    const payment = body.payment

    if (!payment?.id) return NextResponse.json({ ok: true })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Update payment status
    const { data: existing } = await supabase
      .from('asaas_payments')
      .select('id,tenant_id,status')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ ok: true, msg: 'Payment not found' })

    // Avoid processing same status twice
    if (existing.status === payment.status) return NextResponse.json({ ok: true, msg: 'Already processed' })

    await supabase.from('asaas_payments').update({
      status: payment.status,
      updated_at: new Date().toISOString(),
    }).eq('asaas_payment_id', payment.id)

    // Activate subscription on confirmed payment
    if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)

      // Update tenant subscription
      await supabase.from('tenants').update({
        subscription_status: 'active',
      }).eq('id', existing.tenant_id)

      // Create/update subscription record
      await supabase.from('subscriptions').insert({
        tenant_id: existing.tenant_id,
        status: 'active',
        payment_method: 'pix_asaas',
        external_id: payment.id,
        total_amount: payment.value,
        starts_at: new Date().toISOString(),
        expires_at: expires.toISOString(),
      })

      // Comissao de afiliado (recorrente: cada pagamento aprovado gera 1 comissao)
      try {
        const { data: ref } = await supabase
          .from('referrals').select('affiliate_tenant_id')
          .eq('referred_tenant_id', existing.tenant_id).maybeSingle()
        if (ref?.affiliate_tenant_id) {
          const { data: aff } = await supabase
            .from('affiliates').select('enabled,commission_rate')
            .eq('tenant_id', ref.affiliate_tenant_id).maybeSingle()
          if (aff?.enabled) {
            const rate = Number(aff.commission_rate || 0.30)
            const amount = Number(payment.value || 0)
            const commission = Number((amount * rate).toFixed(2))
            // UNIQUE(asaas_payment_id) evita duplicidade em reentradas do webhook
            await supabase.from('affiliate_commissions').insert({
              affiliate_tenant_id: ref.affiliate_tenant_id,
              referred_tenant_id: existing.tenant_id,
              asaas_payment_id: payment.id,
              payment_amount: amount,
              commission_amount: commission,
              rate,
              status: 'pending',
            })
          }
        }
      } catch (e) {
        // nao bloqueia o webhook se comissao falhar
        console.error('affiliate commission error', e?.message)
      }
    }

    return NextResponse.json({ ok: true, status: payment.status })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
