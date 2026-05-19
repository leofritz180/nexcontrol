/**
 * Tour config — steps do painel admin.
 *
 * Cada step: { target, title, description, position }
 *   target:     seletor CSS do elemento (ex: '[data-tour="hero-lucro"]')
 *               se null → step de texto centralizado (welcome/final)
 *   title:      titulo curto do passo
 *   description: explicacao 1-3 frases
 *   position:   'top' | 'bottom' | 'left' | 'right' | 'auto' (default)
 */

export const ADMIN_TOUR_STEPS = [
  {
    target: null,
    title: 'Bem-vindo ao NexControl',
    description: 'Vamos te mostrar cada parte do painel em ~90 segundos. Você pode sair a qualquer momento clicando no X.',
  },
  {
    target: '[data-tour="hero-lucro"]',
    title: 'Lucro final acumulado',
    description: 'O coração do painel. Soma de todas as metas fechadas — depois de salário, BAU e custos. É o dinheiro que você de fato gerou operando.',
    position: 'bottom',
  },
  {
    target: '[data-tour="kpi-deposito"]',
    title: 'Total depositado',
    description: 'Volume bruto de depósitos feitos pelos seus operadores em todas as metas. Indicador de tamanho da operação.',
    position: 'left',
  },
  {
    target: '[data-tour="kpi-saque"]',
    title: 'Total sacado',
    description: 'Quanto saiu em forma de saque. A diferença entre depositado e sacado é o resultado bruto das remessas (antes de salário/BAU).',
    position: 'left',
  },
  {
    target: '[data-tour="kpi-metas"]',
    title: 'Total de metas',
    description: 'Quantas metas você já criou desde o início. Inclui ativas, finalizadas e fechadas.',
    position: 'left',
  },
  {
    target: '[data-tour="kpi-depositantes"]',
    title: 'Depositantes totais',
    description: 'Quantas contas únicas foram processadas. Esse é o volume real da sua operação — cada conta vira potencial bônus de BAU.',
    position: 'left',
  },
  {
    target: '[data-tour="menu-operadores"]',
    title: 'Gerenciar equipe',
    description: 'Convide operadores, veja ranking de performance, defina modelo de remuneração e remova quem sair da equipe (sem perder histórico de lucro).',
    position: 'right',
  },
  {
    target: '[data-tour="menu-redes"]',
    title: 'Comparar redes',
    description: 'Ranking das plataformas onde você opera (W1, OKOK, VOY...). Sparklines de 6 semanas, volatilidade e tendência semanal.',
    position: 'right',
  },
  {
    target: '[data-tour="menu-faturamento"]',
    title: 'Faturamento',
    description: 'Receita global da operação. Lucro líquido após custos, insights de IA e gráficos de evolução.',
    position: 'right',
  },
  {
    target: '[data-tour="menu-custos"]',
    title: 'Custos operacionais',
    description: 'Proxy, SMS, VPS, bot. Registre aqui — o sistema desconta automaticamente do lucro bruto pra calcular sua margem real.',
    position: 'right',
  },
  {
    target: '[data-tour="menu-pix"]',
    title: 'Chaves PIX',
    description: 'Importe chaves em lote. O sistema detecta tipo (telefone, CPF, e-mail, EVP) e organiza pra operadores escolherem na hora da remessa.',
    position: 'right',
  },
  {
    target: '[data-tour="menu-afiliados"]',
    title: 'Programa de afiliados',
    description: 'Compartilhe seu link único e ganhe comissão recorrente todo mês enquanto seus indicados pagam. Renda extra sem esforço.',
    position: 'right',
  },
  {
    target: '[data-tour="menu-slots"]',
    title: 'Slots Premium',
    description: 'Biblioteca curada de 48 slots testados. Filtros por provider e performance — pra você guiar seus operadores na escolha.',
    position: 'right',
  },
  {
    target: null,
    title: 'Pronto pra começar?',
    description: 'Esse foi o tour. Pra criar sua primeira meta, clique em "Nova meta" no menu lateral ou no botão flutuante. Boa operação.',
  },
]

export const TOURS = {
  admin: ADMIN_TOUR_STEPS,
}

export function getTour(routeId) {
  return TOURS[routeId] || []
}
