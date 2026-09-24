// ═══════════════════════════════════════
// NexControl — avisos do ciclo da meta (lado do cliente)
//
// Cada função manda os DADOS de um tipo do catálogo (lib/notificacoes) pelo
// dispararPush (lib/pushClient), que leva o token da sessão. O TEXTO não
// nasce aqui: é escrito no catálogo, na voz que cada destinatário escolheu.
// ═══════════════════════════════════════
import { dispararPush } from './pushClient'

// Pega só o primeiro nome (descarta sobrenomes) + capitaliza.
// Ex: 'thomas melo ferreira' → 'Thomas'
//     '@usuario'            → '@usuario' (sem espaço, mantém)
function firstName(raw) {
  if (!raw) return 'Operador'
  const trimmed = String(raw).trim()
  if (!trimmed) return 'Operador'
  const first = trimmed.split(/\s+/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

/** Operador abriu uma meta → admins. */
export function notifyMetaCreated(tenantId, operador, contas, rede, metaId) {
  if (!tenantId) return
  return dispararPush('meta-criada', { nome: firstName(operador), contas: Number(contas || 0), rede, metaId, chave: metaId ? String(metaId) : undefined }, 'admins')
}

/**
 * Operador registrou uma remessa → admins.
 * extra: { metaId, contas (da remessa), feitas, alvo (contas da meta), slot }
 */
export function notifyRemessaCreated(tenantId, operador, rede, resultado, tipo, extra = {}) {
  if (!tenantId) return
  return dispararPush('remessa-nova', {
    nome: firstName(operador), valor: Number(resultado || 0), rede, bonus: tipo === 'bonus',
    contas: Number(extra.contas || 0), feitas: extra.feitas, alvo: extra.alvo, slot: extra.slot,
    metaId: extra.metaId, chave: extra.metaId ? String(extra.metaId) : undefined,
  }, 'admins')
}

/**
 * Admin fechou a meta com custos.
 *   → admins: o resultado final (lucro_final).
 *   → operador da meta: SÓ que fechou e o resultado das remessas, que ele
 *     mesmo registrou. Salário, baú e lucro final nunca vão pro operador.
 * extra: { metaId, operatorId, resultadoRemessas, pedidoPor }
 */
export function notifyMetaClosed(tenantId, contas, rede, lucroFinal, extra = {}) {
  if (!tenantId) return
  const base = { contas: Number(contas || 0), rede, metaId: extra.metaId, chave: extra.metaId ? String(extra.metaId) : undefined }
  const p = [dispararPush('meta-fechada', { ...base, lucroFinal: Number(lucroFinal || 0) }, 'admins')]
  if (extra.operatorId && extra.operatorId !== extra.pedidoPor) {
    p.push(dispararPush('meta-fechada-operador', { ...base, valor: Number(extra.resultadoRemessas || 0) }, { user_id: extra.operatorId }))
  }
  return Promise.all(p)
}

/**
 * Marco da meta (metade / batida) → admins e, se quem registrou é operador,
 * ele também. Chamar só quando a contagem CRUZA o marco.
 */
export function notifyMarcoMeta({ tenantId, operador, rede, feitas, alvo, metaId, marco, souAdmin }) {
  if (!tenantId) return
  const base = { nome: firstName(operador), rede, feitas, alvo, marco, metaId, chave: `${metaId}-${marco}` }
  const p = [dispararPush('marco-meta', base, 'admins')]
  if (!souAdmin) p.push(dispararPush('marco-meta', { ...base, paraOperador: true }, 'eu'))
  return Promise.all(p)
}
