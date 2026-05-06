// ═══════════════════════════════════════════════════════════════
// NexControl — Rank System
// 15 tiers baseados em depositantes processados (contas reais)
// ═══════════════════════════════════════════════════════════════

export const RANK_TIERS = [
  { tier: 1,  name: 'Ferro',           min: 0,     primary: '#7A8088', secondary: '#3F4448', glow: 'rgba(140,150,160,0.35)', icon: 'shield' },
  { tier: 2,  name: 'Bronze',          min: 50,    primary: '#C68B4F', secondary: '#7A4F2A', glow: 'rgba(198,139,79,0.45)',  icon: 'shield-star' },
  { tier: 3,  name: 'Prata',           min: 150,   primary: '#D5DBE2', secondary: '#8E97A2', glow: 'rgba(213,219,226,0.45)', icon: 'shield-stars' },
  { tier: 4,  name: 'Ouro',            min: 300,   primary: '#F0CC4C', secondary: '#9E7A1F', glow: 'rgba(240,204,76,0.55)',  icon: 'crown-shield' },
  { tier: 5,  name: 'Platina',         min: 500,   primary: '#C8DEE8', secondary: '#7D9CA8', glow: 'rgba(200,222,232,0.55)', icon: 'crystal' },
  { tier: 6,  name: 'Esmeralda',       min: 750,   primary: '#10D396', secondary: '#0B5E3A', glow: 'rgba(16,211,150,0.55)',  icon: 'gem-emerald' },
  { tier: 7,  name: 'Safira',          min: 1100,  primary: '#5A8FD4', secondary: '#1E3A6B', glow: 'rgba(90,143,212,0.55)',  icon: 'gem-sapphire' },
  { tier: 8,  name: 'Rubi',            min: 1500,  primary: '#E64158', secondary: '#7B0A1A', glow: 'rgba(230,65,88,0.55)',   icon: 'gem-ruby' },
  { tier: 9,  name: 'Diamante',        min: 2000,  primary: '#F0F4F8', secondary: '#A8B5C5', glow: 'rgba(220,235,255,0.7)',  icon: 'diamond' },
  { tier: 10, name: 'Mestre',          min: 2750,  primary: '#A66BD4', secondary: '#4A2168', glow: 'rgba(166,107,212,0.6)',  icon: 'crown' },
  { tier: 11, name: 'Elite',           min: 3750,  primary: '#22D3EE', secondary: '#0E5266', glow: 'rgba(34,211,238,0.6)',   icon: 'lightning' },
  { tier: 12, name: 'Lendário',        min: 5000,  primary: '#FF7E47', secondary: '#7A2C0E', glow: 'rgba(255,126,71,0.65)',  icon: 'flame' },
  { tier: 13, name: 'Imortal',         min: 7000,  primary: '#B87DE8', secondary: '#2A0A4A', glow: 'rgba(184,125,232,0.7)',  icon: 'eye' },
  { tier: 14, name: 'Supremo',         min: 10000, primary: 'prismatic', secondary: '#0A0A0A', glow: 'prismatic',            icon: 'crown-stars' },
  { tier: 15, name: 'Apex',            min: 15000, primary: '#0A0A0A', secondary: '#FFD700', glow: 'rgba(255,215,0,0.6)',    icon: 'apex' },
]

/**
 * Retorna o rank do operador baseado em contas (depositantes processados).
 * @param {number} contas — número de depositantes processados
 * @returns { current, next, progress, isMax }
 */
export function getRank(contas) {
  const n = Math.max(0, Math.floor(Number(contas) || 0))
  let current = RANK_TIERS[0]
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (n >= RANK_TIERS[i].min) { current = RANK_TIERS[i]; break }
  }
  const next = RANK_TIERS.find(t => t.tier === current.tier + 1) || null
  const isMax = !next
  const inTier = n - current.min
  const tierSize = next ? next.min - current.min : 1
  const progress = isMax ? 100 : Math.max(0, Math.min(100, (inTier / tierSize) * 100))
  const remaining = next ? Math.max(0, next.min - n) : 0
  return { current, next, progress, isMax, contas: n, remaining }
}

/**
 * Cor para texto/borda — resolve "prismatic" para um fallback.
 */
export function rankColor(rank, fallback = '#FFFFFF') {
  if (!rank) return fallback
  if (rank.primary === 'prismatic') return '#E0E0FF'
  return rank.primary
}

/**
 * Gera um background CSS pra cada rank — gradients sofisticados,
 * com tratamento especial pros tiers 14 (Supremo) e 15 (Ônix Celestial).
 */
export function rankBackground(rank) {
  if (!rank) return '#000'
  if (rank.primary === 'prismatic') {
    // Supremo — conic gradient holographic
    return 'conic-gradient(from 0deg, #FF6B9D, #C77DFF, #4FC3F7, #4DD0E1, #66BB6A, #FFEE58, #FFA726, #FF6B9D)'
  }
  if (rank.tier === 15) {
    // Apex — preto profundo com hint dourado
    return 'radial-gradient(circle at 30% 30%, rgba(255,215,0,0.18) 0%, #0A0A0A 50%, #000 100%)'
  }
  if (rank.tier === 9) {
    // Diamante — gradient prismatic suave
    return 'linear-gradient(135deg, #F0F4F8 0%, #C8D4E0 50%, #F0F4F8 100%)'
  }
  return `linear-gradient(135deg, ${rank.primary} 0%, ${rank.secondary} 100%)`
}

/**
 * Cor de texto contrastante — claro pra ranks escuros, escuro pra ranks claros
 */
export function rankTextColor(rank) {
  if (!rank) return '#FFFFFF'
  if (rank.tier === 3 || rank.tier === 5 || rank.tier === 9) return '#1A1A1A' // prata, platina, diamante = texto escuro
  if (rank.tier === 14) return '#FFFFFF' // supremo
  if (rank.tier === 15) return '#FFD700' // apex
  return '#FFFFFF'
}

/**
 * Próximos N ranks após o atual (pra mostrar "metas futuras")
 */
export function getNextRanks(currentTier, count = 3) {
  return RANK_TIERS.filter(t => t.tier > currentTier).slice(0, count)
}

export function rankByTier(tier) {
  return RANK_TIERS.find(t => t.tier === tier) || RANK_TIERS[0]
}
