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
// /admin — Tour completo cobrindo todas as 4 tabs
// ═══════════════════════════════════════
export const ADMIN_TOUR_STEPS = [
  // ── Tab 1: Visão geral ──
  {
    clickBefore: '[data-tour-tab="overview"]',
    target: '[data-tour="hero-lucro"]',
    title: 'Lucro final acumulado',
    description: 'O coração do painel. Soma de todas as metas fechadas — depois de salário, BAU e custos. É o dinheiro que você de fato gerou.',
    position: 'bottom',
  },
  {
    clickBefore: '[data-tour-tab="overview"]',
    target: '[data-tour="kpi-deposito"]',
    title: 'Total depositado',
    description: 'Volume bruto de depósitos feitos pelos operadores. Indicador de tamanho real da operação.',
    position: 'left',
  },
  {
    clickBefore: '[data-tour-tab="overview"]',
    target: '[data-tour="kpi-saque"]',
    title: 'Total sacado',
    description: 'Quanto saiu em forma de saque. Depositado − Sacado = resultado bruto das remessas (antes de salário/BAU).',
    position: 'left',
  },
  {
    clickBefore: '[data-tour-tab="overview"]',
    target: '[data-tour="kpi-metas"]',
    title: 'Total de metas',
    description: 'Quantas metas você já criou desde o início. Inclui ativas, finalizadas e fechadas.',
    position: 'left',
  },
  {
    clickBefore: '[data-tour-tab="overview"]',
    target: '[data-tour="kpi-depositantes"]',
    title: 'Depositantes totais',
    description: 'Quantas contas únicas foram processadas. Esse é o volume real — cada conta vira potencial bônus de BAU.',
    position: 'left',
  },
  // ── Tab 2: Minha operação ──
  {
    clickBefore: '[data-tour-tab="myops"]',
    target: '[data-tour="tab-myops"]',
    title: 'Minha operação',
    description: 'Espaço onde você (admin) opera pessoalmente. Cria suas próprias metas, registra remessas e acompanha o rank pessoal. Independente da equipe.',
    position: 'auto',
  },
  // ── Tab 3: Metas & Fechamento ──
  {
    clickBefore: '[data-tour-tab="operations"]',
    target: '[data-tour="tab-operations"]',
    title: 'Metas & Fechamento',
    description: 'Lista todas as metas do tenant (suas e da equipe). Aqui você finaliza, fecha financeiramente (salário + BAU + custos) e grava o lucro_final.',
    position: 'auto',
  },
  // ── Tab 4: Lixeira ──
  {
    clickBefore: '[data-tour-tab="trash"]',
    target: '[data-tour="tab-trash"]',
    title: 'Lixeira',
    description: 'Metas excluídas ficam aqui por 30 dias. Pode restaurar a qualquer momento ou apagar definitivamente. Nada se perde por acidente.',
    position: 'auto',
  },
]

// ═══════════════════════════════════════
// /operadores — cobre todas as 3 tabs (Ranking, Folha, Configs)
// ═══════════════════════════════════════
export const OPERADORES_TOUR_STEPS = [
  // ── Tab Ranking ──
  {
    clickBefore: '[data-tour-tab="ranking"]',
    target: '[data-tour="ops-kpis"]',
    title: 'KPIs da equipe',
    description: 'Operadores ativos, depositantes processados, acerto médio e lucro total gerado pelo time. Visão executiva.',
    position: 'bottom',
  },
  {
    clickBefore: '[data-tour-tab="ranking"]',
    target: '[data-tour="ops-tabs"]',
    title: 'Abas de gestão',
    description: 'Ranking mostra performance, Folha calcula quanto pagar cada um, Configurações define modelo de remuneração.',
    position: 'bottom',
  },
  {
    clickBefore: '[data-tour-tab="ranking"]',
    target: '[data-tour="ops-invite"]',
    title: 'Convidar operador',
    description: 'Gera link único de convite. Quem entra pelo link vira operador do seu tenant. Limite depende do plano.',
    position: 'top',
  },
  {
    clickBefore: '[data-tour-tab="ranking"]',
    target: '[data-tour="ops-equipe"]',
    title: 'Sua equipe',
    description: 'Operadores ativos. Clique pra ver perfil detalhado. Lixeira remove da equipe — histórico de lucro fica preservado.',
    position: 'top',
  },
  // ── Tab Folha de pagamento ──
  {
    clickBefore: '[data-tour-tab="folha"]',
    target: '[data-tour="ops-folha"]',
    title: 'Folha de pagamento',
    description: 'Cálculo automático de quanto pagar cada operador no período (hoje, 7d, 30d ou tudo). Baseado no modelo configurado.',
    position: 'auto',
  },
  // ── Tab Configurações ──
  {
    clickBefore: '[data-tour-tab="config"]',
    target: '[data-tour="ops-config"]',
    title: 'Configurações da equipe',
    description: 'Define o modelo de remuneração (fixo por depositante, % do lucro ou divisão de resultado). Modelo de operação padrão (Salário+BAU ou Apenas BAU) também fica aqui.',
    position: 'auto',
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
