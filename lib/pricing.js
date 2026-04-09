// ═══════════════════════════════════
// NexControl — Pricing Engine
// Single source of truth for all pricing
// ═══════════════════════════════════

export const BASE_PRICE = 39.90
export const OP_BASE_PRICE = 19.90

// Discount tiers
const TIERS = [
  { min: 1,  max: 1,  discount: 0 },
  { min: 2,  max: 3,  discount: 10 },
  { min: 4,  max: 6,  discount: 15 },
  { min: 7,  max: 9,  discount: 20 },
  { min: 10, max: 999, discount: 25 },
]

export function getDiscountTier(opCount) {
  if (opCount <= 0) return { discount: 0, tier: null, nextTier: TIERS[0] }
  const tier = TIERS.find(t => opCount >= t.min && opCount <= t.max) || TIERS[TIERS.length - 1]
  const nextTier = TIERS.find(t => t.min > opCount) || null
  return { discount: tier.discount, tier, nextTier }
}

export function calculatePrice(opCount) {
  const { discount, tier, nextTier } = getDiscountTier(opCount)
  const factor = 1 - discount / 100
  const opUnitPrice = Math.round(OP_BASE_PRICE * factor * 100) / 100
  const opTotal = Math.round(opCount * opUnitPrice * 100) / 100
  const total = Math.round((BASE_PRICE + opTotal) * 100) / 100
  const fullPrice = Math.round((BASE_PRICE + opCount * OP_BASE_PRICE) * 100) / 100
  const savings = Math.round((fullPrice - total) * 100) / 100

  return {
    base: BASE_PRICE,
    opCount,
    opUnitPrice,
    opTotal,
    total,
    fullPrice,
    savings,
    discount,
    tier,
    nextTier,
    nextTierOps: nextTier ? nextTier.min : null,
    nextTierDiscount: nextTier ? nextTier.discount : null,
  }
}

export function getAllTiers() {
  return TIERS.map(t => ({
    ...t,
    label: t.min === t.max ? `${t.min} operador` : `${t.min}-${t.max} operadores`,
    unitPrice: Math.round(OP_BASE_PRICE * (1 - t.discount / 100) * 100) / 100,
  }))
}
