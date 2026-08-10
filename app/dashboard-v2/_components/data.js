/* ══════════════════════════════════════════════════════════════
   Dashboard V2 (Resend-inspired) — dados 100% MOCK
   Deriva de lib/demo-data.js. Nao toca Supabase, auth ou API.
   ══════════════════════════════════════════════════════════════ */
import {
  DEMO_METAS, DEMO_REMESSAS, DEMO_OPERATORS, DEMO_COSTS,
  DEMO_OPERATOR_RANKING, DEMO_REDES_RANKING, DEMO_GLOBAL,
} from '../../../lib/demo-data'

export const brl = (v, opts = {}) => {
  const n = Number(v || 0)
  const s = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: opts.cents === false ? 0 : 2, maximumFractionDigits: opts.cents === false ? 0 : 2 })
  return `${n < 0 ? '-' : opts.sign ? '+' : ''}R$ ${s}`
}

export const pct = (v) => `${v > 0 ? '+' : ''}${Number(v || 0).toFixed(1)}%`

/* ── Serie diaria de lucro (determinista, sem random no render) ── */
const DAILY = [
  // 30 dias anteriores (base de comparacao)
  41, 29, 58, 47, 22, -31, 36, 63, 84, 70,
  52, 31, 77, 95, 61, 38, -14, 49, 82, 101,
  68, 54, 86, 110, 93, 60, 43, 91, 118, 104,
  // 30 dias mais recentes (periodo exibido)
  62, 48, 91, 74, 33, -18, 55, 87, 120, 96,
  71, 44, 108, 133, 89, 52, -26, 67, 115, 142,
  98, 76, 121, 154, 132, 88, 61, 129, 167, 148,
]

const LABELS = DAILY.map((_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (DAILY.length - 1 - i))
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
})

export const PERIODS = [
  { id: '24h', label: '24h', days: 2 },
  { id: '7d', label: '7 dias', days: 7 },
  { id: '30d', label: '30 dias', days: 30 },
  { id: 'all', label: 'Tudo', days: 60 },
]

export function seriesFor(periodId) {
  const p = PERIODS.find(x => x.id === periodId) || PERIODS[2]
  const n = Math.min(p.days, DAILY.length)
  const values = DAILY.slice(-n)
  const labels = LABELS.slice(-n)
  const total = values.reduce((a, b) => a + b, 0)
  // comparativo com o periodo anterior de mesmo tamanho
  const prevSlice = DAILY.slice(Math.max(0, DAILY.length - n * 2), DAILY.length - n)
  const prev = prevSlice.length ? prevSlice.reduce((a, b) => a + b, 0) : null
  const delta = prev ? ((total - prev) / Math.abs(prev)) * 100 : null
  return { values, labels, total, prev, delta, days: n }
}

/* ── KPIs da faixa dividida ── */
export function kpis(periodId) {
  const s = seriesFor(periodId)
  const ativas = DEMO_METAS.filter(m => m.status_fechamento !== 'fechada')
  const fechadas = DEMO_METAS.filter(m => m.status_fechamento === 'fechada')
  const contas = DEMO_GLOBAL.totalContas
  const custos = DEMO_COSTS.reduce((a, c) => a + Number(c.amount || 0), 0)
  const winRate = fechadas.length
    ? Math.round(fechadas.filter(m => Number(m.lucro_final || 0) > 0).length / fechadas.length * 100)
    : 0
  return [
    { label: 'Metas ativas', value: String(ativas.length), hint: `${fechadas.length} fechadas no periodo`, spark: [2, 3, 2, 4, 3, 3, ativas.length] },
    { label: 'Contas processadas', value: String(contas), hint: `${DEMO_REMESSAS.length} remessas registradas`, spark: [40, 55, 48, 72, 65, 90, 105] },
    { label: 'Lucro por conta', value: brl(DEMO_GLOBAL.lucroPerConta), hint: `Media de ${brl(DEMO_GLOBAL.lucroPerMeta)} por meta`, spark: [3, 4, 3.4, 5, 4.6, 6.2, 6.6] },
    { label: 'Taxa de acerto', value: `${winRate}%`, hint: `${fechadas.length} metas avaliadas`, spark: [60, 66, 62, 70, 74, 78, winRate] },
    { label: 'Custos do periodo', value: brl(custos), hint: `${DEMO_COSTS.length} lancamentos`, spark: [55, 40, 62, 35, 48, 30, 25], negative: true },
  ]
}

/* ── Metas em andamento ── */
export function metasAtivas() {
  return DEMO_METAS.filter(m => m.status_fechamento !== 'fechada').map(m => {
    const rem = DEMO_REMESSAS.filter(r => r.meta_id === m.id)
    const contasFeitas = rem.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
    const resultado = rem.reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)
    const op = DEMO_OPERATORS.find(o => o.id === m.operator_id)
    return {
      id: m.id,
      titulo: m.titulo,
      rede: m.rede,
      operador: op?.nome || '—',
      contasFeitas,
      contasTotal: Number(m.quantidade_contas || 0),
      progresso: m.quantidade_contas ? Math.min(100, Math.round(contasFeitas / m.quantidade_contas * 100)) : 0,
      resultado,
      remessas: rem.length,
    }
  })
}

/* ── Ranking de operadores ── */
export function operadores() {
  return DEMO_OPERATOR_RANKING.map((o, i) => ({
    rank: i + 1,
    nome: o.nome,
    email: o.email,
    iniciais: o.nome.split(' ').map(p => p[0]).slice(0, 2).join(''),
    lucro: o.lucroFinal,
    metas: o.metasFechadas,
    ativas: o.metasAtivas,
    winRate: o.winRate,
    badge: o.badge,
    spark: o.lucroFinal > 300 ? [10, 22, 18, 34, 30, 46, 52]
      : o.lucroFinal > 0 ? [14, 12, 20, 17, 26, 24, 31]
        : [30, 24, 26, 18, 20, 12, 8],
  }))
}

/* ── Remessas recentes (tabela) ── */
export function remessasRecentes(limit = 8) {
  return [...DEMO_REMESSAS]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
    .map(r => {
      const meta = DEMO_METAS.find(m => m.id === r.meta_id)
      const op = DEMO_OPERATORS.find(o => o.id === meta?.operator_id)
      const resultado = Number(r.lucro || 0) - Number(r.prejuizo || 0)
      return {
        id: r.id,
        titulo: r.titulo,
        rede: meta?.rede || '—',
        slot: r.slot_name || '—',
        operador: op?.nome?.split(' ')[0] || '—',
        deposito: Number(r.deposito || 0),
        saque: Number(r.saque || 0),
        resultado,
        contas: Number(r.contas_remessa || 0),
        tipo: r.tipo,
        status: r.status_problema === 'normal'
          ? (resultado >= 0 ? 'lucro' : 'prejuizo')
          : 'pendente',
        hora: new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }
    })
}

/* ── Redes ── */
export function redes() {
  const max = Math.max(...DEMO_REDES_RANKING.map(r => Math.abs(r.lucroFinal)), 1)
  return DEMO_REDES_RANKING.map(r => ({
    rede: r.rede,
    lucro: r.lucroFinal,
    metas: r.metas,
    contas: r.contas,
    porConta: r.lucroPerConta,
    winRate: r.winRate,
    share: Math.round(Math.abs(r.lucroFinal) / max * 100),
  }))
}

/* ── Custos agrupados ── */
export function custos() {
  const map = {}
  DEMO_COSTS.forEach(c => { map[c.type] = (map[c.type] || 0) + Number(c.amount || 0) })
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
  return Object.entries(map)
    .map(([type, amount]) => ({ type, amount, share: Math.round(amount / total * 100) }))
    .sort((a, b) => b.amount - a.amount)
}

export const totals = DEMO_GLOBAL
