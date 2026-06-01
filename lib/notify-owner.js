// Notifica o owner do sistema sempre que um cliente paga uma assinatura.
// Idempotente: usa winback_log com segment 'owner-new-payment' pra evitar
// notificar 2x o mesmo pagamento (caso webhook + check-payment dupliquem).

import { sendPushToUser } from './push'

const OWNER_EMAIL = 'leofritz180@gmail.com'

export async function notifyOwnerOfPayment(sb, { tenantId, paymentId, amount, planMonths }) {
  if (!sb || !paymentId) return { skipped: 'missing' }
  try {
    // Idempotencia — usa user_id=null + reason=paymentId
    const tag = 'owner-new-payment-' + String(paymentId)
    const { data: existing } = await sb.from('winback_log')
      .select('id').eq('segment', tag).limit(1).maybeSingle()
    if (existing) return { skipped: 'already_notified' }

    // Pega owner
    const { data: owner } = await sb.from('profiles')
      .select('id').eq('email', OWNER_EMAIL).maybeSingle()
    if (!owner?.id) return { skipped: 'no_owner' }

    // Pega dados do tenant + admin pra montar mensagem
    const { data: tenant } = await sb.from('tenants').select('name').eq('id', tenantId).maybeSingle()
    const { data: admin } = await sb.from('profiles').select('nome,email').eq('tenant_id', tenantId).eq('role','admin').maybeSingle()

    const adminName = admin?.nome || admin?.email?.split('@')[0] || 'Cliente'
    const tenantName = tenant?.name || adminName
    const value = Number(amount || 0).toFixed(2).replace('.', ',')

    // Conta pagamentos anteriores pra saber se eh NOVO ou RENOVACAO
    let tipo = 'pagamento'
    try {
      const { count: ant } = await sb.from('mp_payments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'approved')
        .neq('mp_payment_id', String(paymentId))
      const { count: antA } = await sb.from('asaas_payments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['RECEIVED','CONFIRMED'])
      const total = (ant || 0) + (antA || 0)
      if (total === 0) tipo = '🆕 NOVO cliente'
      else if (planMonths === 0) tipo = '➕ add-ops'
      else tipo = '🔁 renovacao'
    } catch {}

    await sendPushToUser(sb, owner.id, {
      title: tipo + ' · R$ ' + value,
      body: `${tenantName} (${adminName}) confirmou pagamento`,
      url: '/owner',
      tag: 'owner-new-payment',
    })

    // Marca como notificado (anti-spam)
    await sb.from('winback_log').insert({
      user_id: owner.id,
      tenant_id: tenantId,
      segment: tag,
      channel: 'push',
      sent_at: new Date().toISOString(),
    })

    return { sent: true }
  } catch (e) {
    console.error('[notify-owner] erro:', e?.message)
    return { error: e.message }
  }
}
