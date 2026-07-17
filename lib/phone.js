// Normalizacao/validacao de telefone BR (WhatsApp).
// Armazenamos SO DIGITOS com DDI: 55 + DDD (2) + numero (8-9) = 12-13 digitos.
// Ex.: "(32) 99834-8889" -> "5532998348889". Retorna null se invalido.

export function normalizeBRPhone(input) {
  let d = String(input || '').replace(/\D/g, '')
  if (!d) return null
  // remove zeros a esquerda (0DD...)
  d = d.replace(/^0+/, '')
  // ja veio com 55? (12-13 digitos)
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    // cuidado: numeros locais que COMECAM com 55 (DDD 55 existe) tem 10-11 digitos,
    // entao só tratamos como DDI quando o tamanho bate com DDI+DDD+numero.
  } else if (d.length === 10 || d.length === 11) {
    d = '55' + d
  } else {
    return null
  }
  const ddd = Number(d.slice(2, 4))
  if (ddd < 11 || ddd > 99) return null
  const num = d.slice(4)
  if (num.length < 8 || num.length > 9) return null
  // lixo obvio: todos os digitos iguais
  if (/^(\d)\1+$/.test(num)) return null
  return d
}

// Exibicao amigavel: 5532998348889 -> (32) 99834-8889
export function formatBRPhone(digits) {
  const d = String(digits || '').replace(/\D/g, '')
  if (d.length < 12) return digits || ''
  const ddd = d.slice(2, 4), num = d.slice(4)
  const cut = num.length - 4
  return `(${ddd}) ${num.slice(0, cut)}-${num.slice(cut)}`
}
