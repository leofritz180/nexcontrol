'use client'
// ─────────────────────────────────────────────────────────────────────────
// ADMIN BENTO — nova camada de APRESENTAÇÃO da visão geral do /admin, no
// estilo aprovado em /design-v2 (bento claro, cantos arredondados, blobs
// orgânicos, pills, curva suave).
//
// É 100% PRESENTACIONAL: recebe por props os dados que o /admin já calcula
// (global, ranking, metas, dailyGoal…) e os handlers que já existem. Não
// busca nada, não grava nada, não recalcula regra de negócio.
//
// Só é montado para as contas liberadas em lib/theme-v2.js — o resto dos
// usuários continua vendo a visão geral antiga, sem nenhuma alteração.
// ─────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Rosca, FATIAS, NumeroTexto, Sparkline, Comparativo, Sequencia, Destaque, Calor, Podio, Risco, Barras, Tira } from '../ui/bento'
import { opDayISO, ultimosDiasOp } from '../../lib/opday'

const RED = '#e5391f', RED2 = '#ff7a4d'
const MONO = 'var(--mono, "JetBrains Mono", monospace)'
const money = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money0 = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
// mesma regra do kit: sem maximumFractionDigits o toLocaleString mantem ate
// 3 casas e uma porcentagem sai como "82,143%"
const int = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

// tons que funcionam no claro e no escuro (via tokens já existentes)
const S = {
  card: { position: 'relative', overflow: 'hidden', background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--b1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)' },
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)',
}

function Blob({ c1, c2 }) {
  const id = 'ab' + String(c1).replace(/\W/g, '')
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: '58%', height: '100%', pointerEvents: 'none' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient></defs>
      <path d="M40,0 C90,18 70,58 110,78 C150,98 180,80 200,64 L200,0 Z" fill={`url(#${id})`} opacity="0.9" />
      <path d="M78,0 C118,22 100,54 142,72 C172,85 190,78 200,70 L200,0 Z" fill={c1} opacity="0.45" />
    </svg>
  )
}
const Ico = ({ d, c = '#fff', s = 19 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

function curva(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}

function Card({ children, style, pad = 22, blob, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 6px 14px rgba(0,0,0,0.06), 0 20px 46px rgba(0,0,0,0.11)' }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      onClick={onClick}
      style={{ ...S.card, padding: pad, cursor: onClick ? 'pointer' : 'default', ...style }}>
      {blob && <motion.div variants={{}} style={{ position: 'absolute', inset: 0 }}><Blob c1={blob[0]} c2={blob[1]} /></motion.div>}
      <div style={{ position: 'relative' }}>{children}</div>
    </motion.div>
  )
}
function Chip({ bg, children }) {
  return <span style={{ width: 40, height: 40, borderRadius: 13, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
}

// mesmos periodos do painel antigo, pra nao mudar o que o numero significa
const PERIODOS = [['month','Mês'],['today','Hoje'],['yesterday','Ontem'],['7d','7d'],['30d','30d'],['all','Tudo']]

export default function AdminBento({ nome, patente, global: g, ranking = [], metas = [], remessas = [], operators = [], dailyGoal, onNovaMeta, onVerMetas, onAbrirMeta, onVerFechamento, onSaveGoal , periodo, onPeriodo, lucroPeriodo , onAtualizar, atualizando }) {
  const [editGoal, setEditGoal] = useState(false)
  const [goalVal, setGoalVal] = useState('')

  const lucroHoje = (g?.lucroHoje || 0) - (g?.custosHoje || 0)
  const lucroTotal = (g?.lucroFinalTotal || 0) - (g?.custosTotal || 0)
  const abertas = useMemo(() => metas.filter(m => !m.deleted_at && m.status_fechamento !== 'fechada'), [metas])
  const fechadas = useMemo(() => metas.filter(m => !m.deleted_at && m.status_fechamento === 'fechada'), [metas])
  const equipeOn = ranking.length

  // meta do dia
  const alvo = Number(dailyGoal?.target || 0), feito = Number(dailyGoal?.today || 0)
  const rotuloPeriodo = 'lucro · ' + (PERIODOS.find(x => x[0] === periodo)?.[1] || 'período').toLowerCase()
  const pctDia = alvo > 0 ? Math.min(100, Math.round((feito / alvo) * 100)) : 0

  // série da semana: lucro das metas fechadas por dia (7 dias)
  const serie = useMemo(() => {
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const v = fechadas.filter(m => String(m.fechada_em || m.created_at || '').slice(0, 10) === key)
        .reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      dias.push({ label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()], v })
    }
    return dias
  }, [fechadas])

  const W = 680, H = 190
  // A escala precisa dar conta de PREJUIZO: com metas fechadas no negativo, um
  // maximo simples jogava a linha pra fora do quadro. Aqui o zero sempre entra
  // na faixa e a curva fica presa dentro da altura.
  const vals = serie.map(s => s.v)
  const hi = Math.max(0, ...vals), lo = Math.min(0, ...vals)
  const folga = ((hi - lo) || 1) * 0.15
  const topo = hi + folga, base = lo - folga
  const yDe = v => H - ((v - base) / (topo - base)) * H
  const pts = serie.map((s, i) => [(i * W) / 6, yDe(s.v)])
  const yZero = yDe(0)
  const temNegativo = lo < 0

  // ── Lucro por dia: a base de varios cards novos. Uma passada so, indexada
  //    por dia, pra nao varrer as metas tres vezes. O dia usado e o do
  //    fechamento (fechada_em), com created_at de reserva — mesma regra que
  //    a curva da semana ja usava, entao os numeros continuam batendo.
  // Agrupa pelo DIA OPERACIONAL (vira as 5h), o mesmo criterio do resto do
  // painel. Antes era `toISOString().slice(0,10)`, que e UTC: o total de
  // "hoje" no topo e o ultimo quadrado do calendario podiam discordar.
  const porDia = useMemo(() => {
    const mapa = new Map()
    for (const m of fechadas) {
      const quando = m.fechada_em || m.created_at
      if (!quando) continue
      const dia = opDayISO(quando)
      mapa.set(dia, (mapa.get(dia) || 0) + Number(m.lucro_final || 0))
    }
    return mapa
  }, [fechadas])

  function ultimosDias(n) {
    return ultimosDiasOp(n).map(({ iso, rotulo }) => ({ d: rotulo, iso, v: porDia.get(iso) || 0 }))
  }

  const dias14 = useMemo(() => ultimosDias(14), [porDia])
  const dias30 = useMemo(() => ultimosDias(30), [porDia])
  const dias10 = useMemo(() => ultimosDias(10), [porDia])

  // Curva dos 14 dias que vai DENTRO do card do lucro. Mesmos dados do
  // Sparkline da linha 2 — nao inventa numero nenhum, só dá corpo ao card.
  const curva14 = useMemo(() => {
    const L = 300, A = 54
    const v = dias14.map(d => d.v)
    if (!v.length) return null
    const alto = Math.max(0, ...v), baixo = Math.min(0, ...v)
    const faixa = (alto - baixo) || 1
    const pts = v.map((n, i) => [
      v.length > 1 ? (i * L) / (v.length - 1) : 0,
      A - ((n - baixo) / faixa) * (A - 8) - 4,
    ])
    return { L, A, d: curva(pts) }
  }, [dias14])

  // mes corrente contra o anterior, pelo mesmo criterio de data
  const { mesAtual, mesPassado } = useMemo(() => {
    const agora = new Date()
    const chaveAtual = agora.toISOString().slice(0, 7)
    const ant = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const chaveAnt = ant.toISOString().slice(0, 7)
    let a = 0, b = 0
    for (const [dia, v] of porDia) {
      if (dia.slice(0, 7) === chaveAtual) a += v
      else if (dia.slice(0, 7) === chaveAnt) b += v
    }
    return { mesAtual: a, mesPassado: b }
  }, [porDia])

  // melhor operador dos ultimos 7 dias, pelo ranking que a pagina ja monta
  const melhorOp = useMemo(() => {
    const ord = [...ranking].sort((x, y) => Number(y.lucroFinal || 0) - Number(x.lucroFinal || 0))
    return ord[0] || null
  }, [ranking])

  // ── O que precisa de atencao ──
  // Tudo aqui sai do que a pagina ja tem em maos. Sem consulta nova e sem
  // inventar limiar: parada = 15 dias, o mesmo corte que a rosca de
  // situacao ja usa; no vermelho = lucro_final negativo de verdade.
  const alertas = useMemo(() => {
    const out = []
    const agora = Date.now()
    const paradas = abertas.filter(m => m.created_at && (agora - new Date(m.created_at).getTime()) / 86400000 > 15)
    if (paradas.length) {
      const nomes = paradas.slice(0, 3).map(m => m.titulo || m.rede || "meta").join(", ")
      out.push(`${int(paradas.length)} meta${paradas.length === 1 ? "" : "s"} aberta${paradas.length === 1 ? "" : "s"} ha mais de 15 dias: ${nomes}${paradas.length > 3 ? " e outras" : ""}`)
    }
    const negativas = fechadas.filter(m => Number(m.lucro_final || 0) < 0)
    if (negativas.length) {
      const soma = negativas.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      out.push(`${int(negativas.length)} meta${negativas.length === 1 ? "" : "s"} fechada${negativas.length === 1 ? "" : "s"} no prejuizo, somando ${money0(Math.abs(soma))}`)
    }
    const semOperador = abertas.filter(m => !m.operator_id)
    if (semOperador.length) out.push(`${int(semOperador.length)} meta${semOperador.length === 1 ? "" : "s"} aberta${semOperador.length === 1 ? "" : "s"} sem operador atribuido`)
    return out
  }, [abertas, fechadas])

  // ── Podio: os tres que mais trouxeram ──
  const podio = useMemo(() => [...ranking]
    .sort((a, b) => Number(b.lucroFinal || 0) - Number(a.lucroFinal || 0))
    .slice(0, 3)
    .map(o => ({ l: o.nome || o.email?.split("@")[0] || "Operador", v: Number(o.lucroFinal || 0) })),
  [ranking])

  // ── Roscas: onde o lucro se concentra e como as metas estao divididas ──
  const porRede = useMemo(() => {
    const mapa = new Map()
    for (const m of fechadas) {
      const rede = (m.rede || 'Sem rede').toUpperCase()
      const v = Number(m.lucro_final || 0)
      if (v <= 0) continue // rosca so faz sentido com fatias positivas
      mapa.set(rede, (mapa.get(rede) || 0) + v)
    }
    const todas = [...mapa.entries()].map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v)
    const topo = todas.slice(0, 4).map((d, i) => ({ ...d, c: FATIAS[i] }))
    const resto = todas.slice(4).reduce((a, d) => a + d.v, 0)
    if (resto > 0) topo.push({ l: 'Outras', v: resto, c: FATIAS[4] })
    return topo
  }, [fechadas])
  const lucroRedes = porRede.reduce((a, d) => a + d.v, 0)

  const situacao = useMemo(() => {
    const paradas = abertas.filter(m => m.created_at && (Date.now() - new Date(m.created_at).getTime()) / 86400000 > 15).length
    return [
      { l: 'Em andamento', v: abertas.length - paradas, c: FATIAS[2] },
      { l: 'Paradas (+15d)', v: paradas, c: FATIAS[0] },
      { l: 'Fechadas', v: fechadas.length, c: FATIAS[4] },
    ].filter(d => d.v > 0)
  }, [abertas, fechadas])

  // ── A OPERAÇÃO EM NÚMEROS DE CPA ─────────────────────────────────────
  // Contas (depositantes), remessas, quem operou hoje, o que espera
  // fechamento. É a linguagem de quem toca operação — "lucro" sozinho é
  // linguagem de qualquer painel. Uma passada pelas remessas, por meta.
  const porMetaRem = useMemo(() => {
    const mapa = new Map()
    for (const r of remessas) {
      const e = mapa.get(r.meta_id) || { contas: 0, liq: 0, n: 0 }
      if (r.tipo !== 'redeposito') e.contas += Number(r.contas_remessa || 0)   // redepósito não conta na progressão
      e.liq += Number(r.lucro || 0) - Number(r.prejuizo || 0)
      e.n++
      mapa.set(r.meta_id, e)
    }
    return mapa
  }, [remessas])

  const agora = useMemo(() => {
    const hojeOp = opDayISO(new Date())
    const remHoje = remessas.filter(r => r.created_at && opDayISO(r.created_at) === hojeOp)
    const contasHoje = remHoje.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
    const metaOp = new Map(metas.map(m => [m.id, m.operator_id]))
    const opsHoje = new Set(remHoje.map(r => metaOp.get(r.meta_id)).filter(Boolean)).size
    let alvo = 0, feitas = 0
    for (const m of abertas) { const a = Number(m.quantidade_contas || 0); alvo += a; feitas += Math.min(a, porMetaRem.get(m.id)?.contas || 0) }
    const aguardando = abertas.filter(m => m.status === 'finalizada').length
    // o objeto global NÃO devolve totalContasFechadas (só o lucroPerConta): a
    // linha 'contas processadas' do card de movimento mostrava 0 há tempos.
    // Aqui soma direto das metas fechadas.
    const depositantes = fechadas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    // lucro final POR CONTA: só CPA (metas fechadas), sem custos — a métrica que
    // o nicho usa pra comparar rede, slot e operador
    const porConta = depositantes > 0 ? Number(g?.lucroFinalTotalCpa ?? g?.lucroFinalTotal ?? 0) / depositantes : 0
    return { remHoje: remHoje.length, contasHoje, opsHoje, alvo, feitas, pct: alvo > 0 ? Math.round((feitas / alvo) * 100) : 0, aguardando, depositantes, porConta }
  }, [remessas, metas, abertas, fechadas, porMetaRem, g])

  const nomeOp = id => { const o = operators.find(x => x.id === id); const n = (o?.nome || o?.email?.split('@')[0] || '').trim(); return n ? n.split(/\s+/)[0] : '' }

  // metas abertas com progresso REAL (contas feitas / alvo, pelas remessas)
  const emAndamento = useMemo(() => abertas.slice(0, 5).map(m => {
    const alvoC = Number(m.quantidade_contas || 0)
    const e = porMetaRem.get(m.id) || { contas: 0, liq: 0, n: 0 }
    const feitas = Math.min(alvoC, e.contas)
    return { id: m.id, rede: (m.rede || '—').toUpperCase(), alvo: alvoC, feitas, pct: alvoC > 0 ? Math.round((feitas / alvoC) * 100) : 0, liq: e.liq, n: e.n, porConta: feitas > 0 ? e.liq / feitas : 0, op: nomeOp(m.operator_id), finalizada: m.status === 'finalizada', criada: m.created_at }
  }), [abertas, porMetaRem, operators])

  // R$ por conta, por rede (metas fechadas): o que separa rede boa de rede ruim
  const porContaRede = useMemo(() => {
    const mapa = new Map()
    for (const m of fechadas) {
      const r = (m.rede || 'Sem rede').toUpperCase(); const e = mapa.get(r) || { lucro: 0, contas: 0 }
      e.lucro += Number(m.lucro_final || 0); e.contas += Number(m.quantidade_contas || 0); mapa.set(r, e)
    }
    return [...mapa.entries()].filter(([, e]) => e.contas > 0).map(([l, e]) => ({ l, v: e.lucro / e.contas, contas: e.contas })).sort((a, b) => b.v - a.v).slice(0, 6)
  }, [fechadas])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* saudação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: S.t1, margin: 0, letterSpacing: '-0.03em' }}>Olá, {nome || 'admin'}</h1>
            {patente}
          </div>
          <p style={{ fontSize: 13.5, color: S.t3, margin: '3px 0 0' }}>{abertas.length} meta{abertas.length === 1 ? '' : 's'} em andamento · {equipeOn} operador{equipeOn === 1 ? '' : 'es'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {onAtualizar && (
          <motion.button type="button" onClick={onAtualizar} disabled={atualizando}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 30, cursor: atualizando ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: S.t2,
              background: 'var(--surface)', border: '1px solid var(--b1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', opacity: atualizando ? 0.55 : 1 }}>
            <motion.span style={{ display: 'inline-flex' }}
              animate={atualizando ? { rotate: 360 } : { rotate: 0 }}
              transition={atualizando ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}>
              <Ico d={<><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></>} s={15} c={S.t2} />
            </motion.span>
            {atualizando ? 'Atualizando' : 'Atualizar'}
          </motion.button>
        )}
        {/* nx-acao: no celular o CSS transforma em botao flutuante redondo,
            acima da barra de abas. "Nova meta" e a acao principal do painel
            e nao pode rolar pra fora da tela no primeiro gesto. */}
        <motion.button type="button" onClick={onNovaMeta} className="nx-acao" whileHover={{ y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.38)' }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
          <span className="nx-acao-ico" style={{ display: 'inline-flex' }}><Ico d={<path d="M12 5v14M5 12h14" />} s={16} /></span>
          <span className="nx-acao-txt">Nova meta</span>
        </motion.button>
        </div>
      </div>

      {/* filtro de periodo — manda no primeiro card */}
      {onPeriodo && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'inline-flex', gap: 3, padding: 4, borderRadius: 30, background: 'var(--surface)', border: '1px solid var(--b1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            {PERIODOS.map(([k, l]) => {
              const on = periodo === k
              return (
                <button key={k} type="button" onClick={() => onPeriodo(k)}
                  style={{ padding: '7px 15px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    background: on ? '#15151a' : 'transparent', color: on ? '#fff' : 'var(--t3)', transition: 'background .18s ease, color .18s ease' }}>
                  {l}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* LINHA 1 — O LUCRO É A ÂNCORA DA TELA.
          Ele era um quarto da linha, do mesmo tamanho de "metas fechadas" —
          sendo o número que define o negócio. O destaque vem de TAMANHO, não
          de cor: quase o dobro de largura e o número em 44px. A superfície
          continua branca como a dos vizinhos (uma tentativa de card preto
          quebrou a harmonia da tela e foi revertida em 21/09).
          A curva de 14 dias ao fundo são os mesmos dados da linha 2. */}
      <div className="ab-r1" style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr 1fr 1.3fr', gap: 14 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card blob={['var(--profit-dim)', 'var(--profit-border)']} pad={24} style={{ minHeight: 148, height: '100%' }}>
            <Chip bg="var(--profit-dim)"><Ico d={<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} c="var(--profit)" /></Chip>
            <p style={{
              fontSize: 44, fontWeight: 900, margin: '16px 0 0', letterSpacing: '-0.045em', lineHeight: 1,
              fontFamily: MONO,
              color: (lucroPeriodo != null ? lucroPeriodo : lucroTotal) >= 0 ? S.t1 : 'var(--loss)',
            }}>
              <NumeroTexto delay={0.15}>{money0(lucroPeriodo != null ? lucroPeriodo : lucroTotal)}</NumeroTexto>
            </p>
            <p style={{ fontSize: 12.5, color: S.t3, margin: '6px 0 0' }}>
              {lucroPeriodo != null ? rotuloPeriodo : 'lucro final acumulado'}
            </p>
            {/* A curva vem DEPOIS do texto, no fluxo, com margem negativa pra
                sangrar até a borda. Absoluta ela se ancoraria no fim do texto
                e passaria por cima da legenda — foi o que aconteceu com o
                Sparkline do kit. */}
            {curva14?.d && (
              <svg viewBox={`0 0 ${curva14.L} ${curva14.A}`} preserveAspectRatio="none" aria-hidden
                style={{ display: 'block', width: 'calc(100% + 48px)', height: 46, marginLeft: -24, marginRight: -24, marginTop: 14, marginBottom: -24, pointerEvents: 'none' }}>
                <defs>
                  <linearGradient id="abLucroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--profit)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--profit)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path d={`${curva14.d} L${curva14.L},${curva14.A} L0,${curva14.A} Z`} fill="url(#abLucroFill)"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.45 }} />
                <motion.path d={curva14.d} fill="none" stroke="var(--profit)" strokeOpacity="0.5" strokeWidth="2"
                  strokeLinecap="round" vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.33, 1, 0.68, 1] }} />
              </svg>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
          <Card blob={[RED2, RED]} style={{ minHeight: 148 }}>
            <Chip bg={RED}><Ico d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>} c="#fff" /></Chip>
            <p style={{ fontSize: 27, fontWeight: 900, color: S.t1, margin: '18px 0 0', letterSpacing: '-0.035em', fontFamily: MONO }}><NumeroTexto delay={0.22}>{int(agora.depositantes)}</NumeroTexto></p>
            <p style={{ fontSize: 12.5, color: S.t3, margin: '4px 0 0' }}>depositantes · {int(fechadas.length)} metas fechadas</p>
            <p style={{ fontSize: 11.5, color: S.t3, margin: '2px 0 0', fontFamily: MONO }}>{money(agora.porConta)} por conta</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
          <Card style={{ minHeight: 148 }}>
            <Chip bg="var(--fill-2)"><Ico d={<><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>} c={S.t2} /></Chip>
            <p style={{ fontSize: 27, fontWeight: 900, color: lucroHoje >= 0 ? 'var(--profit)' : 'var(--loss)', margin: '18px 0 0', letterSpacing: '-0.035em', fontFamily: MONO }}><NumeroTexto delay={0.29}>{money0(lucroHoje)}</NumeroTexto></p>
            <p style={{ fontSize: 12.5, color: S.t3, margin: '4px 0 0' }}>hoje, desde as 5h</p>
            <p style={{ fontSize: 11.5, color: S.t3, margin: '2px 0 0' }}>{int(agora.remHoje)} remessa{agora.remHoje === 1 ? '' : 's'} · {int(agora.contasHoje)} conta{agora.contasHoje === 1 ? '' : 's'}</p>
          </Card>
        </motion.div>

        {/* meta do dia — card vermelho */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
          <div style={{ position: 'relative', overflow: 'hidden', minHeight: 148, height: '100%', borderRadius: 24, padding: 22, background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 14px 34px rgba(229,57,31,0.3)' }}>
            <svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
              <path d="M0,96 C46,60 84,124 132,88 C164,64 182,74 200,66 L200,140 L0,140 Z" fill="#fff" opacity="0.35" />
              <path d="M0,116 C52,86 92,138 140,110 C170,92 186,98 200,92 L200,140 L0,140 Z" fill="#fff" opacity="0.4" />
            </svg>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Meta do dia</p>
                  <p style={{ fontSize: 12, color: 'var(--t1)', margin: '3px 0 0' }}>{alvo > 0 ? `${money0(feito)} de ${money0(alvo)}` : 'ainda não definida'}</p>
                </div>
                {alvo > 0 && !editGoal && (
                  <button type="button" onClick={() => { setGoalVal(String(alvo)); setEditGoal(true) }} title="Alterar meta"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontFamily: MONO, fontSize: 15, fontWeight: 900, color: 'var(--t1)' }}>
                    {pctDia}%
                  </button>
                )}
              </div>

              {editGoal ? (
                <div style={{ marginTop: 16, display: 'flex', gap: 7 }}>
                  <input autoFocus value={goalVal} inputMode="numeric"
                    onChange={e => setGoalVal(e.target.value.replace(/D/g, '').slice(0, 7))}
                    onKeyDown={e => { if (e.key === 'Enter' && onSaveGoal) { onSaveGoal(Number(goalVal) || null); setEditGoal(false) } }}
                    placeholder="ex: 5000"
                    style={{ flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: 11, border: 'none', outline: 'none', fontFamily: MONO, fontSize: 14, fontWeight: 800, color: '#15151a' }} />
                  <button type="button" onClick={() => { if (onSaveGoal) onSaveGoal(Number(goalVal) || null); setEditGoal(false) }}
                    style={{ padding: '0 14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, background: '#fff', color: '#c2310f' }}>Salvar</button>
                </div>
              ) : (
                <>
                  <div style={{ marginTop: 20, height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.32)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pctDia}%` }} transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }} style={{ height: '100%', borderRadius: 5, background: '#fff' }} />
                  </div>
                  {alvo > 0 ? (
                    <p style={{ fontSize: 11.5, color: 'var(--t1)', margin: '10px 0 0' }}>
                      {feito >= alvo ? 'meta batida hoje' : `faltam ${money0(alvo - feito)}`}{dailyGoal?.streak > 1 ? ` · ${dailyGoal.streak} dias seguidos` : ''}
                    </p>
                  ) : (
                    <button type="button" onClick={() => { setGoalVal(''); setEditGoal(true) }}
                      style={{ marginTop: 12, padding: '9px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, background: '#fff', color: '#c2310f' }}>
                      Definir meta →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* OPERAÇÃO AGORA — contas, remessas, quem está operando e o que espera
          fechamento. É a primeira pergunta de quem toca operação CPA. */}
      <Tira itens={[
        { l: 'Metas rodando', v: int(abertas.length - agora.aguardando), hint: abertas.length ? `${int(abertas.length)} aberta${abertas.length === 1 ? '' : 's'} no total` : 'nenhuma aberta' },
        { l: 'Contas feitas', v: `${int(agora.feitas)}/${int(agora.alvo)}`, hint: `${agora.pct}% das metas abertas` },
        { l: 'Remessas hoje', v: int(agora.remHoje), hint: `${int(agora.opsHoje)} operador${agora.opsHoje === 1 ? '' : 'es'} operando` },
        { l: 'Aguardando fechamento', v: int(agora.aguardando), c: agora.aguardando > 0 ? RED : undefined, hint: agora.aguardando > 0 ? 'finalizadas pelo operador' : 'nada pendente' },
      ]} />
      {agora.aguardando > 0 && onVerFechamento && (
        <motion.button type="button" onClick={onVerFechamento} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '13px 18px', borderRadius: 18, border: '1px solid rgba(229,57,31,0.35)', background: 'var(--surface)', boxShadow: '0 8px 26px rgba(229,57,31,0.10)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: RED, boxShadow: '0 0 0 4px rgba(229,57,31,0.16)', flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: S.t1 }}>{int(agora.aguardando)} meta{agora.aguardando === 1 ? '' : 's'} finalizada{agora.aguardando === 1 ? '' : 's'} esperando você fechar</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: RED, flexShrink: 0 }}>Fechar →</span>
        </motion.button>
      )}

      {/* LINHA 2 — leitura rapida: tendencia, comparacao e constancia */}
      <div className="ab-r1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Sparkline
          rotulo="Últimos 14 dias"
          valor={money0(dias14.reduce((a, d) => a + d.v, 0))}
          serie={dias14.map(d => d.v)}
          nota="lucro das metas fechadas no período"
          delay={0.18}
        />
        <Comparativo
          rotulo="Este mês"
          valor={money0(mesAtual)}
          anterior={mesPassado}
          rotuloAnterior="mes passado"
          delay={0.22}
        />
        <Sequencia
          rotulo="Constância"
          dias={dias10.map(d => d.v > 0)}
          nota="dias com meta fechada no positivo, nos ultimos 10"
          delay={0.26}
        />
      </div>

      {/* LINHA 3 — O MES INTEIRO DE UMA OLHADA.
          Largura total de proposito: sao 30 quadrados em fila, e espremido
          em uma coluna ele virava uma tira apertada que nao encaixava com
          o vizinho. Fica logo depois da leitura rapida porque responde a
          pergunta seguinte: "e ao longo do mes, como foi?" */}
      <Calor rotulo="Os últimos 30 dias" dias={dias30} delay={0.2} />

      {/* LINHA 4 — curva + depositado/sacado */}
      <div className="ab-r2" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.22 }}>
          <Card pad={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 16.5, fontWeight: 800, color: S.t1, margin: 0, letterSpacing: '-0.02em' }}>Resultado da semana</p>
                <p style={{ fontSize: 12.5, color: S.t3, margin: '3px 0 0' }}>lucro das metas fechadas por dia</p>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.t2, fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: RED }} />Lucro
              </span>
            </div>
            <div style={{ position: 'relative', marginTop: 30 }}>
              <svg viewBox={`0 0 ${W} ${H + 8}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
                {/* linha do zero: so aparece quando ha prejuizo na semana */}
                {temNegativo && (
                  <line x1="0" y1={yZero} x2={W} y2={yZero} stroke="var(--b2)" strokeWidth="1.5" strokeDasharray="5 5" />
                )}
                <path d={curva(pts)} fill="none" stroke={RED} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {serie.map((s, i) => s.v !== 0 && (
                  <span key={i} style={{ position: 'absolute', left: `${(i / 6) * 100}%`, top: `${(pts[i][1] / (H + 8)) * 100}%`, transform: 'translate(-50%,-150%)', background: 'var(--t1)', color: 'var(--surface)', fontFamily: MONO, fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>{money0(s.v)}</span>
                ))}
              </div>
              <div style={{ display: 'flex', marginTop: 14 }}>
                {serie.map((s, i) => <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11.5, color: S.t3, fontWeight: 600 }}>{s.label}</span>)}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div data-tour="kpis-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28 }}>
          <div style={{ height: '100%', borderRadius: 24, padding: 24, background: 'var(--profit-dim)', border: '1px solid var(--profit-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
              <Chip bg="var(--surface)"><Ico d={<path d="M3 17l6-6 4 4 8-8" />} c="var(--profit)" s={17} /></Chip>
              <p style={{ fontSize: 15.5, fontWeight: 800, color: S.t1, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>Movimento<br />da operação</p>
            </div>
            {[['Depositado', g?.totalDep || 0], ['Sacado', g?.totalSaq || 0], ['Custos', g?.custosTotal || 0]].map(([l, v], i) => {
              const maxM = Math.max(1, g?.totalDep || 0, g?.totalSaq || 0)
              return (
                <div key={l} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.t2 }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: S.t1, fontFamily: MONO }}>{money0(v)}</span>
                  </div>
                  <div style={{ height: 18, borderRadius: 9, background: 'var(--surface)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (v / maxM) * 100)}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                      style={{ height: '100%', borderRadius: 9, background: i === 2 ? 'var(--loss)' : 'var(--profit)' }} />
                  </div>
                </div>
              )
            })}
            <p style={{ fontSize: 11.5, color: S.t3, margin: '16px 0 0' }}>{int(agora.depositantes)} depositantes processados</p>
          </div>
        </motion.div>
      </div>

      {/* so aparece quando ha algo a olhar */}
      <Risco itens={alertas} delay={0.28} />

      {/* LINHA 5 — os dois cards de EQUIPE, lado a lado e do mesmo peso */}
      <div className="ab-par" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {melhorOp ? (
          <Destaque
            rotulo="Destaque da equipe"
            titulo={melhorOp.nome || melhorOp.email?.split('@')[0] || 'Operador'}
            valor={money0(melhorOp.lucroFinal)}
            avatar={String(melhorOp.nome || melhorOp.email || '?').slice(0, 2).toUpperCase()}
            // Os campos sao `metasFechadas` e `depositantesFinalizados` (veja o
            // ranking em app/admin/page.js). Estava lendo closedCount e
            // totalDepositantes, que nao existem nesse objeto: o card mostrava
            // "R$ 27.009" ao lado de "0 metas fechadas · 0 depositantes".
            nota={`${int(melhorOp.metasFechadas || 0)} metas fechadas · ${int(melhorOp.depositantesFinalizados || 0)} depositantes`}
            onClick={onVerMetas}
            delay={0.3}
          />
        ) : (
          <Destaque rotulo="Destaque da equipe" titulo="Ainda sem ranking" valor="R$ 0" nota="assim que a equipe fechar metas, o destaque aparece" delay={0.3} />
        )}
        <Podio rotulo="Pódio da equipe" itens={podio} delay={0.36} onAbrir={onVerMetas} />
      </div>

      {/* LINHA 6 — distribuicao por operador, largura total */}
      <div>
        <Barras
          titulo="Lucro por operador"
          dados={[...ranking].sort((a, b) => Number(b.lucroFinal || 0) - Number(a.lucroFinal || 0)).slice(0, 6).map(o => ({
            l: o.nome || o.email?.split("@")[0] || "Operador",
            v: Math.abs(Number(o.lucroFinal || 0)),
            txt: money0(o.lucroFinal),
            dot: Number(o.lucroFinal) >= 0 ? undefined : 'var(--loss)',
          }))}
          delay={0.4}
        />
      </div>

      {/* R$ POR CONTA, POR REDE — a comparação que decide onde operar.
          Só metas fechadas (lucro final ÷ depositantes), sem custos. */}
      {porContaRede.length > 0 && (
        <Barras
          titulo="Lucro por conta, por rede"
          sub="lucro final das metas fechadas ÷ depositantes · onde cada conta rende mais"
          dados={porContaRede.map(r => ({ l: `${r.l} · ${int(r.contas)} contas`, v: Math.abs(r.v), txt: money(r.v) + '/conta', dot: r.v >= 0 ? undefined : 'var(--loss)' }))}
          delay={0.42}
        />
      )}

      {/* LINHA 7 — roscas: concentracao de lucro e situacao das metas */}
      <div className="ab-par" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}>
          <Card pad={24}>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: S.t1, margin: '0 0 3px', letterSpacing: '-0.02em' }}>De onde sai o lucro</p>
            <p style={{ fontSize: 12.5, color: S.t3, margin: '0 0 20px' }}>lucro final por rede, metas fechadas</p>
            <Rosca dados={porRede} centro={money0(lucroRedes)} rotulo="no total" formata={money0} delay={0.34} />
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.36 }}>
          <Card pad={24}>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: S.t1, margin: '0 0 3px', letterSpacing: '-0.02em' }}>Situação das metas</p>
            <p style={{ fontSize: 12.5, color: S.t3, margin: '0 0 20px' }}>parada = aberta há mais de 15 dias</p>
            <Rosca dados={situacao} centro={int(abertas.length + fechadas.length)} rotulo="metas" formata={int} delay={0.4} />
          </Card>
        </motion.div>
      </div>

      {/* LINHA 8 — metas + ranking */}
      <div className="ab-r2" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.34 }}>
          <Card pad={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 16.5, fontWeight: 800, color: S.t1, margin: 0, letterSpacing: '-0.02em' }}>Metas em andamento</p>
              <button type="button" onClick={onVerMetas} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: RED }}>ver todas →</button>
            </div>
            {emAndamento.length === 0 && <p style={{ fontSize: 13, color: S.t3, margin: 0 }}>Nenhuma meta aberta. Crie a primeira no botão acima.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {emAndamento.map((m, i) => {
                const dias = m.criada ? Math.floor((Date.now() - new Date(m.criada).getTime()) / 86400000) : 0
                const parada = dias > 15
                return (
                  <motion.div key={m.id} onClick={() => onAbrirMeta && onAbrirMeta(m.id)}
                whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{ cursor: onAbrirMeta ? 'pointer' : 'default', borderRadius: 10, padding: '2px 4px', margin: '0 -4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: S.t1 }}>{m.rede}</span>
                        {m.op && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', background: 'var(--fill-1)', color: S.t2, border: '1px solid var(--b1)' }}>OP: {m.op.toUpperCase()}</span>}
                        {m.finalizada && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: 'rgba(229,57,31,0.08)', color: RED, border: '1px solid rgba(229,57,31,0.3)' }}>falta fechar</span>}
                        {parada && !m.finalizada && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: 'var(--loss-dim)', color: 'var(--loss)', border: '1px solid var(--loss-border)' }}>parada há {dias}d</span>}
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: S.t3, flexShrink: 0 }}>{int(m.feitas)}/{int(m.alvo)} contas</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: 'var(--fill-1)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
                        style={{ height: '100%', borderRadius: 4, background: parada && !m.finalizada ? 'var(--loss)' : `linear-gradient(90deg, ${RED2}, ${RED})` }} />
                    </div>
                    {m.n > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 5 }}>
                        <span style={{ fontSize: 11, color: S.t3 }}>{int(m.n)} remessa{m.n === 1 ? '' : 's'}</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: m.liq >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{money0(m.liq)}{m.feitas > 0 ? ` · ${money(m.porConta)}/conta` : ''}</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}>
          <Card pad={24}>
            <p style={{ fontSize: 16.5, fontWeight: 800, color: S.t1, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Ranking</p>
            {ranking.length === 0 && <p style={{ fontSize: 13, color: S.t3, margin: 0 }}>Sem operadores ainda.</p>}
            {ranking.slice(0, 5).map((op, i, a) => (
              <div key={op.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 0', borderBottom: i < a.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 800, color: i === 0 ? RED : S.t3, width: 14 }}>{i + 1}º</span>
                  <span style={{ width: 28, height: 28, borderRadius: 9, background: i === 0 ? RED : 'var(--fill-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: i === 0 ? '#fff' : S.t2, flexShrink: 0 }}>
                    {String(op.nome || op.email || '?')[0].toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.t1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.nome || op.email}</span>
                </div>
                <span style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ display: 'block', fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: op.lucroFinal >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{money0(op.lucroFinal)}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: S.t3 }}>{int(op.depositantesFinalizados || 0)} dep</span>
                </span>
              </div>
            ))}
          </Card>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1000px) { .ab-r1 { grid-template-columns: 1fr 1fr !important; } .ab-r2, .ab-par { grid-template-columns: 1fr !important; } .bk-tira { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .ab-r1 { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
