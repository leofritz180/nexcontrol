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

// ROLLOUT GERAL — a 2.0 vale pra todo mundo.
//
// Enquanto isto era false, a lista acima mandava. Ligado, o e-mail deixa de
// importar: qualquer conta vê a 2.0, INCLUSIVE quem ainda não entrou.
//
// Isso último é o ponto. Login, cadastro, convite e redefinir senha não têm
// sessão pra consultar, então com a lista ligada elas ficavam no visual
// antigo e a pessoa entrava por uma porta escura num prédio claro. Aqui as
// duas coisas viram no MESMO instante, que é a única forma de não existir
// esse degrau.
//
// Pra voltar atrás: basta devolver false. A lista continua inteira acima e o
// ramo antigo de cada tela ainda está no lugar.
export const ROLLOUT_GERAL = true

export function isNex2(email) {
  if (ROLLOUT_GERAL) return true
  return !!email && NEX2_EMAILS.has(String(email).toLowerCase())
}
