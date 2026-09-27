/* ROTEIRO — um trecho por cena. Aprovado pelo dono em 26/09/2026.
   Só o último trecho muda entre as variantes de CTA. */
const BASE = [
  "Sua operação ainda vive em planilha e print de WhatsApp?",
  "E o lucro do dia vira chute.",
  "Com o Nex Control, cada meta tem dono,",
  "cada remessa entra na hora,",
  "e o painel mostra lucro e prejuízo em tempo real.",
  "Fechou a meta? Salário, baú e custos entram na conta,",
  "e o lucro final sai calculado.",
  "Meta parada ou remessa no vermelho? Alerta no celular.",
  "Cada operador com acesso próprio, e um ranking da equipe.",
  "Sua operação inteira, sob controle.",
];
export const FECHOS = {
  bio: "Conheça o Nex Control, link na bio.",
  saiba: "Conheça o Nex Control, toque em saiba mais.",
};
export const trechos = (cta) => [...BASE, FECHOS[cta]];
