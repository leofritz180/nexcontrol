// ── Dados 100% MOCKADOS e paleta — sala de operação CPA ──
// Nada toca banco, Supabase, APIs, auth ou dados reais.

export const C = {
  bg: '#04070E',
  panel: '#070C15',
  panelHi: '#0A111D',
  line: 'rgba(255,255,255,0.055)',
  lineHi: 'rgba(255,49,49,0.30)',
  red: '#FF3131',
  redSoft: 'rgba(255,49,49,0.10)',
  green: '#22C55E',
  greenSoft: 'rgba(34,197,94,0.12)',
  amber: '#F5A524',
  amberSoft: 'rgba(245,165,36,0.12)',
  blue: '#4DA3FF',
  blueSoft: 'rgba(77,163,255,0.12)',
  text: '#F4F6FB',
  sub: '#8A94A6',
  faint: '#525C6E',
}

export const tone = {
  success: { c: C.green, bg: C.greenSoft },
  loss:    { c: C.red,   bg: C.redSoft },
  info:    { c: C.blue,  bg: C.blueSoft },
  attention:{ c: C.amber, bg: C.amberSoft },
  risk:    { c: C.red,   bg: C.redSoft },
}

export const USER = { name: 'Bruno Oliveira', first: 'Bruno' }

export const HERO = {
  lucro: 14822,
  delta: +12.4,
  indicadores: [
    { label: 'Metas ativas',       value: '68' },
    { label: 'Operadores online',  value: '22' },
    { label: 'Taxa de sucesso',    value: '82%' },
    { label: 'Risco operacional',  value: 'Oscilando', tone: 'attention' },
  ],
}

export const STATUS = {
  estado: 'OSCILANDO',
  tone: 'attention',
  itens: [
    { k: 'Melhor rede',          v: 'VOY',         tone: 'success' },
    { k: 'Operador em alta',     v: 'Bernardho',   tone: 'success' },
    { k: 'Rede com risco',       v: 'WE',          tone: 'risk' },
    { k: 'Última meta fechada',  v: 'W1 · há 2min', tone: 'info' },
  ],
}

export const FEED = [
  { time: '14:31', op: 'Pedro',   act: 'fechou W1',       value: '+R$ 247',   tone: 'success' },
  { time: '14:28', op: 'Nicole',  act: 'abriu remessa',   value: 'R$ 1.500',  tone: 'info' },
  { time: '14:26', op: 'Thomas',  act: 'bateu W3',        value: '+R$ 312',   tone: 'success' },
  { time: '14:20', op: 'Diogo',   act: 'prejuízo W1',     value: '-R$ 48',    tone: 'loss' },
  { time: '14:14', op: 'Larissa', act: 'fechou OKOK',     value: '+R$ 189',   tone: 'success' },
  { time: '14:09', op: 'Pedro',   act: 'abriu remessa',   value: 'R$ 900',    tone: 'info' },
  { time: '14:03', op: 'Rafael',  act: 'bateu VOY',       value: '+R$ 421',   tone: 'success' },
  { time: '13:58', op: 'Camila',  act: 'abriu remessa',   value: 'R$ 1.200',  tone: 'info' },
  { time: '13:51', op: 'Diogo',   act: 'fechou DY',       value: '+R$ 167',   tone: 'success' },
  { time: '13:44', op: 'Thomas',  act: 'prejuízo W3',     value: '-R$ 92',    tone: 'loss' },
  { time: '13:37', op: 'Nicole',  act: 'bateu DY',        value: '+R$ 358',   tone: 'success' },
  { time: '13:29', op: 'Bernardho', act: 'fechou VOY',    value: '+R$ 503',   tone: 'success' },
  { time: '13:18', op: 'Rafael',  act: 'abriu remessa',   value: 'R$ 750',    tone: 'info' },
  { time: '13:05', op: 'Larissa', act: 'prejuízo 91',     value: '-R$ 61',    tone: 'loss' },
]

export const PODIUM = [
  { medal: '🥇', name: 'Pedro',  lucro: '+R$ 2.147', metas: 27 },
  { medal: '🥈', name: 'Nicole', lucro: '+R$ 1.392', metas: 18 },
  { medal: '🥉', name: 'Thomas', lucro: '+R$ 987',   metas: 14 },
]

export const PODIUM_REST = [
  { pos: 4, name: 'Rafael',  lucro: '+R$ 743', metas: 11 },
  { pos: 5, name: 'Larissa', lucro: '+R$ 512', metas: 8 },
]

export const NETWORKS = [
  { name: 'W1',   lucro: 8420, metas: 63, pct: 100, status: 'healthy' },
  { name: 'OKOK', lucro: 6120, metas: 48, pct: 73,  status: 'healthy' },
  { name: 'VOY',  lucro: 5380, metas: 41, pct: 64,  status: 'healthy' },
  { name: 'DY',   lucro: 3940, metas: 33, pct: 47,  status: 'attention' },
  { name: '91',   lucro: 2870, metas: 27, pct: 34,  status: 'attention' },
  { name: 'WE',   lucro: 1610, metas: 19, pct: 19,  status: 'risk' },
]

export const NET_STATUS = {
  healthy:   { c: C.green, label: 'saudável' },
  attention: { c: C.amber, label: 'atenção' },
  risk:      { c: C.red,   label: 'risco' },
}

export const ACCUM = [
  1200, 1800, 1650, 2400, 3100, 2900, 3800, 4600, 4300, 5500, 6400, 6100,
  7300, 8200, 8000, 9400, 10800, 10500, 12100, 13600, 13200, 15400, 17200, 17000,
  18900, 20600, 20300, 21800, 22600, 23348,
]

export const fmtBRL = v => (Number(v) || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
