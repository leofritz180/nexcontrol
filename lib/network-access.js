// ─────────────────────────────────────────────────────────────────────────
// NETWORK — feature flag (rollout seguro).
// Modulo social/comunidade entre ADMINs da NexControl. Comeca liberado APENAS
// para as contas abaixo (owner + DS Mentoria) pra validar em producao sem
// impactar ninguem. Pra liberar geral, troque o corpo de networkEnabled por
// `role === 'admin'` (todos os admins) — a UI/rotas ja estao prontas pra isso.
// ─────────────────────────────────────────────────────────────────────────

export const NETWORK_EMAILS = new Set([
  'leofritz180@gmail.com',   // owner / voce
  'darkzinmg7@gmail.com',    // DS Mentoria 2.0 (conta secundaria do dono)
])

// Habilita o Network pra um email (allowlist da fase de teste).
//
// ROLLOUT GERAL (quando liberar pra todos): a regra sera "admin PRO ativo".
// Ou seja: SO admins com assinatura PRO ativa acessam/veem as mensagens.
// A checagem de PRO depende de subscription (server-side) — quando for a hora,
// authNetwork passa a exigir sub ativa (alem de role admin) e o item do menu
// so aparece pra quem tem PRO. Ate la, fica so nesta allowlist.
export function networkEnabled(email) {
  return !!email && NETWORK_EMAILS.has(String(email).toLowerCase())
}

// Email do dono (acesso a tudo + moderacao total).
export const OWNER_EMAIL = 'leofritz180@gmail.com'
// Quem pode dar "verificado" a outros usuarios.
export const VERIFIER_EMAILS = new Set(['leofritz180@gmail.com', 'darkzinmg7@gmail.com'])

// Canais disponiveis. Regras:
//   ownerOnly  -> so o OWNER envia (ex: Avisos)
//   requireImage -> mensagem SO com foto (sem texto solto) (ex: Resultados)
export const NETWORK_CHANNELS = [
  { key: 'geral',      name: 'Network Geral',        emoji: '#',  desc: 'Conversa geral da comunidade' },
  { key: 'avisos',     name: 'Avisos da Comunidade', emoji: '📢', desc: 'Comunicados oficiais', ownerOnly: true },
  { key: 'resultados', name: 'Resultados',           emoji: '📈', desc: 'Só foto + legenda', requireImage: true },
]

export function channelRule(key) {
  return NETWORK_CHANNELS.find(c => c.key === key) || null
}
