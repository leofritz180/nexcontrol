'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: base + i * 0.05, ease },
})

/* ── Score (secondary metric) ── */
const LEAGUES = [
  { name: 'Bronze', min: 0, max: 299 },
  { name: 'Prata', min: 300, max: 599 },
  { name: 'Ouro', min: 600, max: 899 },
  { name: 'Elite', min: 900, max: Infinity },
]
function getLeague(score) { return LEAGUES.find(l => score >= l.min && score <= l.max) || LEAGUES[0] }
function calcScore(op) {
  const lucroScore = Math.min(Math.max(op.lucroFinal / 50, 0), 400)
  const winScore = (op.winRate / 100) * 300
  const volumeScore = Math.min(op.closedCount * 15, 300)
  return Math.round(lucroScore + winScore + volumeScore)
}

/* ── Badges (max 1 shown, discrete) ── */
function getBadge(op) {
  if (op.winRate >= 70 && op.closedCount >= 3) return { text: 'Top performer', color: '#22c55e' }
  if (op.trend === 'up' && op.closedCount >= 3) return { text: 'Em alta', color: '#22c55e' }
  if (op.trend === 'down' && op.closedCount >= 3) return { text: 'Oscilando', color: '#f59e0b' }
  return null
}

/* ── Count-up ── */
function useCountUp(target, duration = 1200, decimals = 0) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const tick = now => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(target * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val)
}

/* ── KPI Card (clean) ── */
function KpiCard({ label, value, suffix, rgb, i, isCurrency, dynamicColor }) {
  const [h, setH] = useState(false)
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0
  const animated = useCountUp(numVal, 1400, isCurrency ? 2 : (suffix === '%' ? 1 : 0))
  const c = dynamicColor ? (numVal >= 0 ? '34,197,94' : '239,68,68') : rgb
  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '24px 22px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, rgba(${c},0.1), rgba(${c},0.02) 60%, transparent)`,
        border: `1px solid rgba(${c},${h ? 0.25 : 0.12})`,
        borderRadius: 16,
        boxShadow: h ? `0 0 40px rgba(${c},0.1), inset 0 1px 0 rgba(255,255,255,0.06)` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        transform: h ? 'translateY(-2px)' : 'none',
        transition: 'all 0.35s ease',
      }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: `rgb(${c})`, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--mono, monospace)' }}>
        {isCurrency ? `R$ ${Number(animated).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}` : animated}
        {suffix && <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 3 }}>{suffix}</span>}
      </p>
    </motion.div>
  )
}

/* ── Performance Bar (clean) ── */
function PerfBar({ value, max, delay = 0 }) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0
  const color = value >= 0 ? '#22c55e' : '#ef4444'
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flex: 1 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay, ease }}
        style={{ height: '100%', borderRadius: 2, background: color }}
      />
    </div>
  )
}

/* ── Mini Sparkline ── */
function MiniSparkline({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(Math.abs), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24, flexShrink: 0 }}>
      {data.map((v, i) => {
        const h = Math.max((Math.abs(v) / max) * 100, 8)
        return (
          <motion.div key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: i * 0.06, ease }}
            style={{
              width: 3, borderRadius: 1.5, minHeight: 2,
              background: v >= 0 ? '#22c55e' : '#ef4444',
              opacity: 0.35 + (i / data.length) * 0.65,
            }}
          />
        )
      })}
    </div>
  )
}

/* ── Live Alerts (clean, green/red only) ── */
function LiveAlerts({ alerts }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (alerts.length <= 1) return
    const iv = setInterval(() => setVisible(v => (v + 1) % alerts.length), 4500)
    return () => clearInterval(iv)
  }, [alerts.length])
  if (alerts.length === 0) return null
  const a = alerts[visible]
  const isUp = a.type === 'up'
  return (
    <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
      <AnimatePresence mode="wait">
        <motion.div key={visible}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
            background: isUp ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
            borderRadius: 12,
          }}>
          <span style={{ fontSize: 14, color: isUp ? '#22c55e' : '#ef4444', flexShrink: 0 }}>
            {isUp ? '↑' : '↓'}
          </span>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', margin: 0, flex: 1 }}>{a.text}</p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
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
  const score = op.score || 0
  const league = getLeague(score)
  const recentMetas = opClosed.slice(0, 10)

  const weeklyProfit = useMemo(() => {
    const weeks = []
    const now = Date.now()
    for (let w = 5; w >= 0; w--) {
      const start = now - (w + 1) * 7 * 86400000
      const end = now - w * 7 * 86400000
      weeks.push(opClosed.filter(m => {
        const d = new Date(m.created_at).getTime()
        return d >= start && d < end
      }).reduce((a, m) => a + Number(m.lucro_final || 0), 0))
    }
    return weeks
  }, [opClosed])

  const insights = useMemo(() => {
    const lines = []
    if (winRate >= 70) lines.push({ text: 'Alta taxa de acerto — operador consistente.', type: 'good' })
    else if (winRate < 40 && opClosed.length > 2) lines.push({ text: 'Taxa de acerto baixa. Revisar estrategia.', type: 'warn' })
    if (lucroPerRemessa > 50) lines.push({ text: `Eficiencia: R$ ${fmt(lucroPerRemessa)} por remessa.`, type: 'good' })
    else if (lucroPerRemessa < 0) lines.push({ text: 'Lucro por remessa negativo.', type: 'warn' })
    if (op.trend === 'up') lines.push({ text: 'Tendencia de crescimento.', type: 'good' })
    if (op.trend === 'down') lines.push({ text: 'Performance em queda.', type: 'warn' })
    if (lines.length === 0) lines.push({ text: 'Aguardando mais dados.', type: 'neutral' })
    return lines
  }, [winRate, lucroPerRemessa, op.trend, opClosed.length])

  let recommendation = null
  if (winRate >= 60 && lucroFinal > 0) recommendation = { text: 'Aumentar volume', desc: 'Boa consistencia. Escalar pode aumentar retorno.', color: '#22c55e' }
  else if (winRate < 45 && opClosed.length > 3) recommendation = { text: 'Reduzir exposicao', desc: 'Revisar redes e estrategia.', color: '#f59e0b' }
  else if (lucroFinal < 0) recommendation = { text: 'Pausar e revisar', desc: 'Resultado negativo.', color: '#ef4444' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
      <motion.div
        initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.3, ease }}
        style={{
          width: '100%', maxWidth: 420, height: '100%', overflowY: 'auto',
          background: 'linear-gradient(180deg, #0c1424, #080e1a)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 26px',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: lucroFinal >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${lucroFinal >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>{getInitial(op)}</div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{getName(op)}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{league.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--mono, monospace)' }}>{score} pts</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Lucro destaque */}
        <div style={{ marginBottom: 24, padding: '20px', borderRadius: 14, background: lucroFinal >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${lucroFinal >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Lucro final</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: lucroFinal >= 0 ? '#22c55e' : '#ef4444', margin: 0, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.03em' }}>
            {lucroFinal >= 0 ? '+' : ''}R$ {fmt(lucroFinal)}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
          {[
            { label: 'Acerto', value: `${winRate.toFixed(0)}%`, color: winRate >= 50 ? '#22c55e' : '#ef4444' },
            { label: 'Depositantes', value: totalDeposit, color: 'rgba(255,255,255,0.6)' },
            { label: 'Remessas', value: opRemessas.length, color: 'rgba(255,255,255,0.6)' },
            { label: 'Metas', value: opClosed.length, color: 'rgba(255,255,255,0.6)' },
            { label: 'Lucro/remessa', value: `R$${fmt(lucroPerRemessa)}`, color: lucroPerRemessa >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Score', value: score, color: 'rgba(255,255,255,0.4)' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0, fontFamily: 'var(--mono, monospace)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Weekly Evolution */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Evolucao semanal</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 50 }}>
            {weeklyProfit.map((v, i) => {
              const maxW = Math.max(...weeklyProfit.map(Math.abs), 1)
              const h = Math.max((Math.abs(v) / maxW) * 100, 5)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease }}
                    style={{ width: '100%', maxWidth: 20, borderRadius: 3, minHeight: 2, background: v >= 0 ? '#22c55e' : '#ef4444' }} />
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>S{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insights */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Insights</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{
                padding: '9px 12px', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              }}>{ins.text}</div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div style={{ padding: '16px 18px', borderRadius: 12, marginBottom: 24, background: `${recommendation.color}08`, border: `1px solid ${recommendation.color}18` }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Recomendacao</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: recommendation.color, margin: '0 0 3px' }}>{recommendation.text}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{recommendation.desc}</p>
          </div>
        )}

        {/* History */}
        {recentMetas.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Historico</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {recentMetas.map(m => {
                const lf = Number(m.lucro_final || 0)
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{m.rede || 'Rede'}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: 0 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: lf >= 0 ? '#22c55e' : '#ef4444' }}>
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

/* ═══════════════════════════════════════════════ */
/* ── Main Page ── */
/* ═══════════════════════════════════════════════ */
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
  const [invSaving, setInvSaving] = useState(false)
  const [invMsg, setInvMsg] = useState('')

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

  async function sendInvite() {
    if (!profile?.tenant_id) return
    setInvSaving(true); setInvMsg('')
    const { data, error: err } = await supabase.from('invites').insert({
      tenant_id: profile.tenant_id,
      role: 'operator',
    }).select().single()
    setInvSaving(false)
    if (err) { setInvMsg('Erro: ' + err.message); return }
    const link = `${window.location.origin}/invite?token=${data.token}`
    await navigator.clipboard.writeText(link)
    setInvMsg('Link copiado!')
    setTimeout(() => setInvMsg(''), 4000)
  }

  const closedMetas = useMemo(() => metas.filter(m => m.status_fechamento === 'fechada'), [metas])

  const operatorStats = useMemo(() => {
    return operators.map(op => {
      const opMetas = metas.filter(m => m.operator_id === op.id)
      const opClosed = closedMetas.filter(m => m.operator_id === op.id)
      const metaIds = new Set(opMetas.map(m => m.id))
      const opRemessas = remessas.filter(r => metaIds.has(r.meta_id))
      const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
      const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const activeMetas = opMetas.filter(m => m.status === 'ativa' || m.status === 'em_andamento')
      const winMetas = opClosed.filter(m => Number(m.lucro_final || 0) > 0).length
      const winRate = opClosed.length > 0 ? (winMetas / opClosed.length) * 100 : 0
      const lastActivity = opRemessas.length > 0 ? new Date(opRemessas[0].created_at) : (opMetas.length > 0 ? new Date(opMetas[0].created_at) : null)
      const isActive = lastActivity && (Date.now() - lastActivity.getTime()) < 7 * 24 * 60 * 60 * 1000
      const lucroPerRemessa = opRemessas.length > 0 ? lucroFinal / opRemessas.length : 0

      const recent3 = opClosed.slice(0, 3).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const prev3 = opClosed.slice(3, 6).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const trend = opClosed.length >= 4 ? (recent3 >= prev3 ? 'up' : 'down') : 'stable'

      const sparkline = []
      const now = Date.now()
      for (let w = 5; w >= 0; w--) {
        const start = now - (w + 1) * 7 * 86400000
        const end = now - w * 7 * 86400000
        sparkline.push(opClosed.filter(m => { const d = new Date(m.created_at).getTime(); return d >= start && d < end })
          .reduce((a, m) => a + Number(m.lucro_final || 0), 0))
      }

      const base = { ...op, metasCount: opMetas.length, closedCount: opClosed.length, remessasCount: opRemessas.length,
        totalDeposit, lucroFinal, activeMetas: activeMetas.length, winRate, isActive, lucroPerRemessa, trend, sparkline }
      base.score = calcScore(base)
      base.badge = getBadge(base)
      return base
    })
  }, [operators, metas, closedMetas, remessas])

  // RANKING BY LUCRO FINAL (not score)
  const ranking = useMemo(() =>
    [...operatorStats].filter(o => o.closedCount > 0).sort((a, b) => b.lucroFinal - a.lucroFinal),
    [operatorStats]
  )

  const maxLucro = useMemo(() => ranking.length > 0 ? Math.max(...ranking.map(o => Math.abs(o.lucroFinal)), 1) : 1, [ranking])
  const totalActive = useMemo(() => operatorStats.filter(o => o.activeMetas > 0).length, [operatorStats])
  const totalLucro = useMemo(() => closedMetas.reduce((a, m) => a + Number(m.lucro_final || 0), 0), [closedMetas])
  const avgWinRate = useMemo(() => {
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length === 0) return 0
    return withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
  }, [operatorStats])

  const alerts = useMemo(() => {
    const a = []
    if (ranking.length > 0) a.push({ text: `${getName(ranking[0])} lidera com R$ ${fmt(ranking[0].lucroFinal)} de lucro.`, type: 'up' })
    const falling = operatorStats.filter(o => o.trend === 'down' && o.lucroFinal < 0)
    if (falling.length > 0) a.push({ text: `${getName(falling[0])} em queda — resultado negativo.`, type: 'down' })
    const rising = operatorStats.filter(o => o.trend === 'up' && o.closedCount >= 3)
    if (rising.length > 0) a.push({ text: `${getName(rising[0])} em tendencia de crescimento.`, type: 'up' })
    return a
  }, [ranking, operatorStats])

  const insights = useMemo(() => {
    const lines = []
    if (ranking.length > 0) lines.push({ text: `${getName(ranking[0])} lidera com R$ ${fmt(ranking[0].lucroFinal)} de lucro.`, type: 'up' })
    const evolving = operatorStats.filter(o => o.trend === 'up' && o.closedCount >= 3)
    if (evolving.length > 0) lines.push({ text: `${evolving.length} operador(es) em crescimento.`, type: 'up' })
    const risk = operatorStats.filter(o => o.trend === 'down' && o.lucroFinal < 0)
    if (risk.length > 0) lines.push({ text: `${getName(risk[0])} precisa de atencao — lucro negativo.`, type: 'down' })
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length > 0) {
      const avg = withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
      lines.push({ text: `Media de acerto: ${avg.toFixed(1)}%`, type: avg >= 50 ? 'up' : 'down' })
    }
    const inactive = operatorStats.filter(o => !o.isActive && o.metasCount > 0)
    if (inactive.length > 0) lines.push({ text: `${inactive.length} operador(es) inativo(s) ha 7+ dias.`, type: 'warn' })
    if (lines.length === 0) lines.push({ text: 'Sem dados suficientes.', type: 'neutral' })
    return lines
  }, [ranking, operatorStats])

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0c1424, #080e1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando...</p>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { key: 'ranking', label: 'Ranking' },
    { key: 'equipe', label: 'Equipe' },
    { key: 'config', label: 'Configuracoes' },
  ]

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 4px' }}>Operadores</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Ranking por lucro e performance individual da equipe.</p>
        </motion.div>

        {/* Alerts */}
        <LiveAlerts alerts={alerts} />

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
          <KpiCard label="Total operadores" value={operators.length} rgb="59,130,246" i={0} />
          <KpiCard label="Ativos" value={totalActive} rgb="34,197,94" i={1} />
          <KpiCard label="Acerto medio" value={avgWinRate} suffix="%" rgb="168,85,247" i={2} />
          <KpiCard label="Lucro da equipe" value={totalLucro} rgb="34,197,94" i={3} isCurrency dynamicColor />
        </div>

        {/* Tabs */}
        <motion.div {...fadeUp(1)} style={{
          display: 'flex', gap: 4, marginBottom: 32,
          background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 600,
                borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s ease',
              }}>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* RANKING */}
        {tab === 'ranking' && (
          <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {ranking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 28 }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Nenhuma meta fechada ainda.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {ranking.map((op, idx) => (
                  <RankingCard key={op.id} op={op} idx={idx} maxLucro={maxLucro} onClick={() => setSelectedOp(op)} />
                ))}
              </div>
            )}

            {/* Insights */}
            <motion.div {...fadeUp(3)} style={{
              background: 'rgba(168,85,247,0.04)',
              border: '1px solid rgba(168,85,247,0.1)',
              borderRadius: 14, padding: '22px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Radar da equipe</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, color: ins.type === 'up' ? '#22c55e' : ins.type === 'down' ? '#ef4444' : ins.type === 'warn' ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                      {ins.type === 'up' ? '↑' : ins.type === 'down' ? '↓' : ins.type === 'warn' ? '!' : '•'}
                    </span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{ins.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* EQUIPE */}
        {tab === 'equipe' && (
          <motion.div key="equipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
              {invMsg && (
                <span style={{ fontSize: 12, fontWeight: 600, color: invMsg.startsWith('Erro') ? '#ef4444' : '#22c55e' }}>{invMsg}</span>
              )}
              <button onClick={sendInvite} disabled={invSaving} style={{
                padding: '9px 18px', fontSize: 13, fontWeight: 600,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 10, color: '#22c55e', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s ease',
                opacity: invSaving ? 0.6 : 1,
              }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                {invSaving ? 'Gerando...' : 'Gerar link de convite'}
              </button>
            </motion.div>

            {operators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Nenhum operador na equipe.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {operatorStats.map((op, idx) => (
                  <motion.div key={op.id} {...fadeUp(idx, 0.04)}
                    onClick={() => setSelectedOp(op)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 14, cursor: 'pointer', transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: op.lucroFinal >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${op.lucroFinal >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>{getInitial(op)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{op.email}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444' }}>
                        {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                      </p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{op.metasCount} metas</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* CONFIG */}
        {tab === 'config' && (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

            {/* Modelo de operacao padrao */}
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Modelo de operacao padrao</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Pode ser alterado por meta</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'salario_bau', label: 'Salario + Bau', desc: 'Com contrato de plataforma' },
                  { key: 'apenas_bau', label: 'Apenas Bau', desc: 'Sem contrato, lucro so do bau' },
                ].map(opt => {
                  const active = (tenant?.operation_model || 'salario_bau') === opt.key
                  return (
                    <button key={opt.key} onClick={async () => {
                      await supabase.from('tenants').update({ operation_model: opt.key }).eq('id', profile.tenant_id)
                      setTenant(prev => ({ ...prev, operation_model: opt.key }))
                    }} style={{
                      flex: 1, padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(229,57,53,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.05)'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: active ? '#e53935' : 'rgba(255,255,255,0.5)', margin: '0 0 3px' }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: active ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.2)', margin: 0 }}>{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pagamento de operadores */}
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Pagamento de operadores</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {[
                  { key: 'fixo_dep', label: 'Fixo por depositante', desc: 'Ex: R$ 2,00 por dep' },
                  { key: 'percentual', label: '% do lucro final', desc: 'Ex: 15% do lucro' },
                ].map(opt => {
                  const active = (tenant?.operator_payment_model || 'fixo_dep') === opt.key
                  return (
                    <button key={opt.key} onClick={async () => {
                      await supabase.from('tenants').update({ operator_payment_model: opt.key }).eq('id', profile.tenant_id)
                      setTenant(prev => ({ ...prev, operator_payment_model: opt.key }))
                    }} style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: active ? '#22c55e' : 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>{opt.label}</p>
                      <p style={{ fontSize: 10, color: active ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.2)', margin: 0 }}>{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  {(tenant?.operator_payment_model || 'fixo_dep') === 'fixo_dep' ? 'Valor por dep (R$)' : 'Percentual (%)'}
                </label>
                <input className="input" type="number" step="0.01" min="0"
                  value={tenant?.operator_payment_value ?? 2}
                  onChange={async (e) => {
                    const val = Number(e.target.value)
                    await supabase.from('tenants').update({ operator_payment_value: val }).eq('id', profile.tenant_id)
                    setTenant(prev => ({ ...prev, operator_payment_value: val }))
                  }}
                  style={{ padding: '8px 12px', fontSize: 14, maxWidth: 100 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedOp && (
          <OperatorDrawer op={selectedOp} onClose={() => setSelectedOp(null)} allMetas={metas} allRemessas={remessas} />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

/* ═══════════════════════════════════════════════ */
/* ── Ranking Card — clean, lucro-focused ── */
/* ═══════════════════════════════════════════════ */
function RankingCard({ op, idx, maxLucro, onClick }) {
  const [h, setH] = useState(false)
  const isTop1 = idx === 0
  const isTop3 = idx < 3
  const badge = op.badge
  const score = op.score || 0
  const league = getLeague(score)

  return (
    <motion.div
      {...fadeUp(idx, 0.06)}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '20px 22px', borderRadius: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        background: isTop1
          ? h ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.03)'
          : h ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isTop1
          ? h ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.1)'
          : h ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        transform: h ? 'translateY(-2px)' : 'none',
        boxShadow: h && isTop1 ? '0 0 30px rgba(34,197,94,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Row: Position + Avatar + Name/Badge + Sparkline + Lucro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        {/* Position */}
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: isTop3 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid rgba(255,255,255,0.06)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: isTop3 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
          fontFamily: 'var(--mono, monospace)',
        }}>
          {idx + 1}
        </div>

        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: op.lucroFinal >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${op.lucroFinal >= 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 800, color: '#fff',
        }}>
          {getInitial(op)}
        </div>

        {/* Name + trend + badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
            {op.trend !== 'stable' && (
              <span style={{ fontSize: 11, fontWeight: 600, color: op.trend === 'up' ? '#22c55e' : '#ef4444' }}>
                {op.trend === 'up' ? '↑' : '↓'}
              </span>
            )}
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                color: badge.color, background: `${badge.color}0c`,
                border: `1px solid ${badge.color}15`,
              }}>{badge.text}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{op.closedCount} meta{op.closedCount !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--mono, monospace)' }}>{league.name} {score}pts</span>
          </div>
        </div>

        {/* Sparkline */}
        <MiniSparkline data={op.sparkline} />

        {/* Lucro — BIGGEST */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 110 }}>
          <p style={{
            fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'var(--mono, monospace)',
            color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444',
            letterSpacing: '-0.02em',
          }}>
            {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
          </p>
        </div>
      </div>

      {/* Performance bar */}
      <PerfBar value={op.lucroFinal} max={maxLucro} delay={0.05 + idx * 0.04} />
    </motion.div>
  )
}
