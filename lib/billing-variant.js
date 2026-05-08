// ═══════════════════════════════════════════════════════════════
// NexControl — A/B variant pra UI de billing/conversao
// 'A' = fluxo atual (controle)
// 'B' = pacote agressivo: sticky bar + trial chip + smart trigger
// ═══════════════════════════════════════════════════════════════

const KEY = 'nx_billing_variant'

/**
 * Retorna 'A' ou 'B'. Persiste em localStorage por user.
 * Override via querystring: ?v=a ou ?v=b
 */
export function getBillingVariant() {
  if (typeof window === 'undefined') return 'A'

  // URL override (dev/testing)
  try {
    const v = new URLSearchParams(window.location.search).get('v')
    if (v === 'a' || v === 'A') { localStorage.setItem(KEY, 'A'); return 'A' }
    if (v === 'b' || v === 'B') { localStorage.setItem(KEY, 'B'); return 'B' }
  } catch {}

  // Stored
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'A' || stored === 'B') return stored
  } catch {}

  // Split 50/50, persiste
  const v = Math.random() < 0.5 ? 'A' : 'B'
  try { localStorage.setItem(KEY, v) } catch {}
  return v
}

/**
 * Helper de price anchoring: "R$ 39,90/mês · R$ 1,33/dia"
 */
export function formatPriceAnchor(monthly = 39.90) {
  const daily = (monthly / 30).toFixed(2).replace('.', ',')
  const m = monthly.toFixed(2).replace('.', ',')
  return { monthly: `R$ ${m}`, daily: `R$ ${daily}` }
}

/**
 * Status do trial: { isTrial, isExpired, daysLeft, urgency }
 */
export function getTrialStatus(tenant, sub) {
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
