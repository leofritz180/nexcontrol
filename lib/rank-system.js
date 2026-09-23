// ═══════════════════════════════════════════════════════════════
// NexControl — Rank System
// 15 tiers baseados em depositantes processados (contas reais)
//
// PALETA (23/09/2026): a escada tinha dourado, azul, ciano e roxo — quatro
// familias que nao existem em nenhum outro lugar do produto. Num painel
// que so usa preto, branco, o vermelho da marca, o verde e o lime da 2.0,
// as patentes eram a unica ilha de outra marca.
//
// A escada agora anda dentro da paleta e ganhou uma progressao que faz
// sentido sozinha: metal frio -> metal claro -> verde -> pedra escura ->
// vermelho -> branco -> grafite -> LIME -> fogo -> vazio -> prismatico ->
// vermelho da marca.
//
// DOIS NOMES MUDARAM, e so porque o nome ERA a cor:
//   Ouro   -> Titanio    (dourado e proibido; titanio fica acima da prata)
//   Safira -> Obsidiana  (safira e azul por definicao)
// Mestre, Elite e Imortal sao TITULOS, nao cores: mudaram de cor e
// mantiveram o nome — ninguem perde a patente que conquistou.
//
// Elite recebeu o lime #C8F21D de proposito: e o acento da identidade 2.0
// e amarra o sistema de patentes ao resto do produto.
// ═══════════════════════════════════════════════════════════════

export const RANK_TIERS = [
  { tier: 1,  name: 'Ferro',     min: 0,     primary: '#7E848B', secondary: '#3F4448', glow: 'rgba(126,132,139,0.30)', icon: 'shield',        rgb: '126,132,139', signature: 'metal-cold',  particle: '#7E848B', idle: 'none' },
  { tier: 2,  name: 'Bronze',    min: 50,    primary: '#B87333', secondary: '#6B3F1E', glow: 'rgba(184,115,51,0.38)',  icon: 'shield-star',   rgb: '184,115,51',  signature: 'metal-warm',  particle: '#B87333', idle: 'shimmer' },
  { tier: 3,  name: 'Prata',     min: 150,   primary: '#98A2AE', secondary: '#626A75', glow: 'rgba(152,162,174,0.38)',  icon: 'shield-stars',  rgb: '152,162,174', signature: 'metal-shine', particle: '#98A2AE', idle: 'shimmer' },
  { tier: 4,  name: 'Titânio',   min: 300,   primary: '#7C8796', secondary: '#4A525D', glow: 'rgba(124,135,150,0.40)',  icon: 'crown-shield',  rgb: '124,135,150', signature: 'metal-shine', particle: '#7C8796', idle: 'shimmer' },
  { tier: 5,  name: 'Platina',   min: 500,   primary: '#B9C2CC', secondary: '#7C8794', glow: 'rgba(185,194,204,0.42)',  icon: 'crystal',       rgb: '185,194,204', signature: 'crystalline', particle: '#B9C2CC', idle: 'shimmer' },
  { tier: 6,  name: 'Esmeralda', min: 750,   primary: '#1E8E63', secondary: '#0B5E3A', glow: 'rgba(30,142,99,0.42)',   icon: 'gem-emerald',   rgb: '30,142,99',  signature: 'gem',         particle: '#1E8E63', idle: 'pulse' },
  { tier: 7,  name: 'Obsidiana', min: 1100,  primary: '#3A4046', secondary: '#15181B', glow: 'rgba(58,64,70,0.46)',    icon: 'gem-sapphire',  rgb: '58,64,70',   signature: 'crystalline', particle: '#3A4046', idle: 'pulse' },
  { tier: 8,  name: 'Rubi',      min: 1500,  primary: '#C0304A', secondary: '#7B0A1A', glow: 'rgba(192,48,74,0.42)',   icon: 'gem-ruby',      rgb: '192,48,74',  signature: 'gem-deep',    particle: '#C0304A', idle: 'pulse' },
  { tier: 9,  name: 'Diamante',  min: 2000,  primary: '#D7DEE6', secondary: '#8B96A3', glow: 'rgba(215,222,230,0.50)', icon: 'diamond',       rgb: '215,222,230', signature: 'diamond',     particle: '#D7DEE6', idle: 'sparkle' },
  { tier: 10, name: 'Mestre',    min: 2750,  primary: '#5A6270', secondary: '#2F343C', glow: 'rgba(90,98,112,0.46)',  icon: 'crown',         rgb: '90,98,112',  signature: 'royal',       particle: '#5A6270', idle: 'pulse-slow' },
  { tier: 11, name: 'Elite',     min: 3750,  primary: '#C8F21D', secondary: '#7E9A0B', glow: 'rgba(200,242,29,0.45)',   icon: 'lightning',     rgb: '200,242,29',  signature: 'tech-neon',   particle: '#C8F21D', idle: 'flicker' },
  { tier: 12, name: 'Lendário',  min: 5000,  primary: '#D9741B', secondary: '#7A2C0E', glow: 'rgba(217,116,27,0.48)',   icon: 'flame',         rgb: '217,116,27',  signature: 'fire',        particle: '#D9741B', idle: 'fire' },
  { tier: 13, name: 'Imortal',   min: 7000,  primary: '#1B1D20', secondary: '#000000', glow: 'rgba(229,57,31,0.34)',  icon: 'eye',           rgb: '27,29,32',   signature: 'void-aura',   particle: '#1B1D20', idle: 'aura' },
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
  4:  { ink: '#4E5661', chip: '#7C8796', tint: '#F1F3F6', edge: '#DCE0E6' },
  5:  { ink: '#5A6672', chip: '#93A0AE', tint: '#F4F6F9', edge: '#E0E5EA' },
  6:  { ink: '#057456', chip: '#0FA678', tint: '#E2F7EF', edge: '#B9E8D6' },
  7:  { ink: '#2B3035', chip: '#3A4046', tint: '#EFF0F1', edge: '#D7D9DC' },
  8:  { ink: '#A11030', chip: '#DC2F51', tint: '#FDE9ED', edge: '#F5C7D1' },
  9:  { ink: '#4A5560', chip: '#94A1B0', tint: '#F5F7FA', edge: '#E2E7EC' },
  10: { ink: '#3E4653', chip: '#5A6270', tint: '#F0F1F4', edge: '#D9DCE1' },
  11: { ink: '#5C7407', chip: '#A9CE12', tint: '#F4FBDD', edge: '#DCEDA4' },
  12: { ink: '#A03F09', chip: '#DF651B', tint: '#FDEFE4', edge: '#F5D5BB' },
  13: { ink: '#1B1D20', chip: '#2A2D31', tint: '#EEEFF0', edge: '#D5D7D9' },
  14: { ink: '#3B3A56', chip: 'prismatic', tint: '#F2F1FA', edge: '#DCDAEE' },
  // Apex deixou o dourado junto com o resto do sistema: o topo veste o
  // vermelho da marca. Esta e a tabela do tema CLARO — o rotulo APEX vinha
  // daqui, e continuava oliva mesmo depois do retom da tabela principal.
  15: { ink: '#A82412', chip: '#E5391F', tint: '#FDEBE7', edge: '#F6CCC3' },
}

// Gradiente do prismático/apex no claro — sem neon, só um degradê discreto.
export const PRISMATIC_LIGHT = 'linear-gradient(135deg, #E5391F, #FF9A78 45%, #8A8F96)'

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
