// ═══════════════════════════════════
// NexControl — Pricing Engine
// Single source of truth for all pricing
// ═══════════════════════════════════

export const BASE_PRICE = 59.90
export const OP_BASE_PRICE = 29.90

// Discount tiers
const TIERS = [
  { min: 1,  max: 1,  discount: 0 },
  { min: 2,  max: 3,  discount: 10 },
  { min: 4,  max: 6,  discount: 15 },
  { min: 7,  max: 9,  discount: 20 },
  { min: 10, max: 999, discount: 25 },
]

// ═══════════════════════════════════════════════════════════════════════
// PACOTES FECHADOS — a oferta nova, LIGADA em 23/09/2026.
//
// PRA DESLIGAR em emergencia: trocar true por false e subir. Volta na hora
// pro modelo antigo (base + por operador com desconto progressivo), sem
// mais nada a fazer.
//
// O create-payment chama calculatePrice, entao o valor que vai pro Mercado
// Pago e o do pacote. O MP nao sabe o que e plano: recebe um numero e
// devolve um QR.
//
// A MIGRACAO, decidida em 23/09/2026: quem ja tem equipe fica no preco
// atual ate o proprio vencimento; na renovacao seguinte ve a oferta nova.
// Isso NAO precisa de trava de preco por conta — como nao existe cobranca
// recorrente (cada ciclo e um PIX novo, com preco calculado na hora),
// quem ja pagou esta preservado por definicao ate vencer.
//
// O QUE CONFERIR ANTES DE LIGAR (dados de 22/09/2026):
//   · 84 pagantes. 66 sem operador — esses nao sentem nada (Solo, 59,90).
//   · 15 com equipe. A Dupla existe por causa deles: 14 dos 15 tem 1 ou 2
//     operadores, e sem ela cairiam no Scale 3 com +49% e +89%.
//   · 7 assinaturas com operator_count divergente da ultima cobranca —
//     ver scripts/auditoria-vagas.mjs. Resolver ANTES, senao o pacote e
//     escolhido em cima de um numero de vagas que ninguem pagou.
// ═══════════════════════════════════════════════════════════════════════
export const PACOTES_ATIVOS = true

export const PACOTES = [
  // ops = quantos operadores o pacote COBRE (o admin nao conta)
  // pro = leva a camada de leitura da operacao (projecao, comparacao,
  //       tendencia, captura automatica de QR, verificado no Network)
  { id: 'solo',     nome: 'Solo',     preco: BASE_PRICE, ops: 0,  pro: false },
  { id: 'solo-pro', nome: 'Solo Pro', preco: 99.90,      ops: 0,  pro: true  },
  { id: 'dupla',    nome: 'Dupla',    preco: 129.90,     ops: 2,  pro: true  },
  { id: 'scale-3',  nome: 'Scale 3',  preco: 169.90,     ops: 3,  pro: true  },
  { id: 'scale-6',  nome: 'Scale 6',  preco: 259.90,     ops: 6,  pro: true  },
  { id: 'scale-10', nome: 'Scale 10', preco: 399.90,     ops: 10, pro: true  },
]

/** O pacote pelo id. */
export function pacotePorId(id) {
  return PACOTES.find(p => p.id === id) || null
}

/**
 * O menor pacote que cobre N operadores.
 * `pro` so importa com 0 operadores (Solo x Solo Pro) — todo pacote com
 * equipe ja inclui a camada pro.
 */
export function pacotePara(operadores, { pro = false } = {}) {
  const n = Math.max(0, Math.floor(Number(operadores) || 0))
  if (n === 0) return pacotePorId(pro ? 'solo-pro' : 'solo')
  return PACOTES.find(p => p.ops >= n) || null   // null = acima de 10
}

// PRECO DO OPERADOR ACIMA DO TETO — numero CRAVADO, nao calculado.
//
// Estava como Math.round(OP_BASE_PRICE * 0.75 * 100) / 100, e isso dava
// resultado DIFERENTE em cada ambiente: no Node, 29.90 * 0.75 * 100 vale
// 2242.4999999999995 e arredonda pra 22,42; no bundle de producao o
// minificador dobra a mesma expressao pra 2242.5, que arredonda pra 22,43.
// Quatro centavos de diferenca entre o que o teste diz e o que o cliente
// paga — pouco em dinheiro, inaceitavel em confianca.
//
// Preco nao se calcula com ponto flutuante: se escreve.
const POR_EXCEDENTE = 22.43

/**
 * Preco mensal com pacote. Acima de 10 operadores nenhum pacote cobre,
 * entao o excedente e cobrado pela regra antiga com o desconto do topo —
 * o importante e que NINGUEM fique sem conseguir pagar.
 */
export function precoComPacote(operadores, { pro = false } = {}) {
  const n = Math.max(0, Math.floor(Number(operadores) || 0))
  const p = pacotePara(n, { pro })
  if (p) return { total: p.preco, pacote: p, excedente: 0 }
  const topo = pacotePorId('scale-10')
  const excedente = n - topo.ops
  return {
    total: Math.round((topo.preco + excedente * POR_EXCEDENTE) * 100) / 100,
    pacote: topo,
    excedente,
  }
}

export function getDiscountTier(opCount) {
  if (opCount <= 0) return { discount: 0, tier: null, nextTier: TIERS[0] }
  const tier = TIERS.find(t => opCount >= t.min && opCount <= t.max) || TIERS[TIERS.length - 1]
  const nextTier = TIERS.find(t => t.min > opCount) || null
  return { discount: tier.discount, tier, nextTier }
}

/**
 * O PRECO. Quem manda no que vai pro Mercado Pago.
 *
 * Com PACOTES_ATIVOS ligado devolve o preco do pacote, mas mantendo os
 * MESMOS campos de sempre — `total`, `opUnitPrice`, `discount` e o resto
 * continuam existindo, porque o create-payment e as telas de cobranca leem
 * daqui e quebrariam com um objeto de outro formato.
 */
export function calculatePrice(opCount, { pro = false } = {}) {
  const n = Math.max(0, Math.floor(Number(opCount) || 0))
  const { discount, tier, nextTier } = getDiscountTier(n)
  const factor = 1 - discount / 100
  const opUnitPrice = Math.round(OP_BASE_PRICE * factor * 100) / 100
  const opTotal = Math.round(n * opUnitPrice * 100) / 100
  const fullPrice = Math.round((BASE_PRICE + n * OP_BASE_PRICE) * 100) / 100

  if (!PACOTES_ATIVOS) {
    const total = Math.round((BASE_PRICE + opTotal) * 100) / 100
    return {
      base: BASE_PRICE, opCount: n, opUnitPrice, opTotal, total, fullPrice,
      savings: Math.round((fullPrice - total) * 100) / 100,
      discount, tier, nextTier,
      nextTierOps: nextTier ? nextTier.min : null,
      nextTierDiscount: nextTier ? nextTier.discount : null,
      pacote: null,
    }
  }

  const { total, pacote, excedente } = precoComPacote(n, { pro })
  // os campos derivados passam a descrever o pacote, pra quem le continuar
  // conseguindo montar "base + operadores" na tela
  const opTotalPac = Math.round((total - BASE_PRICE) * 100) / 100
  return {
    base: BASE_PRICE,
    opCount: n,
    opUnitPrice: n > 0 ? Math.round((opTotalPac / n) * 100) / 100 : 0,
    opTotal: opTotalPac,
    total,
    fullPrice,
    savings: Math.round(Math.max(0, fullPrice - total) * 100) / 100,
    discount: fullPrice > 0 ? Math.round((1 - total / fullPrice) * 100) : 0,
    tier, nextTier,
    nextTierOps: nextTier ? nextTier.min : null,
    nextTierDiscount: nextTier ? nextTier.discount : null,
    pacote, excedente,
  }
}

export function getAllTiers() {
  return TIERS.map(t => ({
    ...t,
    label: t.min === t.max ? `${t.min} operador` : `${t.min}-${t.max} operadores`,
    unitPrice: Math.round(OP_BASE_PRICE * (1 - t.discount / 100) * 100) / 100,
  }))
}
