'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = v => Number(v || 0).toLocaleString('pt-BR')
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: base + i * 0.06, ease } })

function CountUp({ value, prefix = '', suffix = '', duration = 1200, formatter = fmt }) {
  const [d, setD] = useState('0')
  const ref = useRef(null)
  useEffect(() => {
    const n = Math.abs(Number(value || 0)), s = performance.now()
    const tick = now => {
      const p = Math.min((now - s) / duration, 1)
      setD(formatter(n * (1 - Math.pow(1 - p, 3))))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <span>{prefix}{d}{suffix}</span>
}

function CountUpInt({ value, prefix = '', suffix = '', duration = 1000 }) {
  return <CountUp value={value} prefix={prefix} suffix={suffix} duration={duration} formatter={v => fmtInt(Math.round(v))} />
}

export default function OwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [chartRange, setChartRange] = useState(30)
  const [hoveredBar, setHoveredBar] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u || u.email !== OWNER) { router.push('/admin'); return }
      const res = await fetch('/api/owner/stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email }),
      })
      if (!res.ok) { router.push('/admin'); return }
      setData(await res.json())
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04070e' }}>
      <div className="spinner" style={{ width: 24, height: 24, borderTopColor: '#e53935' }} />
    </main>
  )
  if (!data) return null

  const { kpis, funnel, activity, adminStats, alerts, revenueByDay } = data

  // Funnel steps with conversion
  const funnelSteps = [
    { l: 'Contas criadas', v: funnel.registered, pct: 100 },
    { l: 'Com meta', v: funnel.withMeta, pct: funnel.registered > 0 ? Math.round(funnel.withMeta / funnel.registered * 100) : 0 },
    { l: 'Com remessa', v: funnel.withRemessa, pct: funnel.registered > 0 ? Math.round(funnel.withRemessa / funnel.registered * 100) : 0 },
    { l: 'Assinantes', v: funnel.withSub, pct: funnel.registered > 0 ? Math.round(funnel.withSub / funnel.registered * 100) : 0 },
  ]

  // Conversion between stages
  const funnelConversions = []
  let biggestDropIdx = -1, biggestDropVal = 0
  for (let i = 1; i < funnelSteps.length; i++) {
    const prev = funnelSteps[i - 1].v
    const curr = funnelSteps[i].v
    const conv = prev > 0 ? Math.round((curr / prev) * 100) : 0
    const drop = funnelSteps[i - 1].pct - funnelSteps[i].pct
    funnelConversions.push(conv)
    if (drop > biggestDropVal) { biggestDropVal = drop; biggestDropIdx = i }
  }

  // Chart data
  const chartData = chartRange === 7 ? (revenueByDay || []).slice(-7) : (revenueByDay || [])
  const maxChart = Math.max(...chartData.map(d => d.value), 1)

  // Variation badge
  const variation = kpis.revenueVariation || 0
  const variationUp = variation >= 0

  const card = {
    padding: '28px', borderRadius: 16,
    background: 'linear-gradient(145deg, #0c1424, #080e1a)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }

  const hoverCard = {
    ...card,
    cursor: 'default',
  }

  const nowDate = new Date()
  const dateStr = nowDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main style={{ minHeight: '100vh', background: '#04070e', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 28px 80px' }}>

        {/* ═══ 1. HEADER ═══ */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
                NexControl <span style={{ color: '#64748B', fontWeight: 400, fontSize: 18 }}> -- </span> <span style={{ fontWeight: 500, fontSize: 20, color: '#94A3B8' }}>Painel do Dono</span>
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, textTransform: 'capitalize' }}>{dateStr}</p>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              style={{ fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.12)' }}
              onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.06)' }}
            >
              Sair
            </button>
          </div>
        </motion.div>

        {/* ═══ 2. HERO — RECEITA TOTAL ═══ */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 16 }}>
          <div style={{ ...card, position: 'relative', overflow: 'hidden', padding: '36px 36px 32px' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '5%', width: 500, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.07), transparent 60%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Receita total acumulada</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 48, fontWeight: 900, color: '#22C55E', lineHeight: 1, letterSpacing: '-0.03em', margin: 0, textShadow: '0 0 50px rgba(34,197,94,0.15)' }}>
                  <CountUp value={kpis.totalRevenue} prefix="R$ " />
                </p>
                {variation !== 0 && (
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
                    background: variationUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: variationUp ? '#22C55E' : '#EF4444',
                    border: `1px solid ${variationUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
                  }}>
                    {variationUp ? '\u2191' : '\u2193'} {variationUp ? '+' : ''}{variation}% vs 7d ant.
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sub-cards: Receita hoje | Receita do mes | MRR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { l: 'Receita hoje', v: kpis.revenueToday, color: kpis.revenueToday > 0 ? '#22C55E' : '#94A3B8' },
            { l: 'Receita do mes', v: kpis.revenueMonth, color: '#F1F5F9' },
            { l: 'MRR estimado', v: kpis.mrr, color: '#22C55E' },
          ].map((item, i) => (
            <motion.div key={i} {...fadeUp(i, 0.12)} style={{ ...card, padding: '22px 26px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = card.boxShadow }}
            >
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.l}</p>
              <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 26, fontWeight: 800, color: item.color, margin: 0, lineHeight: 1 }}>
                <CountUp value={item.v} prefix="R$ " />
              </p>
              {i === 2 && (
                <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0' }}>{kpis.activeSubs} assinatura{kpis.activeSubs !== 1 ? 's' : ''} ativa{kpis.activeSubs !== 1 ? 's' : ''}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ═══ 3. FUNNEL ═══ */}
        <motion.div {...fadeUp(0, 0.2)} style={{ ...card, marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: '0 0 24px' }}>Funil de conversao</h3>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {funnelSteps.map((step, i) => {
              const isBiggestDrop = i === biggestDropIdx
              const widthPct = Math.max(step.pct, 12)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Bar */}
                  <div style={{
                    width: `${widthPct}%`, minWidth: 48, height: 64, borderRadius: 10,
                    background: isBiggestDrop
                      ? 'linear-gradient(180deg, rgba(239,68,68,0.25), rgba(239,68,68,0.08))'
                      : step.pct >= 60
                        ? 'linear-gradient(180deg, rgba(34,197,94,0.25), rgba(34,197,94,0.08))'
                        : step.pct >= 30
                          ? 'linear-gradient(180deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))'
                          : 'linear-gradient(180deg, rgba(239,68,68,0.25), rgba(239,68,68,0.08))',
                    border: `1px solid ${isBiggestDrop ? 'rgba(239,68,68,0.2)' : step.pct >= 60 ? 'rgba(34,197,94,0.15)' : step.pct >= 30 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.4s ease',
                  }}>
                    <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 20, fontWeight: 800, color: '#F1F5F9' }}>{step.v}</span>
                  </div>
                  {/* Label */}
                  <p style={{ fontSize: 11, color: isBiggestDrop ? '#EF4444' : '#94A3B8', margin: '10px 0 4px', fontWeight: isBiggestDrop ? 700 : 500, textAlign: 'center' }}>{step.l}</p>
                  <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 12, color: '#64748B', margin: 0 }}>{step.pct}%</p>
                  {/* Conversion arrow between stages */}
                  {i < funnelSteps.length - 1 && (
                    <div style={{ position: 'absolute', right: -12, top: 20, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'var(--mono, "JetBrains Mono", monospace)' }}>{funnelConversions[i]}%</span>
                      <svg width={14} height={10} viewBox="0 0 14 10" fill="none"><path d="M0 5h10M10 5l-3-3M10 5l-3 3" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {biggestDropIdx > 0 && (
            <div style={{ marginTop: 18, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <p style={{ fontSize: 11, color: '#EF4444', margin: 0 }}>
                Maior queda: "{funnelSteps[biggestDropIdx].l}" (-{biggestDropVal}pp)
              </p>
            </div>
          )}
        </motion.div>

        {/* ═══ 4. CHART — Receita 30 dias ═══ */}
        <motion.div {...fadeUp(1, 0.2)} style={{ ...card, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Receita diaria</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30].map(r => (
                <button key={r} onClick={() => setChartRange(r)} style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  border: chartRange === r ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  background: chartRange === r ? 'rgba(34,197,94,0.1)' : 'transparent',
                  color: chartRange === r ? '#22C55E' : '#64748B',
                  transition: 'all 0.2s',
                }}>{r}d</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: chartRange === 7 ? 8 : 3, height: 160, position: 'relative' }}>
            {chartData.map((day, i) => {
              const h = maxChart > 0 ? Math.max((day.value / maxChart) * 140, day.value > 0 ? 4 : 1) : 1
              const isHovered = hoveredBar === i
              return (
                <div
                  key={day.date}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: h + 8, left: '50%', transform: 'translateX(-50)',
                      background: '#0c1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                      padding: '4px 8px', whiteSpace: 'nowrap', zIndex: 10,
                    }}>
                      <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 2px' }}>{day.date.slice(5)}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', margin: 0, fontFamily: 'var(--mono, "JetBrains Mono", monospace)' }}>R$ {fmt(day.value)}</p>
                    </div>
                  )}
                  <div style={{
                    width: '100%', maxWidth: chartRange === 7 ? 48 : 20, height: h, borderRadius: 3,
                    background: isHovered ? '#22C55E' : day.value > 0 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.04)',
                    transition: 'all 0.15s ease',
                  }} />
                </div>
              )
            })}
          </div>
          {/* X-axis labels (show every few days) */}
          <div style={{ display: 'flex', gap: chartRange === 7 ? 8 : 3, marginTop: 8 }}>
            {chartData.map((day, i) => {
              const show = chartRange === 7 || i % 5 === 0 || i === chartData.length - 1
              return (
                <div key={day.date} style={{ flex: 1, textAlign: 'center' }}>
                  {show && <span style={{ fontSize: 9, color: '#64748B' }}>{day.date.slice(5)}</span>}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ═══ 5. ADMIN RANKING ═══ */}
        <motion.div {...fadeUp(0, 0.3)} style={{ ...card, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Ranking de admins</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Top 8 por metas</span>
              <button
                onClick={() => router.push('/owner/admins')}
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94A3B8', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = '#F1F5F9' }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = '#94A3B8' }}
              >
                Ver todos
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['#', 'Admin', 'Metas', 'Ops', 'Plano', 'Atividade'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminStats.slice(0, 8).map((a, i) => {
                  const planColors = { PRO: { bg: 'rgba(34,197,94,0.08)', color: '#22C55E', border: 'rgba(34,197,94,0.2)' }, TRIAL: { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: 'rgba(245,158,11,0.2)' }, FREE: { bg: 'rgba(100,116,139,0.08)', color: '#64748B', border: 'rgba(100,116,139,0.2)' } }
                  const plan = planColors[a.planStatus] || planColors.FREE
                  const days = a.daysSinceActivity
                  const activityDot = days <= 1 ? '#22C55E' : days <= 7 ? '#F59E0B' : '#EF4444'
                  const relTime = !a.lastActivity ? 'nunca' : days === 0 ? 'hoje' : days === 1 ? 'ha 1 dia' : days < 30 ? `ha ${days} dias` : `ha ${Math.floor(days / 30)}m`
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontWeight: 700, color: i < 3 ? '#22C55E' : '#64748B', fontSize: 13 }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: i < 3 ? 'rgba(34,197,94,0.1)' : '#0c1424', border: `1px solid ${i < 3 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? '#22C55E' : '#94A3B8' }}>{(a.name || a.email)[0].toUpperCase()}</span>
                            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: activityDot, border: '2px solid #0c1424' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{a.name || a.email.split('@')[0]}</p>
                            <p style={{ fontSize: 10, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>{a.metas}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{a.operators}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
                          background: plan.bg, color: plan.color, border: `1px solid ${plan.border}`,
                        }}>
                          {a.planStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: days <= 1 ? '#22C55E' : days <= 7 ? '#94A3B8' : '#64748B' }}>{relTime}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ═══ 6. ALERTS ═══ */}
        <motion.div {...fadeUp(1, 0.3)} style={{ ...card, marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: '0 0 20px' }}>Alertas</h3>
          {alerts.length === 0 ? (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Nenhum alerta ativo</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {alerts.map((al, i) => {
                const isCrit = al.type === 'critical'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12,
                    background: isCrit ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                    border: `1px solid ${isCrit ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'}`,
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isCrit ? '#EF4444' : '#F59E0B'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isCrit ? '#EF4444' : '#F59E0B' }}>
                        {isCrit ? 'Critico' : 'Atencao'}
                      </span>
                      <p style={{ fontSize: 12, color: isCrit ? '#FCA5A5' : '#FCD34D', margin: '4px 0 0', lineHeight: 1.5 }}>{al.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ═══ 7. QUICK STATS ═══ */}
        <motion.div {...fadeUp(0, 0.4)}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Numeros gerais</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Total admins', v: kpis.totalAdmins, accent: '#F1F5F9' },
              { l: 'Total operadores', v: kpis.totalOperators, accent: '#F1F5F9' },
              { l: 'Total metas', v: kpis.totalMetas, accent: '#22C55E' },
              { l: 'Total remessas', v: kpis.totalRemessas, accent: '#22C55E' },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp(i, 0.45)} style={{ ...card, padding: '20px 24px', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = card.boxShadow }}
              >
                <p style={{ fontSize: 11, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.l}</p>
                <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 28, fontWeight: 800, color: item.accent, margin: 0, lineHeight: 1 }}>
                  <CountUpInt value={item.v} />
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </main>
  )
}
