// ── Dados 100% MOCKADOS e paleta da dashboard experimental ──
// Nada aqui toca banco, Supabase, APIs ou logica de producao.

export const C = {
  bg: '#04070E',
  bgGrad: 'radial-gradient(1200px 600px at 70% -10%, rgba(255,49,49,0.06), transparent 60%), #04070E',
  card: '#080D16',
  cardHi: '#0B121E',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,49,49,0.35)',
  primary: '#FF3131',
  primaryDim: 'rgba(255,49,49,0.12)',
  success: '#22C55E',
  successDim: 'rgba(34,197,94,0.12)',
  loss: '#FF4D4D',
  text: '#FFFFFF',
  sub: '#94A3B8',
  faint: '#5B6678',
}

export const USER = { name: 'Bruno Oliveira', first: 'Bruno' }

const spark = (a) => a

export const KPIS = [
  { id: 'lucro', label: 'Lucro Total',       value: 'R$ 23.348', delta: +12.4, color: C.primary, type: 'area',
    data: spark([8, 11, 9, 14, 12, 17, 16, 21, 19, 24, 23, 27]) },
  { id: 'metas', label: 'Metas Ativas',      value: '68',        delta: +8.0,  color: C.primary, type: 'bars',
    data: spark([5, 7, 6, 9, 8, 11, 10, 12, 11, 13, 12, 14]) },
  { id: 'taxa',  label: 'Taxa de Sucesso',   value: '82%',       delta: +3.1,  color: C.success, type: 'area',
    data: spark([70, 72, 71, 74, 76, 75, 78, 80, 79, 81, 82, 82]) },
  { id: 'online',label: 'Operadores Online', value: '22',        delta: +2.0,  color: C.success, type: 'bars',
    data: spark([12, 14, 13, 16, 15, 18, 17, 19, 20, 21, 22, 22]) },
]

export const FEED = [
  { id: 1,  op: 'Pedro',   action: 'concluiu meta na rede W1', value: '+R$ 247',   tone: 'success', t: 'agora' },
  { id: 2,  op: 'Nicole',  action: 'registrou remessa',        value: 'R$ 1.500',  tone: 'info',    t: '1 min' },
  { id: 3,  op: 'Thomas',  action: 'bateu meta',               value: '+R$ 312',   tone: 'success', t: '2 min' },
  { id: 4,  op: 'Diogo',   action: 'registrou prejuízo',       value: '-R$ 48',    tone: 'loss',    t: '4 min' },
  { id: 5,  op: 'Larissa', action: 'concluiu meta na OKOK',    value: '+R$ 189',   tone: 'success', t: '6 min' },
  { id: 6,  op: 'Pedro',   action: 'abriu nova remessa',       value: 'R$ 900',    tone: 'info',    t: '8 min' },
  { id: 7,  op: 'Rafael',  action: 'bateu meta na VOY',        value: '+R$ 421',   tone: 'success', t: '11 min' },
  { id: 8,  op: 'Camila',  action: 'registrou remessa',        value: 'R$ 1.200',  tone: 'info',    t: '13 min' },
  { id: 9,  op: 'Diogo',   action: 'concluiu meta',            value: '+R$ 167',   tone: 'success', t: '15 min' },
  { id: 10, op: 'Thomas',  action: 'registrou prejuízo',       value: '-R$ 92',    tone: 'loss',    t: '18 min' },
  { id: 11, op: 'Nicole',  action: 'bateu meta na DY',         value: '+R$ 358',   tone: 'success', t: '21 min' },
  { id: 12, op: 'Rafael',  action: 'abriu nova remessa',       value: 'R$ 750',    tone: 'info',    t: '24 min' },
]

export const RANKING = [
  { name: 'Pedro',   lucro: 2147, pct: 100 },
  { name: 'Thomas',  lucro: 1820, pct: 85 },
  { name: 'Rafael',  lucro: 1543, pct: 72 },
  { name: 'Nicole',  lucro: 1290, pct: 60 },
  { name: 'Larissa', lucro: 980,  pct: 46 },
]

export const LEADERS = {
  operador: { medal: '🥇', name: 'Pedro', value: '+R$ 2.147', sub: 'operador líder' },
  rede:     { medal: '🏆', name: 'W1',    value: '63 metas',  sub: 'rede líder' },
  meta:     { medal: '💰', name: 'R$ 487', value: 'mais lucrativa', sub: 'meta' },
}

export const NETWORKS = [
  { name: 'W1',   metas: 63, lucro: 8420, pct: 100 },
  { name: 'OKOK', metas: 48, lucro: 6120, pct: 78 },
  { name: 'VOY',  metas: 41, lucro: 5380, pct: 66 },
  { name: 'DY',   metas: 33, lucro: 3940, pct: 51 },
  { name: '91',   metas: 27, lucro: 2870, pct: 39 },
  { name: 'WE',   metas: 19, lucro: 1610, pct: 24 },
]

// Lucro acumulado (grafico de area estilo Stripe/TradingView)
export const ACCUM = [
  1200, 1800, 1650, 2400, 3100, 2900, 3800, 4600, 4300, 5500, 6400, 6100,
  7300, 8200, 8000, 9400, 10800, 10500, 12100, 13600, 13200, 15400, 17200, 17000,
  18900, 20600, 20300, 21800, 22600, 23348,
]

export const fmtBRL = v => (Number(v) || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
