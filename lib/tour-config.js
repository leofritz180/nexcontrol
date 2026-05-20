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
// /admin — Tab Visão geral
// ═══════════════════════════════════════
export const ADMIN_TOUR_STEPS = [
  {
    target: '[data-tour="hero-lucro"]',
    title: 'Lucro consolidado',
    description: 'O coração do painel. Lucro líquido (depois de salário, BAU e custos) no período selecionado. Filtros: mês, hoje, ontem, 7d, 30d ou tudo.',
    position: 'right',
  },
  {
    target: '[data-tour="kpis-grid"]',
    title: 'KPIs operacionais',
    description: 'Total depositado, sacado, metas criadas e depositantes processados. Visão imediata do tamanho da operação.',
    position: 'left',
  },
]

// ═══════════════════════════════════════
// /admin — Tab Minha operação
// ═══════════════════════════════════════
export const ADMIN_MYOPS_TOUR_STEPS = [
  {
    target: '[data-tour="myops-header"]',
    title: 'Minha operação',
    description: 'Espaço onde você (admin) opera pessoalmente. Cria suas próprias metas, registra remessas e acompanha rank pessoal. Independente da equipe.',
    position: 'bottom',
  },
  {
    target: '[data-tour="myops-new"]',
    title: 'Criar minha meta',
    description: 'Botão pra criar uma nova operação pessoal. Você define plataforma, rede, contas e modelo (Salário+BAU ou Apenas BAU).',
    position: 'left',
  },
  {
    target: '[data-tour="myops-list"]',
    title: 'Minhas metas',
    description: 'Lista das suas operações pessoais. Clique em qualquer uma pra registrar remessas e acompanhar resultados.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /admin — Tab Metas & Fechamento
// ═══════════════════════════════════════
export const ADMIN_OPERATIONS_TOUR_STEPS = [
  {
    target: '[data-tour="ops-filters"]',
    title: 'Filtros',
    description: 'Filtre por status (ativa, finalizada, fechada), rede ou período. Útil quando você tem muitas metas pra fechar.',
    position: 'bottom',
  },
  {
    target: '[data-tour="ops-list"]',
    title: 'Lista de metas',
    description: 'Todas as metas do tenant — suas e da equipe. Clique em "Fechar" pra abrir o modal de fechamento e gravar o lucro_final.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /admin — Tab Lixeira
// ═══════════════════════════════════════
export const ADMIN_TRASH_TOUR_STEPS = [
  {
    target: '[data-tour="tab-trash"]',
    title: 'Lixeira',
    description: 'Metas excluídas ficam aqui por 30 dias. Pode restaurar a qualquer momento ou apagar definitivamente. Nada se perde por acidente.',
    position: 'auto',
  },
]

// ═══════════════════════════════════════
// /operadores — Tab Ranking
// ═══════════════════════════════════════
export const OPERADORES_TOUR_STEPS = [
  {
    target: '[data-tour="ops-kpis"]',
    title: 'KPIs da equipe',
    description: 'Operadores ativos, depositantes processados, acerto médio e lucro total gerado pelo time. Visão executiva.',
    position: 'bottom',
  },
  {
    target: '[data-tour="ops-tabs"]',
    title: 'Abas de gestão',
    description: 'Ranking mostra performance, Folha calcula quanto pagar cada um, Configurações define modelo de remuneração.',
    position: 'bottom',
  },
  {
    target: '[data-tour="ops-invite"]',
    title: 'Convidar operador',
    description: 'Gera link único de convite. Quem entra pelo link vira operador do seu tenant. Limite depende do plano.',
    position: 'top',
  },
  {
    target: '[data-tour="ops-equipe"]',
    title: 'Sua equipe',
    description: 'Operadores ativos. Clique pra ver perfil detalhado. Lixeira remove da equipe — histórico de lucro fica preservado.',
    position: 'top',
  },
]

// ═══════════════════════════════════════
// /operadores — Tab Folha de pagamento
// ═══════════════════════════════════════
export const OPERADORES_FOLHA_TOUR_STEPS = [
  {
    target: '[data-tour="ops-folha"]',
    title: 'Folha de pagamento',
    description: 'Cálculo automático de quanto pagar cada operador no período (hoje, 7d, 30d ou tudo). Baseado no modelo configurado em "Configurações".',
    position: 'auto',
  },
]

// ═══════════════════════════════════════
// /operadores — Tab Configurações
// ═══════════════════════════════════════
export const OPERADORES_CONFIG_TOUR_STEPS = [
  {
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
// /operator — painel do operador
// ═══════════════════════════════════════
export const OPERATOR_TOUR_STEPS = [
  {
    target: '[data-tour="op-kpis"]',
    title: 'Seus indicadores',
    description: 'Metas ativas, total de remessas registradas, depositantes processados e taxa de conclusão. Visão imediata do seu progresso.',
    position: 'bottom',
  },
  {
    target: '[data-tour="op-nova-meta"]',
    title: 'Nova meta',
    description: 'Clique aqui pra criar uma nova operação. Você define plataforma, rede, número de contas e modelo (Salário + BAU ou Apenas BAU).',
    position: 'left',
  },
  {
    target: '[data-tour="op-metas"]',
    title: 'Suas metas',
    description: 'Lista de todas as suas operações. Use os filtros Todas/Ativas/Fechadas. Clique em qualquer meta pra registrar remessas e acompanhar resultados.',
    position: 'right',
  },
  {
    target: '[data-tour="op-stats"]',
    title: 'Stats pessoais',
    description: 'Suas métricas individuais: metas fechadas, total de depositantes processados, médias por meta. Atualiza em tempo real.',
    position: 'left',
  },
  {
    target: '[data-tour="op-ranking"]',
    title: 'Ranking pessoal',
    description: 'Quantos depositantes únicos você já processou. Quanto maior o número, maior seu rank no sistema (Iniciante → Apex).',
    position: 'left',
  },
  {
    target: '[data-tour="op-conquistas"]',
    title: 'Conquistas',
    description: 'Marcos desbloqueados conforme você opera. Cada milestone batido é registrado pra sua trajetória no NexControl.',
    position: 'left',
  },
  {
    target: '[data-tour="op-alertas"]',
    title: 'Alertas operacionais',
    description: 'Avisa sobre saques pendentes, contas bloqueadas ou bancos em análise nas suas remessas. Aja em 24h pra evitar perda de receita.',
    position: 'left',
  },
]

// ═══════════════════════════════════════
// Tour por slug
// ═══════════════════════════════════════
export const TOURS = {
  admin: ADMIN_TOUR_STEPS,
  'admin-myops': ADMIN_MYOPS_TOUR_STEPS,
  'admin-operations': ADMIN_OPERATIONS_TOUR_STEPS,
  'admin-trash': ADMIN_TRASH_TOUR_STEPS,
  operator: OPERATOR_TOUR_STEPS,
  operadores: OPERADORES_TOUR_STEPS,
  'operadores-folha': OPERADORES_FOLHA_TOUR_STEPS,
  'operadores-config': OPERADORES_CONFIG_TOUR_STEPS,
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
