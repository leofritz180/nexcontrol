// ─────────────────────────────────────────────────────────────────────────
// TEMA DO PAINEL (claro / escuro) — uma fonte só da verdade.
//
// Desde 25/09/2026 o ESCURO é o padrão: é a paleta da landing 2.0 (preto
// #080909 + lime #C8F21D + laranja pontual) e o dono quis que o produto e a
// página de venda parecessem a mesma marca. O claro continua a um clique,
// no menu e no bem-vindo.
//
// Chave nova ('nx_tema') de propósito: a antiga ('nx_noir') guardava '0' pra
// quem só passou pelo seletor com o claro pré-marcado — respeitá-la deixaria
// quase todo mundo no claro sem nunca ter escolhido. A antiga fica ignorada.
//
// O script inline do app/layout.js repete esta regra (roda antes do React).
// ─────────────────────────────────────────────────────────────────────────
export const CHAVE_TEMA = 'nx_tema'

// Telas de entrada (sem sessao) tem layout claro PROPRIO, com fundo cravado:
// no escuro so o botao mudaria (lime com texto branco). Ficam no claro de
// sempre. O script inline do app/layout.js repete esta lista.
export const ROTAS_SEM_ESCURO = ['/login', '/signup', '/reset-password', '/invite', '/convite']
export function rotaAceitaEscuro(pathname) {
  const p = pathname || ''
  return !ROTAS_SEM_ESCURO.some(r => p === r || p.startsWith(r + '/'))
}

export function temaEscuro() {
  try { return localStorage.getItem(CHAVE_TEMA) !== 'claro' } catch { return true }
}

export function definirTema(escuro) {
  try { localStorage.setItem(CHAVE_TEMA, escuro ? 'escuro' : 'claro') } catch {}
  try { document.documentElement.classList.toggle('nx-noir', !!escuro) } catch {}
  try { window.dispatchEvent(new CustomEvent('nx:tema', { detail: { escuro: !!escuro } })) } catch {}
}
