'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

/* ── CountUp animation ── */
function CountUp({ value, prefix = '', suffix = '', duration = 1200, integer = false }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  useEffect(() => {
    const num = Math.abs(Number(value || 0))
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = num * ease
      setDisplay(integer ? String(Math.round(current)) : current.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration, integer])
  return <span>{prefix}{display}{suffix}</span>
}

/* ── SVG Icons ── */
function IconTarget() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
}
function IconCheck() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
}
function IconLock() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
}
function IconUsers() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function IconBox() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
}
function IconPercent() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
}
function IconAward() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
}
function IconAlert() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function IconTrophy() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
}
function IconClock() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function IconZap() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
}
function IconPlay() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
}
function IconRefresh() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
}
function IconStar() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}
function IconGamepad() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" /><rect x="2" y="6" width="20" height="12" rx="2" /></svg>
}

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] }
  })
}

/* ── KPI Card ── */
function KpiCard({ icon, label, value, sub, prefix, suffix, integer, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{
        padding: '22px 24px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--b1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--raised)',
          border: '1px solid var(--b1)',
          color: 'var(--t2)',
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{
        fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800,
        color: 'var(--t2)', margin: 0, lineHeight: 1, letterSpacing: '-0.02em'
      }}>
        <CountUp value={Math.abs(Number(value || 0))} prefix={prefix || ''} suffix={suffix || ''} integer />
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 10 }}>{sub}</p>}
    </motion.div>
  )
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const cfg = {
    ativa: { bg: 'rgba(236,253,245,0.12)', color: '#ECFDF5', border: 'rgba(236,253,245,0.25)', label: 'ATIVA' },
    finalizada: { bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.78)', border: 'rgba(255,255,255,0.25)', label: 'Finalizada' },
    fechada: { bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.78)', border: 'rgba(255,255,255,0.25)', label: 'Fechada' },
  }
  const c = cfg[status] || cfg.ativa
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      letterSpacing: '0.03em',
    }}>
      {c.label}
    </span>
  )
}

/* ── Rede badge ── */
function RedeBadge({ rede }) {
  if (!rede) return null
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
      background: 'rgba(229,57,53,0.1)', color: '#e53935',
      border: '1px solid rgba(229,57,53,0.2)',
    }}>
      {rede}
    </span>
  )
}

/* ── Achievement badge ── */
function AchievementBadge({ label, achieved, current, target, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      style={{
        padding: '16px 18px',
        borderRadius: 12,
        background: achieved ? 'rgba(236,253,245,0.06)' : 'var(--surface)',
        border: `1px solid ${achieved ? 'rgba(236,253,245,0.2)' : 'var(--b1)'}`,
        boxShadow: achieved ? '0 0 20px rgba(236,253,245,0.06)' : 'none',
        opacity: achieved ? 1 : 0.6,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: achieved ? 0 : 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: achieved ? 'rgba(236,253,245,0.15)' : 'var(--raised)',
          border: `1px solid ${achieved ? 'rgba(236,253,245,0.3)' : 'var(--b1)'}`,
          color: achieved ? '#ECFDF5' : 'var(--t4)',
        }}>
          {achieved ? <IconCheck /> : <IconLock />}
        </div>
        <span style={{
          fontSize: 13, fontWeight: achieved ? 700 : 500,
          color: achieved ? '#ECFDF5' : 'var(--t4)',
          flex: 1,
        }}>
          {label}
        </span>
      </div>
      {!achieved && target > 0 && (
        <div>
          <div style={{
            width: '100%', height: 4, borderRadius: 2,
            background: 'var(--b1)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min((current / target) * 100, 100)}%`,
              height: '100%', borderRadius: 2,
              background: 'var(--t4)',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4, textAlign: 'right' }}>
            {current}/{target}
          </p>
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function PerformancePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [allOperatorStats, setAllOperatorStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function load() {
    setLoading(true)
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(p)

    const isAdmin = p?.role === 'admin'

    // Load metas: operator sees own, admin sees all
    let metaQuery = supabase.from('metas').select('*').order('created_at', { ascending: false })
    if (!isAdmin) {
      metaQuery = metaQuery.eq('operator_id', u.id)
    }
    const { data: m } = await metaQuery
    const activeMetas = (m || []).filter(x => !x.deleted_at)
    setMetas(activeMetas)

    // Load remessas for these metas
    const metaIds = activeMetas.map(x => x.id)
    let allRem = []
    if (metaIds.length > 0) {
      const { data: r } = await supabase.from('remessas').select('id,meta_id,deposito,saque,resultado,contas_remessa,slot_name,status_problema,created_at').in('meta_id', metaIds).order('created_at', { ascending: false })
      allRem = r || []
    }
    setRemessas(allRem)

    // For admin: load all operators' stats for ranking
    if (isAdmin && p?.tenant_id) {
      const { data: allMetas } = await supabase.from('metas').select('operator_id,quantidade_contas,status_fechamento,deleted_at').eq('tenant_id', p.tenant_id)
      const filtered = (allMetas || []).filter(x => !x.deleted_at)
      const byOp = {}
      filtered.forEach(mt => {
        if (!byOp[mt.operator_id]) byOp[mt.operator_id] = { deps: 0, fechadas: 0 }
        byOp[mt.operator_id].deps += Number(mt.quantidade_contas || 0)
        if (mt.status_fechamento === 'fechada') byOp[mt.operator_id].fechadas++
      })
      const ranking = Object.entries(byOp)
        .map(([id, s]) => ({ id, ...s }))
        .sort((a, b) => b.deps - a.deps)
      setAllOperatorStats(ranking)
    }

    setLoading(false)
  }

  /* ── For operator-specific view: filter metas to current user only ── */
  const myMetas = useMemo(() => {
    if (!profile || profile.role === 'admin') return metas
    return metas.filter(m => m.operator_id === user?.id)
  }, [metas, profile, user])

  /* ── KPI stats ── */
  const stats = useMemo(() => {
    const fechadas = myMetas.filter(m => m.status_fechamento === 'fechada')
    const totalDeps = myMetas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const totalRem = remessas.filter(r => myMetas.some(m => m.id === r.meta_id)).length
    const taxa = myMetas.length > 0 ? Math.round((fechadas.length / myMetas.length) * 100) : 0
    return {
      totalMetas: myMetas.length,
      fechadas: fechadas.length,
      totalDeps,
      totalRem,
      taxa,
    }
  }, [myMetas, remessas])

  /* ── Evolution: last 20 closed metas ── */
  const evolution = useMemo(() => {
    return myMetas
      .filter(m => m.status_fechamento === 'fechada')
      .slice(0, 20)
      .map(m => {
        const mRem = remessas.filter(r => r.meta_id === m.id)
        return {
          ...m,
          remCount: mRem.length,
          date: new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        }
      })
  }, [myMetas, remessas])

  /* ── Personal ranking stats ── */
  const rankingStats = useMemo(() => {
    const fechadas = myMetas.filter(m => m.status_fechamento === 'fechada')
    const totalDeps = myMetas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const mediaDeps = fechadas.length > 0 ? Math.round(totalDeps / fechadas.length) : 0

    // Best meta by depositantes
    let melhorMeta = null
    let maxDeps = 0
    myMetas.forEach(m => {
      const d = Number(m.quantidade_contas || 0)
      if (d > maxDeps) { maxDeps = d; melhorMeta = m }
    })

    // Fastest meta (fewest remessas among closed)
    let metaRapida = null
    let minRem = Infinity
    fechadas.forEach(m => {
      const count = remessas.filter(r => r.meta_id === m.id).length
      if (count < minRem && count > 0) { minRem = count; metaRapida = m }
    })

    // Ranking position (admin only)
    let position = null
    if (allOperatorStats.length > 0 && user?.id) {
      const idx = allOperatorStats.findIndex(s => s.id === user.id)
      if (idx >= 0) position = idx + 1
    }

    return { totalDeps, mediaDeps, melhorMeta, maxDeps, metaRapida, minRem: minRem === Infinity ? 0 : minRem, position, totalOperators: allOperatorStats.length }
  }, [myMetas, remessas, allOperatorStats, user])

  /* ── Achievements ── */
  const achievements = useMemo(() => {
    const closedCount = myMetas.filter(m => m.status_fechamento === 'fechada').length
    const totalDeps = myMetas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const totalRem = remessas.filter(r => myMetas.some(m => m.id === r.meta_id)).length
    return [
      { label: 'Primeira meta', achieved: myMetas.length >= 1, current: myMetas.length, target: 1 },
      { label: '5 metas fechadas', achieved: closedCount >= 5, current: closedCount, target: 5 },
      { label: '10 metas fechadas', achieved: closedCount >= 10, current: closedCount, target: 10 },
      { label: '25 metas fechadas', achieved: closedCount >= 25, current: closedCount, target: 25 },
      { label: '50 depositantes', achieved: totalDeps >= 50, current: totalDeps, target: 50 },
      { label: '100 depositantes', achieved: totalDeps >= 100, current: totalDeps, target: 100 },
      { label: '250 depositantes', achieved: totalDeps >= 250, current: totalDeps, target: 250 },
      { label: '500 depositantes', achieved: totalDeps >= 500, current: totalDeps, target: 500 },
      { label: '1000 depositantes', achieved: totalDeps >= 1000, current: totalDeps, target: 1000 },
      { label: '10 remessas', achieved: totalRem >= 10, current: totalRem, target: 10 },
      { label: '50 remessas', achieved: totalRem >= 50, current: totalRem, target: 50 },
      { label: '100 remessas', achieved: totalRem >= 100, current: totalRem, target: 100 },
    ]
  }, [myMetas, remessas])

  /* ── Slot stats ── */
  const slotStats = useMemo(() => {
    const groups = {}
    remessas.forEach(r => {
      if (!r.slot_name) return
      if (!groups[r.slot_name]) groups[r.slot_name] = { name: r.slot_name, total: 0, count: 0, contas: 0 }
      groups[r.slot_name].total += Number(r.resultado || 0)
      groups[r.slot_name].count++
      groups[r.slot_name].contas += Number(r.contas_remessa || 0)
    })
    return Object.values(groups)
      .filter(s => s.count >= 2)
      .map(s => ({ ...s, perConta: s.contas > 0 ? s.total / s.contas : 0 }))
      .sort((a, b) => b.perConta - a.perConta)
  }, [remessas])

  /* ── Active alerts ── */
  const alertas = useMemo(() => {
    const myMetaIds = new Set(myMetas.map(m => m.id))
    const myRem = remessas.filter(r => myMetaIds.has(r.meta_id))
    const probs = myRem.filter(r => r.status_problema && r.status_problema !== 'normal')
    const sp = probs.filter(r => r.status_problema === 'saque_pendente')
    const cb = probs.filter(r => r.status_problema === 'conta_bloqueada')
    const ba = probs.filter(r => r.status_problema === 'banco_analise')
    return { total: probs.length, sp, cb, ba }
  }, [myMetas, remessas])

  /* ── Active metas ── */
  const activeMetas = useMemo(() => {
    return myMetas.filter(m => (m.status || 'ativa') === 'ativa' && m.status_fechamento !== 'fechada')
  }, [myMetas])

  /* ── Helper: progress for active metas ── */
  function getMetaProgress(meta) {
    const mRem = remessas.filter(r => r.meta_id === meta.id)
    const totalDep = mRem.reduce((a, r) => a + Number(r.deposito || 0), 0)
    // Progress based on remessas count vs contas
    const target = Number(meta.quantidade_contas || 10)
    const depositCount = mRem.filter(r => Number(r.deposito || 0) > 0).length
    return { depositCount, target, pct: target > 0 ? Math.min(Math.round((depositCount / target) * 100), 100) : 0 }
  }

  /* ── Section heading ── */
  function SectionHead({ icon, title, index }) {
    return (
      <motion.div
        custom={index}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, marginTop: 40 }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--raised)', border: '1px solid var(--b1)', color: 'var(--t2)',
        }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
      </motion.div>
    )
  }

  /* ═══════ RENDER ═══════ */
  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>

          {/* ── HEADER ── */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}
          >
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)', margin: '0 0 4px' }}>
                Performance
              </h1>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
                Acompanhe sua evolucao e conquistas
              </p>
            </div>
            <button
              onClick={load}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', fontSize: 13, fontWeight: 500,
                color: 'var(--t2)', background: 'transparent',
                border: '1px solid var(--b2)', borderRadius: 10,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <IconRefresh /> Atualizar
            </button>
          </motion.div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 28, height: 28, border: '2.5px solid var(--b2)', borderTopColor: 'var(--brand)', borderRadius: '50%' }}
              />
            </div>
          ) : (
            <>
              {/* ══════ SECTION 1: KPI CARDS ══════ */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 14,
              }}>
                <KpiCard icon={<IconTarget />} label="Total de metas" value={stats.totalMetas} integer index={0} />
                <KpiCard icon={<IconCheck />} label="Metas fechadas" value={stats.fechadas} integer index={1} />
                <KpiCard icon={<IconUsers />} label="Total depositantes" value={stats.totalDeps} integer index={2} />
                <KpiCard icon={<IconBox />} label="Total remessas" value={stats.totalRem} integer index={3} />
                <KpiCard icon={<IconPercent />} label="Taxa de conclusao" value={stats.taxa} suffix="%" integer index={4} />
              </div>

              {/* ══════ SECTION 2: EVOLUCAO ══════ */}
              <SectionHead icon={<IconClock />} title="Evolucao" index={5} />
              <motion.div
                custom={6}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                style={{
                  borderRadius: 14,
                  background: 'var(--surface)',
                  border: '1px solid var(--b1)',
                  overflow: 'hidden',
                }}
              >
                {evolution.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--t4)' }}>Nenhuma meta fechada ainda</p>
                  </div>
                ) : (
                  evolution.map((m, i) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                        padding: '14px 20px',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        borderBottom: i < evolution.length - 1 ? '1px solid var(--b1)' : 'none',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--mono)', minWidth: 64 }}>{m.date}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', flex: 1, minWidth: 120 }}>{m.titulo}</span>
                      <RedeBadge rede={m.rede} />
                      <span style={{ fontSize: 11, color: 'var(--t3)', minWidth: 80 }}>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--t2)', fontWeight: 600 }}>{m.quantidade_contas || 0}</span> contas
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', minWidth: 80 }}>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--t2)', fontWeight: 600 }}>{m.remCount}</span> remessas
                      </span>
                      <StatusBadge status="fechada" />
                    </div>
                  ))
                )}
              </motion.div>

              {/* ══════ SECTION 3: RANKING PESSOAL ══════ */}
              <SectionHead icon={<IconTrophy />} title="Ranking pessoal" index={7} />
              <motion.div
                custom={8}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}
              >
                {/* Total depositantes */}
                <div style={{
                  padding: '24px', borderRadius: 14,
                  background: 'var(--surface)', border: '1px solid var(--b1)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seus depositantes totais</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, color: 'var(--t1)', margin: 0, lineHeight: 1 }}>
                    <CountUp value={rankingStats.totalDeps} integer />
                  </p>
                </div>

                {/* Media por meta */}
                <div style={{
                  padding: '24px', borderRadius: 14,
                  background: 'var(--surface)', border: '1px solid var(--b1)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Media por meta</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, color: 'var(--t1)', margin: 0, lineHeight: 1 }}>
                    <CountUp value={rankingStats.mediaDeps} integer />
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 6 }}>depositantes / meta fechada</p>
                </div>

                {/* Melhor meta */}
                <div style={{
                  padding: '24px', borderRadius: 14,
                  background: 'var(--surface)', border: '1px solid var(--b1)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Melhor meta</p>
                  {rankingStats.melhorMeta ? (
                    <>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, color: 'var(--t1)', margin: 0, lineHeight: 1 }}>
                        <CountUp value={rankingStats.maxDeps} integer />
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>{rankingStats.melhorMeta.titulo}</p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>--</p>
                  )}
                </div>

                {/* Meta mais rapida */}
                <div style={{
                  padding: '24px', borderRadius: 14,
                  background: 'var(--surface)', border: '1px solid var(--b1)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Meta mais rapida</p>
                  {rankingStats.metaRapida ? (
                    <>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, color: 'var(--t1)', margin: 0, lineHeight: 1 }}>
                        <CountUp value={rankingStats.minRem} integer />
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>{rankingStats.metaRapida.titulo} ({rankingStats.minRem} remessas)</p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>--</p>
                  )}
                </div>

                {/* Admin ranking position */}
                {profile?.role === 'admin' && rankingStats.position && (
                  <div style={{
                    padding: '24px', borderRadius: 14,
                    background: 'rgba(229,57,53,0.04)', border: '1px solid rgba(229,57,53,0.15)',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sua posicao no ranking</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, color: '#e53935', margin: 0, lineHeight: 1 }}>
                      {rankingStats.position}°
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>de {rankingStats.totalOperators} operadores</p>
                  </div>
                )}
              </motion.div>

              {/* ══════ SECTION 4: CONQUISTAS ══════ */}
              <SectionHead icon={<IconAward />} title="Conquistas" index={9} />
              <motion.div
                custom={10}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                {achievements.map((a, i) => (
                  <AchievementBadge key={a.label} label={a.label} achieved={a.achieved} current={a.current} target={a.target} index={10 + i} />
                ))}
              </motion.div>

              {/* ══════ SECTION 4.5: SEUS SLOTS ══════ */}
              {slotStats.length > 0 && (
                <>
                  <SectionHead icon={<IconGamepad />} title="Seus Slots" index={15} />
                  <motion.div
                    custom={16}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {/* Best slot */}
                    <div style={{
                      padding: '16px 20px', borderRadius: 12,
                      background: 'rgba(236,253,245,0.06)', border: '1px solid rgba(236,253,245,0.2)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(236,253,245,0.15)', border: '1px solid rgba(236,253,245,0.3)',
                        color: '#ECFDF5',
                      }}>
                        <IconStar />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ECFDF5' }}>
                        {slotStats[0].name}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                        — seu melhor slot (R$ {slotStats[0].perConta.toFixed(0)}/conta)
                      </span>
                    </div>

                    {/* Worst slot warning */}
                    {slotStats.length > 1 && slotStats[slotStats.length - 1].perConta < -8 && (
                      <div style={{
                        padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                          color: 'rgba(255,255,255,0.78)',
                        }}>
                          <IconAlert />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>
                          {slotStats[slotStats.length - 1].name}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                          — considere evitar (R$ {slotStats[slotStats.length - 1].perConta.toFixed(0)}/conta)
                        </span>
                      </div>
                    )}

                    {/* All slots list */}
                    <motion.div
                      custom={17}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      style={{
                        borderRadius: 14,
                        background: 'var(--surface)',
                        border: '1px solid var(--b1)',
                        overflow: 'hidden',
                      }}
                    >
                      {slotStats.map((s, i) => (
                        <div
                          key={s.name}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 20px',
                            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                            borderBottom: i < slotStats.length - 1 ? '1px solid var(--b1)' : 'none',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', flex: 1, minWidth: 120 }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--t3)', minWidth: 80 }}>
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--t2)', fontWeight: 600 }}>{s.count}</span> remessas
                          </span>
                          <span style={{
                            fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 700, minWidth: 90, textAlign: 'right',
                            color: s.perConta >= 0 ? '#ECFDF5' : '#EF4444',
                          }}>
                            R$ {s.perConta.toFixed(0)}/conta
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                </>
              )}

              {/* ══════ SECTION 5: ALERTAS ATIVOS ══════ */}
              {alertas.total > 0 && (
                <>
                  <SectionHead icon={<IconAlert />} title="Alertas ativos" index={22} />
                  <motion.div
                    custom={23}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 14,
                    }}
                  >
                    {alertas.sp.length > 0 && (
                      <div style={{
                        padding: '20px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.78)' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>Saques pendentes</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
                            padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.78)',
                          }}>
                            {alertas.sp.length}
                          </span>
                        </div>
                        {alertas.sp.slice(0, 5).map(r => (
                          <div key={r.id} style={{ fontSize: 11, color: 'var(--t3)', padding: '3px 0' }}>
                            Remessa #{String(r.id).slice(-6)} - {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        ))}
                        {alertas.sp.length > 5 && (
                          <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>+{alertas.sp.length - 5} mais</p>
                        )}
                      </div>
                    )}

                    {alertas.cb.length > 0 && (
                      <div style={{
                        padding: '20px', borderRadius: 14,
                        background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>Contas bloqueadas</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
                            padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                          }}>
                            {alertas.cb.length}
                          </span>
                        </div>
                      </div>
                    )}

                    {alertas.ba.length > 0 && (
                      <div style={{
                        padding: '20px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.78)' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>Bancos em analise</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
                            padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.78)',
                          }}>
                            {alertas.ba.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </>
              )}

              {/* ══════ SECTION 6: METAS ATIVAS ══════ */}
              {activeMetas.length > 0 && (
                <>
                  <SectionHead icon={<IconZap />} title="Metas ativas" index={24} />
                  <motion.div
                    custom={25}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 14,
                      marginBottom: 40,
                    }}
                  >
                    {activeMetas.map((m) => {
                      const prog = getMetaProgress(m)
                      return (
                        <div
                          key={m.id}
                          style={{
                            padding: '20px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                            transition: 'border-color 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', flex: 1 }}>{m.titulo}</span>
                            <RedeBadge rede={m.rede} />
                          </div>

                          {/* Progress bar */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: 'var(--t4)' }}>{prog.depositCount} / {prog.target} depositos</span>
                              <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{prog.pct}%</span>
                            </div>
                            <div style={{
                              width: '100%', height: 6, borderRadius: 3,
                              background: 'var(--b1)', overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${prog.pct}%`,
                                height: '100%', borderRadius: 3,
                                background: prog.pct >= 80 ? '#ECFDF5' : prog.pct >= 50 ? 'rgba(255,255,255,0.78)' : '#e53935',
                                transition: 'width 0.6s ease',
                              }} />
                            </div>
                          </div>

                          <button
                            onClick={() => router.push(`/meta/${m.id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              width: '100%', padding: '9px 16px',
                              fontSize: 12, fontWeight: 700,
                              color: '#fff', background: '#e53935',
                              border: 'none', borderRadius: 8,
                              cursor: 'pointer', transition: 'opacity 0.2s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <IconPlay /> Continuar
                          </button>
                        </div>
                      )
                    })}
                  </motion.div>
                </>
              )}

              {/* Bottom spacer */}
              <div style={{ height: 40 }} />
            </>
          )}
        </div>
      </AppLayout>
    </main>
  )
}
