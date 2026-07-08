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
export function networkEnabled(email) {
  return !!email && NETWORK_EMAILS.has(String(email).toLowerCase())
}

// Canais disponiveis (o SQL faz o seed; aqui e so o fallback/labels da UI).
export const NETWORK_CHANNELS = [
  { key: 'geral',         name: 'Network Geral',        emoji: '#', desc: 'Conversa geral da comunidade' },
  { key: 'avisos',        name: 'Avisos da Comunidade', emoji: '📢', desc: 'Comunicados oficiais' },
  { key: 'duvidas',       name: 'Dúvidas Operacionais', emoji: '❓', desc: 'Tire dúvidas com outros admins' },
  { key: 'resultados',    name: 'Resultados',           emoji: '📈', desc: 'Compartilhe resultados' },
  { key: 'oportunidades', name: 'Oportunidades',        emoji: '💡', desc: 'Redes, parcerias, oportunidades' },
  { key: 'offtopic',      name: 'Off-topic',            emoji: '☕', desc: 'Papo livre' },
]
