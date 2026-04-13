/* ══════════════════════════════════════════════
   NexControl — Demo Data (onboarding visual)
   Dados simulados coerentes para novos usuarios
   ══════════════════════════════════════════════ */

const now = new Date()
const h = (hoursAgo) => new Date(now.getTime() - hoursAgo * 3600000).toISOString()

/* ── Demo Metas ── */
export const DEMO_METAS = [
  {
    id: 'demo-meta-1',
    titulo: '30 DEP W1',
    rede: 'W1',
    plataforma: 'W1',
    quantidade_contas: 30,
    status: 'ativa',
    status_fechamento: null,
    operator_id: 'demo-op',
    created_at: h(48),
    deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-2',
    titulo: '20 DEP OKOK',
    rede: 'OKOK',
    plataforma: 'OKOK',
    quantidade_contas: 20,
    status: 'finalizada',
    status_fechamento: 'fechada',
    fechada_em: h(12),
    lucro_final: 186.40,
    salario: 120,
    bau: 95,
    operator_id: 'demo-op',
    created_at: h(120),
    deleted_at: null,
    operation_model: 'salario_bau',
  },
  {
    id: 'demo-meta-3',
    titulo: '50 DEP VOY',
    rede: 'VOY',
    plataforma: 'VOY',
    quantidade_contas: 50,
    status: 'finalizada',
    status_fechamento: 'fechada',
    fechada_em: h(72),
    lucro_final: 312.80,
    salario: 200,
    bau: 160,
    operator_id: 'demo-op',
    created_at: h(200),
    deleted_at: null,
    operation_model: 'salario_bau',
  },
]

/* ── Demo Remessas (for demo-meta-1, the active one) ── */
export const DEMO_REMESSAS = [
  {
    id: 'demo-rem-1', meta_id: 'demo-meta-1',
    deposito: 320, saque: 185, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 5, titulo: 'Remessa 1',
    slot_name: 'Fortune Tiger', status_problema: 'normal',
    created_at: h(2),
  },
  {
    id: 'demo-rem-2', meta_id: 'demo-meta-1',
    deposito: 280, saque: 410, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 4, titulo: 'Remessa 2',
    slot_name: 'Gates of Olympus', status_problema: 'normal',
    created_at: h(6),
  },
  {
    id: 'demo-rem-3', meta_id: 'demo-meta-1',
    deposito: 150, saque: 95, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 3, titulo: 'Remessa 3',
    slot_name: 'Sweet Bonanza', status_problema: 'normal',
    created_at: h(18),
  },
  {
    id: 'demo-rem-4', meta_id: 'demo-meta-1',
    deposito: 200, saque: 340, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 4, titulo: 'Remessa 4',
    slot_name: 'Fortune Tiger', status_problema: 'normal',
    created_at: h(24),
  },
  {
    id: 'demo-rem-5', meta_id: 'demo-meta-1',
    deposito: 180, saque: 120, lucro: 0, prejuizo: 0,
    tipo: 'redeposito', contas_remessa: 0, titulo: 'Redeposito',
    slot_name: null, status_problema: 'normal',
    created_at: h(25),
  },
  // Remessas from demo-meta-2 (closed)
  {
    id: 'demo-rem-6', meta_id: 'demo-meta-2',
    deposito: 500, saque: 380, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 10, titulo: 'Remessa 1',
    slot_name: 'Fortune Mouse', status_problema: 'normal',
    created_at: h(96),
  },
  {
    id: 'demo-rem-7', meta_id: 'demo-meta-2',
    deposito: 420, saque: 510, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 10, titulo: 'Remessa 2',
    slot_name: 'Gates of Olympus', status_problema: 'normal',
    created_at: h(80),
  },
  // Remessas from demo-meta-3 (closed)
  {
    id: 'demo-rem-8', meta_id: 'demo-meta-3',
    deposito: 1200, saque: 950, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 25, titulo: 'Remessa 1',
    slot_name: 'Sweet Bonanza', status_problema: 'normal',
    created_at: h(180),
  },
  {
    id: 'demo-rem-9', meta_id: 'demo-meta-3',
    deposito: 980, saque: 1340, lucro: 0, prejuizo: 0,
    tipo: 'remessa', contas_remessa: 25, titulo: 'Remessa 2',
    slot_name: 'Fortune Tiger', status_problema: 'normal',
    created_at: h(150),
  },
]

/* ── Demo Insights ── */
export const DEMO_INSIGHTS = [
  { type: 'profit', text: 'Sequencia positiva: 2 remessas com saque maior que deposito' },
  { type: 'info', text: 'Meta ativa com 53% de progresso — ritmo consistente' },
  { type: 'warn', text: 'Atencao: remessa 3 teve resultado abaixo da media' },
  { type: 'profit', text: 'Fortune Tiger rendendo +R$ 4,20/conta nesta meta' },
]

/* ── Demo Activity Feed ── */
export const DEMO_ACTIVITY = [
  { text: 'Remessa registrada: +R$ 320 depositados', time: h(2), color: '#22C55E' },
  { text: 'Saque processado: R$ 410,00', time: h(6), color: '#22C55E' },
  { text: 'Insight: sequencia positiva detectada', time: h(6.5), color: '#e53935' },
  { text: 'Remessa registrada: +R$ 150 depositados', time: h(18), color: '#22C55E' },
  { text: 'Meta 20 DEP OKOK finalizada', time: h(12), color: '#22C55E' },
]

/* ── Helper: check if should show demo ── */
export function shouldShowDemo(metas) {
  return !metas || metas.length === 0
}
