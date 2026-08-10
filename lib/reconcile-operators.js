// Reconciliacao de operadores apos uma renovacao que REDUZIU o plano.
// Se o admin renovou por menos operadores do que tem, remove os EXCEDENTES
// (os mais recentes) pra bater com o que foi pago — sem ele precisar entrar na
// conta. Nao-destrutivo pros dados: mantem metas/historico (igual remove-operator),
// so desvincula (tenant_id=null + marca removido).
//
// Seguro por design: SO remove quando real > pago. Em qualquer outro caso
// (upgrade, renovacao mantendo/aumentando, pagamento antigo) nao remove nada.

export async function reconcilePaidOperators(sb, tenantId, paidCount) {
  try {
    if (!tenantId) return { removed: 0 }
    const paid = Number(paidCount)
    if (!Number.isFinite(paid) || paid < 0) return { removed: 0 } // sem alvo valido → nao mexe

    const { data: ops } = await sb.from('profiles')
      .select('id, created_at')
      .eq('tenant_id', tenantId)
      .eq('role', 'operator')
      .is('removed_from_tenant_id', null)
      .order('created_at', { ascending: true }) // mais antigos primeiro (mantidos)

    const list = ops || []
    const excess = list.length - paid
    if (excess <= 0) return { removed: 0 } // real <= pago → nada a remover

    const toRemove = list.slice(list.length - excess) // os `excess` mais RECENTES
    const now = new Date().toISOString()
    let removed = 0
    for (const op of toRemove) {
      const { error } = await sb.from('profiles').update({
        tenant_id: null,
        removed_from_tenant_id: tenantId,
        removed_from_tenant_at: now,
      }).eq('id', op.id)
      if (!error) removed += 1
    }
    return { removed }
  } catch (e) {
    console.error('[reconcile-ops] falhou', e?.message)
    return { removed: 0, error: e?.message }
  }
}
