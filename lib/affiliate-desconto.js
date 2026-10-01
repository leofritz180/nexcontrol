// Conta do desconto do saldo de afiliado — usada no servidor (create-payment)
// e na tela de pagamento (billing-mp), pra os dois mostrarem o MESMO valor.
// O PIX nunca fica abaixo de R$ 1,00: o que sobra do saldo fica guardado.
export const PIX_MINIMO = 1.00
export function descontoPara(saldo, preco) {
  const d = Math.max(0, Math.min(Number(saldo || 0), Number(preco || 0) - PIX_MINIMO))
  return Math.round(d * 100) / 100
}
