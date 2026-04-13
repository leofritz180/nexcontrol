// ═══════════════════════════════════════
// NexControl — Insights Engine
// Camada independente de inteligencia operacional
// NAO altera o sistema de notificacoes existente
// Usa /api/push/send como canal de entrega
// ═══════════════════════════════════════

const fmt = v => Math.abs(Number(v||0)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

// ── Cooldown por tipo/meta/operador (sessionStorage) ──
const COOLDOWN_MS = {
  sequencia_negativa: 30 * 60 * 1000,    // 30 min
  prejuizo_acima_media: 20 * 60 * 1000,  // 20 min
  meta_parada: 60 * 60 * 1000,           // 1 hora
}

function getCooldownKey(type, metaId, userId) {
  return `nxc_insight_${type}_${metaId}_${userId}`
}

function isOnCooldown(type, metaId, userId) {
  if (typeof sessionStorage === 'undefined') return false
  const key = getCooldownKey(type, metaId, userId)
  const last = sessionStorage.getItem(key)
  if (!last) return false
  return (Date.now() - Number(last)) < (COOLDOWN_MS[type] || 600000)
}

function markSent(type, metaId, userId) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(getCooldownKey(type, metaId, userId), String(Date.now()))
}

// ── Dispatch (reutiliza canal existente, NAO altera notify.js) ──
async function sendInsight(userId, title, body, url) {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title, body, url }),
    })
  } catch {
    // Silent — insights nao devem quebrar fluxo
  }
}

// ═══════════════════════════════════════
// INSIGHT 1: Sequencia negativa
// ═══════════════════════════════════════
// Dispara quando operador acumula 3+ remessas seguidas com prejuizo
// Usa contas_remessa pra calcular media por conta na sequencia

function checkSequenciaNegativa(remessas, meta, userId) {
  if (!remessas || remessas.length < 3) return null
  if (isOnCooldown('sequencia_negativa', meta.id, userId)) return null

  const ordered = [...remessas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  let streak = 0
  let streakTotal = 0
  for (let i = ordered.length - 1; i >= 0; i--) {
    const res = Number(ordered[i].resultado || 0)
    if (res < 0) { streak++; streakTotal += Math.abs(res) }
    else break
  }

  if (streak < 3) return null

  markSent('sequencia_negativa', meta.id, userId)
  return {
    title: 'Sequencia negativa detectada',
    body: `${streak} remessas consecutivas com prejuizo — R$ ${fmt(streakTotal)} acumulado. Avalie trocar de estrategia.`,
    url: `/meta/${meta.id}`,
  }
}

// ═══════════════════════════════════════
// INSIGHT 2: Prejuizo acima da media
// ═══════════════════════════════════════
// Compara a remessa recem-registrada com a media das ultimas 10
// So dispara se > 1.8x a media E > R$8/conta (evita falso positivo)

function checkPrejuizoAcimaMedia(remessas, novaRemessa, meta, userId) {
  if (!remessas || remessas.length < 5) return null
  if (isOnCooldown('prejuizo_acima_media', meta.id, userId)) return null

  const diff = Number(novaRemessa.resultado || 0)
  if (diff >= 0) return null // Sem prejuizo, nada a alertar

  const contasRem = Number(novaRemessa.contas_remessa || 0)
  const prejPerConta = contasRem > 0 ? Math.abs(diff) / contasRem : Math.abs(diff)

  // Pegar ultimas 10 remessas com prejuizo pra calcular media
  const recentesPrej = remessas
    .filter(r => Number(r.resultado || 0) < 0 && r.id !== novaRemessa.id)
    .slice(-10)

  if (recentesPrej.length < 3) return null

  const avgPrej = recentesPrej.reduce((a, r) => {
    const c = Number(r.contas_remessa || 0)
    return a + (c > 0 ? Math.abs(Number(r.resultado || 0)) / c : Math.abs(Number(r.resultado || 0)))
  }, 0) / recentesPrej.length

  // So alerta se > 1.8x a media E > R$8/conta (evita micro variacoes)
  if (prejPerConta <= avgPrej * 1.8 || prejPerConta <= 8) return null

  markSent('prejuizo_acima_media', meta.id, userId)
  return {
    title: 'Prejuizo acima do seu padrao',
    body: `R$ ${fmt(prejPerConta)}/conta nesta remessa — sua media recente e R$ ${fmt(avgPrej)}/conta. Fique atento.`,
    url: `/meta/${meta.id}`,
  }
}

// ═══════════════════════════════════════
// INSIGHT 3: Meta parada
// ═══════════════════════════════════════
// Detecta meta ativa sem remessa ha mais de X horas
// Chamado no carregamento da pagina, nao apos remessa

function checkMetaParada(remessas, meta, userId, horasLimite = 12) {
  if (!meta || meta.status !== 'ativa' || meta.status_fechamento === 'fechada') return null
  if (isOnCooldown('meta_parada', meta.id, userId)) return null

  if (!remessas || remessas.length === 0) {
    // Meta sem nenhuma remessa — verificar data de criacao
    const created = new Date(meta.created_at)
    const horas = (Date.now() - created.getTime()) / (1000 * 60 * 60)
    if (horas < horasLimite) return null

    markSent('meta_parada', meta.id, userId)
    return {
      title: 'Meta aguardando inicio',
      body: `Sua meta "${meta.quantidade_contas || 0} DEP ${meta.rede || ''}" esta ativa mas sem nenhuma remessa registrada.`,
      url: `/meta/${meta.id}`,
    }
  }

  // Pegar ultima remessa
  const ultima = [...remessas].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const horas = (Date.now() - new Date(ultima.created_at).getTime()) / (1000 * 60 * 60)

  if (horas < horasLimite) return null

  markSent('meta_parada', meta.id, userId)
  return {
    title: 'Meta sem movimentacao',
    body: `Sua meta esta sem nova remessa ha ${Math.round(horas)}h. Retome quando possivel.`,
    url: `/meta/${meta.id}`,
  }
}

// ═══════════════════════════════════════
// ENGINE PRINCIPAL
// ═══════════════════════════════════════

/**
 * Avaliar insights apos registrar remessa
 * Chamado no handleAdd da pagina da meta
 * @param {Object} params
 * @param {Array} params.remessas - todas as remessas da meta
 * @param {Object} params.novaRemessa - dados da remessa recem-registrada
 * @param {Object} params.meta - dados da meta
 * @param {string} params.userId - id do usuario
 */
export async function evaluateAfterRemessa({ remessas, novaRemessa, meta, userId }) {
  const insights = [
    checkSequenciaNegativa(remessas, meta, userId),
    checkPrejuizoAcimaMedia(remessas, novaRemessa, meta, userId),
  ].filter(Boolean)

  // Disparar no maximo 1 insight por vez (evitar flood)
  if (insights.length > 0) {
    const best = insights[0]
    await sendInsight(userId, best.title, best.body, best.url)
  }
}

/**
 * Avaliar insights ao carregar pagina da meta
 * Chamado no fetchData da pagina da meta
 */
export async function evaluateOnLoad({ remessas, meta, userId }) {
  const insight = checkMetaParada(remessas, meta, userId)
  if (insight) {
    await sendInsight(userId, insight.title, insight.body, insight.url)
  }
}
