import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { maybeCreateCommission } from '../../../../lib/affiliate-commission'
import { notifyOwnerOfPayment } from '../../../../lib/notify-owner'

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
      .select('id,tenant_id,user_id,status,amount,operator_count,plan_months')
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

        // CALCULO DE EXPIRES_AT:
        //   planMonths > 0 (renovacao/assinatura completa):
        //     - sub ativa valida → estende: expires = currentExpires + planMonths (cumulativo!)
        //     - sem sub ativa    → novo ciclo: expires = now + planMonths
        //   planMonths = 0 (add-ops, upgrade parcial):
        //     - mantem expires_at do ciclo atual (so atualiza operator_count)
        const { data: activeSubs } = await sb.from('subscriptions')
          .select('expires_at')
          .eq('tenant_id', record.tenant_id)
          .eq('status', 'active')

        const validExpiries = (activeSubs || [])
          .map(s => s.expires_at ? new Date(s.expires_at) : null)
          .filter(d => d && d > nowDate)
          .sort((a, b) => b - a) // decrescente: pega o MAIOR expires_at (ultima renovacao valida)

        const planMonths = Number(record.plan_months) || 0
        const latestExpires = validExpiries[0] // pode ser undefined

        let expires
        if (planMonths > 0) {
          // Plano completo → estende ciclo (renovacao antecipada acumula dias)
          const baseDate = (latestExpires && latestExpires > nowDate) ? latestExpires : nowDate
          expires = new Date(baseDate)
          expires.setMonth(expires.getMonth() + planMonths)
          console.log('[MP webhook] ciclo de ' + planMonths + ' mes(es) a partir de ' + baseDate.toISOString() + ' → ' + expires.toISOString())
        } else if (latestExpires && latestExpires > nowDate) {
          // Upgrade parcial (add-ops) → mantem ciclo atual
          expires = latestExpires
          console.log('[MP webhook] add-ops: mantendo expires_at atual:', expires.toISOString())
        } else {
          // Fallback: sem ciclo ativo + sem planMonths → 30 dias
          expires = new Date(nowDate)
          expires.setMonth(expires.getMonth() + 1)
          console.log('[MP webhook] fallback 30 dias:', expires.toISOString())
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
          plan_months: planMonths,
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

        // Comissao de afiliado — UNICA VEZ na primeira mensalidade do indicado
        await maybeCreateCommission(sb, {
          tenantId: record.tenant_id,
          paymentId: payment.id,
          amount: record.amount,
        })

        // Notifica owner via push (idempotente por payment_id)
        await notifyOwnerOfPayment(sb, {
          tenantId: record.tenant_id,
          paymentId: payment.id,
          amount: record.amount,
          planMonths,
        })
      }
    }

    return NextResponse.json({ ok: true, status: payment.status })
  } catch (err) {
    console.error('[MP webhook] error', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
