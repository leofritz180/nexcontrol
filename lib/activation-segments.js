// Segmentos de ATIVACAO — para quem CADASTROU mas ainda NAO criou nenhuma meta.
// Diferente do trial-notifications (que pede assinatura) e do engagement (cliente
// pagante dormente). Aqui o objetivo eh ATIVAR: fazer o usuario criar a 1a meta.
//
// Insight do funil (jul/2026): 64% dos cadastros nunca criam uma meta, mas
// 68% dos que FECHAM uma meta viram pagantes. A ativacao eh o gargalo — o valor
// ja esta provado. Estes nudges empurram o usuario pra criar/fechar a 1a meta,
// sem falar de preco (o pedido de assinatura fica com o trial-cron nos dias 3/1).

export const ACTIVATION_SEGMENTS = [
  {
    id: 'activation_d1',
    daysSinceSignup: 1,
    push: {
      title: '{nome}, monta sua primeira meta em 2 min',
      body: 'Voce ainda ta no modo demo. Cria uma meta real e ve o lucro da operacao ao vivo.',
    },
    email: {
      subject: 'Falta 1 passo pra sua operacao aparecer, {nome}',
      preheader: 'Crie sua primeira meta e veja os numeros reais.',
      bodyTitle: 'Sua operacao ainda esta no modo demo',
      bodyText: 'Voce se cadastrou mas ainda nao criou nenhuma meta — entao o painel esta mostrando dados de exemplo. Crie sua primeira meta (leva 2 minutos) e o NexControl passa a calcular seu lucro real, por operador, em tempo real. Quem cria a primeira meta e quem realmente sente o controle da operacao.',
      ctaText: 'Criar minha primeira meta',
    },
  },
  {
    id: 'activation_d3',
    daysSinceSignup: 3,
    push: {
      title: 'Sua conta ta vazia, {nome}',
      body: 'Cria a 1a meta antes do teste acabar — e assim que voce ve o lucro real da sua equipe.',
    },
    email: {
      subject: '{nome}, nao deixe seu teste passar em branco',
      preheader: 'Bastam 2 minutos pra ativar sua operacao.',
      bodyTitle: 'Seu teste ta correndo — e sua conta ainda ta vazia',
      bodyText: 'Voce comecou o teste do NexControl mas ainda nao criou nenhuma meta. A galera que cria a primeira meta e quem enxerga na hora quanto cada operador rende e quanto a operacao lucra no dia. Nao deixe o teste acabar sem ver isso funcionando com os SEUS numeros. Leva 2 minutos pra montar a primeira.',
      ctaText: 'Ativar minha operacao',
    },
  },
]

// Escolhe o segmento pelo dia exato desde o cadastro (so dispara 1x por marco).
export function pickActivationSegment(daysSinceSignup) {
  return ACTIVATION_SEGMENTS.find(s => daysSinceSignup === s.daysSinceSignup) || null
}
