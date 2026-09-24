// ═══════════════════════════════════════
// NexControl — avisos do ciclo da meta (lado do cliente)
//
// Cada função monta os DADOS de um tipo do catálogo (lib/notificacoes) e
// pede o push pelo dispararPush (lib/pushClient), que leva o token da
// sessão. Texto, botões e vibração são do catálogo — aqui só os números.
// ═══════════════════════════════════════
import { dispararPush } from './pushClient'

const fmt = v => Math.abs(Number(v || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const sinal = v => (Number(v || 0) >= 0 ? '+' : '−')

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

const REDE = r => (r || 'rede').toUpperCase()

/** Operador abriu uma meta → admins. */
export function notifyMetaCreated(tenantId, operador, contas, rede, metaId) {
  if (!tenantId) return
  return dispararPush('meta-criada', {
    titulo: `${firstName(operador)} abriu uma meta`,
    corpo: `${contas || 0} DEP na ${REDE(rede)} · começa agora`,
    metaId, chave: metaId ? String(metaId) : undefined,
  }, 'admins')
}

/**
 * Operador registrou uma remessa → admins.
 * extra: { metaId, contas (da remessa), feitas, alvo (contas da meta), slot }
 */
export function notifyRemessaCreated(tenantId, operador, rede, resultado, tipo, extra = {}) {
  if (!tenantId) return
  const nome = firstName(operador)
  const val = `${sinal(resultado)}R$ ${fmt(resultado)}`
  const progresso = extra.alvo ? ` · ${Math.min(extra.feitas || 0, extra.alvo)}/${extra.alvo} DEP` : ''
  const titulo = tipo === 'bonus' ? `${nome} registrou um bônus` : Number(resultado) >= 0 ? `${nome} lucrou na remessa` : `${nome} fechou uma remessa no vermelho`
  const partes = [val]
  if (extra.contas) partes.push(`${extra.contas} conta${extra.contas === 1 ? '' : 's'}`)
  partes.push(REDE(rede))
  if (extra.slot) partes.push(extra.slot)
  return dispararPush('remessa-nova', {
    titulo,
    corpo: partes.join(' · ') + progresso,
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
  const rotulo = `${contas || 0} DEP ${REDE(rede)}`
  const p = []
  p.push(dispararPush('meta-fechada', {
    titulo: Number(lucroFinal) >= 0 ? 'Meta fechada no lucro' : 'Meta fechada no prejuízo',
    corpo: `${rotulo} · resultado final ${sinal(lucroFinal)}R$ ${fmt(lucroFinal)}`,
    metaId: extra.metaId, chave: extra.metaId ? String(extra.metaId) : undefined,
  }, 'admins'))
  if (extra.operatorId && extra.operatorId !== extra.pedidoPor) {
    const r = extra.resultadoRemessas
    p.push(dispararPush('meta-fechada-operador', {
      titulo: 'Sua meta foi fechada',
      corpo: r === undefined || r === null ? `${rotulo} encerrada pelo admin` : `${rotulo} · suas remessas: ${sinal(r)}R$ ${fmt(r)}`,
      metaId: extra.metaId, chave: extra.metaId ? String(extra.metaId) : undefined,
    }, { user_id: extra.operatorId }))
  }
  return Promise.all(p)
}

/**
 * Marco da meta (metade / batida) → admins e, se quem registrou é operador,
 * ele também. Chamar só quando a contagem CRUZA o marco.
 */
export function notifyMarcoMeta({ tenantId, operador, rede, feitas, alvo, metaId, marco, souAdmin }) {
  if (!tenantId) return
  const nome = firstName(operador)
  const dados = marco >= 100
    ? { titulo: `${nome} bateu a meta`, corpo: `${feitas}/${alvo} DEP na ${REDE(rede)} · pronta pra finalizar` }
    : { titulo: `Metade da meta na ${REDE(rede)}`, corpo: `${nome} está em ${feitas}/${alvo} DEP` }
  const base = { ...dados, metaId, chave: `${metaId}-${marco}` }
  const p = [dispararPush('marco-meta', base, 'admins')]
  if (!souAdmin) p.push(dispararPush('marco-meta', {
    ...base,
    titulo: marco >= 100 ? 'Você bateu a meta' : 'Metade da meta',
    corpo: marco >= 100 ? `${feitas}/${alvo} DEP na ${REDE(rede)} · finalize pra o admin fechar` : `${feitas}/${alvo} DEP na ${REDE(rede)} · continua assim`,
  }, 'eu'))
  return Promise.all(p)
}
