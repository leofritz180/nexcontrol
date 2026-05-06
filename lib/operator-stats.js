// ═══════════════════════════════════════════════════════════════
// NexControl — Source of truth pra contagem de depositantes
// Padroniza: SEMPRE usa metas FECHADAS NÃO DELETADAS,
// somando quantidade_contas (target oficial pago).
// Antes existia divergência entre admin/operadores/performance.
// ═══════════════════════════════════════════════════════════════

/**
 * Filtra metas válidas pra estatística (não deletadas + fechadas).
 */
export function validClosedMetas(metas) {
  return (metas || []).filter(m => !m.deleted_at && m.status_fechamento === 'fechada')
}

/**
 * Conta depositantes processados de um operador.
 * Source of truth pra rank, ranking, performance, folha.
 */
export function countOperatorDeposits(metas, operatorId) {
  return validClosedMetas(metas)
    .filter(m => m.operator_id === operatorId)
    .reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
}

/**
 * Conta depositantes do tenant inteiro (todas metas fechadas).
 */
export function countTenantDeposits(metas) {
  return validClosedMetas(metas).reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
}

/**
 * Stats por operador — usado em rankings/folha.
 */
export function operatorDepositStats(metas, operatorId) {
  const ops = validClosedMetas(metas).filter(m => m.operator_id === operatorId)
  const total = ops.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
  return { totalDeposit: total, metasFechadas: ops.length }
}
