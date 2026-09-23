// ─────────────────────────────────────────────────────────────────────────
// QUEM É PRO.
//
// O Pro é a camada de leitura e automação do NexControl 2.0. Ele entra em
// três lugares, e em nenhum outro:
//
//   1. LEITURA DA OPERAÇÃO — projeção de fechamento do mês, comparação com
//      o período anterior e tendência de alta/queda (/faturamento), mais a
//      evolução meta a meta (/performance).
//   2. CAPTURA AUTOMÁTICA DE QR — a extensão lê o valor do PIX e soma na
//      remessa sem digitação (/api/deposit-capture).
//   3. VERIFICADO NO NETWORK — o selo no perfil da comunidade.
//
// COMO SE SABE, sem coluna nova no banco:
//
// O Supabase aqui não dá DDL pela service role e não há string de conexão
// direta, então não existe `subscriptions.pacote`. Mas dá pra derivar sem
// ambiguidade, porque a tabela de preços não se sobrepõe:
//
//   · com 1+ operador  -> Dupla ou Scale, e TODOS incluem Pro.
//   · com 0 operadores -> Solo (R$ 59,90) ou Solo Pro (R$ 99,90). Aí o que
//     separa é o valor. Mesmo no anual, que tem 25% de desconto, as faixas
//     não se tocam:
//         Solo      R$ 44,85 (anual) .. R$ 59,90 (mensal)
//         Solo Pro  R$ 74,93 (anual) .. R$ 99,90 (mensal)
//     O corte em R$ 65 fica no meio do vão, longe das duas pontas.
//
// SE UM DIA HOUVER COLUNA, troque `ehPro` por uma leitura direta e apague o
// palpite. Enquanto não houver, o palpite é seguro e está testado.
// ─────────────────────────────────────────────────────────────────────────

/** No meio do vão entre o Solo anual (44,85) e o Solo Pro anual (74,93). */
const CORTE_MENSAL_PRO = 65

/**
 * @param {{operator_count?:number, total_amount?:number, plan_months?:number}} sub
 *   a assinatura VIGENTE do tenant (a de maior expires_at ainda válida)
 */
export function ehPro(sub) {
  if (!sub) return false
  const ops = Number(sub.operator_count || 0)
  if (ops > 0) return true          // Dupla e Scale já vêm com a camada

  const meses = Math.max(1, Number(sub.plan_months || 1))
  const mensal = Number(sub.total_amount || 0) / meses
  return mensal >= CORTE_MENSAL_PRO
}

/**
 * A assinatura que vale hoje, de uma lista. Sempre a de maior vencimento
 * ainda no futuro — nunca a mais recente por created_at, porque compra de
 * operador no meio do ciclo cria linha nova com vencimento menor.
 */
export function subVigente(subs, agora = new Date()) {
  let melhor = null
  for (const s of (subs || [])) {
    if (s?.status !== 'active' || !s?.expires_at) continue
    if (new Date(s.expires_at) <= agora) continue
    if (!melhor || new Date(s.expires_at) > new Date(melhor.expires_at)) melhor = s
  }
  return melhor
}

/** Atalho: recebe a lista de assinaturas e diz se o tenant é Pro. */
export function tenantEhPro(subs, agora = new Date()) {
  return ehPro(subVigente(subs, agora))
}

/**
 * Busca no banco e responde. Serve pro servidor (service role) e pro
 * cliente (anon com RLS) — os dois enxergam as subs do próprio tenant.
 */
export async function buscarEhPro(sb, tenantId) {
  if (!sb || !tenantId) return false
  try {
    const { data } = await sb.from('subscriptions')
      .select('operator_count,total_amount,plan_months,status,expires_at')
      .eq('tenant_id', tenantId).eq('status', 'active')
    return tenantEhPro(data)
  } catch { return false }
}
