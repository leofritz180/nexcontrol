import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Cria cobranca PIX via Mercado Pago.
// Aceita amount variavel (plano base, upgrade de operador, etc).
export async function POST(req) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      email,
      name,
      amount,
      cpfCnpj,
      description,
      tenant_id: tenantIdIn,
      user_id: userIdIn,
      plan_id,
    } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'email e name sao obrigatorios' }, { status: 400 })
    }

    const transactionAmount = Number(amount) > 0 ? Number(amount) : 39.9

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Resolver tenant/user via email se nao vierem
    let tenantId = tenantIdIn
    let userId = userIdIn
    if (!tenantId || !userId) {
      const { data: profile } = await sb.from('profiles')
        .select('id,tenant_id')
        .eq('email', email).maybeSingle()
      if (!profile) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
      tenantId = tenantId || profile.tenant_id
      userId = userId || profile.id
    }

    // Monta payer (CPF opcional — se vier, melhora conversao)
    const payer = { email, first_name: name }
    if (cpfCnpj) {
      const digits = String(cpfCnpj).replace(/\D/g, '')
      if (digits.length === 11) {
        payer.identification = { type: 'CPF', number: digits }
      }
    }

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: transactionAmount,
        description: description || 'NexControl - Assinatura',
        payment_method_id: 'pix',
        payer,
      }),
    })

    const text = await mpRes.text()
    let payment = {}
    if (text) { try { payment = JSON.parse(text) } catch { payment = { _raw: text } } }

    if (!mpRes.ok || !payment?.id) {
      const msg = payment?.message || payment?._raw || `MP HTTP ${mpRes.status}`
      console.error('[MP create-payment] error', mpRes.status, msg)
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const mpId = String(payment.id)
    const qrCode = payment?.point_of_interaction?.transaction_data?.qr_code || ''
    const qrBase64 = payment?.point_of_interaction?.transaction_data?.qr_code_base64 || ''

    await sb.from('mp_payments').insert({
      tenant_id: tenantId,
      user_id: userId,
      mp_payment_id: mpId,
      status: 'pending',
      amount: transactionAmount,
      pix_qr_code: qrCode,
      pix_qr_code_base64: qrBase64,
    })

    // Retorno com aliases compativeis com o contrato do PixPayment.js (Asaas)
    return NextResponse.json({
      id: mpId,
      payment_id: mpId,
      qr_code: qrCode,
      qr_code_base64: qrBase64,
      pix_payload: qrCode,
      pix_qr_code: qrBase64,
    })
  } catch (err) {
    console.error('[MP create-payment] error', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
