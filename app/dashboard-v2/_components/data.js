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

export const fmtData = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
export const fmtHora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

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
  const ativas = DEMO_METAS.filter(m => m.status_fechamento !== 'fechada')
  const fechadas = DEMO_METAS.filter(m => m.status_fechamento === 'fechada')
  const contas = DEMO_GLOBAL.totalContas
  const custosTotal = DEMO_COSTS.reduce((a, c) => a + Number(c.amount || 0), 0)
  const winRate = fechadas.length
    ? Math.round(fechadas.filter(m => Number(m.lucro_final || 0) > 0).length / fechadas.length * 100)
    : 0
  return [
    { label: 'Metas ativas', value: String(ativas.length), hint: `${fechadas.length} fechadas no periodo`, spark: [2, 3, 2, 4, 3, 3, ativas.length] },
    { label: 'Contas processadas', value: String(contas), hint: `${DEMO_REMESSAS.length} remessas registradas`, spark: [40, 55, 48, 72, 65, 90, 105] },
    { label: 'Lucro por conta', value: brl(DEMO_GLOBAL.lucroPerConta), hint: `Media de ${brl(DEMO_GLOBAL.lucroPerMeta)} por meta`, spark: [3, 4, 3.4, 5, 4.6, 6.2, 6.6] },
    { label: 'Taxa de acerto', value: `${winRate}%`, hint: `${fechadas.length} metas avaliadas`, spark: [60, 66, 62, 70, 74, 78, winRate] },
    { label: 'Custos do periodo', value: brl(custosTotal), hint: `${DEMO_COSTS.length} lancamentos`, spark: [55, 40, 62, 35, 48, 30, 25], negative: true },
  ]
}

/* ══════════════════════════════════════════
   METAS
   ══════════════════════════════════════════ */
function enrichMeta(m) {
  const rem = DEMO_REMESSAS.filter(r => r.meta_id === m.id)
  const contasFeitas = rem.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
  const resultado = rem.reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)
  const op = DEMO_OPERATORS.find(o => o.id === m.operator_id)
  const fechada = m.status_fechamento === 'fechada'
  const contasTotal = Number(m.quantidade_contas || 0)
  return {
    id: m.id,
    titulo: m.titulo,
    rede: m.rede,
    operador: op?.nome || '—',
    operadorId: m.operator_id,
    contasFeitas: fechada ? contasTotal : contasFeitas,
    contasTotal,
    progresso: contasTotal ? Math.min(100, Math.round((fechada ? contasTotal : contasFeitas) / contasTotal * 100)) : 0,
    resultado,
    remessas: rem.length,
    fechada,
    status: fechada ? 'fechada' : 'ativa',
    lucroFinal: fechada ? Number(m.lucro_final || 0) : resultado,
    salario: Number(m.salario || 0),
    bau: Number(m.bau || 0),
    custoFixo: Number(m.custo_fixo || 0),
    taxaAgente: Number(m.taxa_agente || 0),
    criadaEm: m.created_at,
    fechadaEm: m.fechada_em || null,
    deposito: rem.reduce((a, r) => a + Number(r.deposito || 0), 0),
    saque: rem.reduce((a, r) => a + Number(r.saque || 0), 0),
    lista: rem.map(r => ({
      id: r.id, titulo: r.titulo, slot: r.slot_name || '—',
      deposito: Number(r.deposito || 0), saque: Number(r.saque || 0),
      resultado: Number(r.lucro || 0) - Number(r.prejuizo || 0),
      contas: Number(r.contas_remessa || 0), tipo: r.tipo,
      problema: r.status_problema !== 'normal',
      created_at: r.created_at,
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  }
}

export function allMetas() {
  return DEMO_METAS.map(enrichMeta).sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm))
}

export function metasAtivas() {
  return allMetas().filter(m => !m.fechada)
}

/* ══════════════════════════════════════════
   OPERADORES
   ══════════════════════════════════════════ */
export function operadores() {
  return DEMO_OPERATOR_RANKING.map((o, i) => {
    const metas = allMetas().filter(m => m.operadorId === o.id)
    return {
      rank: i + 1,
      id: o.id,
      nome: o.nome,
      email: o.email,
      iniciais: o.nome.split(' ').map(p => p[0]).slice(0, 2).join(''),
      lucro: o.lucroFinal,
      metas: o.metasFechadas,
      ativas: o.metasAtivas,
      contas: o.totalDeposit,
      remessas: o.totalRem,
      winRate: o.winRate,
      porConta: o.lucroPerConta,
      badge: o.badge,
      desde: o.created_at,
      online: i < 2,
      listaMetas: metas,
      spark: o.lucroFinal > 300 ? [10, 22, 18, 34, 30, 46, 52]
        : o.lucroFinal > 0 ? [14, 12, 20, 17, 26, 24, 31]
          : [30, 24, 26, 18, 20, 12, 8],
    }
  })
}

/* ══════════════════════════════════════════
   REMESSAS
   ══════════════════════════════════════════ */
export function remessasRecentes(limit = 8) {
  const all = [...DEMO_REMESSAS]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(r => {
      const meta = DEMO_METAS.find(m => m.id === r.meta_id)
      const op = DEMO_OPERATORS.find(o => o.id === meta?.operator_id)
      const resultado = Number(r.lucro || 0) - Number(r.prejuizo || 0)
      return {
        id: r.id,
        metaId: r.meta_id,
        meta: meta?.titulo || '—',
        titulo: r.titulo,
        rede: meta?.rede || '—',
        slot: r.slot_name || '—',
        operador: op?.nome || '—',
        operadorCurto: op?.nome?.split(' ')[0] || '—',
        deposito: Number(r.deposito || 0),
        saque: Number(r.saque || 0),
        resultado,
        contas: Number(r.contas_remessa || 0),
        tipo: r.tipo,
        status: r.status_problema === 'normal' ? (resultado >= 0 ? 'lucro' : 'prejuizo') : 'pendente',
        created_at: r.created_at,
        hora: fmtHora(r.created_at),
        dia: new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }
    })
  return limit ? all.slice(0, limit) : all
}

/* ══════════════════════════════════════════
   REDES
   ══════════════════════════════════════════ */
export function redes() {
  const max = Math.max(...DEMO_REDES_RANKING.map(r => Math.abs(r.lucroFinal)), 1)
  return DEMO_REDES_RANKING.map(r => {
    const metasRede = allMetas().filter(m => m.rede === r.rede)
    const dep = metasRede.reduce((a, m) => a + m.deposito, 0)
    const saq = metasRede.reduce((a, m) => a + m.saque, 0)
    return {
      rede: r.rede,
      lucro: r.lucroFinal,
      metas: r.metas,
      contas: r.contas,
      porConta: r.lucroPerConta,
      winRate: r.winRate,
      score: r.score,
      deposito: dep,
      saque: saq,
      roi: dep > 0 ? ((saq - dep) / dep) * 100 : 0,
      ativas: metasRede.filter(m => !m.fechada).length,
      share: Math.round(Math.abs(r.lucroFinal) / max * 100),
      spark: r.lucroFinal > 250 ? [8, 14, 11, 20, 18, 27, 31]
        : r.lucroFinal > 150 ? [10, 9, 15, 13, 19, 18, 23]
          : [16, 13, 15, 11, 14, 12, 15],
    }
  })
}

/* ══════════════════════════════════════════
   SLOTS
   ══════════════════════════════════════════ */
export function slots() {
  const map = {}
  DEMO_REMESSAS.forEach(r => {
    if (!r.slot_name) return
    const meta = DEMO_METAS.find(m => m.id === r.meta_id)
    const res = Number(r.lucro || 0) - Number(r.prejuizo || 0)
    const s = map[r.slot_name] || (map[r.slot_name] = {
      nome: r.slot_name, usos: 0, deposito: 0, saque: 0, resultado: 0, wins: 0, redes: new Set(),
    })
    s.usos++
    s.deposito += Number(r.deposito || 0)
    s.saque += Number(r.saque || 0)
    s.resultado += res
    if (res > 0) s.wins++
    if (meta?.rede) s.redes.add(meta.rede)
  })
  return Object.values(map).map(s => ({
    ...s,
    redes: [...s.redes],
    winRate: s.usos ? Math.round(s.wins / s.usos * 100) : 0,
    roi: s.deposito ? ((s.saque - s.deposito) / s.deposito) * 100 : 0,
  })).sort((a, b) => b.resultado - a.resultado)
}

/* ══════════════════════════════════════════
   CUSTOS
   ══════════════════════════════════════════ */
export const CUSTO_TIPOS = ['proxy', 'sms', 'bot', 'vps', 'instagram', 'outros']

export function custosIniciais() {
  return DEMO_COSTS.map(c => ({
    id: c.id, tipo: c.type, valor: Number(c.amount || 0), data: c.date, nota: c.note,
  })).sort((a, b) => (a.data < b.data ? 1 : -1))
}

export function agrupaCustos(lista) {
  const map = {}
  lista.forEach(c => { map[c.tipo] = (map[c.tipo] || 0) + Number(c.valor || 0) })
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
  return Object.entries(map)
    .map(([tipo, valor]) => ({ tipo, valor, share: Math.round(valor / total * 100) }))
    .sort((a, b) => b.valor - a.valor)
}

export function custos() {
  return agrupaCustos(custosIniciais()).map(c => ({ type: c.tipo, amount: c.valor, share: c.share }))
}

/* ══════════════════════════════════════════
   FATURAMENTO / ASSINATURA
   (precos reais do plano: base + por operador)
   ══════════════════════════════════════════ */
export const PRECO_BASE = 59.9
export const PRECO_OPERADOR = 29.9

export function assinatura(qtdOperadores = DEMO_OPERATORS.length) {
  const total = PRECO_BASE + PRECO_OPERADOR * qtdOperadores
  const venc = new Date(); venc.setDate(venc.getDate() + 12)
  return {
    plano: 'PRO',
    status: 'ativa',
    operadores: qtdOperadores,
    base: PRECO_BASE,
    porOperador: PRECO_OPERADOR,
    total,
    metodo: 'PIX · Mercado Pago',
    proximoVencimento: venc.toISOString(),
    diasRestantes: 12,
  }
}

export function faturas() {
  const out = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const ops = i < 2 ? 3 : i < 4 ? 2 : 1
    out.push({
      id: `INV-${String(2026 - 0).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`,
      data: d.toISOString(),
      periodo: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      operadores: ops,
      valor: PRECO_BASE + PRECO_OPERADOR * ops,
      status: i === 0 ? 'em aberto' : 'paga',
      metodo: 'PIX',
    })
  }
  return out
}

/* ══════════════════════════════════════════
   PIX — recebimentos da operacao
   ══════════════════════════════════════════ */
export function pixRecebimentos() {
  return DEMO_REMESSAS
    .filter(r => Number(r.saque || 0) > 0)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map((r, i) => {
      const meta = DEMO_METAS.find(m => m.id === r.meta_id)
      const op = DEMO_OPERATORS.find(o => o.id === meta?.operator_id)
      return {
        id: `pix-${r.id}`,
        valor: Number(r.saque || 0),
        rede: meta?.rede || '—',
        operador: op?.nome || '—',
        chave: `${(op?.email || 'operador@nex').split('@')[0]}@pix`,
        status: i === 0 ? 'processando' : 'confirmado',
        created_at: r.created_at,
      }
    })
}

/* ══════════════════════════════════════════
   PREMIACOES — faixas por faturamento
   ══════════════════════════════════════════ */
export function premiacoes() {
  const atual = DEMO_GLOBAL.lucroFinalTotal
  const faixas = [
    { nome: 'Bronze', meta: 500, cor: 'rgba(255,255,255,0.35)' },
    { nome: 'Prata', meta: 2500, cor: 'rgba(255,255,255,0.55)' },
    { nome: 'Ouro', meta: 10000, cor: 'rgba(255,255,255,0.75)' },
    { nome: 'Diamante', meta: 50000, cor: 'rgba(255,255,255,0.9)' },
  ]
  return faixas.map(f => ({
    ...f,
    atingida: atual >= f.meta,
    progresso: Math.min(100, Math.round(atual / f.meta * 100)),
    falta: Math.max(0, f.meta - atual),
  }))
}

/* ══════════════════════════════════════════
   NETWORK — feed da comunidade
   ══════════════════════════════════════════ */
export function networkFeed() {
  const base = [
    { autor: 'Marcos Vieira', handle: '@marcosv', texto: 'Fechei 30 dep na VOY com margem de 12% por conta. O segredo foi trocar de slot depois da terceira remessa.', likes: 24, coments: 6, h: 2 },
    { autor: 'Camila Reis', handle: '@camilareis', texto: 'Alguem mais notou queda no CPA da OKOK essa semana? Aqui caiu quase 15%.', likes: 11, coments: 14, h: 5 },
    { autor: 'Diego Nunes', handle: '@diegonunes', texto: 'Dica: separe o custo de proxy por operador. Mudou completamente minha leitura de lucro por conta.', likes: 38, coments: 9, h: 9 },
    { autor: 'Bruno Oliveira', handle: '@brunoop', texto: 'Time bateu 5 metas fechadas no mes com 80% de acerto. Bora pra cima.', likes: 52, coments: 12, h: 20 },
  ]
  return base.map((p, i) => {
    const d = new Date(); d.setHours(d.getHours() - p.h)
    return {
      ...p,
      id: `post-${i}`,
      iniciais: p.autor.split(' ').map(x => x[0]).slice(0, 2).join(''),
      created_at: d.toISOString(),
      tempo: p.h < 24 ? `${p.h}h` : `${Math.round(p.h / 24)}d`,
    }
  })
}

/* ══════════════════════════════════════════
   NOTIFICACOES
   ══════════════════════════════════════════ */
export function notificacoes() {
  return [
    { id: 'n1', titulo: 'Meta fechada', texto: '20 DEP OKOK fechou com +R$ 186,40', tempo: '12h', tom: 'profit', lida: false },
    { id: 'n2', titulo: 'Sequencia negativa', texto: 'Lucas Mendes com 2 remessas negativas seguidas', tempo: '1d', tom: 'loss', lida: false },
    { id: 'n3', titulo: 'Saque pendente', texto: 'Remessa 2 da OKOK aguardando confirmacao', tempo: '2d', tom: 'neutral', lida: false },
    { id: 'n4', titulo: 'Assinatura', texto: 'Sua renovacao vence em 12 dias', tempo: '3d', tom: 'neutral', lida: true },
  ]
}

export const totals = DEMO_GLOBAL
export const REDES_DISPONIVEIS = ['W1', 'VOY', 'OKOK', 'DY', '91', 'WE']
