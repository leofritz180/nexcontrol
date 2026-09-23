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
  'leofritz180@gmail.com', // conta principal do dono (mais dados, pra validar de verdade)

  // PRIMEIRA CONTA DE OPERADOR na 2.0. E operador do DS MENTORIA 2.0, com
  // 32 metas fechadas, 198 remessas e 2437 depositantes — volume suficiente
  // pra validar o painel com dado de verdade, nao com conta vazia.
  // Cuidado com os homonimos: existem outras quatro contas "Lucas Neves
  // Serra"/"Lucas Neves" no banco, e as outras estao zeradas. A certa e
  // esta, com dominio @gma.com.
  'lucasserea73@gma.com', // Lucas Neves Serra — operador
])

export function isNex2(email) {
  return !!email && NEX2_EMAILS.has(String(email).toLowerCase())
}
