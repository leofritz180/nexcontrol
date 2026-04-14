'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import OnlineCounter from '../../components/OnlineCounter'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = v => Number(v || 0).toLocaleString('pt-BR')
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: base + i * 0.07, ease } })

function relativeTime(dateStr) {
  if (!dateStr) return 'nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `ha ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `ha ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ha 1 dia'
  if (days < 30) return `ha ${days} dias`
  return `ha ${Math.floor(days / 30)}m`
}

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

/* ── Mini Sparkline ── */
function MiniSparkline({ data, color = '#22C55E', w = 140, h = 36 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) + 2}`).join(' ')
  const area = pts + ` ${w},${h} 0,${h}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id="spkG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={area} fill="url(#spkG)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={Number(pts.split(' ').pop().split(',')[1])} r="2.5" fill={color} />
    </svg>
  )
}

export default function OwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [userId, setUserId] = useState(null)
  const [chartRange, setChartRange] = useState(30)
  const [hoveredBar, setHoveredBar] = useState(null)
  const [adminSearch, setAdminSearch] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u || u.email !== OWNER) { router.push('/admin'); return }
      setUserId(u.id)
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
  const variation = kpis.revenueVariation || 0
  const variationUp = variation >= 0
  const chartData = chartRange === 7 ? (revenueByDay || []).slice(-7) : (revenueByDay || [])
  const maxChart = Math.max(...chartData.map(d => d.value), 1)
  const sparkValues = (revenueByDay || []).map(d => d.value)

  // Funnel
  const funnelSteps = [
    { l: 'Contas', v: funnel.registered, pct: 100, icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { l: 'Com meta', v: funnel.withMeta, pct: funnel.registered > 0 ? Math.round(funnel.withMeta / funnel.registered * 100) : 0, icon: 'M12 2L2 7l10 5 10-5-10-5z' },
    { l: 'Com remessa', v: funnel.withRemessa, pct: funnel.registered > 0 ? Math.round(funnel.withRemessa / funnel.registered * 100) : 0, icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    { l: 'Assinantes', v: funnel.withSub, pct: funnel.registered > 0 ? Math.round(funnel.withSub / funnel.registered * 100) : 0, icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  ]
  const funnelConversions = []
  let biggestDropIdx = -1, biggestDropVal = 0
  for (let i = 1; i < funnelSteps.length; i++) {
    const conv = funnelSteps[i - 1].v > 0 ? Math.round((funnelSteps[i].v / funnelSteps[i - 1].v) * 100) : 0
    const drop = funnelSteps[i - 1].pct - funnelSteps[i].pct
    funnelConversions.push(conv)
    if (drop > biggestDropVal) { biggestDropVal = drop; biggestDropIdx = i }
  }

  // Global movimentacao
  const globalDep = adminStats.reduce((a, s) => a + Number(s.totalDep || 0), 0)
  const globalSaq = adminStats.reduce((a, s) => a + Number(s.totalSaq || 0), 0)
  const globalLiq = globalDep - globalSaq

  // ── Operation health status ──
  const inactiveAdmins = adminStats.filter(a => a.daysSinceActivity > 7).length
  const convRate = kpis.totalAdmins > 0 ? Math.round((funnel.withSub / kpis.totalAdmins) * 100) : 0
  const metaConvPct = funnel.registered > 0 ? Math.round((funnel.withMeta / funnel.registered) * 100) : 0
  const activeRate = kpis.totalAdmins > 0 ? Math.round(((kpis.totalAdmins - inactiveAdmins) / kpis.totalAdmins) * 100) : 0

  const opHealth = (() => {
    let score = 50
    if (variation > 10) score += 20; else if (variation > 0) score += 10; else if (variation < -10) score -= 20; else if (variation < 0) score -= 10
    if (convRate >= 30) score += 15; else if (convRate < 10) score -= 15
    if (activeRate >= 70) score += 10; else if (activeRate < 40) score -= 15
    if (kpis.revenueToday > 0) score += 5
    score = Math.max(0, Math.min(100, score))
    if (score >= 65) return { status: 'Saudavel', color: '#22C55E', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', text: 'Sua operacao esta saudavel, com crescimento consistente.' }
    if (score >= 40) return { status: 'Atencao', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', text: 'Atencao: alguns indicadores precisam de melhoria.' }
    return { status: 'Critica', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', text: 'Situacao critica: queda na conversao e atividade abaixo do ideal.' }
  })()

  // ── Intelligence insights ──
  const insights = []
  if (convRate < 20) insights.push({ text: `Taxa de conversao em ${convRate}% — abaixo do esperado`, type: 'warn' })
  if (inactiveAdmins > 2) insights.push({ text: `${inactiveAdmins} admins inativos ha mais de 7 dias`, type: 'warn' })
  const topAdmin = adminStats[0]
  if (topAdmin && topAdmin.metas > 0) {
    const topPct = kpis.totalMetas > 0 ? Math.round((topAdmin.metas / kpis.totalMetas) * 100) : 0
    if (topPct > 50) insights.push({ text: `Receita concentrada: ${topAdmin.name || topAdmin.email.split('@')[0]} tem ${topPct}% das metas`, type: 'warn' })
  }
  if (variation < -10) insights.push({ text: `Crescimento desacelerando: ${variation}% vs semana anterior`, type: 'critical' })
  if (variation > 15) insights.push({ text: `Crescimento forte: +${variation}% vs semana anterior`, type: 'profit' })
  if (kpis.revenueToday > 0) insights.push({ text: `Receita registrada hoje: R$ ${fmt(kpis.revenueToday)}`, type: 'profit' })

  // ── "O que esta acontecendo agora" ──
  const happeningNow = []
  // Principal problema
  if (metaConvPct < 50 && funnel.registered > 5) happeningNow.push({ label: 'Principal problema', text: `Baixa conversao de contas para metas (${metaConvPct}%)`, type: 'warn', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' })
  // Maior oportunidade
  if (inactiveAdmins > 0) {
    const potentialRev = Math.round(inactiveAdmins * (kpis.avgTicket || 39.9) * 0.3)
    happeningNow.push({ label: 'Maior oportunidade', text: `Reativar ${inactiveAdmins} admins pode gerar +R$ ${fmt(potentialRev)}/mes`, type: 'profit', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' })
  }
  // Tendencia
  if (variation !== 0) happeningNow.push({ label: 'Tendencia', text: `${variationUp ? 'Crescimento' : 'Queda'} de ${variationUp ? '+' : ''}${variation}% vs ultimos 7 dias`, type: variationUp ? 'profit' : 'critical', icon: variationUp ? 'M23 6l-9.5 9.5-5-5L1 18' : 'M23 18l-9.5-9.5-5 5L1 6' })

  // ── Prediction (7 days) ──
  const avgDailyRev = sparkValues.length > 0 ? sparkValues.reduce((a, v) => a + v, 0) / sparkValues.length : 0
  const last7Avg = sparkValues.length >= 7 ? sparkValues.slice(-7).reduce((a, v) => a + v, 0) / 7 : avgDailyRev
  const predicted7d = last7Avg * 7
  const optimistic7d = predicted7d * (1 + Math.max(variation, 10) / 100)

  // ── Actions with priority ──
  const actions = []
  if (inactiveAdmins > 0) actions.push({ text: `Reativar ${inactiveAdmins} admin${inactiveAdmins > 1 ? 's' : ''} inativo${inactiveAdmins > 1 ? 's' : ''}`, impact: 'Alto', priority: 1 })
  if (funnel.withMeta < funnel.registered * 0.5) actions.push({ text: 'Incentivar criacao de metas — muitos admins sem meta', impact: 'Alto', priority: 2 })
  if (convRate < 30) actions.push({ text: 'Melhorar funil de conversao — poucos assinantes', impact: 'Medio', priority: 3 })
  if (kpis.churnRate > 10) actions.push({ text: `Reduzir churn (${kpis.churnRate}%) — investigar cancelamentos`, impact: 'Medio', priority: 4 })

  const card = {
    borderRadius: 18,
    background: 'linear-gradient(145deg, #0c1424, #080e1a)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
  }

  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main style={{ minHeight: '100vh', background: '#04070e', position: 'relative', zIndex: 1 }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', top: '-10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.03), transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 28px 80px' }}>

        {/* ═══ HEADER ═══ */}
        <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
              Centro de Comando
            </h1>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, textTransform: 'capitalize' }}>{dateStr}</p>
          </div>
          <button onClick={() => router.push('/admin')}
            style={{ fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#94A3B8', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = '#F1F5F9' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = '#94A3B8' }}
          >Voltar ao painel</button>
        </motion.div>

        {/* ═══ OPERATION HEALTH STATUS ═══ */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 20 }}>
          <div style={{ ...card, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderColor: opHealth.border, background: opHealth.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <motion.div
                animate={{ boxShadow: [`0 0 0 0 ${opHealth.color}00`, `0 0 0 8px ${opHealth.color}20`, `0 0 0 0 ${opHealth.color}00`] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 12, height: 12, borderRadius: '50%', background: opHealth.color, flexShrink: 0 }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: opHealth.color, margin: '0 0 2px' }}>Estado da operacao: {opHealth.status}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{opHealth.text}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, color: '#64748B' }}>
              <span>{activeRate}% ativos</span>
              <span>{convRate}% conversao</span>
              <span>{variationUp ? '+' : ''}{variation}% receita</span>
            </div>
          </div>
        </motion.div>

        {/* ═══ ONLINE COUNTER CARD ═══ */}
        <div style={{ marginBottom: 20 }}>
          <OnlineCounter userId={userId} variant="card" />
        </div>

        {/* ═══ LEVEL 1: HERO ═══ */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 16 }}>
          <div style={{ ...card, position: 'relative', overflow: 'hidden', padding: '36px 36px 28px' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '5%', width: 500, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 60%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.08), transparent)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, margin: 0 }}>Receita total acumulada</p>
                    {variation !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: variationUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: variationUp ? '#22C55E' : '#EF4444', border: `1px solid ${variationUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, fontFamily: 'var(--mono)' }}>
                        {variationUp ? '+' : ''}{variation}%
                      </span>
                    )}
                  </div>
                  <motion.p
                    animate={{ textShadow: ['0 0 30px rgba(34,197,94,0.1)', '0 0 60px rgba(34,197,94,0.2)', '0 0 30px rgba(34,197,94,0.1)'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontFamily: 'var(--mono)', fontSize: 48, fontWeight: 900, color: '#22C55E', lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 12px' }}
                  >
                    <CountUp value={kpis.totalRevenue} prefix="R$ " />
                  </motion.p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, background: variationUp ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', color: variationUp ? '#4ade80' : '#fca5a5' }}>
                    {variationUp ? 'Operacao em crescimento' : 'Atencao na queda'}
                  </span>
                </div>
                {/* Mini sparkline */}
                <div style={{ flexShrink: 0, paddingTop: 20 }}>
                  <MiniSparkline data={sparkValues} w={160} h={50} />
                  <p style={{ fontSize: 9, color: '#64748B', margin: '6px 0 0', textAlign: 'right' }}>Ultimos 30 dias</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sub-KPIs */}
        <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { l: 'Receita hoje', v: kpis.revenueToday, c: kpis.revenueToday > 0 ? '#22C55E' : '#64748B' },
            { l: 'Receita do mes', v: kpis.revenueMonth, c: '#F1F5F9' },
            { l: 'MRR estimado', v: kpis.mrr, c: '#22C55E', sub: `${kpis.activeSubs} assinatura${kpis.activeSubs !== 1 ? 's' : ''}` },
            { l: 'Ticket medio', v: kpis.avgTicket || 0, c: '#F1F5F9' },
          ].map((item, i) => (
            <motion.div key={i} {...fadeUp(i, 0.12)} style={{ ...card, padding: '20px 22px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = card.boxShadow }}
            >
              <p style={{ fontSize: 10, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.l}</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: item.c, margin: 0, lineHeight: 1 }}><CountUp value={item.v} prefix="R$ " /></p>
              {item.sub && <p style={{ fontSize: 10, color: '#64748B', margin: '6px 0 0' }}>{item.sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* ═══ "O QUE ESTA ACONTECENDO AGORA" + PREVISAO ═══ */}
        <div className="g-side" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Happening now */}
          {happeningNow.length > 0 && (
            <motion.div {...fadeUp(0, 0.15)} style={{ ...card, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                O que esta acontecendo agora
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {happeningNow.map((h, i) => {
                  const colors = { profit: '#22C55E', warn: '#F59E0B', critical: '#EF4444' }
                  const c = colors[h.type] || '#3b82f6'
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.2 + i * 0.1 }}
                      style={{ padding: '12px 14px', borderRadius: 12, background: `${c}08`, border: `1px solid ${c}18`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d={h.icon} /></svg>
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{h.label}</p>
                        <p style={{ fontSize: 12, color: '#F1F5F9', margin: 0, lineHeight: 1.4 }}>{h.text}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Previsao 7 dias */}
          <motion.div {...fadeUp(1, 0.2)} style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              Previsao (7 dias)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 6px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>Cenario atual</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: '#22C55E', margin: 0 }}>+R$ <CountUp value={predicted7d} /></p>
                <p style={{ fontSize: 10, color: '#64748B', margin: '4px 0 0' }}>Mantendo o padrao atual</p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 6px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>Cenario otimista</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: '#a855f7', margin: 0 }}>+R$ <CountUp value={optimistic7d} /></p>
                <p style={{ fontSize: 10, color: '#64748B', margin: '4px 0 0' }}>Se melhorar conversao</p>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#64748B' }}>Media diaria</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#F1F5F9' }}>R$ {fmt(last7Avg)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ LEVEL 2: DECISION ROW ═══ */}
        <div className="g-side" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Funnel */}
          <motion.div {...fadeUp(0, 0.2)} style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 20px' }}>Funil de conversao</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {funnelSteps.map((step, i) => {
                const isBigDrop = i === biggestDropIdx
                const barColor = isBigDrop ? '#EF4444' : step.pct >= 60 ? '#22C55E' : step.pct >= 30 ? '#F59E0B' : '#EF4444'
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${barColor}12`, border: `1px solid ${barColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: barColor }}>{step.v}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: isBigDrop ? 700 : 500, color: isBigDrop ? '#EF4444' : '#94A3B8' }}>{step.l}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#64748B' }}>{step.pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(step.pct, 3)}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease }} style={{ height: '100%', borderRadius: 2, background: barColor }} />
                        </div>
                      </div>
                    </div>
                    {i < funnelSteps.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 40, marginBottom: 2 }}>
                        <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M5 0v8M5 8l-2.5-2.5M5 8l2.5-2.5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'var(--mono)' }}>{funnelConversions[i]}%</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {biggestDropIdx > 0 && (
              <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <p style={{ fontSize: 10, color: '#EF4444', margin: 0 }}>Maior queda: "{funnelSteps[biggestDropIdx].l}" (-{biggestDropVal}pp)</p>
              </div>
            )}
          </motion.div>

          {/* Alerts + Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Alerts */}
            <motion.div {...fadeUp(1, 0.2)} style={{ ...card, padding: 24, flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px' }}>Alertas</h3>
              {alerts.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" style={{ margin: '0 auto 8px', display: 'block' }}><polyline points="20 6 9 17 4 12" /></svg>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Nenhum alerta</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alerts.slice(0, 4).map((al, i) => {
                    const isCrit = al.type === 'critical'
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: isCrit ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${isCrit ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'}` }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isCrit ? '#EF4444' : '#F59E0B', flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: isCrit ? '#FCA5A5' : '#FCD34D', margin: 0, flex: 1, lineHeight: 1.4 }}>{al.text}</p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Intelligence */}
            {insights.length > 0 && (
              <motion.div {...fadeUp(2, 0.25)} style={{ ...card, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" /><line x1="9" y1="21" x2="15" y2="21" /></svg>
                  Inteligencia executiva
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {insights.map((ins, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: ins.type === 'profit' ? '#22C55E' : ins.type === 'critical' ? '#EF4444' : '#F59E0B', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: ins.type === 'profit' ? '#4ade80' : ins.type === 'critical' ? '#fca5a5' : '#fcd34d', lineHeight: 1.4 }}>{ins.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══ CHART ═══ */}
        <motion.div {...fadeUp(0, 0.3)} style={{ ...card, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Receita diaria</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {[7, 30].map(r => (
                <button key={r} onClick={() => setChartRange(r)} style={{ fontSize: 10, fontWeight: 600, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', border: chartRange === r ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)', background: chartRange === r ? 'rgba(34,197,94,0.1)' : 'transparent', color: chartRange === r ? '#22C55E' : '#64748B', transition: 'all 0.2s' }}>{r}d</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: chartRange === 7 ? 6 : 2, height: 140 }}>
            {chartData.map((day, i) => {
              const h = maxChart > 0 ? Math.max((day.value / maxChart) * 120, day.value > 0 ? 3 : 1) : 1
              const isHov = hoveredBar === i
              return (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                  {isHov && (
                    <div style={{ position: 'absolute', bottom: h + 8, left: '50%', transform: 'translateX(-50%)', background: '#0c1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 7px', whiteSpace: 'nowrap', zIndex: 10 }}>
                      <p style={{ fontSize: 9, color: '#94A3B8', margin: '0 0 1px' }}>{day.date.slice(5)}</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', margin: 0, fontFamily: 'var(--mono)' }}>R$ {fmt(day.value)}</p>
                    </div>
                  )}
                  <div style={{ width: '100%', maxWidth: chartRange === 7 ? 44 : 18, height: h, borderRadius: 3, background: isHov ? '#22C55E' : day.value > 0 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: chartRange === 7 ? 6 : 2, marginTop: 6 }}>
            {chartData.map((day, i) => {
              const show = chartRange === 7 || i % 5 === 0 || i === chartData.length - 1
              return <div key={day.date} style={{ flex: 1, textAlign: 'center' }}>{show && <span style={{ fontSize: 8, color: '#64748B' }}>{day.date.slice(5)}</span>}</div>
            })}
          </div>
        </motion.div>

        {/* ═══ LEVEL 2.5: MOVIMENTACAO + ACTIONS ═══ */}
        <div className="g-side" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Movimentacao */}
          <motion.div {...fadeUp(0, 0.35)} style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 16px' }}>Movimentacao da plataforma</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Depositado</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: '#22C55E', margin: 0, lineHeight: 1 }}><CountUp value={globalDep} prefix="R$ " /></p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sacado</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: '#EF4444', margin: 0, lineHeight: 1 }}><CountUp value={globalSaq} prefix="R$ " /></p>
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: globalLiq >= 0 ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)', border: `1px solid ${globalLiq >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Liquido (dep - saq)</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: globalLiq >= 0 ? '#22C55E' : '#EF4444' }}>{globalLiq >= 0 ? '+' : ''}R$ {fmt(globalLiq)}</span>
            </div>
          </motion.div>

          {/* O que fazer agora — com prioridades */}
          {actions.length > 0 && (
            <motion.div {...fadeUp(1, 0.35)} style={{ ...card, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                Prioridades
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {actions.map((a, i) => {
                  const impactC = a.impact === 'Alto' ? '#EF4444' : '#F59E0B'
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                      style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(229,57,53,0.03)', border: '1px solid rgba(229,57,53,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#e53935', fontFamily: 'var(--mono)' }}>#{a.priority}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${impactC}12`, color: impactC, border: `1px solid ${impactC}25`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impacto {a.impact}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#F1F5F9', margin: 0, lineHeight: 1.4 }}>{a.text}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* ═══ LEVEL 3: RANKING ═══ */}
        <motion.div {...fadeUp(0, 0.4)} style={{ ...card, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Ranking de admins</h3>
            <button onClick={() => router.push('/owner/admins')}
              style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94A3B8', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = '#F1F5F9' }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = '#94A3B8' }}
            >Ver todos</button>
          </div>

          {/* Top 3 podium */}
          {adminStats.length >= 3 && (
            <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {adminStats.slice(0, 3).map((a, i) => {
                const medals = ['#FFD700', '#C0C0C0', '#CD7F32']
                const maxM = Math.max(...adminStats.slice(0, 3).map(x => x.metas), 1)
                return (
                  <motion.div key={a.id} {...fadeUp(i, 0.45)}
                    onClick={() => setSelectedAdmin(a)}
                    style={{ padding: '18px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${medals[i]}22`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${medals[i]}44`; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${medals[i]}22`; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${medals[i]}15`, border: `2px solid ${medals[i]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: medals[i] }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || a.email.split('@')[0]}</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: '#22C55E', margin: '6px 0 8px' }}>{a.metas} metas</p>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(a.metas / maxM) * 100}%`, borderRadius: 2, background: medals[i], opacity: 0.6 }} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="Buscar admin..."
              style={{ width: '100%', padding: '9px 14px 9px 34px', fontSize: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#F1F5F9', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'rgba(229,57,53,0.3)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['#', 'Admin', 'Metas', 'Ops', 'Lucro', 'Plano', 'Atividade'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminStats.filter(a => { if (!adminSearch.trim()) return true; const q = adminSearch.toLowerCase(); return (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) }).slice(0, 10).map((a, i) => {
                  const planC = { PRO: { bg: 'rgba(34,197,94,0.08)', c: '#22C55E', b: 'rgba(34,197,94,0.2)' }, TRIAL: { bg: 'rgba(245,158,11,0.08)', c: '#F59E0B', b: 'rgba(245,158,11,0.2)' }, FREE: { bg: 'rgba(100,116,139,0.08)', c: '#64748B', b: 'rgba(100,116,139,0.2)' } }
                  const plan = planC[a.planStatus] || planC.FREE
                  const days = a.daysSinceActivity
                  const dot = days <= 0 ? '#22C55E' : days <= 7 ? '#F59E0B' : '#EF4444'
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                      onClick={() => setSelectedAdmin(a)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: i < 3 ? '#22C55E' : '#64748B', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: i < 3 ? 'rgba(34,197,94,0.1)' : '#0c1424', border: `1px solid ${i < 3 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#22C55E' : '#94A3B8' }}>{(a.name || a.email)[0].toUpperCase()}</span>
                            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: dot, border: '2px solid #0c1424' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{a.name || a.email.split('@')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: '#F1F5F9' }}>{a.metas}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{a.operators}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: (a.lucroFinal || 0) >= 0 ? '#22C55E' : '#EF4444' }}>{(a.lucroFinal || 0) >= 0 ? '+' : ''}R$ {fmt(a.lucroFinal || 0)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: plan.bg, color: plan.c, border: `1px solid ${plan.b}` }}>{a.planStatus}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 10, color: days <= 0 ? '#22C55E' : days <= 7 ? '#94A3B8' : '#EF4444' }}>{relativeTime(a.lastActivity)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ═══ LUCRO REAL + HEATMAP ═══ */}
        <div className="g-side" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Lucro real */}
          <motion.div {...fadeUp(0, 0.45)} style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 16px' }}>Lucro real da operacao</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Receita total</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#22C55E' }}>R$ <CountUp value={kpis.totalRevenue} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Custos estimados</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#EF4444' }}>--</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>Lucro liquido</span>
                <motion.span
                  animate={{ textShadow: ['0 0 10px rgba(34,197,94,0.1)', '0 0 25px rgba(34,197,94,0.2)', '0 0 10px rgba(34,197,94,0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 900, color: '#22C55E' }}>R$ <CountUp value={kpis.totalRevenue} /></motion.span>
              </div>
            </div>
          </motion.div>

          {/* Heatmap de performance */}
          <motion.div {...fadeUp(1, 0.45)} style={{ ...card, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 16px' }}>Performance dos admins</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {adminStats.slice(0, 8).map((a, i) => {
                const perf = a.metas > 5 && a.daysSinceActivity <= 3 ? 'high' : a.metas > 0 && a.daysSinceActivity <= 7 ? 'mid' : 'low'
                const perfC = perf === 'high' ? '#22C55E' : perf === 'mid' ? '#F59E0B' : '#EF4444'
                const maxM = Math.max(...adminStats.slice(0, 8).map(x => x.metas), 1)
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }} onClick={() => setSelectedAdmin(a)}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: perfC, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{a.name || a.email.split('@')[0]}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(a.metas / maxM) * 100}%`, borderRadius: 2, background: perfC, opacity: 0.7 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: perfC, width: 30, textAlign: 'right' }}>{a.metas}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ═══ LEVEL 3: QUICK STATS ═══ */}
        <motion.div {...fadeUp(0, 0.45)}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Numeros gerais</h3>
          <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { l: 'Total admins', v: kpis.totalAdmins, c: '#F1F5F9' },
              { l: 'Total operadores', v: kpis.totalOperators, c: '#F1F5F9' },
              { l: 'Total metas', v: kpis.totalMetas, c: '#22C55E' },
              { l: 'Total remessas', v: kpis.totalRemessas, c: '#22C55E' },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp(i, 0.5)} style={{ ...card, padding: '18px 20px' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}
              >
                <p style={{ fontSize: 10, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.l}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: item.c, margin: 0, lineHeight: 1 }}><CountUpInt value={item.v} /></p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ═══ ADMIN DETAIL MODAL ═══ */}
      <AnimatePresence>
        {selectedAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedAdmin(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(4,8,16,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 520, padding: 28, borderRadius: 20, background: 'linear-gradient(160deg, #10141e, #080b14)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', position: 'relative', maxHeight: 'calc(100dvh - 48px)', overflowY: 'auto' }}>
              <button onClick={() => setSelectedAdmin(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#e53935' }}>{(selectedAdmin.name || selectedAdmin.email)[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', margin: '0 0 2px' }}>{selectedAdmin.name || selectedAdmin.email.split('@')[0]}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{selectedAdmin.email}</p>
                </div>
                {(() => { const planC = { PRO: { bg: 'rgba(34,197,94,0.08)', c: '#22C55E', b: 'rgba(34,197,94,0.2)' }, TRIAL: { bg: 'rgba(245,158,11,0.08)', c: '#F59E0B', b: 'rgba(245,158,11,0.2)' }, FREE: { bg: 'rgba(100,116,139,0.08)', c: '#64748B', b: 'rgba(100,116,139,0.2)' } }; const p = planC[selectedAdmin.planStatus] || planC.FREE; return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: p.bg, color: p.c, border: `1px solid ${p.b}` }}>{selectedAdmin.planStatus}</span> })()}
              </div>
              {/* Lucro */}
              <div style={{ padding: '16px 18px', borderRadius: 14, marginBottom: 14, background: (selectedAdmin.lucroFinal || 0) >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${(selectedAdmin.lucroFinal || 0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Lucro final</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{selectedAdmin.totalContas || 0} contas · R$ {fmt(selectedAdmin.lucroPerConta || 0)}/conta</p>
                </div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 900, color: (selectedAdmin.lucroFinal || 0) >= 0 ? '#22C55E' : '#EF4444', margin: 0 }}>{(selectedAdmin.lucroFinal || 0) >= 0 ? '+' : ''}R$ {fmt(selectedAdmin.lucroFinal || 0)}</p>
              </div>
              <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[{ l: 'Metas', v: selectedAdmin.metas, c: '#F1F5F9' }, { l: 'Fechadas', v: selectedAdmin.fechadas, c: '#22C55E' }, { l: 'Ops', v: selectedAdmin.operators, c: '#F1F5F9' }, { l: 'Remessas', v: selectedAdmin.totalRemessas || selectedAdmin.remessas, c: '#F1F5F9' }].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '12px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: s.c, margin: '0 0 3px' }}>{s.v}</p>
                    <p style={{ fontSize: 8, color: '#64748B', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>Depositado</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>R$ {fmtInt(selectedAdmin.totalDep || 0)}</p>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>Sacado</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>R$ {fmtInt(selectedAdmin.totalSaq || 0)}</p>
                </div>
              </div>
              {selectedAdmin.topRedes && selectedAdmin.topRedes.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 }}>
                  <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 10px', textTransform: 'uppercase', fontWeight: 600 }}>Melhores redes</p>
                  {selectedAdmin.topRedes.map((r, i) => (
                    <div key={r.rede} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < selectedAdmin.topRedes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#e53935', width: 14, textAlign: 'center' }}>{i + 1}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{r.rede}</span>
                        <span style={{ fontSize: 10, color: '#64748B' }}>{r.metas}m</span>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: r.lucro >= 0 ? '#22C55E' : '#EF4444' }}>{r.lucro >= 0 ? '+' : ''}R$ {fmt(r.lucro)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Pago', v: `R$ ${fmt(selectedAdmin.totalPaid)}`, c: selectedAdmin.totalPaid > 0 ? '#22C55E' : '#64748B' },
                  { l: 'Atividade', v: relativeTime(selectedAdmin.lastActivity), c: selectedAdmin.daysSinceActivity <= 0 ? '#22C55E' : selectedAdmin.daysSinceActivity <= 7 ? '#F1F5F9' : '#EF4444' },
                  { l: 'Criado', v: selectedAdmin.created_at ? new Date(selectedAdmin.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '--', c: '#94A3B8' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 8, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: s.c, margin: 0, fontFamily: i === 0 ? 'var(--mono)' : 'inherit' }}>{s.v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
