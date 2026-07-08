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

// Chave do rollout GERAL (General Availability). `true` = Network aberto para
// admins PRO ativos (alem da allowlist). Checagem de sub ativa fica no
// authNetwork/Sidebar/page. LANCADO OFICIAL 08/07/2026 (so PRO).
export const NETWORK_GA = true

// Ate quando o selo "NOVO" aparece no menu (lancamento). Depois some sozinho.
export const NETWORK_NEW_UNTIL = '2026-07-19T00:00:00Z'
// Quantos "Fundadores" (primeiros a entrar) recebem o selo automatico.
export const FOUNDERS_LIMIT = 100

// ─────────────────────────────────────────────────────────────────────────
// SOCIAL BETA — nova experiencia "rede social premium" do Network (perfil estilo
// Instagram, feed de Resultados com posts/curtidas/comentarios). Fica visivel
// SOMENTE para as contas abaixo (fase de teste). Ninguem mais ve essa versao:
// pra todos os outros, o Network continua exatamente como esta hoje.
// Estas contas tambem ganham acesso ao Network independente de PRO (sao teste).
// ─────────────────────────────────────────────────────────────────────────
export const SOCIAL_BETA_EMAILS = new Set([
  'leofritz178@gmail.com',   // conta de teste
])
export function socialBetaEnabled(email) {
  return !!email && SOCIAL_BETA_EMAILS.has(String(email).toLowerCase())
}

// ROLLOUT GERAL da experiencia social. `true` = TODOS que ja tem acesso ao Network
// (allowlist + admins PRO ativos) recebem a versao rede social (perfil Instagram,
// feed Resultados, curtidas/comentarios). Aprovado 08/07/2026. Pra voltar pro modo
// so-teste, basta setar `false` (o gate volta a ser so a allowlist SOCIAL_BETA_EMAILS).
export const NETWORK_SOCIAL_GA = true

// Reacoes permitidas (toggle 1 por emoji/usuario/msg). ❤️ = "curtir" (feed social);
// os demais sao as reacoes rapidas. Superset das antigas pra nao quebrar historico.
export const ALLOWED_REACTIONS = ['❤️', '🔥', '💰', '👏', '🚀', '🎯', '✅', '👀']
// Paleta de reacoes exibida nos POSTS do feed Resultados (modo social).
export const POST_REACTIONS = ['🔥', '💰', '👏', '🚀', '🎯']

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
