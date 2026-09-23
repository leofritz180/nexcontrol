// ─────────────────────────────────────────────────────────────────────────
// GRUPO NEX NETWORK — o upsell que aparece depois do pagamento aprovado.
//
// Acesso vitalício ao grupo de WhatsApp com quem opera CPA de verdade.
// Pagamento único, sem renovação.
//
// POR QUE DEPOIS DA APROVAÇÃO, e não antes: quem acabou de pagar está com
// a decisão fresca e a confiança alta. Oferecer antes competiria com a
// assinatura, que é o que sustenta o negócio.
//
// ONDE FICA GUARDADO QUEM COMPROU: este Supabase não dá DDL pela service
// role, então não existe tabela de membros. Mas não precisa de uma:
//   · nome e WhatsApp vão pro `profiles` (nome, phone) — colunas que já
//     existem e que o resto do produto já usa;
//   · quem comprou se identifica pelo VALOR em `mp_payments`. R$ 97,00 é
//     único no sistema: nenhum plano, período ou compra de operador cai
//     nesse número.
// Se um dia houver tabela, é trocar a leitura e apagar este bilhete.
// ─────────────────────────────────────────────────────────────────────────

export const GRUPO_PRECO = 97.00

/** O convite do WhatsApp. Vazio = a tela diz que a entrada é manual. */
export const GRUPO_LINK = process.env.NEXT_PUBLIC_NEX_GRUPO_URL || ''

/**
 * A apresentação que todo mundo posta ao entrar. Sai pronta pra copiar —
 * grupo em que ninguém se apresenta vira lista de silêncio, e grupo em que
 * a apresentação é livre vira bagunça. O modelo resolve os dois.
 */
export function modeloApresentacao({ nome = '', estado = '', idade = '' } = {}) {
  return [
    'Olá irmãos! 👋',
    `Nome: ${nome || ''}`,
    `Idade: ${idade || ''}`,
    `Estado: ${estado || ''}`,
    'Experiência com marketing digital: ',
    '@ do Instagram: ',
    '',
    'Pronto pra crescer com vocês! 🚀',
  ].join('\n')
}

/** Só dígitos, com o 55 na frente. Devolve null se não parecer telefone. */
export function normalizarWhatsapp(valor) {
  const d = String(valor || '').replace(/\D/g, '')
  if (d.length < 10 || d.length > 13) return null
  if (d.startsWith('55')) return d.length >= 12 ? d : null
  return '55' + d
}

/** (32) 99834-8889 — só pra mostrar de volta pra pessoa conferir. */
export function formatarWhatsapp(valor) {
  const d = String(valor || '').replace(/\D/g, '').replace(/^55/, '')
  if (d.length < 10) return valor || ''
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  const meio = resto.length > 8 ? resto.slice(0, 5) : resto.slice(0, 4)
  return `(${ddd}) ${meio}-${resto.slice(meio.length)}`
}
