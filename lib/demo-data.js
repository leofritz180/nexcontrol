/* ══════════════════════════════════════════════════════════════
   NexControl — Demo Data (onboarding visual completo)
   Dataset coerente para todos os modulos do admin e operador
   ══════════════════════════════════════════════════════════════ */

const now = new Date()
const h = (hoursAgo) => new Date(now.getTime() - hoursAgo * 3600000).toISOString()
const d = (daysAgo) => { const dt = new Date(now); dt.setDate(dt.getDate() - daysAgo); return dt.toISOString().slice(0, 10) }

export const DEMO_BANNER_TEXT = 'Exemplo de operacao em andamento — os dados reais comecam quando voce criar sua primeira meta.'

/* ═══════════════════════════════════
   OPERATORS (3 operators)
   ═══════════════════════════════════ */
export const DEMO_OPERATORS = [
  { id: 'demo-op-1', nome: 'Rafael Lima', email: 'rafael@email.com', role: 'operator', tenant_id: 'demo-tenant', created_at: h(720) },
  { id: 'demo-op-2', nome: 'Juliana Costa', email: 'juliana@email.com', role: 'operator', tenant_id: 'demo-tenant', created_at: h(480) },
  { id: 'demo-op-3', nome: 'Lucas Mendes', email: 'lucas@email.com', role: 'operator', tenant_id: 'demo-tenant', created_at: h(240) },
]

/* ═══════════════════════════════════
   METAS (8 metas across 4 redes, 3 operators)
   All coherent: W1, OKOK, VOY, DY
   ═══════════════════════════════════ */
export const DEMO_METAS = [
  // ── Rafael (demo-op-1): 3 metas ──
  {
    id: 'demo-meta-1',
    titulo: '30 DEP W1', rede: 'W1', plataforma: 'W1',
    quantidade_contas: 30, status: 'ativa', status_fechamento: null,
    operator_id: 'demo-op-1', created_at: h(48), deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-2',
    titulo: '20 DEP OKOK', rede: 'OKOK', plataforma: 'OKOK',
    quantidade_contas: 20, status: 'finalizada', status_fechamento: 'fechada',
    fechada_em: h(12), lucro_final: 186.40, salario: 120, bau: 95,
    custo_fixo: 15, taxa_agente: 10,
    operator_id: 'demo-op-1', created_at: h(120), deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-3',
    titulo: '50 DEP VOY', rede: 'VOY', plataforma: 'VOY',
    quantidade_contas: 50, status: 'finalizada', status_fechamento: 'fechada',
    fechada_em: h(72), lucro_final: 312.80, salario: 200, bau: 160,
    custo_fixo: 20, taxa_agente: 15,
    operator_id: 'demo-op-1', created_at: h(200), deleted_at: null,
    operation_model: 'salario_bau',
  },
  // ── Juliana (demo-op-2): 3 metas ──
  {
    id: 'demo-meta-4',
    titulo: '30 DEP DY', rede: 'DY', plataforma: 'DY',
    quantidade_contas: 30, status: 'finalizada', status_fechamento: 'fechada',
    fechada_em: h(36), lucro_final: 224.60, salario: 140, bau: 110,
    custo_fixo: 12, taxa_agente: 8,
    operator_id: 'demo-op-2', created_at: h(168), deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-5',
    titulo: '20 DEP W1', rede: 'W1', plataforma: 'W1',
    quantidade_contas: 20, status: 'finalizada', status_fechamento: 'fechada',
    fechada_em: h(96), lucro_final: 148.20, salario: 100, bau: 80,
    custo_fixo: 10, taxa_agente: 8,
    operator_id: 'demo-op-2', created_at: h(240), deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-6',
    titulo: '25 DEP VOY', rede: 'VOY', plataforma: 'VOY',
    quantidade_contas: 25, status: 'ativa', status_fechamento: null,
    operator_id: 'demo-op-2', created_at: h(24), deleted_at: null,
    operation_model: 'salario_bau',
  },
  // ── Lucas (demo-op-3): 2 metas ──
  {
    id: 'demo-meta-7',
    titulo: '20 DEP OKOK', rede: 'OKOK', plataforma: 'OKOK',
    quantidade_contas: 20, status: 'finalizada', status_fechamento: 'fechada',
    fechada_em: h(60), lucro_final: -42.30, salario: 100, bau: 55,
    custo_fixo: 10, taxa_agente: 5,
    operator_id: 'demo-op-3', created_at: h(192), deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-8',
    titulo: '30 DEP DY', rede: 'DY', plataforma: 'DY',
    quantidade_contas: 30, status: 'ativa', status_fechamento: null,
    operator_id: 'demo-op-3', created_at: h(18), deleted_at: null,
    operation_model: 'salario_bau',
  },
]

/* ═══════════════════════════════════
   REMESSAS (coherent with metas)
   ═══════════════════════════════════ */
export const DEMO_REMESSAS = [
  // ── Meta 1 (Rafael, W1, ativa — 16/30 contas) ──
  { id:'dr-1', meta_id:'demo-meta-1', deposito:320, saque:185, lucro:0, prejuizo:135, tipo:'remessa', contas_remessa:5, titulo:'Remessa 1', slot_name:'Fortune Tiger', status_problema:'normal', created_at:h(2) },
  { id:'dr-2', meta_id:'demo-meta-1', deposito:280, saque:410, lucro:130, prejuizo:0, tipo:'remessa', contas_remessa:4, titulo:'Remessa 2', slot_name:'Gates of Olympus', status_problema:'normal', created_at:h(6) },
  { id:'dr-3', meta_id:'demo-meta-1', deposito:150, saque:95, lucro:0, prejuizo:55, tipo:'remessa', contas_remessa:3, titulo:'Remessa 3', slot_name:'Sweet Bonanza', status_problema:'normal', created_at:h(18) },
  { id:'dr-4', meta_id:'demo-meta-1', deposito:200, saque:340, lucro:140, prejuizo:0, tipo:'remessa', contas_remessa:4, titulo:'Remessa 4', slot_name:'Fortune Tiger', status_problema:'normal', created_at:h(24) },
  { id:'dr-5', meta_id:'demo-meta-1', deposito:180, saque:120, lucro:0, prejuizo:60, tipo:'redeposito', contas_remessa:0, titulo:'Redeposito', slot_name:null, status_problema:'normal', created_at:h(25) },
  // ── Meta 2 (Rafael, OKOK, fechada) ──
  { id:'dr-6', meta_id:'demo-meta-2', deposito:500, saque:680, lucro:180, prejuizo:0, tipo:'remessa', contas_remessa:10, titulo:'Remessa 1', slot_name:'Fortune Mouse', status_problema:'normal', created_at:h(96) },
  { id:'dr-7', meta_id:'demo-meta-2', deposito:420, saque:510, lucro:90, prejuizo:0, tipo:'remessa', contas_remessa:10, titulo:'Remessa 2', slot_name:'Gates of Olympus', status_problema:'normal', created_at:h(80) },
  // ── Meta 3 (Rafael, VOY, fechada) ──
  { id:'dr-8', meta_id:'demo-meta-3', deposito:1200, saque:1580, lucro:380, prejuizo:0, tipo:'remessa', contas_remessa:25, titulo:'Remessa 1', slot_name:'Sweet Bonanza', status_problema:'normal', created_at:h(180) },
  { id:'dr-9', meta_id:'demo-meta-3', deposito:980, saque:1340, lucro:360, prejuizo:0, tipo:'remessa', contas_remessa:25, titulo:'Remessa 2', slot_name:'Fortune Tiger', status_problema:'normal', created_at:h(150) },
  // ── Meta 4 (Juliana, DY, fechada) ──
  { id:'dr-10', meta_id:'demo-meta-4', deposito:680, saque:920, lucro:240, prejuizo:0, tipo:'remessa', contas_remessa:15, titulo:'Remessa 1', slot_name:'Fortune Tiger', status_problema:'normal', created_at:h(144) },
  { id:'dr-11', meta_id:'demo-meta-4', deposito:540, saque:680, lucro:140, prejuizo:0, tipo:'remessa', contas_remessa:15, titulo:'Remessa 2', slot_name:'Gates of Olympus', status_problema:'normal', created_at:h(120) },
  // ── Meta 5 (Juliana, W1, fechada) ──
  { id:'dr-12', meta_id:'demo-meta-5', deposito:480, saque:620, lucro:140, prejuizo:0, tipo:'remessa', contas_remessa:10, titulo:'Remessa 1', slot_name:'Sweet Bonanza', status_problema:'normal', created_at:h(216) },
  { id:'dr-13', meta_id:'demo-meta-5', deposito:390, saque:480, lucro:90, prejuizo:0, tipo:'remessa', contas_remessa:10, titulo:'Remessa 2', slot_name:'Fortune Mouse', status_problema:'normal', created_at:h(200) },
  // ── Meta 6 (Juliana, VOY, ativa — 8/25 contas) ──
  { id:'dr-14', meta_id:'demo-meta-6', deposito:240, saque:310, lucro:70, prejuizo:0, tipo:'remessa', contas_remessa:4, titulo:'Remessa 1', slot_name:'Fortune Tiger', status_problema:'normal', created_at:h(10) },
  { id:'dr-15', meta_id:'demo-meta-6', deposito:180, saque:140, lucro:0, prejuizo:40, tipo:'remessa', contas_remessa:4, titulo:'Remessa 2', slot_name:'Sweet Bonanza', status_problema:'normal', created_at:h(16) },
  // ── Meta 7 (Lucas, OKOK, fechada — prejuizo) ──
  { id:'dr-16', meta_id:'demo-meta-7', deposito:520, saque:380, lucro:0, prejuizo:140, tipo:'remessa', contas_remessa:10, titulo:'Remessa 1', slot_name:'Gates of Olympus', status_problema:'normal', created_at:h(168) },
  { id:'dr-17', meta_id:'demo-meta-7', deposito:440, saque:350, lucro:0, prejuizo:90, tipo:'remessa', contas_remessa:10, titulo:'Remessa 2', slot_name:'Fortune Tiger', status_problema:'saque_pendente', created_at:h(144) },
  // ── Meta 8 (Lucas, DY, ativa — 6/30 contas) ──
  { id:'dr-18', meta_id:'demo-meta-8', deposito:160, saque:210, lucro:50, prejuizo:0, tipo:'remessa', contas_remessa:3, titulo:'Remessa 1', slot_name:'Fortune Tiger', status_problema:'normal', created_at:h(8) },
  { id:'dr-19', meta_id:'demo-meta-8', deposito:140, saque:100, lucro:0, prejuizo:40, tipo:'remessa', contas_remessa:3, titulo:'Remessa 2', slot_name:'Sweet Bonanza', status_problema:'normal', created_at:h(14) },
]

/* ═══════════════════════════════════
   CUSTOS (costs for demo tenant)
   ═══════════════════════════════════ */
export const DEMO_COSTS = [
  { id:'dc-1', type:'proxy', amount:35, date:d(0), note:'Proxy mensal', tenant_id:'demo-tenant', created_at:h(4) },
  { id:'dc-2', type:'sms', amount:18, date:d(0), note:'SMS verificacao', tenant_id:'demo-tenant', created_at:h(8) },
  { id:'dc-3', type:'instagram', amount:25, date:d(1), note:'Post patrocinado', tenant_id:'demo-tenant', created_at:h(30) },
  { id:'dc-4', type:'proxy', amount:35, date:d(3), note:'Proxy mensal', tenant_id:'demo-tenant', created_at:h(78) },
  { id:'dc-5', type:'bot', amount:40, date:d(5), note:'Bot automacao', tenant_id:'demo-tenant', created_at:h(126) },
  { id:'dc-6', type:'vps', amount:55, date:d(7), note:'VPS servidor', tenant_id:'demo-tenant', created_at:h(174) },
  { id:'dc-7', type:'sms', amount:12, date:d(10), note:'SMS verificacao', tenant_id:'demo-tenant', created_at:h(246) },
  { id:'dc-8', type:'outros', amount:20, date:d(14), note:'Chip celular', tenant_id:'demo-tenant', created_at:h(340) },
]

/* ═══════════════════════════════════
   INSIGHTS (rotating tips)
   ═══════════════════════════════════ */
export const DEMO_INSIGHTS = [
  { type: 'profit', text: 'Lucro acumulado: +R$ 829,70 em 5 metas fechadas' },
  { type: 'profit', text: 'Rafael Lima liderando com +R$ 499,20 de lucro final' },
  { type: 'info', text: '3 metas ativas em andamento — equipe produzindo' },
  { type: 'warn', text: 'Lucas Mendes com resultado negativo: -R$ 42,30 na ultima meta' },
  { type: 'profit', text: 'Rede VOY com maior rentabilidade: +R$ 8,82/conta' },
  { type: 'info', text: 'Media de R$ 165,94 de lucro por meta fechada' },
]

/* ═══════════════════════════════════
   ACTIVITY FEED
   ═══════════════════════════════════ */
export const DEMO_ACTIVITY = [
  { text: 'Rafael registrou remessa: +R$ 320 depositados', time: h(2), color: '#22C55E' },
  { text: 'Juliana completou remessa na VOY', time: h(10), color: '#22C55E' },
  { text: 'Meta 20 DEP OKOK fechada: +R$ 186,40', time: h(12), color: '#22C55E' },
  { text: 'Lucas registrou remessa na DY', time: h(8), color: '#22C55E' },
  { text: 'Insight: sequencia positiva detectada', time: h(6), color: '#e53935' },
  { text: 'Meta 30 DEP DY fechada: +R$ 224,60', time: h(36), color: '#22C55E' },
]

/* ═══════════════════════════════════
   PRE-COMPUTED AGGREGATES
   (for pages that need ready data)
   ═══════════════════════════════════ */

// Operator ranking (pre-computed for operadores page)
export const DEMO_OPERATOR_RANKING = (() => {
  const ops = DEMO_OPERATORS.map(op => {
    const opMetas = DEMO_METAS.filter(m => m.operator_id === op.id)
    const closed = opMetas.filter(m => m.status_fechamento === 'fechada')
    const active = opMetas.filter(m => m.status_fechamento !== 'fechada')
    const opRem = DEMO_REMESSAS.filter(r => opMetas.some(m => m.id === r.meta_id))
    const lucroFinal = closed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const totalDeposit = closed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const winMetas = closed.filter(m => Number(m.lucro_final || 0) > 0).length
    const winRate = closed.length > 0 ? Math.round(winMetas / closed.length * 100) : 0
    const lucroPerConta = totalDeposit > 0 ? lucroFinal / totalDeposit : 0
    return {
      ...op,
      metasFechadas: closed.length,
      metasAtivas: active.length,
      lucroFinal,
      totalDeposit,
      totalRem: opRem.length,
      winRate,
      lucroPerConta,
      trend: lucroFinal > 100 ? 'up' : lucroFinal < 0 ? 'down' : 'stable',
      badge: lucroFinal > 300 ? 'Top performer' : lucroFinal > 0 ? 'Em alta' : 'Oscilando',
    }
  })
  return ops.sort((a, b) => b.lucroFinal - a.lucroFinal)
})()

// Redes ranking (pre-computed for redes page)
export const DEMO_REDES_RANKING = (() => {
  const redes = {}
  DEMO_METAS.filter(m => m.status_fechamento === 'fechada').forEach(m => {
    if (!redes[m.rede]) redes[m.rede] = { rede: m.rede, metas: 0, lucroFinal: 0, contas: 0, remessas: 0, winMetas: 0 }
    const r = redes[m.rede]
    r.metas++
    r.lucroFinal += Number(m.lucro_final || 0)
    r.contas += Number(m.quantidade_contas || 0)
    r.remessas += DEMO_REMESSAS.filter(rm => rm.meta_id === m.id).length
    if (Number(m.lucro_final || 0) > 0) r.winMetas++
  })
  return Object.values(redes).map(r => ({
    ...r,
    lucroPerConta: r.contas > 0 ? r.lucroFinal / r.contas : 0,
    winRate: r.metas > 0 ? Math.round(r.winMetas / r.metas * 100) : 0,
    trend: r.lucroFinal > 200 ? 'up' : r.lucroFinal > 0 ? 'stable' : 'down',
    score: Math.min(100, Math.max(0, Math.round(50 + (r.lucroFinal / 10)))),
  })).sort((a, b) => b.lucroFinal - a.lucroFinal)
})()

// Global stats (for admin dashboard)
export const DEMO_GLOBAL = (() => {
  const fechadas = DEMO_METAS.filter(m => m.status_fechamento === 'fechada')
  const ativas = DEMO_METAS.filter(m => m.status_fechamento !== 'fechada')
  const lucroFinalTotal = fechadas.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
  const totalDep = DEMO_REMESSAS.reduce((a, r) => a + Number(r.deposito || 0), 0)
  const totalSaq = DEMO_REMESSAS.reduce((a, r) => a + Number(r.saque || 0), 0)
  const totalContas = fechadas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
  const custosTotal = DEMO_COSTS.reduce((a, c) => a + Number(c.amount || 0), 0)
  const lucroPerConta = totalContas > 0 ? lucroFinalTotal / totalContas : 0
  const lucroPerMeta = fechadas.length > 0 ? lucroFinalTotal / fechadas.length : 0
  return {
    lucroFinalTotal,
    totalDep,
    totalSaq,
    totalMetas: DEMO_METAS.length,
    ativas: ativas.length,
    fechadas: fechadas.length,
    totalRem: DEMO_REMESSAS.length,
    ops: DEMO_OPERATORS.length,
    totalContas,
    lucroPerConta,
    lucroPerMeta,
    custosTotal,
    custosHoje: DEMO_COSTS.filter(c => c.date === new Date().toISOString().slice(0, 10)).reduce((a, c) => a + Number(c.amount || 0), 0),
  }
})()

/* ═══════════════════════════════════
   HELPER
   ═══════════════════════════════════ */
export function shouldShowDemo(metas) {
  return !metas || metas.length === 0
}
