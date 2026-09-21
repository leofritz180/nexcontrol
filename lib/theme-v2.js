// ─────────────────────────────────────────────────────────────────────────
// VISUAL V2 ("bento claro") — interruptor por CONTA.
//
// Liga o modo claro + a camada bento (cantos arredondados, sombras suaves,
// superfícies brancas) SÓ para os e-mails abaixo. Qualquer outro usuário
// continua exatamente com o visual atual — nenhuma função, tela ou dado muda.
//
// Rollout: testar aqui → validar → ir adicionando e-mails → liberar geral
// trocando o corpo de isNex2 por `return !!email`.
// ─────────────────────────────────────────────────────────────────────────
export const NEX2_EMAILS = new Set([
  'leofritz178@gmail.com', // conta de teste do dono
])

export function isNex2(email) {
  return !!email && NEX2_EMAILS.has(String(email).toLowerCase())
}
