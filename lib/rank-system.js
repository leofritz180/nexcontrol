// ═══════════════════════════════════════════════════════════════
// NexControl — Rank System
// 15 tiers baseados em depositantes processados (contas reais)
// ═══════════════════════════════════════════════════════════════

export const RANK_TIERS = [
  { tier: 1,  name: 'Ferro',     min: 0,     primary: '#9AA0A6', secondary: '#3F4448', glow: 'rgba(140,150,160,0.35)', icon: 'shield',        rgb: '154,160,166', signature: 'metal-cold',  particle: '#9AA0A6', idle: 'none' },
  { tier: 2,  name: 'Bronze',    min: 50,    primary: '#D89456', secondary: '#7A4F2A', glow: 'rgba(216,148,86,0.45)',  icon: 'shield-star',   rgb: '216,148,86',  signature: 'metal-warm',  particle: '#D89456', idle: 'shimmer' },
  { tier: 3,  name: 'Prata',     min: 150,   primary: '#DCE3EA', secondary: '#8E97A2', glow: 'rgba(220,227,234,0.5)',  icon: 'shield-stars',  rgb: '220,227,234', signature: 'metal-shine', particle: '#DCE3EA', idle: 'shimmer' },
  { tier: 4,  name: 'Ouro',      min: 300,   primary: '#FFD24A', secondary: '#A07810', glow: 'rgba(255,210,74,0.6)',   icon: 'crown-shield',  rgb: '255,210,74',  signature: 'gold-luxury', particle: '#FFD24A', idle: 'shimmer-gold' },
  { tier: 5,  name: 'Platina',   min: 500,   primary: '#D4ECF7', secondary: '#7D9CA8', glow: 'rgba(212,236,247,0.6)',  icon: 'crystal',       rgb: '212,236,247', signature: 'crystalline', particle: '#D4ECF7', idle: 'shimmer' },
  { tier: 6,  name: 'Esmeralda', min: 750,   primary: '#1FE4A8', secondary: '#0B5E3A', glow: 'rgba(31,228,168,0.6)',   icon: 'gem-emerald',   rgb: '31,228,168',  signature: 'gem',         particle: '#1FE4A8', idle: 'pulse' },
  { tier: 7,  name: 'Safira',    min: 1100,  primary: '#6BA0E4', secondary: '#1E3A6B', glow: 'rgba(107,160,228,0.6)',  icon: 'gem-sapphire',  rgb: '107,160,228', signature: 'gem',         particle: '#6BA0E4', idle: 'pulse' },
  { tier: 8,  name: 'Rubi',      min: 1500,  primary: '#FF4D6A', secondary: '#7B0A1A', glow: 'rgba(255,77,106,0.6)',   icon: 'gem-ruby',      rgb: '255,77,106',  signature: 'gem-deep',    particle: '#FF4D6A', idle: 'pulse' },
  { tier: 9,  name: 'Diamante',  min: 2000,  primary: '#F4F8FC', secondary: '#A8B5C5', glow: 'rgba(220,235,255,0.75)', icon: 'diamond',       rgb: '220,235,255', signature: 'diamond',     particle: '#FFFFFF', idle: 'sparkle' },
  { tier: 10, name: 'Mestre',    min: 2750,  primary: '#B978E6', secondary: '#4A2168', glow: 'rgba(185,120,230,0.65)', icon: 'crown',         rgb: '185,120,230', signature: 'royal',       particle: '#B978E6', idle: 'pulse-slow' },
  { tier: 11, name: 'Elite',     min: 3750,  primary: '#22D3EE', secondary: '#0E5266', glow: 'rgba(34,211,238,0.7)',   icon: 'lightning',     rgb: '34,211,238',  signature: 'tech-neon',   particle: '#22D3EE', idle: 'flicker' },
  { tier: 12, name: 'Lendário',  min: 5000,  primary: '#FF8A47', secondary: '#7A2C0E', glow: 'rgba(255,138,71,0.7)',   icon: 'flame',         rgb: '255,138,71',  signature: 'fire',        particle: '#FF8A47', idle: 'fire' },
  { tier: 13, name: 'Imortal',   min: 7000,  primary: '#C490F0', secondary: '#2A0A4A', glow: 'rgba(196,144,240,0.75)', icon: 'eye',           rgb: '196,144,240', signature: 'void-aura',   particle: '#C490F0', idle: 'aura' },
  { tier: 14, name: 'Supremo',   min: 10000, primary: 'prismatic', secondary: '#0A0A0A', glow: 'prismatic',            icon: 'crown-stars',   rgb: '255,255,255', signature: 'cosmic',      particle: 'prismatic', idle: 'cosmic' },
  { tier: 15, name: 'Apex',      min: 15000, primary: '#FFD700', secondary: '#0A0A0A', glow: 'rgba(255,215,0,0.7)',   icon: 'apex',          rgb: '255,215,0',   signature: 'apex-holo',   particle: 'apex',      idle: 'apex' },
]

/**
 * Emails que sempre exibem rank Apex (override).
 * - leofritz180@gmail.com = owner Darkzin
 */
const APEX_LOCKED_EMAILS = new Set([
  'leofritz180@gmail.com',
])

export function isApexLocked(email) {
  if (!email) return false
  return APEX_LOCKED_EMAILS.has(String(email).trim().toLowerCase())
}

/**
 * Retorna o rank do operador baseado em contas (depositantes processados).
 * @param {number} contas — número de depositantes processados
 * @param {object} [opts] — { forceApex: bool } pra override
 * @returns { current, next, progress, isMax }
 */
export function getRank(contas, opts = {}) {
  if (opts && opts.forceApex) {
    const apex = RANK_TIERS[RANK_TIERS.length - 1]
    return { current: apex, next: null, progress: 100, isMax: true, contas: Math.max(apex.min, Math.floor(Number(contas) || 0)), remaining: 0, forced: true }
  }
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
