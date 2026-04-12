'use client'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.06, ease } })
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

const MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32']
const MEDAL_LABELS = ['Ouro', 'Prata', 'Bronze']

/* ── Count-up hook ── */
function useCountUp(target, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const startVal = 0
    startRef.current = performance.now()

    const tick = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (target - startVal) * eased
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, decimals])

  return value
}

/* ── Mini Sparkline (CSS-based) ── */
function MiniSparkline({ data, color = '#22C55E', width = 80, height = 28 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const barW = Math.max(2, (width / data.length) - 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height, width, flexShrink: 0 }}>
      {data.map((v, i) => {
        const h = Math.max(2, ((v - min) / range) * height)
        return (
          <div key={i} style={{
            width: barW, height: h, borderRadius: 1,
            background: v >= 0 ? color : '#EF4444',
            opacity: 0.5 + (i / data.length) * 0.5,
          }} />
        )
      })}
    </div>
  )
}

/* ── KPI Card with count-up ── */
function KpiCard({ label, value, prefix, rgb, gradient, i, isProfit, rawValue }) {
  const displayCount = useCountUp(typeof rawValue === 'number' ? Math.abs(rawValue) : value, 1400, typeof rawValue === 'number' ? 2 : 0)
  const [hovered, setHovered] = useState(false)

  const profitColor = isProfit
    ? (rawValue >= 0 ? '34,197,94' : '239,68,68')
    : null
  const activeRgb = profitColor || rgb

  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '26px 24px',
        background: gradient || `linear-gradient(145deg, rgba(${activeRgb},0.14), rgba(${activeRgb},0.03) 50%, transparent 80%)`,
        border: `1px solid rgba(${activeRgb},0.2)`,
        borderRadius: 16,
        boxShadow: hovered
          ? `0 0 50px rgba(${activeRgb},0.18), 0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 0 16px rgba(${activeRgb},0.05), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
        cursor: 'default',
      }}>
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${activeRgb},${hovered ? 0.14 : 0.06}), transparent 70%)`,
        transition: 'all 0.4s', pointerEvents: 'none',
      }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {label}
      </p>
      <p style={{
        fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
        fontFamily: 'var(--mono, monospace)',
        color: isProfit
          ? (rawValue >= 0 ? '#22C55E' : '#EF4444')
          : `rgb(${rgb})`,
        textShadow: isProfit && rawValue >= 0 ? '0 0 20px rgba(34,197,94,0.3)' : 'none',
      }}>
        {prefix && <span style={{ fontSize: 16, fontWeight: 600, marginRight: 2 }}>{prefix}</span>}
        {isProfit && rawValue < 0 && '-'}
        {isProfit
          ? displayCount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : displayCount}
      </p>
    </motion.div>
  )
}

/* ── Drawer Panel ── */
function DrawerPanel({ rede, onClose, allRedes }) {
  if (!rede) return null

  const lucroPorRemessa = rede.remessaCount > 0 ? rede.lucroFinal / rede.remessaCount : 0
  const lucroPorMeta = rede.metas.length > 0 ? rede.lucroFinal / rede.metas.length : 0
  const ranking = allRedes.findIndex(r => r.nome === rede.nome) + 1

  // Group profit by week (last 4 weeks)
  const weeklyData = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now)
      start.setDate(start.getDate() - (w + 1) * 7)
      const end = new Date(now)
      end.setDate(end.getDate() - w * 7)
      const weekProfit = rede.metas
        .filter(m => {
          const d = new Date(m.updated_at || m.created_at)
          return d >= start && d < end
        })
        .reduce((s, m) => s + Number(m.lucro_final || 0), 0)
      weeks.push(weekProfit)
    }
    return weeks
  }, [rede])

  // AI recommendation
  const recommendation = useMemo(() => {
    if (rede.trend === 'up' && rede.lucroFinal > 0) return { text: 'Rede em crescimento com lucro positivo. Recomendacao: aumentar volume de operacoes.', type: 'success' }
    if (rede.trend === 'down' && rede.lucroFinal > 0) return { text: 'Lucro positivo mas tendencia de queda. Recomendacao: manter volume e monitorar de perto.', type: 'warning' }
    if (rede.lucroFinal < 0) return { text: 'Rede com prejuizo. Recomendacao: reduzir risco, avaliar operadores e considerar pausar.', type: 'danger' }
    return { text: 'Rede estavel. Recomendacao: avaliar oportunidades de escalar gradualmente.', type: 'info' }
  }, [rede])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999,
          width: '100%', maxWidth: 440,
          background: 'linear-gradient(180deg, #0c1424, #080e1a)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto', padding: '28px 24px',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: 4 }}>{rede.nome}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: rede.trend === 'up' ? 'rgba(34,197,94,0.12)' : rede.trend === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                color: rede.trend === 'up' ? '#22C55E' : rede.trend === 'down' ? '#EF4444' : '#94A3B8',
                border: `1px solid ${rede.trend === 'up' ? 'rgba(34,197,94,0.2)' : rede.trend === 'down' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {rede.trend === 'up' ? 'Crescimento' : rede.trend === 'down' ? 'Queda' : 'Estavel'}
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>#{ranking} no ranking</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: '#94A3B8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#F1F5F9' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94A3B8' }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Lucro destaque */}
        <div style={{
          padding: '24px 20px', borderRadius: 14, marginBottom: 20,
          background: rede.lucroFinal >= 0
            ? 'linear-gradient(145deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))'
            : 'linear-gradient(145deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))',
          border: `1px solid ${rede.lucroFinal >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lucro total da rede</p>
          <p style={{
            fontSize: 32, fontWeight: 800, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.03em',
            color: rede.lucroFinal >= 0 ? '#22C55E' : '#EF4444',
            textShadow: rede.lucroFinal >= 0 ? '0 0 30px rgba(34,197,94,0.25)' : '0 0 30px rgba(239,68,68,0.25)',
          }}>
            R$ {fmt(rede.lucroFinal)}
          </p>
        </div>

        {/* Metricas grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Metas fechadas', value: rede.metas.length, color: '99,102,241' },
            { label: 'Depositantes', value: rede.depositantes, color: '59,130,246' },
            { label: 'Remessas', value: rede.remessaCount, color: '168,85,247' },
            { label: 'Lucro/remessa', value: `R$ ${fmt(lucroPorRemessa)}`, color: lucroPorRemessa >= 0 ? '34,197,94' : '239,68,68' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '16px 14px', borderRadius: 12,
              background: `linear-gradient(145deg, rgba(${m.color},0.06), transparent)`,
              border: `1px solid rgba(${m.color},0.1)`,
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: `rgb(${m.color})`, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Evolucao semanal */}
        <div style={{
          padding: '20px', borderRadius: 14, marginBottom: 20,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Evolucao semanal (ultimas 4 semanas)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 60 }}>
            {weeklyData.map((v, i) => {
              const maxAbs = Math.max(...weeklyData.map(Math.abs), 1)
              const h = Math.max(4, (Math.abs(v) / maxAbs) * 56)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', height: h, borderRadius: 4,
                    background: v >= 0
                      ? 'linear-gradient(180deg, rgba(34,197,94,0.6), rgba(34,197,94,0.2))'
                      : 'linear-gradient(180deg, rgba(239,68,68,0.6), rgba(239,68,68,0.2))',
                  }} />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>S{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Eficiencia */}
        <div style={{
          padding: '20px', borderRadius: 14, marginBottom: 20,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Indicadores de eficiencia</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Lucro por meta</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono, monospace)', color: lucroPorMeta >= 0 ? '#22C55E' : '#EF4444' }}>R$ {fmt(lucroPorMeta)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Lucro por remessa</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono, monospace)', color: lucroPorRemessa >= 0 ? '#22C55E' : '#EF4444' }}>R$ {fmt(lucroPorRemessa)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Depositantes por meta</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono, monospace)', color: '#60a5fa' }}>
                {rede.metas.length > 0 ? (rede.depositantes / rede.metas.length).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div style={{
          padding: '20px', borderRadius: 14,
          background: 'linear-gradient(145deg, rgba(168,85,247,0.08), rgba(59,130,246,0.04))',
          border: '1px solid rgba(168,85,247,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <line x1="9" y1="21" x2="15" y2="21" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>Recomendacao IA</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '2px 7px', borderRadius: 5 }}>AI</span>
          </div>
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0,
            paddingLeft: 12, borderLeft: `2px solid ${recommendation.type === 'success' ? 'rgba(34,197,94,0.4)' : recommendation.type === 'warning' ? 'rgba(245,158,11,0.4)' : recommendation.type === 'danger' ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.4)'}`,
          }}>
            {recommendation.text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */
export default function RedesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRede, setSelectedRede] = useState(null)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    const [{ data: t }, { data: sb }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setTenant(t); setSub(sb)
    loadData()
  }

  async function loadData() {
    setLoading(true)
    const [{ data: ms }, { data: rs }] = await Promise.all([
      supabase.from('metas').select('*').order('created_at', { ascending: false }),
      supabase.from('remessas').select('*').order('created_at', { ascending: false }),
    ])
    setMetas((ms || []).filter(m => !m.deleted_at))
    setRemessas(rs || [])
    setLoading(false)
  }

  /* ── Compute redes data ── */
  const redesData = useMemo(() => {
    const closed = metas.filter(m => m.status_fechamento === 'fechada')
    const grouped = {}

    closed.forEach(m => {
      const rede = m.rede || 'Sem rede'
      if (!grouped[rede]) grouped[rede] = { nome: rede, metas: [], remessaCount: 0, lucroFinal: 0, depositantes: 0 }
      grouped[rede].metas.push(m)
      grouped[rede].lucroFinal += Number(m.lucro_final || 0)
      grouped[rede].depositantes += Number(m.quantidade_contas || 0)
    })

    // Count remessas per rede
    remessas.forEach(r => {
      const meta = metas.find(m => m.id === r.meta_id)
      if (meta) {
        const rede = meta.rede || 'Sem rede'
        if (grouped[rede]) grouped[rede].remessaCount++
      }
    })

    // 7-day trend + sparkline data
    const now = new Date()
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
    const d14 = new Date(now); d14.setDate(d14.getDate() - 14)

    Object.values(grouped).forEach(g => {
      const last7 = g.metas.filter(m => new Date(m.updated_at || m.created_at) >= d7).reduce((s, m) => s + Number(m.lucro_final || 0), 0)
      const prev7 = g.metas.filter(m => {
        const d = new Date(m.updated_at || m.created_at)
        return d >= d14 && d < d7
      }).reduce((s, m) => s + Number(m.lucro_final || 0), 0)

      if (last7 > prev7 * 1.05) g.trend = 'up'
      else if (last7 < prev7 * 0.95) g.trend = 'down'
      else g.trend = 'stable'

      // Sparkline: last 6 weeks profit
      const sparkline = []
      for (let w = 5; w >= 0; w--) {
        const ws = new Date(now); ws.setDate(ws.getDate() - (w + 1) * 7)
        const we = new Date(now); we.setDate(we.getDate() - w * 7)
        const wp = g.metas
          .filter(m => {
            const d = new Date(m.updated_at || m.created_at)
            return d >= ws && d < we
          })
          .reduce((s, m) => s + Number(m.lucro_final || 0), 0)
        sparkline.push(wp)
      }
      g.sparkline = sparkline

      // Efficiency
      g.lucroPorRemessa = g.remessaCount > 0 ? g.lucroFinal / g.remessaCount : 0
    })

    return Object.values(grouped).sort((a, b) => b.lucroFinal - a.lucroFinal)
  }, [metas, remessas])

  /* ── KPIs ── */
  const totalRedes = redesData.length
  const redesAtivas = redesData.filter(r => r.lucroFinal > 0).length
  const lucroTotal = redesData.reduce((s, r) => s + r.lucroFinal, 0)
  const topLucro = redesData.length > 0 ? redesData[0].lucroFinal : 1

  /* ── Insights ── */
  const insights = useMemo(() => {
    const list = []
    if (redesData.length > 0) {
      const top = redesData[0]
      list.push({
        type: 'success',
        icon: 'crown',
        text: `${top.nome} lidera o ranking com R$ ${fmt(top.lucroFinal)} de lucro total`,
        arrow: 'up',
      })
    }
    // Best efficiency
    const withRemessas = redesData.filter(r => r.remessaCount > 0)
    if (withRemessas.length > 0) {
      const bestEfficiency = [...withRemessas].sort((a, b) => b.lucroPorRemessa - a.lucroPorRemessa)[0]
      if (bestEfficiency.lucroPorRemessa > 0) {
        list.push({
          type: 'info',
          icon: 'target',
          text: `${bestEfficiency.nome} tem a melhor eficiencia: R$ ${fmt(bestEfficiency.lucroPorRemessa)} por remessa`,
          arrow: 'up',
        })
      }
    }
    // Negative networks
    const negative = redesData.filter(r => r.lucroFinal < 0)
    if (negative.length > 0) {
      list.push({
        type: 'warning',
        icon: 'alert',
        text: `${negative.length} rede${negative.length > 1 ? 's' : ''} com prejuizo -- ${negative[0].nome} precisa de atencao`,
        arrow: 'down',
      })
    }
    // Growing networks
    const growing = redesData.filter(r => r.trend === 'up')
    if (growing.length > 0) {
      list.push({
        type: 'info',
        icon: 'trending',
        text: `${growing.length} rede${growing.length > 1 ? 's' : ''} em crescimento: ${growing.map(g => g.nome).slice(0, 3).join(', ')}`,
        arrow: 'up',
      })
    }
    return list
  }, [redesData])

  /* ── Loading state ── */
  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, #0c1424, #080e1a)' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, border: '3px solid rgba(229,57,53,0.2)', borderTopColor: '#e53935', borderRadius: '50%' }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando radar de redes...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ padding: '32px 24px 64px', maxWidth: 1100, margin: '0 auto' }}>

          {/* ── Header ── */}
          <motion.div {...fadeUp(0)} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(229,57,53,0.15), rgba(168,85,247,0.1))',
                border: '1px solid rgba(229,57,53,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="2" />
                  <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: 2 }}>
                  Radar de Redes
                </h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  Central estrategica de analise de lucro por rede -- ranking, eficiencia e tendencias
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            <KpiCard label="Total de redes" value={totalRedes} prefix="" rgb="99,102,241" i={1} />
            <KpiCard label="Redes lucrativas" value={redesAtivas} prefix="" rgb="34,197,94" i={2} />
            <KpiCard label="Lucro total" value={0} prefix="R$ " rgb="34,197,94" i={3} isProfit={true} rawValue={lucroTotal} />
          </div>

          {/* ── Radar Estrategico (Insights) ── */}
          {insights.length > 0 && (
            <motion.div {...fadeUp(4)} style={{ marginBottom: 32 }}>
              <div style={{
                padding: '22px 24px', borderRadius: 16,
                background: 'linear-gradient(145deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04) 50%, rgba(255,255,255,0.01))',
                border: '1px solid rgba(168,85,247,0.15)',
                boxShadow: '0 0 40px rgba(168,85,247,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round">
                      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                      <line x1="9" y1="21" x2="15" y2="21" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Radar estrategico da operacao</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {insights.map((ins, i) => (
                    <motion.div key={i} {...fadeUp(5 + i)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12,
                      background: ins.type === 'success' ? 'rgba(34,197,94,0.05)' : ins.type === 'warning' ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.05)',
                      border: `1px solid ${ins.type === 'success' ? 'rgba(34,197,94,0.1)' : ins.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)'}`,
                    }}>
                      {/* Arrow indicator */}
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: ins.arrow === 'up' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: ins.arrow === 'up' ? '#22C55E' : '#EF4444',
                        }}>
                          {ins.arrow === 'up' ? '\u2191' : '\u2193'}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.5 }}>{ins.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Ranking Section ── */}
          <motion.div {...fadeUp(5)} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>Ranking estrategico</span>
              <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>{redesData.length} rede{redesData.length !== 1 ? 's' : ''}</span>
            </div>

            {redesData.length === 0 ? (
              <div style={{
                padding: '56px 24px', textAlign: 'center', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 16px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>Nenhuma rede com metas fechadas ainda</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Feche metas para ativar o radar estrategico</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {redesData.map((rede, i) => {
                  const pct = topLucro > 0 ? Math.max(0, (rede.lucroFinal / topLucro) * 100) : 0
                  const isTop3 = i < 3
                  const medalColor = isTop3 ? MEDALS[i] : null
                  const medalRgb = i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : i === 2 ? '205,127,50' : null

                  return (
                    <motion.div key={rede.nome} {...fadeUp(6 + i)}>
                      <div
                        onClick={() => setSelectedRede(rede)}
                        style={{
                          padding: '22px 24px', position: 'relative', overflow: 'hidden',
                          borderRadius: 16, cursor: 'pointer',
                          background: isTop3
                            ? `linear-gradient(145deg, rgba(${medalRgb},0.06), rgba(${medalRgb},0.02) 40%, rgba(255,255,255,0.01))`
                            : 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                          border: `1px solid ${isTop3 ? `rgba(${medalRgb},0.18)` : 'rgba(255,255,255,0.05)'}`,
                          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'
                          e.currentTarget.style.boxShadow = isTop3
                            ? `0 0 40px rgba(${medalRgb},0.12), 0 12px 40px rgba(0,0,0,0.3)`
                            : '0 12px 40px rgba(0,0,0,0.3)'
                          e.currentTarget.style.borderColor = isTop3 ? `rgba(${medalRgb},0.35)` : 'rgba(255,255,255,0.12)'
                          e.currentTarget.style.filter = 'brightness(1.05)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none'
                          e.currentTarget.style.boxShadow = 'none'
                          e.currentTarget.style.borderColor = isTop3 ? `rgba(${medalRgb},0.18)` : 'rgba(255,255,255,0.05)'
                          e.currentTarget.style.filter = 'none'
                        }}
                      >
                        {/* Top 3 glow overlay */}
                        {isTop3 && (
                          <div style={{
                            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
                            borderRadius: '50%', pointerEvents: 'none',
                            background: `radial-gradient(circle, rgba(${medalRgb},0.06), transparent 70%)`,
                          }} />
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                          {/* Position badge */}
                          <div style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                            background: isTop3 ? `rgba(${medalRgb},0.12)` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isTop3 ? `rgba(${medalRgb},0.25)` : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            {isTop3 ? (
                              <>
                                <svg width={16} height={16} viewBox="0 0 24 24" fill={medalColor} stroke="none">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span style={{ fontSize: 8, fontWeight: 700, color: medalColor, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{MEDAL_LABELS[i]}</span>
                              </>
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#64748B', fontFamily: 'var(--mono, monospace)' }}>#{i + 1}</span>
                            )}
                          </div>

                          {/* Name + status + metrics */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{rede.nome}</span>
                              {/* Status badge */}
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                background: rede.trend === 'up' ? 'rgba(34,197,94,0.1)' : rede.trend === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                                color: rede.trend === 'up' ? '#22C55E' : rede.trend === 'down' ? '#EF4444' : '#94A3B8',
                                border: `1px solid ${rede.trend === 'up' ? 'rgba(34,197,94,0.18)' : rede.trend === 'down' ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)'}`,
                              }}>
                                {rede.trend === 'up' ? '\u2191 Crescimento' : rede.trend === 'down' ? '\u2193 Queda' : '\u2194 Estavel'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: '#94A3B8' }}>{rede.metas.length}</span> metas fechadas
                              </span>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: '#94A3B8' }}>{rede.depositantes}</span> depositantes
                              </span>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: '#94A3B8' }}>{rede.remessaCount}</span> remessas
                              </span>
                              {rede.remessaCount > 0 && (
                                <span style={{ fontSize: 11, color: '#64748B' }}>
                                  <span style={{ fontWeight: 700, color: rede.lucroPorRemessa >= 0 ? '#22C55E' : '#EF4444' }}>R$ {fmt(rede.lucroPorRemessa)}</span>/remessa
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Sparkline */}
                          <MiniSparkline data={rede.sparkline} color={rede.lucroFinal >= 0 ? '#22C55E' : '#EF4444'} />

                          {/* Lucro */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{
                              fontSize: 20, fontWeight: 800, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em',
                              color: rede.lucroFinal >= 0 ? '#22C55E' : '#EF4444',
                              textShadow: rede.lucroFinal >= 0 ? '0 0 20px rgba(34,197,94,0.2)' : 'none',
                              marginBottom: 2,
                            }}>
                              {rede.lucroFinal >= 0 ? '+' : ''}R$ {fmt(rede.lucroFinal)}
                            </p>
                            <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>lucro final</p>
                          </div>
                        </div>

                        {/* Performance bar */}
                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, pct)}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.08, ease }}
                            style={{
                              height: '100%', borderRadius: 3,
                              background: rede.lucroFinal >= 0
                                ? `linear-gradient(90deg, rgba(34,197,94,0.7), rgba(34,197,94,0.25))`
                                : `linear-gradient(90deg, rgba(239,68,68,0.7), rgba(239,68,68,0.25))`,
                              boxShadow: rede.lucroFinal >= 0
                                ? '0 0 8px rgba(34,197,94,0.2)'
                                : '0 0 8px rgba(239,68,68,0.2)',
                            }}
                          />
                        </div>

                        {/* Click hint */}
                        <div style={{
                          position: 'absolute', bottom: 8, right: 14,
                          fontSize: 10, color: 'rgba(255,255,255,0.15)',
                        }}>
                          Clique para detalhes
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </AppLayout>

      {/* ── Drawer Panel ── */}
      <AnimatePresence>
        {selectedRede && (
          <DrawerPanel
            rede={selectedRede}
            onClose={() => setSelectedRede(null)}
            allRedes={redesData}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
