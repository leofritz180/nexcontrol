/**
 * Tour config — steps por rota.
 *
 * Cada step: { target, title, description, position }
 *   target:     seletor CSS do elemento (ex: '[data-tour="hero"]')
 *               se null → step de texto centralizado
 *   title:      titulo curto
 *   description: explicacao 1-3 frases
 *   position:   'top' | 'bottom' | 'left' | 'right' | 'auto' (default)
 */

// ═══════════════════════════════════════
// /admin — Visão geral
// ═══════════════════════════════════════
export const ADMIN_TOUR_STEPS = [
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
    description: 'Quantas contas únicas foram processadas. Esse é o volume real da operação — cada conta vira potencial bônus de BAU.',
    position: 'left',
  },
]

// ═══════════════════════════════════════
// /operadores
// ═══════════════════════════════════════
export const OPERADORES_TOUR_STEPS = [
  {
    target: '[data-tour="ops-kpis"]',
    title: 'KPIs da equipe',
    description: 'Total de operadores, metas processadas e folha de pagamento estimada. Visão executiva do time num cartão só.',
    position: 'bottom',
  },
  {
    target: '[data-tour="ops-tabs"]',
    title: 'Abas de gestão',
    description: 'Ranking compara performance, Folha calcula quanto pagar cada um, Configurações define modelo de remuneração.',
    position: 'bottom',
  },
  {
    target: '[data-tour="ops-invite"]',
    title: 'Convidar operador',
    description: 'Gera um link único de convite. Quem entra pelo link vira operador do seu tenant automaticamente. Limite depende do seu plano.',
    position: 'top',
  },
  {
    target: '[data-tour="ops-equipe"]',
    title: 'Sua equipe',
    description: 'Lista de operadores ativos. Clique pra ver perfil detalhado. Botão lixeira remove da equipe — mas o histórico de lucro fica preservado.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /redes
// ═══════════════════════════════════════
export const REDES_TOUR_STEPS = [
  {
    target: '[data-tour="redes-kpis"]',
    title: 'KPIs globais por rede',
    description: 'Total de redes, redes lucrativas, lucro total e score médio. Visão imediata da performance agregada.',
    position: 'bottom',
  },
  {
    target: '[data-tour="redes-ranking"]',
    title: 'Ranking por Network Score',
    description: 'Cada rede no ranking mostra score, lucro total, número de metas, win rate e sparkline. Clique em qualquer uma pra ver análise completa.',
    position: 'bottom',
  },
]

// ═══════════════════════════════════════
// /faturamento
// ═══════════════════════════════════════
export const FATURAMENTO_TOUR_STEPS = [
  {
    target: '[data-tour="fat-kpis"]',
    title: 'KPIs financeiros',
    description: 'Receita do mês, lucro líquido e saúde geral da operação. Top do painel financeiro.',
    position: 'bottom',
  },
  {
    target: '[data-tour="fat-chart"]',
    title: 'Evolução da receita',
    description: 'Gráfico de área mostrando a receita diária. Detecta padrões de pico e queda visualmente.',
    position: 'top',
  },
  {
    target: '[data-tour="fat-insights"]',
    title: 'Insights gerados por IA',
    description: 'Recomendações automáticas baseadas no comportamento da sua operação. Atualiza diariamente.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /custos
// ═══════════════════════════════════════
export const CUSTOS_TOUR_STEPS = [
  {
    target: '[data-tour="custos-kpis"]',
    title: 'Custo dia e mês',
    description: 'Quanto você gastou hoje e no mês corrente. Inclui proxy, SMS, VPS, bot — tudo que tira margem do lucro.',
    position: 'bottom',
  },
  {
    target: '[data-tour="custos-novo"]',
    title: 'Registrar custo',
    description: 'Adiciona um custo novo. O sistema detecta o tipo automaticamente pela descrição (proxy, SMS, VPS...). Subtrai do lucro bruto na hora.',
    position: 'left',
  },
  {
    target: '[data-tour="custos-lista"]',
    title: 'Histórico',
    description: 'Lista de custos registrados. Filtra por tipo, busca por descrição, exporta pra planilha.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /pix
// ═══════════════════════════════════════
export const PIX_TOUR_STEPS = [
  {
    target: '[data-tour="pix-kpis"]',
    title: 'Estatísticas das chaves',
    description: 'Total, válidas, por tipo (telefone, CPF, e-mail, EVP) e inválidas. Visão imediata do estoque.',
    position: 'bottom',
  },
  {
    target: '[data-tour="pix-import"]',
    title: 'Importar em lote',
    description: 'Cola chaves no textarea ou faz upload de .txt. O sistema detecta o tipo automaticamente e separa válidas das inválidas.',
    position: 'top',
  },
  {
    target: '[data-tour="pix-lista"]',
    title: 'Catálogo de chaves',
    description: 'Filtra por tipo, copia individualmente ou em massa, exporta. Operador usa essa lista pra escolher chave de cada conta.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /afiliados
// ═══════════════════════════════════════
export const AFILIADOS_TOUR_STEPS = [
  {
    target: '[data-tour="afil-link"]',
    title: 'Seu link único',
    description: 'Compartilhe em qualquer canal. Quem assina pelo seu link gera comissão recorrente pra você todo mês enquanto a assinatura tiver ativa.',
    position: 'bottom',
  },
  {
    target: '[data-tour="afil-kpis"]',
    title: 'Comissão acumulada',
    description: 'Quantos indicaram, comissão total acumulada e quanto está a receber. Pago a cada ciclo de cobrança do indicado.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /slots
// ═══════════════════════════════════════
export const SLOTS_TOUR_STEPS = [
  {
    target: '[data-tour="slots-filtros"]',
    title: 'Filtros',
    description: 'Filtra por provider (Pragmatic, Microgaming, Pgsoft) ou por performance (alta, média, baixa). Encontra o slot ideal rápido.',
    position: 'bottom',
  },
  {
    target: '[data-tour="slots-grid"]',
    title: 'Catálogo de 48 slots',
    description: 'Cada card mostra slot, provider, tags e nível de performance. Clique pra copiar nome — operador usa na hora de registrar remessa.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /aulas
// ═══════════════════════════════════════
export const AULAS_TOUR_STEPS = [
  {
    target: '[data-tour="aulas-hero"]',
    title: 'Curso em destaque',
    description: 'Banner cinematográfico com o curso principal do momento. Clique pra entrar direto na primeira aula.',
    position: 'bottom',
  },
  {
    target: '[data-tour="aulas-grid"]',
    title: 'Catálogo VIP',
    description: 'Cursos exclusivos sobre operação CPA, estratégia de remessa, gestão de equipe. Barra de progresso indica o quanto você já assistiu.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// Tour por slug
// ═══════════════════════════════════════
export const TOURS = {
  admin: ADMIN_TOUR_STEPS,
  operadores: OPERADORES_TOUR_STEPS,
  redes: REDES_TOUR_STEPS,
  faturamento: FATURAMENTO_TOUR_STEPS,
  custos: CUSTOS_TOUR_STEPS,
  pix: PIX_TOUR_STEPS,
  afiliados: AFILIADOS_TOUR_STEPS,
  slots: SLOTS_TOUR_STEPS,
  aulas: AULAS_TOUR_STEPS,
}

export function getTour(routeId) {
  return TOURS[routeId] || []
}
