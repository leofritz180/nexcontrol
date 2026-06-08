// Interruptor central do REDESIGN (gated por email).
// Pra liberar geral depois da aprovação: troque isRedesign por () => true
// (ou adicione mais emails). Único lugar pra mexer no gate.
export const REDESIGN_EMAILS = new Set([
  'leofritz180@gmail.com',
  'leofritz178@gmail.com',
])

export function isRedesign(email) {
  return !!email && REDESIGN_EMAILS.has(String(email).toLowerCase())
}
