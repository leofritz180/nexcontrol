import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getOrCreateCustomer, createPixPayment, getPixQrCode } from '../../../../lib/asaas/client'

export async function POST(req) {
  try {
    const { tenant_id, user_id, plan_id, amount, name, email, cpfCnpj } = await req.json()
    if (!tenant_id || !user_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Get or create Asaas customer
    const customerId = await getOrCreateCustomer(supabase, user_id, {
      name: name || 'NexControl User',
      email: email || '',
      cpfCnpj,
    })

    // 2. Create PIX payment
    const payment = await createPixPayment(customerId, amount, `NexControl - Plano mensal`)

    // 3. Get QR Code
    const pix = await getPixQrCode(payment.id)

    // 4. Save to database
    await supabase.from('asaas_payments').insert({
      tenant_id,
      user_id,
      asaas_customer_id: customerId,
      asaas_payment_id: payment.id,
      status: payment.status,
      billing_type: 'PIX',
      amount,
      pix_payload: pix.payload,
      pix_qr_code: pix.encodedImage,
      plan_id: plan_id || null,
    })

    return NextResponse.json({
      ok: true,
      payment_id: payment.id,
      pix_payload: pix.payload,
      pix_qr_code: pix.encodedImage,
      status: payment.status,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
