// Planos de assinatura — periodo + desconto sobre preço base.
// Preço base: R$ 59,90/mês (admin) + R$ 29,90/mês por operador extra.

export const BASE_PRICE = 59.9 // R$/mês (plano base admin)

export const PLANS = [
  {
    id: 'monthly',
    months: 1,
    label: 'Mensal',
    discount: 0,
    badge: null,
    description: 'Renovação manual todo mês',
  },
  {
    id: 'quarterly',
    months: 3,
    label: 'Trimestral',
    discount: 0.10, // 10% off
    badge: '10% OFF',
    description: 'Economiza R$ 9 por operador',
  },
  {
    id: 'semiannual',
    months: 6,
    label: 'Semestral',
    discount: 0.15, // 15% off
    badge: '15% OFF',
    description: 'Economiza R$ 27 por operador',
  },
  {
    id: 'annual',
    months: 12,
    label: 'Anual',
    discount: 0.25, // 25% off
    badge: 'MAIS POPULAR',
    description: 'Economiza R$ 90 por operador · 3 meses grátis',
    highlighted: true,
  },
]

export function getPlan(id) {
  return PLANS.find(p => p.id === id) || PLANS[0]
}

/**
 * Calcula valor final do plano.
 * @param {string} planId   - 'monthly' | 'quarterly' | 'semiannual' | 'annual'
 * @param {number} operatorCount - quantos operadores
 * @returns {{ base, gross, discount, total, perMonth, plan }}
 */
export function calculatePrice(planId, operatorCount = 1) {
  const plan = getPlan(planId)
  const ops = Math.max(1, Number(operatorCount) || 1)
  const monthly = BASE_PRICE * ops
  const gross = monthly * plan.months
  const discount = gross * plan.discount
  const total = Number((gross - discount).toFixed(2))
  const perMonth = Number((total / plan.months).toFixed(2))
  return { base: monthly, gross, discount, total, perMonth, plan }
}

/**
 * Calcula nova data de expiracao baseada no plano.
 */
export function addPlanMonths(fromDate, planId) {
  const plan = getPlan(planId)
  const d = new Date(fromDate)
  d.setMonth(d.getMonth() + plan.months)
  return d
}
