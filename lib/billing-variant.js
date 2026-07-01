// ═══════════════════════════════════════════════════════════════
// NexControl — A/B variant pra UI de billing/conversao
// 'A' = fluxo atual (controle)
// 'B' = pacote agressivo: sticky bar + trial chip + smart trigger
// ═══════════════════════════════════════════════════════════════

const KEY = 'nx_billing_variant'

/**
 * Retorna 'A' ou 'B'. B foi promovida para producao (default).
 * Override via querystring: ?v=a (forca controle) ou ?v=b (forca tratamento).
 *
 * Historico:
 * - Inicialmente split 50/50 random
 * - 2026-05-08: B aprovada → default 'B' pra todos. A so via ?v=a.
 */
export function getBillingVariant() {
  if (typeof window === 'undefined') return 'B'

  // URL override (dev/testing)
  try {
    const v = new URLSearchParams(window.location.search).get('v')
    if (v === 'a' || v === 'A') { localStorage.setItem(KEY, 'A'); return 'A' }
    if (v === 'b' || v === 'B') { localStorage.setItem(KEY, 'B'); return 'B' }
  } catch {}

  // Default = B (variant aprovada e em producao)
  return 'B'
}

/**
 * Helper de price anchoring: "R$ 59,90/mês · R$ 1,33/dia"
 */
export function formatPriceAnchor(monthly = 59.90) {
  const daily = (monthly / 30).toFixed(2).replace('.', ',')
  const m = monthly.toFixed(2).replace('.', ',')
  return { monthly: `R$ ${m}`, daily: `R$ ${daily}` }
}

/**
 * Modo preview: força a UI da variant B aparecer mesmo pra quem não tá em trial.
 * Ativa via ?preview=1 (persiste em localStorage). Desativa via ?preview=0.
 */
export function isPreviewMode() {
  if (typeof window === 'undefined') return false
  try {
    const v = new URLSearchParams(window.location.search).get('preview')
    if (v === '1') { localStorage.setItem('nx_preview', '1'); return true }
    if (v === '0') { localStorage.removeItem('nx_preview'); return false }
    return localStorage.getItem('nx_preview') === '1'
  } catch { return false }
}

/**
 * Status do trial: { isTrial, isExpired, daysLeft, urgency }
 */
export function getTrialStatus(tenant, sub) {
  // PREVIEW MODE: simula trial de 2 dias pra visualizar componentes da variant B
  if (isPreviewMode()) {
    return { isTrial: true, isExpired: false, daysLeft: 2, urgency: 'medium', preview: true }
  }

  const subActive = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())
  if (subActive) return { isTrial: false, isExpired: false, daysLeft: null, urgency: 'none' }

  const trialEnd = tenant?.trial_end ? new Date(tenant.trial_end) : null
  const now = new Date()
  if (!trialEnd) return { isTrial: false, isExpired: true, daysLeft: 0, urgency: 'critical' }

  const msLeft = trialEnd - now
  if (msLeft <= 0) return { isTrial: false, isExpired: true, daysLeft: 0, urgency: 'critical' }

  const daysLeft = Math.ceil(msLeft / 86400000)
  const urgency = daysLeft >= 3 ? 'low' : daysLeft >= 2 ? 'medium' : daysLeft >= 1 ? 'high' : 'critical'
  return { isTrial: true, isExpired: false, daysLeft, urgency }
}
