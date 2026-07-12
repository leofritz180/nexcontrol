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

    // ─────────────────────────────────────────────────────────────────────────
    // AUTORIDADE DO SERVIDOR sobre a quantidade de operadores.
    // Antes o preco era calculado com o operator_count enviado pelo CLIENTE (URL
    // ?operators=N / body) — furo que deixava renovar 10 operadores pagando so a base.
    // Agora o servidor conta os operadores ATIVOS reais no banco e a renovacao SEMPRE
    // cobre todos eles. Pra pagar menos, o admin tem que REMOVER operador (o count cai
    // aqui). So conta operadores nao removidos do tenant.
    let realOps = 0
    try {
      const { count } = await sb.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).eq('role', 'operator')
        .is('removed_from_tenant_id', null)
      realOps = Number(count) || 0
    } catch (e) { console.error('[MP create-payment] contagem de operadores falhou', e?.message) }

    // Ha ciclo ativo NAO vencido? Distingue renovacao (cria/estende ciclo) de UPGRADE
    // (adicionar operadores dentro de um ciclo vigente). currentPaidOps = quantos
    // operadores o ciclo atual JA cobre (MAX operator_count das subs ativas nao vencidas).
    let hasActiveCycle = false
    let currentPaidOps = 0
    try {
      const nowD = new Date()
      const { data: actSubs } = await sb.from('subscriptions')
        .select('expires_at, operator_count').eq('tenant_id', tenantId).eq('status', 'active')
      for (const s of (actSubs || [])) {
        if (s.expires_at && new Date(s.expires_at) > nowD) {
          hasActiveCycle = true
          currentPaidOps = Math.max(currentPaidOps, Number(s.operator_count || 0))
        }
      }
    } catch {}

    // Preco mensal correto pra TODOS os operadores ativos (piso de qualquer renovacao).
    const fullMonthly = Number(calcOpTier(realOps).total)

    // Resolucao do valor + duracao do plano:
    //   plan_period          → renovacao. opsForCalc = MAX(cliente, operadores reais).
    //                          amount validado contra o preco de TODOS os operadores.
    //   amount sozinho        → add-op se ha ciclo ativo (pro-rata, min R$1);
    //                          se NAO ha ciclo (viraria renovacao no fallback), exige
    //                          o preco cheio de todos os operadores.
    //   nada                  → default = preco cheio mensal / 1 mes.
    let transactionAmount, planMonths, resolvedOps
    if (plan_period) {
      const plan = getPlan(plan_period)
      planMonths = plan.months
      const opsForCalc = Math.max(Number(operatorCountIn) || 0, realOps)
      resolvedOps = opsForCalc
      const monthlyTier = calcOpTier(opsForCalc).total
      const expected = Number((monthlyTier * plan.months * (1 - plan.discount)).toFixed(2))
      const minAllowed = expected * 0.95
      if (Number(amount) > 0) {
        if (Number(amount) < minAllowed) {
          console.warn('[MP create-payment] BLOQUEADO: amount abaixo do preco de', opsForCalc, 'operadores', { email, plan_period, opsForCalc, expected, sent: Number(amount) })
          return NextResponse.json({
            error: `Valor invalido: a renovacao precisa cobrir seus ${opsForCalc} operador(es) ativos. Remova operadores no painel se quiser pagar menos.`,
          }, { status: 400 })
        }
        // Nunca cobra menos que o esperado, mesmo aceitando o amount do cliente.
        transactionAmount = Math.max(Number(amount), expected)
      } else {
        transactionAmount = expected
      }
    } else if (Number(amount) > 0) {
      const amt = Number(amount)
      if (amt < 1) {
        console.warn('[MP create-payment] BLOQUEADO: amount <R$1 sem plan_period', { email, sent: amt })
        return NextResponse.json({ error: 'Valor minimo de R$ 1,00.' }, { status: 400 })
      }
      planMonths = 0
      if (!hasActiveCycle) {
        // Sem ciclo ativo, esse pagamento viraria uma RENOVACAO (fallback 30d no webhook).
        // Entao tem que cobrir todos os operadores — senao e o furo do valor avulso.
        if (amt < fullMonthly * 0.95) {
          console.warn('[MP create-payment] BLOQUEADO: renovacao avulsa abaixo do preco de', realOps, 'operadores', { email, realOps, fullMonthly, sent: amt })
          return NextResponse.json({
            error: `Seu plano venceu. A renovacao precisa cobrir seus ${realOps} operador(es) ativos (R$ ${fullMonthly.toFixed(2).replace('.', ',')}). Remova operadores no painel se quiser pagar menos.`,
          }, { status: 400 })
        }
        resolvedOps = realOps
      } else {
        // UPGRADE dentro do ciclo (a base ja esta paga). ALVO = MAX(desejado pelo
        // cliente, operadores reais, ja pago):
        //   - operadores reais = PISO (nunca deixa realOps acima do limite → anti-fraude);
        //   - desejado > reais → PRE-COMPRA de slots: as vagas extras ficam "abertas"
        //     (o admin pode criar os operadores depois). Corrige o caso de pagar a
        //     adicao ANTES de criar os perfis (bug que cobrava sem liberar).
        // Cobra so o DELTA ate o alvo (nao recobra a base). Anti-fraude: tem que pagar
        // o delta cheio pro alvo — nao da pra inflar o limite pagando pouco.
        const desired = Math.max(Number(operatorCountIn) || 0, realOps, currentPaidOps)
        if (desired > currentPaidOps) {
          const requiredDelta = Number((calcOpTier(desired).total - calcOpTier(currentPaidOps).total).toFixed(2))
          if (amt < requiredDelta * 0.95) {
            console.warn('[MP create-payment] BLOQUEADO: valor abaixo do delta pro alvo de operadores', { email, currentPaidOps, realOps, desired, requiredDelta, sent: amt })
            return NextResponse.json({
              error: `Pra ir pra ${desired} operador(es) neste ciclo faltam R$ ${requiredDelta.toFixed(2).replace('.', ',')}.`,
            }, { status: 400 })
          }
          resolvedOps = desired
        } else {
          // Nao aumenta o limite (alvo <= ja pago e sem excesso real) — nada a cobrar.
          // Evita o furo de COBRAR SEM ENTREGAR (pagar e o limite nao subir).
          console.warn('[MP create-payment] BLOQUEADO: add-op sem aumento de limite', { email, currentPaidOps, realOps, desired, sent: amt })
          return NextResponse.json({
            error: 'Nada a adicionar: seu plano ja cobre esse número de operadores.',
          }, { status: 400 })
        }
      }
      transactionAmount = amt
    } else {
      transactionAmount = fullMonthly
      planMonths = 1
      resolvedOps = realOps
    }

    // Safety net global: NUNCA aceitar pagamento abaixo de R$ 1,00 (alem das validacoes acima)
    if (transactionAmount < 1) {
      console.warn('[MP create-payment] BLOQUEADO: transactionAmount final <R$1', { email, transactionAmount })
      return NextResponse.json({ error: 'Valor invalido.' }, { status: 400 })
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

    // Persiste o operator_count REAL cobrado (autoridade do servidor) pro webhook ler.
    const operatorCount = Number(resolvedOps)
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
