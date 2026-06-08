// Interruptor central do REDESIGN.
// LIBERADO GERAL (2026-06-08): todos os usuários logados (admins e operadores)
// recebem o novo visual. Pra voltar a restringir por email, troque o corpo de
// isRedesign pela checagem do Set abaixo.
export const REDESIGN_EMAILS = new Set([
  'leofritz180@gmail.com',
  'leofritz178@gmail.com',
])

export function isRedesign(email) {
  return !!email // qualquer usuário logado
}
