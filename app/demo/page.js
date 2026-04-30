'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DEMO_METAS, DEMO_REMESSAS, DEMO_COSTS, DEMO_INSIGHTS, DEMO_ACTIVITY,
  DEMO_OPERATORS, DEMO_OPERATOR_RANKING, DEMO_REDES_RANKING, DEMO_GLOBAL,
} from '../../lib/demo-data'
import Logo from '../../components/Logo'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const ease = [0.33, 1, 0.68, 1]
const relativeTime = iso => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  if (h < 24) return `${h}h`
  return `${d}d`
}

export default function DemoPage() {
  const [tab, setTab] = useState('dashboard')
  const [notif, setNotif] = useState(null)

  // Floating notification carrossel (simula remessa chegando)
  useEffect(() => {
    const msgs = [
      { op: 'Rafael Lima', rede: 'W1', val: 127.50, pos: true },
      { op: 'Juliana Costa', rede: 'OKOK', val: 45.20, pos: false },
      { op: 'Lucas Mendes', rede: 'VOY', val: 210.80, pos: true },
    ]
    let i = 0
    const show = () => {
      setNotif({ ...msgs[i % msgs.length], time: Date.now() })
      setTimeout(() => setNotif(null), 4500)
      i++
    }
    const t1 = setTimeout(show, 2000)
    const t2 = setInterval(show, 12000)
    return () => { clearTimeout(t1); clearInterval(t2) }
  }, [])

  // Chart synthetic daily revenue (30d)
  const chartData = (() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const base = 120 + Math.sin(i * 0.6) * 80 + (Math.random() * 60)
      days.push({ date: d.toISOString().slice(5, 10), value: Math.max(0, Math.round(base)) })
    }
    return days
  })()
  const maxChart = Math.max(...chartData.map(d => d.value), 1)

  const G = DEMO_GLOBAL

  return (
    <main style={{ minHeight: '100vh', position: 'relative', background: '#000000', paddingBottom: 80 }}>
      {/* ═══ Banner fixo de demo ═══ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.14), rgba(229,57,53,0.14))',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.22)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <motion.div
          animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,0.55)', '0 0 0 6px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0)'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.78)', flexShrink: 0 }}
        />
        <span style={{ fontSize: 12, color: '#FCD34D', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center' }}>
          Modo demonstração — dados simulados
        </span>
      </div>

      {/* ═══ Header ═══ */}
      <header style={{
        padding: '22px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <Logo size={1.2} />
        <Link href="/signup" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03, boxShadow: '0 6px 30px rgba(229,57,53,0.45)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(145deg, #e53935, #c62828)', color: 'white',
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(229,57,53,0.35)',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Criar conta grátis
          </motion.div>
        </Link>
      </header>

      {/* ═══ Tabs ═══ */}
      <div style={{
        padding: '16px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 38, zIndex: 30,
        background: 'rgba(4,7,14,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'operadores', label: 'Operadores' },
            { id: 'redes', label: 'Redes' },
            { id: 'faturamento', label: 'Faturamento' },
            { id: 'custos', label: 'Custos' },
            { id: 'metas', label: 'Metas' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                background: tab === t.id ? 'rgba(229,57,53,0.12)' : 'transparent',
                color: tab === t.id ? '#e53935' : '#94A3B8',
                border: tab === t.id ? '1px solid rgba(229,57,53,0.25)' : '1px solid transparent',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        <AnimatePresence mode="wait">
          {tab === 'dashboard' && <TabDashboard key="dash" G={G} chartData={chartData} maxChart={maxChart} />}
          {tab === 'operadores' && <TabOperadores key="ops" />}
          {tab === 'redes' && <TabRedes key="redes" />}
          {tab === 'faturamento' && <TabFaturamento key="fat" G={G} chartData={chartData} maxChart={maxChart} />}
          {tab === 'custos' && <TabCustos key="custos" />}
          {tab === 'metas' && <TabMetas key="metas" />}
        </AnimatePresence>

        {/* CTA inferior */}
        <CtaBottom />
      </div>

      {/* ═══ Floating notification ═══ */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.35, ease }}
            style={{
              position: 'fixed', bottom: 20, right: 20, zIndex: 50,
              padding: '14px 18px', borderRadius: 14, maxWidth: 300,
              background: 'rgba(12,18,32,0.92)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${notif.pos ? 'rgba(0,140,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${notif.pos ? 'rgba(0,140,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: notif.pos ? 'rgba(0,140,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${notif.pos ? 'rgba(0,140,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={notif.pos ? '#008C5E' : '#EF4444'} strokeWidth="2.5" strokeLinecap="round">
                {notif.pos
                  ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>}
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 2px', fontWeight: 600 }}>{notif.op} · {notif.rede}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: notif.pos ? '#008C5E' : '#EF4444', margin: 0, fontFamily: 'var(--mono)' }}>
                {notif.pos ? '+' : '−'}R$ {fmt(notif.val)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

/* ═══ Dashboard tab ═══ */
function TabDashboard({ G, chartData, maxChart }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
      {/* Lucro hero */}
      <HeroCard G={G} />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Kpi label="Metas ativas" value={G.ativas} color="rgba(255,255,255,0.78)" icon="target"/>
        <Kpi label="Fechadas" value={G.fechadas} color="#008C5E" icon="check"/>
        <Kpi label="Operadores" value={G.ops} color="rgba(255,255,255,0.78)" icon="users"/>
        <Kpi label="Remessas" value={G.totalRem} color="rgba(255,255,255,0.78)" icon="bolt"/>
      </div>

      {/* Chart */}
      <ChartCard chartData={chartData} maxChart={maxChart} />

      {/* Grid: Insights + Atividade */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 22 }}>
        <InsightsCard />
        <ActivityCard />
      </div>
    </motion.div>
  )
}

/* ═══ Operadores tab ═══ */
function TabOperadores() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
      <SectionTitle icon="users" title="Ranking de operadores" subtitle="Performance por operador — lucro final, taxa de vitória e evolução" />
      <div style={{ display: 'grid', gap: 12 }}>
        {DEMO_OPERATOR_RANKING.map((op, i) => (
          <motion.div key={op.id} {...fade(i)} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(145deg, #e53935, #c62828)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', margin: '0 0 3px' }}>{op.nome}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{op.metasFechadas} fechadas · {op.metasAtivas} ativas</span>
                  <span style={{ fontSize: 11, color: '#008C5E', fontWeight: 700 }}>{op.winRate}% vitória</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Lucro final</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: op.lucroFinal >= 0 ? '#008C5E' : '#EF4444', fontFamily: 'var(--mono)', margin: 0 }}>
                  R$ {fmt(op.lucroFinal)}
                </p>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge color="#008C5E" label={op.badge} />
              <Badge color="rgba(255,255,255,0.78)" label={`${op.totalDeposit} contas`} />
              <Badge color="rgba(255,255,255,0.78)" label={`R$ ${fmt(op.lucroPerConta)}/conta`} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══ Redes tab ═══ */
function TabRedes() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
      <SectionTitle icon="network" title="Ranking estratégico de redes" subtitle="Score por rentabilidade e consistência — recomendações automáticas" />
      <div style={{ display: 'grid', gap: 12 }}>
        {DEMO_REDES_RANKING.map((r, i) => (
          <motion.div key={r.rede} {...fade(i)} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--mono)' }}>
                {r.rede}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Rede {r.rede}</p>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: r.score >= 70 ? 'rgba(0,140,94,0.15)' : r.score >= 50 ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.15)', color: r.score >= 70 ? '#008C5E' : r.score >= 50 ? 'rgba(255,255,255,0.78)' : '#EF4444', fontWeight: 800 }}>
                    Score {r.score}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{r.metas} metas · {r.contas} contas</span>
                  <span style={{ fontSize: 11, color: '#008C5E', fontWeight: 700 }}>{r.winRate}% vitória</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Rentabilidade</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#008C5E', fontFamily: 'var(--mono)', margin: 0 }}>R$ {fmt(r.lucroFinal)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══ Faturamento tab ═══ */
function TabFaturamento({ G, chartData, maxChart }) {
  const totalPeriodo = chartData.reduce((a, d) => a + d.value, 0)
  const media = totalPeriodo / chartData.length
  const melhor = Math.max(...chartData.map(d => d.value))
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
      <SectionTitle icon="chart" title="Faturamento" subtitle="Receita, evolução e previsão — últimos 30 dias" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Kpi label="Receita 30d" value={`R$ ${fmt(totalPeriodo)}`} color="#008C5E" icon="money" big/>
        <Kpi label="Média diária" value={`R$ ${fmt(media)}`} color="rgba(255,255,255,0.78)" icon="chart"/>
        <Kpi label="Melhor dia" value={`R$ ${fmt(melhor)}`} color="rgba(255,255,255,0.78)" icon="trophy"/>
        <Kpi label="Lucro líquido" value={`R$ ${fmt(G.lucroFinalTotal)}`} color="#008C5E" icon="money"/>
      </div>
      <ChartCard chartData={chartData} maxChart={maxChart} />
    </motion.div>
  )
}

/* ═══ Custos tab ═══ */
function TabCustos() {
  const byType = {}
  DEMO_COSTS.forEach(c => {
    if (!byType[c.type]) byType[c.type] = 0
    byType[c.type] += Number(c.amount || 0)
  })
  const total = Object.values(byType).reduce((a, b) => a + b, 0)
  const types = Object.entries(byType).sort((a, b) => b[1] - a[1])
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
      <SectionTitle icon="money" title="Custos operacionais" subtitle="Proxy, SMS, VPS, bot e outros — distribuição por tipo" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Kpi label="Total no mês" value={`R$ ${fmt(total)}`} color="#EF4444" icon="money" big/>
        <Kpi label="Tipos ativos" value={types.length} color="rgba(255,255,255,0.78)" icon="layers"/>
        <Kpi label="Média/tipo" value={`R$ ${fmt(total/Math.max(types.length,1))}`} color="rgba(255,255,255,0.78)" icon="chart"/>
      </div>
      <div style={{ ...cardStyle, padding: 22 }}>
        <p style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 16px' }}>Distribuição por tipo</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {types.map(([type, amount], i) => {
            const pct = total > 0 ? (amount / total) * 100 : 0
            return (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', textTransform: 'capitalize' }}>{type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--mono)' }}>R$ {fmt(amount)}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(239,68,68,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.12, ease }}
                    style={{ height: '100%', background: '#EF4444', borderRadius: 3 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══ Metas tab ═══ */
function TabMetas() {
  const metasWithOp = DEMO_METAS.map(m => ({
    ...m,
    operador: DEMO_OPERATORS.find(o => o.id === m.operator_id),
    remessas: DEMO_REMESSAS.filter(r => r.meta_id === m.id).length,
  }))
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
      <SectionTitle icon="target" title="Metas operacionais" subtitle="Status, progresso e lucro de cada meta da operação" />
      <div style={{ display: 'grid', gap: 12 }}>
        {metasWithOp.map((m, i) => {
          const isClosed = m.status_fechamento === 'fechada'
          return (
            <motion.div key={m.id} {...fade(i)} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isClosed ? 'rgba(0,140,94,0.12)' : 'rgba(255,255,255,0.12)', border: `1px solid ${isClosed ? 'rgba(0,140,94,0.3)' : 'rgba(255,255,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={isClosed ? '#008C5E' : 'rgba(255,255,255,0.78)'} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', margin: '0 0 3px' }}>{m.titulo}</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.operador?.nome}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>·</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.remessas} remessas</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <Badge color={isClosed ? '#008C5E' : 'rgba(255,255,255,0.78)'} label={isClosed ? 'Fechada' : 'Ativa'} />
                  {isClosed && m.lucro_final != null && (
                    <span style={{ fontSize: 14, fontWeight: 800, color: m.lucro_final >= 0 ? '#008C5E' : '#EF4444', fontFamily: 'var(--mono)' }}>
                      R$ {fmt(m.lucro_final)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ═══ Componentes reutilizáveis ═══ */

function HeroCard({ G }) {
  const receita = G.lucroFinalTotal + G.custosTotal
  return (
    <motion.div {...fade(0)} style={{ ...cardStyle, padding: 28, marginBottom: 18, background: 'linear-gradient(145deg, rgba(0,140,94,0.06), rgba(229,57,53,0.04))', border: '1px solid rgba(0,140,94,0.15)' }}>
      <p style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 8px' }}>
        Lucro acumulado da operação
      </p>
      <p style={{ fontSize: 42, fontWeight: 900, color: G.lucroFinalTotal >= 0 ? '#008C5E' : '#EF4444', fontFamily: 'var(--mono)', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1 }}>
        R$ {fmt(G.lucroFinalTotal)}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { l: 'Depósitos', v: G.totalDep, c: 'rgba(255,255,255,0.78)' },
          { l: 'Saques', v: G.totalSaq, c: 'rgba(255,255,255,0.78)' },
          { l: 'Custos', v: G.custosTotal, c: '#EF4444' },
          { l: 'Contas', v: G.totalContas, c: 'rgba(255,255,255,0.78)', raw: true },
        ].map(x => (
          <div key={x.l} style={{ padding: '10px 12px', background: 'rgba(4,7,14,0.4)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 3px' }}>{x.l}</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: x.c, fontFamily: 'var(--mono)', margin: 0 }}>
              {x.raw ? x.v : `R$ ${fmt(x.v)}`}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ChartCard({ chartData, maxChart }) {
  return (
    <motion.div {...fade(1)} style={{ ...cardStyle, padding: 22, marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Receita diária</p>
        <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Últimos 30 dias</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130 }}>
        {chartData.map((d, i) => {
          const h = (d.value / maxChart) * 120
          return (
            <motion.div
              key={d.date}
              initial={{ height: 0 }}
              animate={{ height: Math.max(h, 2) }}
              transition={{ duration: 0.6, delay: i * 0.02, ease }}
              style={{ flex: 1, background: 'linear-gradient(180deg, #008C5E, rgba(0,140,94,0.25))', borderRadius: 2, minWidth: 4, position: 'relative' }}
              title={`${d.date}: R$ ${fmt(d.value)}`}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'var(--mono)' }}>{chartData[0].date}</span>
        <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'var(--mono)' }}>{chartData[chartData.length - 1].date}</span>
      </div>
    </motion.div>
  )
}

function InsightsCard() {
  return (
    <motion.div {...fade(2)} style={{ ...cardStyle, padding: 22 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
        Inteligência da operação
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEMO_INSIGHTS.slice(0, 5).map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ins.type === 'profit' ? '#008C5E' : ins.type === 'critical' ? '#EF4444' : 'rgba(255,255,255,0.78)', flexShrink: 0, marginTop: 6 }}/>
            <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>{ins.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ActivityCard() {
  return (
    <motion.div {...fade(3)} style={{ ...cardStyle, padding: 22 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div
          animate={{ boxShadow: ['0 0 0 0 rgba(0,140,94,0)', '0 0 0 4px rgba(0,140,94,0.2)', '0 0 0 0 rgba(0,140,94,0)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#008C5E' }}
        />
        Atividade recente
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEMO_ACTIVITY.slice(0, 5).map((a, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, flex: 1 }}>{a.text}</p>
            <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'var(--mono)', flexShrink: 0 }}>{relativeTime(a.at)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function Kpi({ label, value, color, big }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      style={{ ...cardStyle, padding: 18 }}
    >
      <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: big ? 22 : 20, fontWeight: 800, color, fontFamily: 'var(--mono)', margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
    </motion.div>
  )
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{subtitle}</p>
    </div>
  )
}

function Badge({ color, label }) {
  return (
    <span style={{
      fontSize: 10, padding: '3px 9px', borderRadius: 6,
      background: `${color}20`, color, fontWeight: 700,
      border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  )
}

function CtaBottom() {
  return (
    <motion.div
      {...fade(5)}
      style={{
        ...cardStyle,
        padding: '36px 28px', marginTop: 28, textAlign: 'center',
        background: 'linear-gradient(145deg, rgba(229,57,53,0.08), rgba(229,57,53,0.02))',
        border: '1px solid rgba(229,57,53,0.2)',
      }}
    >
      <h3 style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        Pronto para operar de verdade?
      </h3>
      <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 22px' }}>
        Crie sua conta agora e tenha essa visão em tempo real da sua operação.
      </p>
      <Link href="/signup" style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(229,57,53,0.5)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700,
            background: 'linear-gradient(145deg, #e53935, #c62828)', color: 'white',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(229,57,53,0.4)',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Começar agora — 3 dias grátis
        </motion.div>
      </Link>
    </motion.div>
  )
}

/* ═══ Styles ═══ */
const cardStyle = {
  padding: 18, borderRadius: 16,
  background: 'rgba(12,18,32,0.65)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
}

const fade = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.06, ease },
})
