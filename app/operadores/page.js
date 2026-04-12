'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: base + i * 0.06, ease },
})

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const medalLabels = ['Top performer', 'Destaque', 'Consistente']

/* ── Count-up hook ── */
function useCountUp(target, duration = 1200, decimals = 0) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const from = 0
    const tick = now => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(from + (target - from) * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val)
}

/* ── KPI Card ── */
function KpiCard({ label, value, suffix, rgb, i, isCurrency, dynamicColor }) {
  const [h, setH] = useState(false)
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0
  const animated = useCountUp(numVal, 1400, isCurrency ? 2 : (suffix === '%' ? 1 : 0))
  const displayColor = dynamicColor ? (numVal >= 0 ? '34,197,94' : '239,68,68') : rgb

  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '26px 24px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, rgba(${displayColor},0.16), rgba(${displayColor},0.04) 55%, transparent 85%)`,
        border: `1px solid rgba(${displayColor},${h ? 0.35 : 0.18})`,
        borderRadius: 18,
        boxShadow: h
          ? `0 0 50px rgba(${displayColor},0.2), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 0 15px rgba(${displayColor},0.05), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: h ? 'translateY(-4px) scale(1.01)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:`radial-gradient(circle, rgba(${displayColor},${h?0.15:0.06}), transparent 70%)`, transition:'all 0.4s', pointerEvents:'none' }} />
      <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{label}</p>
      <p style={{ fontSize:30, fontWeight:800, color:`rgb(${displayColor})`, lineHeight:1, letterSpacing:'-0.03em', fontFamily:'var(--mono, monospace)' }}>
        {isCurrency ? `R$ ${Number(animated).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}` : animated}
        {suffix && <span style={{ fontSize:14, fontWeight:600, marginLeft:4 }}>{suffix}</span>}
      </p>
    </motion.div>
  )
}

/* ── Performance Bar ── */
function PerfBar({ value, max, color, delay = 0 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden', flex:1 }}>
      <motion.div
        initial={{ width:0 }}
        animate={{ width:`${pct}%` }}
        transition={{ duration:1.2, delay, ease:[0.33,1,0.68,1] }}
        style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg, ${color}, ${color}88)` }}
      />
    </div>
  )
}

/* ── Operator Drawer ── */
function OperatorDrawer({ op, onClose, allMetas, allRemessas }) {
  const opMetas = useMemo(() => allMetas.filter(m => m.operator_id === op.id), [op.id, allMetas])
  const opClosed = useMemo(() => opMetas.filter(m => m.status_fechamento === 'fechada'), [opMetas])
  const opRemessas = useMemo(() => {
    const ids = new Set(opMetas.map(m => m.id))
    return allRemessas.filter(r => ids.has(r.meta_id))
  }, [opMetas, allRemessas])

  const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
  const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
  const winRate = opClosed.length > 0 ? (opClosed.filter(m => Number(m.lucro_final || 0) > 0).length / opClosed.length * 100) : 0
  const lucroPerRemessa = opRemessas.length > 0 ? lucroFinal / opRemessas.length : 0

  // Recent metas for history
  const recentMetas = opClosed.slice(0, 8)

  // Trend: compare last 5 vs previous 5 metas
  const last5 = opClosed.slice(0, 5).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
  const prev5 = opClosed.slice(5, 10).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
  const trending = opClosed.length >= 3 ? (last5 >= prev5 ? 'up' : 'down') : 'stable'

  // AI insights
  const insights = []
  if (winRate >= 70) insights.push({ text: 'Alta taxa de acerto — operador consistente.', type: 'good' })
  else if (winRate < 40 && opClosed.length > 2) insights.push({ text: 'Taxa de acerto abaixo da media. Revisar estrategia.', type: 'warn' })
  if (lucroPerRemessa > 50) insights.push({ text: `Eficiencia excelente: R$ ${fmt(lucroPerRemessa)} por remessa.`, type: 'good' })
  if (trending === 'up' && opClosed.length >= 5) insights.push({ text: 'Tendencia de crescimento nas ultimas metas.', type: 'good' })
  if (trending === 'down' && opClosed.length >= 5) insights.push({ text: 'Lucro em queda nas ultimas metas. Acompanhar de perto.', type: 'warn' })
  if (opClosed.length === 0) insights.push({ text: 'Nenhuma meta fechada ainda. Aguardando dados.', type: 'neutral' })

  // Recommendation
  let recommendation = null
  if (winRate >= 60 && lucroFinal > 0) recommendation = { text: 'Aumentar volume de operacao', icon: '↑', color: '#22c55e' }
  else if (winRate < 45 && opClosed.length > 3) recommendation = { text: 'Reduzir exposicao e revisar redes', icon: '↓', color: '#f59e0b' }
  else if (lucroFinal < 0) recommendation = { text: 'Pausar operacao e revisar estrategia', icon: '!', color: '#ef4444' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'flex-end',
      }}>
      <motion.div
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
        style={{
          width: '100%', maxWidth: 420, height: '100%', overflowY: 'auto',
          background: 'linear-gradient(180deg, #0c1424, #080e1a)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          padding: '32px 28px',
        }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: lucroFinal >= 0
                ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))',
              border: `1px solid ${lucroFinal >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>
              {getInitial(op)}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{getName(op)}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{op.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Lucro final', value: `R$ ${fmt(lucroFinal)}`, color: lucroFinal >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Taxa de acerto', value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? '#22c55e' : '#f59e0b' },
            { label: 'Depositantes', value: totalDeposit, color: '#60a5fa' },
            { label: 'Remessas', value: opRemessas.length, color: '#a855f7' },
            { label: 'Metas fechadas', value: opClosed.length, color: '#60a5fa' },
            { label: 'Lucro/remessa', value: `R$ ${fmt(lucroPerRemessa)}`, color: lucroPerRemessa >= 0 ? '#22c55e' : '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: s.color, margin: 0, fontFamily: 'var(--mono, monospace)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Trend */}
        <div style={{
          padding: '14px 18px', borderRadius: 14, marginBottom: 24,
          background: trending === 'up' ? 'rgba(34,197,94,0.06)' : trending === 'down' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${trending === 'up' ? 'rgba(34,197,94,0.15)' : trending === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{trending === 'up' ? '↑' : trending === 'down' ? '↓' : '→'}</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: trending === 'up' ? '#22c55e' : trending === 'down' ? '#ef4444' : 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>
              {trending === 'up' ? 'Em crescimento' : trending === 'down' ? 'Em queda' : 'Estavel'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Baseado nas ultimas metas fechadas</p>
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Insights</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.12)', padding: '2px 7px', borderRadius: 5 }}>AI</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: ins.type === 'good' ? 'rgba(34,197,94,0.05)' : ins.type === 'warn' ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${ins.type === 'good' ? 'rgba(34,197,94,0.12)' : ins.type === 'warn' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
                }}>
                  {ins.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div style={{
            padding: '16px 18px', borderRadius: 14, marginBottom: 24,
            background: `linear-gradient(135deg, ${recommendation.color}12, transparent)`,
            border: `1px solid ${recommendation.color}25`,
          }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Recomendacao</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, color: recommendation.color }}>{recommendation.icon}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: recommendation.color, margin: 0 }}>{recommendation.text}</p>
            </div>
          </div>
        )}

        {/* Recent metas history */}
        {recentMetas.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Historico recente</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentMetas.map((m, i) => {
                const lf = Number(m.lucro_final || 0)
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{m.rede || 'Rede'}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                    <p style={{
                      fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)',
                      color: lf >= 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {lf >= 0 ? '+' : ''}R$ {fmt(lf)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ── Main Page ── */
export default function OperadoresPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [operators, setOperators] = useState([])
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ranking')
  const [selectedOp, setSelectedOp] = useState(null)

  useEffect(() => { checkAndLoad() }, [])

  async function checkAndLoad() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    await loadAll(p.tenant_id)
  }

  async function loadAll(forceTenantId) {
    setLoading(true)
    const tid = forceTenantId || profile?.tenant_id
    const [{ data: ops }, { data: ms }, { data: rs }, { data: t }, { data: s2 }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'operator').order('created_at', { ascending: false }),
      supabase.from('metas').select('*').order('created_at', { ascending: false }),
      supabase.from('remessas').select('*').order('created_at', { ascending: false }),
      supabase.from('tenants').select('*').eq('id', tid).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setOperators(ops || [])
    setMetas((ms || []).filter(m => !m.deleted_at))
    setRemessas(rs || [])
    if (t) setTenant(t)
    if (s2) setSub(s2)
    setLoading(false)
  }

  /* ── Derived data ── */
  const closedMetas = useMemo(() => metas.filter(m => m.status_fechamento === 'fechada'), [metas])

  const operatorStats = useMemo(() => {
    return operators.map(op => {
      const opMetas = metas.filter(m => m.operator_id === op.id)
      const opClosed = closedMetas.filter(m => m.operator_id === op.id)
      const opRemessas = remessas.filter(r => {
        const metaIds = new Set(opMetas.map(m => m.id))
        return metaIds.has(r.meta_id)
      })
      const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
      const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const activeMetas = opMetas.filter(m => m.status === 'ativa' || m.status === 'em_andamento')
      const winMetas = opClosed.filter(m => Number(m.lucro_final || 0) > 0).length
      const winRate = opClosed.length > 0 ? (winMetas / opClosed.length) * 100 : 0
      const lastActivity = opRemessas.length > 0 ? new Date(opRemessas[0].created_at) : (opMetas.length > 0 ? new Date(opMetas[0].created_at) : null)
      const isActive = lastActivity && (Date.now() - lastActivity.getTime()) < 7 * 24 * 60 * 60 * 1000
      const lucroPerRemessa = opRemessas.length > 0 ? lucroFinal / opRemessas.length : 0

      // Trend: compare recent 3 vs previous 3
      const recent3 = opClosed.slice(0, 3).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const prev3 = opClosed.slice(3, 6).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const trend = opClosed.length >= 4 ? (recent3 >= prev3 ? 'up' : 'down') : 'stable'

      // Badge
      let badge = null
      if (winRate >= 70 && opClosed.length >= 3) badge = { text: 'Top performer', color: '#22c55e' }
      else if (trend === 'up' && opClosed.length >= 4) badge = { text: 'Em crescimento', color: '#60a5fa' }
      else if (opClosed.length >= 3) badge = { text: 'Estavel', color: 'rgba(255,255,255,0.35)' }

      return {
        ...op,
        metasCount: opMetas.length,
        closedCount: opClosed.length,
        remessasCount: opRemessas.length,
        totalDeposit,
        lucroFinal,
        activeMetas: activeMetas.length,
        winRate,
        isActive,
        lucroPerRemessa,
        trend,
        badge,
      }
    })
  }, [operators, metas, closedMetas, remessas])

  const ranking = useMemo(() =>
    [...operatorStats].filter(o => o.closedCount > 0).sort((a, b) => b.lucroFinal - a.lucroFinal),
    [operatorStats]
  )

  const maxLucro = useMemo(() => {
    if (ranking.length === 0) return 1
    return Math.max(...ranking.map(o => Math.abs(o.lucroFinal)), 1)
  }, [ranking])

  const totalActive = useMemo(() => operatorStats.filter(o => o.activeMetas > 0).length, [operatorStats])
  const totalLucro = useMemo(() => closedMetas.reduce((a, m) => a + Number(m.lucro_final || 0), 0), [closedMetas])
  const avgWinRate = useMemo(() => {
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length === 0) return 0
    return withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
  }, [operatorStats])

  const insights = useMemo(() => {
    const lines = []
    if (ranking.length > 0) {
      const best = ranking[0]
      lines.push({ text: `${getName(best)} lidera com R$ ${fmt(best.lucroFinal)} de lucro.`, type: 'up' })
    }
    if (ranking.length > 1) {
      const worst = ranking[ranking.length - 1]
      if (worst.lucroFinal < 0) lines.push({ text: `${getName(worst)} esta com resultado negativo. Acompanhar de perto.`, type: 'down' })
    }
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length > 0) {
      const avg = withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
      lines.push({ text: `Media de acerto da equipe: ${avg.toFixed(1)}%`, type: avg >= 50 ? 'up' : 'down' })
    }
    const growing = operatorStats.filter(o => o.trend === 'up')
    if (growing.length > 0) lines.push({ text: `${growing.length} operador(es) em tendencia de crescimento.`, type: 'up' })
    const inactive = operatorStats.filter(o => !o.isActive && o.metasCount > 0)
    if (inactive.length > 0) lines.push({ text: `${inactive.length} operador(es) sem atividade nos ultimos 7 dias.`, type: 'warn' })
    // Best efficiency
    const withRemessas = operatorStats.filter(o => o.remessasCount > 0 && o.lucroFinal > 0)
    if (withRemessas.length > 0) {
      const bestEff = withRemessas.sort((a, b) => b.lucroPerRemessa - a.lucroPerRemessa)[0]
      lines.push({ text: `${getName(bestEff)} tem melhor eficiencia: R$ ${fmt(bestEff.lucroPerRemessa)}/remessa.`, type: 'up' })
    }
    if (lines.length === 0) lines.push({ text: 'Ainda sem dados suficientes para gerar insights.', type: 'neutral' })
    return lines
  }, [ranking, operatorStats])

  /* ── Loading ── */
  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0c1424, #080e1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando operadores...</p>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { key: 'ranking', label: 'Ranking', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { key: 'equipe', label: 'Equipe', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  ]

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Central de Performance</h1>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: 'rgba(34,197,94,0.1)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.2)', letterSpacing: '0.06em',
            }}>LIVE</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Acompanhe o desempenho individual e tome decisoes baseadas em dados reais.</p>
        </motion.div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <KpiCard label="Total operadores" value={operators.length} rgb="59,130,246" i={0} />
          <KpiCard label="Ativos (com metas)" value={totalActive} rgb="34,197,94" i={1} />
          <KpiCard label="Performance media" value={avgWinRate} suffix="%" rgb="168,85,247" i={2} />
          <KpiCard label="Lucro da equipe" value={totalLucro} rgb="34,197,94" i={3} isCurrency dynamicColor />
        </div>

        {/* Tabs */}
        <motion.div {...fadeUp(1)} style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '11px 16px', fontSize: 13, fontWeight: 600,
                borderRadius: 11, border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: tab === t.key ? '#22c55e' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: tab === t.key ? 1 : 0.5 }}>
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ═══ RANKING TAB ═══ */}
        {tab === 'ranking' && (
          <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            {/* Ranking Section */}
            <motion.div {...fadeUp(2)} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Ranking de performance</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{ranking.length} operador{ranking.length !== 1 ? 'es' : ''}</span>
              </div>

              {ranking.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Nenhuma meta fechada ainda para gerar ranking.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ranking.map((op, idx) => {
                    const isTop3 = idx < 3
                    const medalColor = isTop3 ? medalColors[idx] : null
                    return (
                      <RankingCard
                        key={op.id}
                        op={op}
                        idx={idx}
                        isTop3={isTop3}
                        medalColor={medalColor}
                        maxLucro={maxLucro}
                        onClick={() => setSelectedOp(op)}
                      />
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* AI Insights */}
            <motion.div {...fadeUp(3)} style={{
              background: 'linear-gradient(145deg, rgba(168,85,247,0.1), rgba(59,130,246,0.05) 50%, rgba(255,255,255,0.01))',
              border: '1px solid rgba(168,85,247,0.18)',
              borderRadius: 18, padding: '26px 24px',
              boxShadow: '0 0 40px rgba(168,85,247,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Radar da equipe</h2>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '3px 9px', borderRadius: 6, letterSpacing: '0.04em' }}>AI</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insights.map((ins, i) => (
                  <motion.div key={i} {...fadeUp(i, 0.15)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    background: 'rgba(255,255,255,0.025)', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, flexShrink: 0, width: 20, textAlign: 'center',
                      color: ins.type === 'up' ? '#22c55e' : ins.type === 'down' ? '#ef4444' : ins.type === 'warn' ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                    }}>
                      {ins.type === 'up' ? '↑' : ins.type === 'down' ? '↓' : ins.type === 'warn' ? '!' : '•'}
                    </span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: '20px' }}>{ins.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ EQUIPE TAB ═══ */}
        {tab === 'equipe' && (
          <motion.div key="equipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            {/* Invite button */}
            <motion.div {...fadeUp(0)} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <motion.button
                onClick={() => router.push('/admin')}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))',
                  border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, color: '#22c55e',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s ease',
                }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Convidar operador
              </motion.button>
            </motion.div>

            {operators.length === 0 ? (
              <motion.div {...fadeUp(1)} style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Nenhum operador na equipe ainda.</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Use o botao acima para convidar seu primeiro operador.</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {operatorStats.map((op, idx) => (
                  <motion.div key={op.id} {...fadeUp(idx, 0.05)}
                    onClick={() => setSelectedOp(op)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16, cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: op.lucroFinal >= 0
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.08))'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.08))',
                      border: `1px solid ${op.lucroFinal >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {getInitial(op)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: op.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                          color: op.isActive ? '#22c55e' : 'rgba(255,255,255,0.25)',
                          border: `1px solid ${op.isActive ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)'}`,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {op.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        {op.badge && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                            color: op.badge.color, background: `${op.badge.color}12`,
                            border: `1px solid ${op.badge.color}20`,
                          }}>
                            {op.badge.text}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{op.email}</p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metas</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.metasCount}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro</p>
                        <p style={{
                          fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)',
                          color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444',
                        }}>
                          {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                        </p>
                      </div>
                      {/* Arrow */}
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedOp && (
          <OperatorDrawer
            op={selectedOp}
            onClose={() => setSelectedOp(null)}
            allMetas={metas}
            allRemessas={remessas}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

/* ── Ranking Card (extracted for performance) ── */
function RankingCard({ op, idx, isTop3, medalColor, maxLucro, onClick }) {
  const [hovered, setHovered] = useState(false)
  const avatarBg = isTop3
    ? `linear-gradient(135deg, ${medalColor}40, ${medalColor}15)`
    : op.lucroFinal >= 0
      ? 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.08))'
      : 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.08))'
  const avatarBorder = isTop3
    ? `${medalColor}50`
    : op.lucroFinal >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'

  return (
    <motion.div
      {...fadeUp(idx, 0.08)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: '20px 22px',
        background: isTop3
          ? `linear-gradient(145deg, ${medalColor}0c, transparent 60%)`
          : hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isTop3 ? `${medalColor}30` : hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 18,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px) scale(1.008)' : 'none',
        boxShadow: hovered
          ? isTop3
            ? `0 12px 40px rgba(0,0,0,0.35), 0 0 30px ${medalColor}12`
            : '0 12px 40px rgba(0,0,0,0.35)'
          : 'none',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Subtle glow for top 3 */}
      {isTop3 && (
        <div style={{
          position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle, ${medalColor}${hovered ? '18' : '0a'}, transparent 70%)`,
          transition: 'all 0.4s', pointerEvents: 'none',
        }} />
      )}

      {/* Top row: position + avatar + name + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        {/* Position */}
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: isTop3 ? `${medalColor}18` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isTop3 ? `${medalColor}35` : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800,
          color: isTop3 ? medalColor : 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--mono, monospace)',
          flexShrink: 0,
        }}>
          {idx + 1}
        </div>

        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: avatarBg,
          border: `1.5px solid ${avatarBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
          boxShadow: isTop3 && hovered ? `0 0 20px ${medalColor}20` : 'none',
          transition: 'box-shadow 0.3s',
        }}>
          {getInitial(op)}
        </div>

        {/* Name + badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
            {isTop3 && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                background: `${medalColor}15`, color: medalColor,
                border: `1px solid ${medalColor}25`, letterSpacing: '0.04em',
              }}>
                {medalLabels[idx]}
              </span>
            )}
            {!isTop3 && op.badge && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                color: op.badge.color, background: `${op.badge.color}10`,
                border: `1px solid ${op.badge.color}18`,
              }}>
                {op.badge.text}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              {op.closedCount} meta{op.closedCount !== 1 ? 's' : ''} fechada{op.closedCount !== 1 ? 's' : ''}
            </p>
            {op.trend !== 'stable' && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: op.trend === 'up' ? '#22c55e' : '#ef4444',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {op.trend === 'up' ? '↑' : '↓'}
                {op.trend === 'up' ? 'crescendo' : 'queda'}
              </span>
            )}
          </div>
        </div>

        {/* Right stats */}
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Depositantes</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.totalDeposit}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acerto</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: op.winRate >= 50 ? '#22c55e' : '#f59e0b', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.winRate.toFixed(0)}%</p>
          </div>
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro final</p>
            <p style={{
              fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'var(--mono, monospace)',
              color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444',
            }}>
              {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
            </p>
          </div>
        </div>
      </div>

      {/* Performance bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <PerfBar
          value={Math.abs(op.lucroFinal)}
          max={maxLucro}
          color={op.lucroFinal >= 0 ? '#22c55e' : '#ef4444'}
          delay={0.1 + idx * 0.06}
        />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--mono, monospace)', flexShrink: 0, minWidth: 34, textAlign: 'right' }}>
          {op.lucroPerRemessa !== undefined && op.remessasCount > 0 ? `R$${Number(op.lucroPerRemessa).toFixed(0)}/r` : '—'}
        </span>
      </div>
    </motion.div>
  )
}
