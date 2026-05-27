// Helper pra calcular limite de operadores vs cadastrados.
// Compativel com server (cron) e client (banner em /admin e /operadores).
//
// Regra: limite = MAX(operator_count) entre subs ativas e nao expiradas.
// Excess = current - limit.

export async function getOperatorLimitStatus(sb, tenantId) {
  if (!sb || !tenantId) return null
  try {
    const now = new Date()
    const [{ data: subs }, { count: opsCount }] = await Promise.all([
      sb.from('subscriptions')
        .select('operator_count, expires_at, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'active'),
      sb.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'operator'),
    ])

    const validLimits = (subs || [])
      .filter(s => !s.expires_at || new Date(s.expires_at) > now)
      .map(s => Number(s.operator_count || 0))

    if (validLimits.length === 0) {
      // Sem sub ativa — admin esta em trial ou sub vencida.
      // Nesse caso o SubscriptionGate ja bloqueia tudo, entao nao se aplica limite.
      return { limit: null, current: opsCount || 0, excess: 0, hasActiveSub: false }
    }

    const limit = Math.max(...validLimits)
    const current = opsCount || 0
    const excess = Math.max(0, current - limit)

    return { limit, current, excess, hasActiveSub: true }
  } catch (e) {
    console.error('[operator-limit] erro:', e?.message)
    return null
  }
}
