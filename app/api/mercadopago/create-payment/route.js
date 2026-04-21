import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 })
    }

    const { email, name } = await req.json()
    if (!email || !name) {
      return NextResponse.json({ error: 'email e name sao obrigatorios' }, { status: 400 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile } = await sb.from('profiles')
      .select('id,tenant_id,email,nome')
      .eq('email', email).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: 39.9,
        description: 'NexControl PRO',
        payment_method_id: 'pix',
        payer: { email, first_name: name },
      }),
    })

    const payment = await mpRes.json()
    if (!mpRes.ok || !payment?.id) {
      return NextResponse.json({ error: payment?.message || 'Falha ao criar cobranca MP' }, { status: 400 })
    }

    const mpId = String(payment.id)
    const qrCode = payment?.point_of_interaction?.transaction_data?.qr_code || ''
    const qrBase64 = payment?.point_of_interaction?.transaction_data?.qr_code_base64 || ''

    await sb.from('mp_payments').insert({
      tenant_id: profile.tenant_id,
      user_id: profile.id,
      mp_payment_id: mpId,
      status: 'pending',
      amount: 39.9,
      pix_qr_code: qrCode,
      pix_qr_code_base64: qrBase64,
    })

    return NextResponse.json({
      id: mpId,
      qr_code: qrCode,
      qr_code_base64: qrBase64,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
