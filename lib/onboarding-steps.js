// ═══════════════════════════════════════════════════════════════
// NexControl — Sistema de onboarding ativo
// Cada step detecta progresso lendo dados ja existentes nas tabelas.
// ═══════════════════════════════════════════════════════════════

export const ONBOARDING_STEPS = [
  {
    id: 'profile',
    title: 'Confirmar seu perfil',
    desc: 'Seu nome aparece pros operadores e em todos os relatorios',
    icon: 'user',
    xp: 10,
    cta: 'Conferir nome',
    detect: (data) => Boolean(data.profile?.nome && data.profile.nome.trim().length > 1),
  },
  {
    id: 'first_meta',
    title: 'Criar sua primeira meta',
    desc: 'Defina N depositantes numa rede e comece a operar',
    icon: 'target',
    xp: 30,
    cta: 'Criar meta',
    href: '/admin',
    actionTab: 'myops', // hint pro UI alternar tab
    detect: (data) => (data.metas || []).length > 0,
  },
  {
    id: 'first_remessa',
    title: 'Registrar primeira remessa',
    desc: 'Cadastre os dados do primeiro lote de depositos',
    icon: 'box',
    xp: 30,
    cta: 'Ir pra meta',
    detect: (data) => (data.remessas || []).length > 0,
  },
  {
    id: 'first_close',
    title: 'Fechar uma meta',
    desc: 'O grande momento — voce ve o lucro_final calculado',
    icon: 'check',
    xp: 50,
    cta: 'Ver minhas metas',
    href: '/admin',
    actionTab: 'myops',
    detect: (data) => (data.metas || []).some(m => m.status_fechamento === 'fechada' && !m.deleted_at),
  },
  {
    id: 'first_invite',
    title: 'Convidar um operador',
    desc: 'Escale dividindo as operacoes com sua equipe',
    icon: 'users',
    xp: 30,
    cta: 'Ir para operadores',
    href: '/operadores',
    detect: (data) => ((data.invites || []).length > 0) || ((data.operators || []).length > 0),
  },
  {
    id: 'pix_key',
    title: 'Cadastrar uma chave PIX',
    desc: 'Pra receber facilmente quando fechar lucros',
    icon: 'pix',
    xp: 20,
    cta: 'Cadastrar chave',
    href: '/pix',
    detect: (data) => (data.pixKeys || []).length > 0 || Boolean(data.profile?.pix_key),
  },
]

export const TOTAL_XP = ONBOARDING_STEPS.reduce((a, s) => a + s.xp, 0) // 170

export function calculateOnboardingProgress(data) {
  const steps = ONBOARDING_STEPS.map(s => ({ ...s, done: !!s.detect(data) }))
  const completed = steps.filter(s => s.done).length
  const xpEarned = steps.filter(s => s.done).reduce((a, s) => a + s.xp, 0)
  const nextStep = steps.find(s => !s.done) || null
  return {
    completed,
    total: steps.length,
    percent: Math.round((completed / steps.length) * 100),
    steps,
    nextStep,
    isComplete: completed === steps.length,
    xpEarned,
    xpTotal: TOTAL_XP,
  }
}

// Storage helpers (dismissal local — server-side flag pode vir depois)
const DISMISS_KEY = (uid) => `nx_onboarding_dismissed_${uid}`
const COMPLETED_AT_KEY = (uid) => `nx_onboarding_completed_${uid}`

export function isDismissed(userId) {
  if (!userId || typeof window === 'undefined') return false
  try { return localStorage.getItem(DISMISS_KEY(userId)) === '1' } catch { return false }
}
export function dismiss(userId) {
  if (!userId || typeof window === 'undefined') return
  try { localStorage.setItem(DISMISS_KEY(userId), '1') } catch {}
}
export function undismiss(userId) {
  if (!userId || typeof window === 'undefined') return
  try { localStorage.removeItem(DISMISS_KEY(userId)) } catch {}
}
export function markCompletedNow(userId) {
  if (!userId || typeof window === 'undefined') return
  try { localStorage.setItem(COMPLETED_AT_KEY(userId), String(Date.now())) } catch {}
}
export function getCompletedAt(userId) {
  if (!userId || typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(COMPLETED_AT_KEY(userId))
    return v ? Number(v) : null
  } catch { return null }
}
