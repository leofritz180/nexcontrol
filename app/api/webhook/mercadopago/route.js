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
      .select('id,tenant_id,user_id,status,amount,operator_count')
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
        const nowDate = new Date()
        const now = nowDate.toISOString()

        // ALINHAMENTO DE CICLO: se ja existe sub ativa valida (expires_at > now),
        // este pagamento eh UPGRADE → expires_at = expires_at MAIS ANTIGO existente,
        // mantendo o ciclo mensal alinhado com a data da assinatura original.
        // Se nao tem nenhuma sub valida → novo ciclo: expires_at = now + 30 dias.
        const { data: activeSubs } = await sb.from('subscriptions')
          .select('expires_at')
          .eq('tenant_id', record.tenant_id)
          .eq('status', 'active')

        const validExpiries = (activeSubs || [])
          .map(s => s.expires_at ? new Date(s.expires_at) : null)
          .filter(d => d && d > nowDate)
          .sort((a, b) => a - b) // crescente: pegamos o MIN (data mais antiga = ciclo original)

        let expires
        if (validExpiries.length > 0) {
          // Upgrade: alinha ao ciclo original
          expires = validExpiries[0]
          console.log('[MP webhook] alinhando expires_at ao ciclo do tenant:', expires.toISOString())
        } else {
          // Novo ciclo: now + 30 dias
          expires = new Date(nowDate.getTime() + 30 * 86400000)
        }

        // Resolve operator_count: prioriza valor desejado salvo na compra.
        let resolvedOpCount = Number(record.operator_count)
        if (!Number.isFinite(resolvedOpCount) || resolvedOpCount <= 0) {
          const { count: currentOps } = await sb.from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', record.tenant_id)
            .eq('role', 'operator')
          const { data: prevSub } = await sb.from('subscriptions')
            .select('operator_count')
            .eq('tenant_id', record.tenant_id)
            .order('created_at', { ascending: false }).limit(1).maybeSingle()
          const prevLimit = Number(prevSub?.operator_count || 0)
          resolvedOpCount = Math.max(prevLimit, (currentOps || 0) + 1)
        }

        await sb.from('tenants').update({
          subscription_status: 'active',
        }).eq('id', record.tenant_id)

        await sb.from('subscriptions').insert({
          tenant_id: record.tenant_id,
          status: 'active',
          payment_method: 'pix_mp',
          external_id: String(payment.id),
          total_amount: record.amount,
          operator_count: resolvedOpCount,
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
