// ═══════════════════════════════════════════════════════════════
// NexControl — Rank System
// 15 tiers baseados em depositantes processados (contas reais)
// ═══════════════════════════════════════════════════════════════

export const RANK_TIERS = [
  { tier: 1,  name: 'Ferro',     min: 0,     primary: '#7E848B', secondary: '#3F4448', glow: 'rgba(126,132,139,0.30)', icon: 'shield',        rgb: '126,132,139', signature: 'metal-cold',  particle: '#7E848B', idle: 'none' },
  { tier: 2,  name: 'Bronze',    min: 50,    primary: '#B87333', secondary: '#6B3F1E', glow: 'rgba(184,115,51,0.38)',  icon: 'shield-star',   rgb: '184,115,51',  signature: 'metal-warm',  particle: '#B87333', idle: 'shimmer' },
  { tier: 3,  name: 'Prata',     min: 150,   primary: '#98A2AE', secondary: '#626A75', glow: 'rgba(152,162,174,0.38)',  icon: 'shield-stars',  rgb: '152,162,174', signature: 'metal-shine', particle: '#98A2AE', idle: 'shimmer' },
  { tier: 4,  name: 'Ouro',      min: 300,   primary: '#C2941F', secondary: '#7A5C08', glow: 'rgba(194,148,31,0.40)',   icon: 'crown-shield',  rgb: '194,148,31',  signature: 'gold-luxury', particle: '#C2941F', idle: 'shimmer-gold' },
  { tier: 5,  name: 'Platina',   min: 500,   primary: '#8FA8B5', secondary: '#5D7480', glow: 'rgba(143,168,181,0.40)',  icon: 'crystal',       rgb: '143,168,181', signature: 'crystalline', particle: '#8FA8B5', idle: 'shimmer' },
  { tier: 6,  name: 'Esmeralda', min: 750,   primary: '#1E8E63', secondary: '#0B5E3A', glow: 'rgba(30,142,99,0.42)',   icon: 'gem-emerald',   rgb: '30,142,99',  signature: 'gem',         particle: '#1E8E63', idle: 'pulse' },
  { tier: 7,  name: 'Safira',    min: 1100,  primary: '#3E6FA8', secondary: '#1E3A6B', glow: 'rgba(62,111,168,0.42)',  icon: 'gem-sapphire',  rgb: '62,111,168', signature: 'gem',         particle: '#3E6FA8', idle: 'pulse' },
  { tier: 8,  name: 'Rubi',      min: 1500,  primary: '#C0304A', secondary: '#7B0A1A', glow: 'rgba(192,48,74,0.42)',   icon: 'gem-ruby',      rgb: '192,48,74',  signature: 'gem-deep',    particle: '#C0304A', idle: 'pulse' },
  { tier: 9,  name: 'Diamante',  min: 2000,  primary: '#6E8CA8', secondary: '#48586A', glow: 'rgba(110,140,168,0.45)', icon: 'diamond',       rgb: '110,140,168', signature: 'diamond',     particle: '#6E8CA8', idle: 'sparkle' },
  { tier: 10, name: 'Mestre',    min: 2750,  primary: '#7E5AA0', secondary: '#4A2168', glow: 'rgba(126,90,160,0.45)', icon: 'crown',         rgb: '126,90,160', signature: 'royal',       particle: '#7E5AA0', idle: 'pulse-slow' },
  { tier: 11, name: 'Elite',     min: 3750,  primary: '#1E8FA6', secondary: '#0E5266', glow: 'rgba(30,143,166,0.45)',   icon: 'lightning',     rgb: '30,143,166',  signature: 'tech-neon',   particle: '#1E8FA6', idle: 'flicker' },
  { tier: 12, name: 'Lendário',  min: 5000,  primary: '#D9741B', secondary: '#7A2C0E', glow: 'rgba(217,116,27,0.48)',   icon: 'flame',         rgb: '217,116,27',  signature: 'fire',        particle: '#D9741B', idle: 'fire' },
  { tier: 13, name: 'Imortal',   min: 7000,  primary: '#6C4E8F', secondary: '#2A0A4A', glow: 'rgba(108,78,143,0.48)', icon: 'eye',           rgb: '108,78,143', signature: 'void-aura',   particle: '#6C4E8F', idle: 'aura' },
  { tier: 14, name: 'Supremo',   min: 10000, primary: 'prismatic', secondary: '#0A0A0A', glow: 'prismatic',            icon: 'crown-stars',   rgb: '255,255,255', signature: 'cosmic',      particle: 'prismatic', idle: 'cosmic' },
  { tier: 15, name: 'Apex',      min: 15000, primary: '#E5391F', secondary: '#0A0A0A', glow: 'rgba(229,57,31,0.50)',   icon: 'apex',          rgb: '229,57,31',   signature: 'apex-holo',   particle: 'apex',      idle: 'apex' },
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
    // Supremo — continua holográfico (é o penúltimo, tem que impressionar),
    // mas na família da casa: brasa, branco e grafite. Antes era arco-íris
    // completo, com amarelo e roxo saturados.
    return 'conic-gradient(from 0deg, #ff7a4d, #ffffff, #e5391f, #b6b6c0, #ff9a78, #15151a, #ff7a4d)'
  }
  if (rank.tier === 15) {
    // Apex — preto profundo com brasa da marca (era dourado)
    return 'radial-gradient(circle at 30% 30%, rgba(229,57,31,0.30) 0%, #160906 52%, #000 100%)'
  }
  if (rank.tier === 9) {
    // Diamante. Era #F0F4F8 → #C8D4E0: quase branco, some no bento claro,
    // que é o mesmo motivo do retom da tabela lá em cima.
    return 'linear-gradient(135deg, #8FA6BC 0%, #5C7590 50%, #8FA6BC 100%)'
  }
  return `linear-gradient(135deg, ${rank.primary} 0%, ${rank.secondary} 100%)`
}

/**
 * Cor de texto contrastante — claro pra ranks escuros, escuro pra ranks claros
 */
export function rankTextColor(rank) {
  if (!rank) return '#FFFFFF'
  // Prata, Platina e Diamante ficaram mais escuros no retom de 21/09: texto
  // preto em cima deles nao le mais. Agora todos usam branco.
  if (rank.tier === 14) return '#FFFFFF' // supremo
  if (rank.tier === 15) return '#FFFFFF' // apex (fundo quase preto)
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

// ═══════════════════════════════════════════════════════════════
// PALETA CLARA (NexControl 2.0 / .nx-bento)
// Os tons acima nasceram pra fundo preto: Prata, Platina e Diamante são
// quase brancos e somem numa superfície branca, e os "glow" viram mancha.
// Aqui cada tier ganha três tons pensados pro claro, mantendo a identidade:
//   ink  — cor do nome e do número, legível sobre branco (>= 4.5:1)
//   chip — cor cheia da pastilha do ícone (ícone sai branco em cima)
//   tint — fundo pálido da pílula
//   edge — borda da pílula
// ═══════════════════════════════════════════════════════════════
export const RANK_LIGHT = {
  1:  { ink: '#5A6169', chip: '#7E868F', tint: '#F1F3F5', edge: '#DDE1E5' },
  2:  { ink: '#8A4F1A', chip: '#B9702C', tint: '#FBF1E7', edge: '#EBD6C0' },
  3:  { ink: '#59636F', chip: '#8894A2', tint: '#F2F5F8', edge: '#DCE2E9' },
  4:  { ink: '#87620A', chip: '#B98C05', tint: '#FCF4DB', edge: '#EEDFA8' },
  5:  { ink: '#3C6C7D', chip: '#6499AC', tint: '#ECF5F9', edge: '#CFE3EB' },
  6:  { ink: '#057456', chip: '#0FA678', tint: '#E2F7EF', edge: '#B9E8D6' },
  7:  { ink: '#28579B', chip: '#4179C6', tint: '#EAF1FB', edge: '#C9DBF3' },
  8:  { ink: '#A11030', chip: '#DC2F51', tint: '#FDE9ED', edge: '#F5C7D1' },
  9:  { ink: '#455C74', chip: '#728AA4', tint: '#EFF4F9', edge: '#D5E0EB' },
  10: { ink: '#652B96', chip: '#9152C7', tint: '#F4EBFC', edge: '#E1CCF3' },
  11: { ink: '#0A6B7D', chip: '#1098B1', tint: '#E4F6FA', edge: '#BEE6EF' },
  12: { ink: '#A03F09', chip: '#DF651B', tint: '#FDEFE4', edge: '#F5D5BB' },
  13: { ink: '#642FA0', chip: '#9257CE', tint: '#F5EDFD', edge: '#E3D0F5' },
  14: { ink: '#3B3A56', chip: 'prismatic', tint: '#F2F1FA', edge: '#DCDAEE' },
  15: { ink: '#86680B', chip: '#B48F00', tint: '#FDF6DC', edge: '#EFE0A6' },
}

// Gradiente do prismático/apex no claro — sem neon, só um degradê discreto.
export const PRISMATIC_LIGHT = 'linear-gradient(135deg, #7C6BD6, #C46BAF 45%, #D98A4E)'

/** Tons do tier no tema pedido. `light=false` devolve o visual original. */
export function rankPalette(tier, light) {
  const base = RANK_TIERS.find(t => t.tier === tier) || RANK_TIERS[0]
  if (!light) {
    return {
      ink: base.primary, chip: base.primary, tint: `rgba(${base.rgb},0.05)`,
      edge: `rgba(${base.rgb},0.28)`, glow: base.glow, prismatic: base.primary === 'prismatic',
    }
  }
  const l = RANK_LIGHT[base.tier] || RANK_LIGHT[1]
  return { ...l, glow: 'none', prismatic: l.chip === 'prismatic' }
}
