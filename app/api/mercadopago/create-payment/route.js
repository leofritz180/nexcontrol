import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPlan } from '../../../../lib/plans'
import { calculatePrice as calcOpTier } from '../../../../lib/pricing'

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
      operator_count: operatorCountIn,
      plan_period, // 'monthly' | 'quarterly' | 'semiannual' | 'annual'
    } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'email e name sao obrigatorios' }, { status: 400 })
    }

    // Resolucao do valor + duracao do plano:
    //   plan_period + amount  → valida amount contra calculatePrice (anti-fraude:
    //                           cliente nao pode mandar amount adulterado via devtools)
    //   plan_period sozinho   → calcula via lib/plans
    //   amount sozinho        → upgrade parcial (add-ops). planMonths=0. Minimo R$ 1,00.
    //   nada                  → default 39.9 / 1 mes (fallback)
    let transactionAmount, planMonths
    if (plan_period) {
      const plan = getPlan(plan_period)
      planMonths = plan.months
      // Preço REAL (idêntico ao front /billing-mp): admin R$39,90 + operadores
      // R$19,90 com desconto por volume (lib/pricing) × meses × desconto do período.
      // Antes usava lib/plans (flat R$39,90/operador) e bloqueava renovação de quem tinha 2+ operadores.
      const opsForCalc = Math.max(0, Number(operatorCountIn) || 0)
      const monthlyTier = calcOpTier(opsForCalc).total
      const expected = Number((monthlyTier * plan.months * (1 - plan.discount)).toFixed(2))
      if (Number(amount) > 0) {
        // Aceita amount enviado SE estiver dentro de 5% do valor esperado (margem de
        // arredondamento ou desconto promocional). Adulteracao via devtools (ex: 0,01
        // em vez de 359,10) sera bloqueada.
        const minAllowed = expected * 0.95
        if (Number(amount) < minAllowed) {
          console.warn('[MP create-payment] BLOQUEADO: amount adulterado', {
            email, plan_period, opsForCalc, expected, sent: Number(amount),
          })
          return NextResponse.json({
            error: 'Valor invalido para o plano selecionado.',
          }, { status: 400 })
        }
        transactionAmount = Number(amount)
      } else {
        transactionAmount = expected
      }
    } else if (Number(amount) > 0) {
      // Upgrade parcial (add-ops) — frontend manda so o amount, sem periodo
      if (Number(amount) < 1) {
        console.warn('[MP create-payment] BLOQUEADO: amount <R$1 sem plan_period', { email, sent: Number(amount) })
        return NextResponse.json({ error: 'Valor minimo de R$ 1,00.' }, { status: 400 })
      }
      transactionAmount = Number(amount)
      planMonths = 0
    } else {
      transactionAmount = 39.9
      planMonths = 1
    }

    // Safety net global: NUNCA aceitar pagamento abaixo de R$ 1,00 (alem das validacoes acima)
    if (transactionAmount < 1) {
      console.warn('[MP create-payment] BLOQUEADO: transactionAmount final <R$1', { email, transactionAmount })
      return NextResponse.json({ error: 'Valor invalido.' }, { status: 400 })
    }

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

    // Anti-duplicacao: se ja existe PIX pending dos ultimos 10min pro mesmo user
    // com o mesmo valor, reaproveita. Evita rajada de cliques + sobrecarga MP +
    // confusao (cliente paga o errado e fica orfao).
    try {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { data: existing } = await sb.from('mp_payments')
        .select('mp_payment_id,amount,pix_qr_code,pix_qr_code_base64,created_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('amount', transactionAmount)
        .gt('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing?.mp_payment_id) {
        console.log('[MP create-payment] reaproveitando PIX pending', existing.mp_payment_id, 'user', userId)
        return NextResponse.json({
          id: existing.mp_payment_id,
          payment_id: existing.mp_payment_id,
          qr_code: existing.pix_qr_code || '',
          qr_code_base64: existing.pix_qr_code_base64 || '',
          pix_payload: existing.pix_qr_code || '',
          pix_qr_code: existing.pix_qr_code_base64 || '',
          reused: true,
        })
      }
    } catch (e) { console.error('[MP create-payment] dedup check failed', e?.message) }

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

    // Persiste operator_count desejado (total apos a compra) para o webhook ler
    const operatorCount = Number(operatorCountIn)
    await sb.from('mp_payments').insert({
      tenant_id: tenantId,
      user_id: userId,
      mp_payment_id: mpId,
      status: 'pending',
      amount: transactionAmount,
      pix_qr_code: qrCode,
      pix_qr_code_base64: qrBase64,
      operator_count: Number.isFinite(operatorCount) && operatorCount > 0 ? operatorCount : null,
      plan_months: planMonths,
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
