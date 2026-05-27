// Gera comissao de afiliado quando um indicado faz a PRIMEIRA mensalidade.
// Regra: 50% (ou rate configurada) UNICA VEZ — so o primeiro pagamento approved
// do indicado gera comissao. Renovacoes nao geram.
//
// Idempotencia: UNIQUE(asaas_payment_id) na tabela affiliate_commissions
// (campo reusado pra MP — guarda o mp_payment_id como string).

export async function maybeCreateCommission(sb, { tenantId, paymentId, amount }) {
  try {
    // 1) Verifica se este tenant tem um referral (foi indicado)
    const { data: ref } = await sb.from('referrals')
      .select('affiliate_tenant_id')
      .eq('referred_tenant_id', tenantId)
      .maybeSingle()
    if (!ref?.affiliate_tenant_id) return { skipped: 'no_referral' }

    // 2) Verifica se afiliado esta habilitado + pega taxa
    const { data: aff } = await sb.from('affiliates')
      .select('enabled, commission_rate')
      .eq('tenant_id', ref.affiliate_tenant_id)
      .maybeSingle()
    if (!aff?.enabled) return { skipped: 'affiliate_disabled' }

    // 3) Regra UNICA VEZ — conta quantos pagamentos approved este indicado JA tem
    //    (excluindo o atual que ja foi marcado approved antes desta chamada)
    //    Se for o PRIMEIRO, gera comissao. Senao, pula.
    const { count: approvedCount } = await sb.from('mp_payments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'approved')
    // Inclui Asaas legado (historico)
    const { count: asaasCount } = await sb.from('asaas_payments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['RECEIVED', 'CONFIRMED'])

    const totalPaid = (approvedCount || 0) + (asaasCount || 0)
    if (totalPaid > 1) return { skipped: 'not_first_payment', total_paid: totalPaid }

    // 4) Cria comissao (idempotente via UNIQUE(asaas_payment_id))
    const rate = Number(aff.commission_rate || 0.50)
    const amt = Number(amount || 0)
    const commission = Number((amt * rate).toFixed(2))

    const { error } = await sb.from('affiliate_commissions').insert({
      affiliate_tenant_id: ref.affiliate_tenant_id,
      referred_tenant_id: tenantId,
      asaas_payment_id: String(paymentId), // campo reusado pra MP id
      payment_amount: amt,
      commission_amount: commission,
      rate,
      status: 'pending',
    })

    if (error) {
      // Duplicate é ok (idempotente)
      if (String(error.message).toLowerCase().includes('duplicate')) {
        return { skipped: 'already_created' }
      }
      console.error('[affiliate-commission] insert error', error.message)
      return { error: error.message }
    }

    console.log('[affiliate-commission] ✅ R$', commission, 'criada pra afiliado', ref.affiliate_tenant_id)
    return { created: true, commission, rate }
  } catch (e) {
    console.error('[affiliate-commission] erro', e.message)
    return { error: e.message }
  }
}
