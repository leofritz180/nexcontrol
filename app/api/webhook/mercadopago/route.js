import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Webhook do Mercado Pago: recebe notificacao, busca o pagamento na API,
// atualiza status no DB e ativa PRO quando aprovado.
export async function POST(req) {
  try {
    // Validacao de origem (opcional): se MP_WEBHOOK_SECRET estiver setada,
    // exige header x-mp-secret ou query ?secret=...
    const expected = process.env.MP_WEBHOOK_SECRET
    if (expected) {
      const headerSecret = req.headers.get('x-mp-secret')
      const querySecret = new URL(req.url).searchParams.get('secret')
      if (headerSecret !== expected && querySecret !== expected) {
        console.warn('[MP webhook] unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json().catch(() => ({}))
    // MP envia { type: 'payment', data: { id } } ou { action: 'payment.updated', data: { id } }
    const paymentId = body?.data?.id || body?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true, msg: 'no payment id' })
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('[MP webhook] MP_ACCESS_TOKEN not configured')
      return NextResponse.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 })
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    if (!mpRes.ok) {
      console.error('[MP webhook] MP fetch failed', mpRes.status)
      return NextResponse.json({ ok: true, msg: 'MP fetch failed' })
    }
    const payment = await mpRes.json()
    console.log('[MP webhook] received', { id: payment.id, status: payment.status })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: record } = await sb.from('mp_payments')
      .select('id,tenant_id,user_id,status,amount')
      .eq('mp_payment_id', String(payment.id)).maybeSingle()

    if (!record) {
      console.warn('[MP webhook] payment not registered', payment.id)
      return NextResponse.json({ ok: true, msg: 'payment not registered' })
    }

    if (record.status === payment.status) {
      return NextResponse.json({ ok: true, msg: 'already processed' })
    }

    await sb.from('mp_payments').update({
      status: payment.status,
      updated_at: new Date().toISOString(),
    }).eq('mp_payment_id', String(payment.id))

    if (payment.status === 'approved') {
      // Idempotencia: se ja existe sub com esse external_id, nao duplica
      const { data: existingSub } = await sb.from('subscriptions')
        .select('id').eq('external_id', String(payment.id)).maybeSingle()

      if (existingSub) {
        console.log('[MP webhook] PRO ja ativo pra payment', payment.id)
      } else {
        const expires = new Date()
        expires.setDate(expires.getDate() + 30)
        const now = new Date().toISOString()

        // Contar operadores reais do tenant no momento do pagamento
        // para gravar operator_count correto na subscription
        const { count: opCount } = await sb.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', record.tenant_id)
          .eq('role', 'operator')

        await sb.from('tenants').update({
          subscription_status: 'active',
        }).eq('id', record.tenant_id)

        await sb.from('subscriptions').insert({
          tenant_id: record.tenant_id,
          status: 'active',
          payment_method: 'pix_mp',
          external_id: String(payment.id),
          total_amount: record.amount,
          operator_count: opCount || 0,
          starts_at: now,
          expires_at: expires.toISOString(),
        })

        // Flag dedicada — best-effort (se coluna nao existir, ignora)
        try {
          await sb.from('profiles').update({
            is_pro: true,
            pro_activated_at: now,
          }).eq('id', record.user_id)
        } catch (e) {
          console.error('[MP webhook] is_pro update failed', e?.message)
        }

        console.log('[MP webhook] PRO ativado', { tenant: record.tenant_id, payment: payment.id })
      }
    }

    return NextResponse.json({ ok: true, status: payment.status })
  } catch (err) {
    console.error('[MP webhook] error', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
