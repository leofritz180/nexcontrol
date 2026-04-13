'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { notifyMetaCreated } from '../../lib/notify'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

function CountUp({ value, prefix='', suffix='', duration=1200, integer=false }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  useEffect(() => {
    const num = Math.abs(Number(value||0))
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now-start)/duration, 1)
      const ease = 1-Math.pow(1-progress,3)
      const current = num*ease
      setDisplay(integer ? String(Math.round(current)) : fmt(current))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration, integer])
  return <span>{prefix}{display}{suffix}</span>
}

/* ── SVG Icons (inline, lightweight) ── */
function IconRefresh() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
}
function IconPlus() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function IconBolt() {
  return <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
}
function IconChevron() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
}
function IconDown({ open }) {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transition:'transform 0.25s ease', transform:open?'rotate(180deg)':'rotate(0)' }}><polyline points="6 9 12 15 18 9"/></svg>
}
function IconTarget() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}
function IconBox() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function IconUsers() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconPercent() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
}
function IconAward() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
}
function IconAlert() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function IconCheck() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconLock() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
function IconPlay() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
}

/* ── Fade up animation variant ── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] }
  })
}

/* ── KPI Card component ── */
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
        transition: 'box-shadow 0.3s ease',
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
        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{
        fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800,
        color: 'var(--t2)', margin: 0, lineHeight: 1, letterSpacing: '-0.02em'
      }}>
        <CountUp value={Math.abs(Number(value || 0))} prefix={prefix || ''} suffix={suffix || ''} integer={!!integer} />
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 10 }}>{sub}</p>}
    </motion.div>
  )
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const cfg = {
    ativa: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E', border: 'rgba(34,197,94,0.25)', label: 'ATIVA' },
    finalizada: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)', label: 'Finalizada' },
    fechada: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: 'rgba(59,130,246,0.25)', label: 'Fechada' },
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

/* ── Milestone badge ── */
function MilestoneBadge({ label, achieved }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 8,
      background: achieved ? 'rgba(34,197,94,0.08)' : 'var(--raised)',
      border: `1px solid ${achieved ? 'rgba(34,197,94,0.2)' : 'var(--b1)'}`,
      opacity: achieved ? 1 : 0.4,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: achieved ? 'rgba(34,197,94,0.15)' : 'transparent',
        color: achieved ? '#22C55E' : 'var(--t4)',
      }}>
        {achieved ? <IconCheck /> : <IconLock />}
      </div>
      <span style={{
        fontSize: 12, fontWeight: achieved ? 600 : 500,
        color: achieved ? 'var(--t1)' : 'var(--t4)',
      }}>
        {label}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function OperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [obs, setObs] = useState('')
  const [contas, setContas] = useState('10')
  const [plataforma, setPlataforma] = useState('')
  const [rede, setRede] = useState('')
  const [redeOpen, setRedeOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [metaFilter, setMetaFilter] = useState('todas')
  const [showForm, setShowForm] = useState(false)
  const redeRef = useRef(null)

  const REDES = ['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']

  useEffect(() => {
    function handleClickOutside(e) {
      if (redeRef.current && !redeRef.current.contains(e.target)) setRedeOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    const { data: m } = await supabase.from('metas').select('*').eq('operator_id', u.id).order('created_at', { ascending: false })
    const activeMetas = (m || []).filter(x => !x.deleted_at)
    setMetas(activeMetas)
    const metaIds = activeMetas.map(x => x.id)
    let allRem = []
    if (metaIds.length > 0) {
      const { data: r } = await supabase.from('remessas').select('id,meta_id,deposito,saque,status_problema,created_at').in('meta_id', metaIds).order('created_at', { ascending: false })
      allRem = r || []
    }
    setRemessas(allRem)
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!titulo.trim() || !plataforma.trim() || !rede) {
      setError(!plataforma.trim() ? 'Preencha a plataforma' : !rede ? 'Selecione a rede' : 'Preencha o titulo')
      return
    }
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('metas').insert({
      operator_id: user.id,
      titulo: titulo.trim(),
      observacoes: obs.trim() || null,
      plataforma: plataforma.trim(),
      rede,
      quantidade_contas: Number(contas || 10),
      status: 'ativa',
      tenant_id: profile?.tenant_id,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    setTitulo(''); setObs(''); setContas('10'); setPlataforma(''); setRede(''); setShowForm(false)
    notifyMetaCreated(profile?.tenant_id, getName(profile), data.quantidade_contas, data.rede)
    router.push(`/meta/${data.id}`)
  }

  /* ── Computed stats ── */
  const stats = useMemo(() => {
    const ativas = metas.filter(m => (m.status || 'ativa') === 'ativa' && m.status_fechamento !== 'fechada').length
    const fechadas = metas.filter(m => m.status_fechamento === 'fechada')
    const totalDepositantes = metas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const taxaConclusao = metas.length > 0 ? Math.round((fechadas.length / metas.length) * 100) : 0
    return {
      ativas,
      total: metas.length,
      nRem: remessas.length,
      fechadas: fechadas.length,
      totalDepositantes,
      taxaConclusao,
    }
  }, [metas, remessas])

  /* ── Performance stats for sidebar ── */
  const perfStats = useMemo(() => {
    const fechadas = metas.filter(m => m.status_fechamento === 'fechada')
    const totalDeps = metas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const mediaDeps = metas.length > 0 ? Math.round(totalDeps / metas.length) : 0
    const mediaRem = metas.length > 0 ? Math.round(remessas.length / metas.length) : 0
    return {
      fechadasCount: fechadas.length,
      totalDeps,
      mediaDeps,
      mediaRem,
    }
  }, [metas, remessas])

  /* ── Alertas: remessas with status_problema !== 'normal' ── */
  const alertas = useMemo(() => {
    const probs = remessas.filter(r => r.status_problema && r.status_problema !== 'normal')
    const sp = probs.filter(r => r.status_problema === 'saque_pendente').length
    const cb = probs.filter(r => r.status_problema === 'conta_bloqueada').length
    const ba = probs.filter(r => r.status_problema === 'banco_analise').length
    return { total: probs.length, sp, cb, ba }
  }, [remessas])

  /* ── Milestones ── */
  const milestones = useMemo(() => {
    const closedCount = metas.filter(m => m.status_fechamento === 'fechada').length
    const totalDeps = metas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const anyMeta = metas.length > 0
    return [
      { label: 'Primeira meta', achieved: anyMeta },
      { label: '10 metas fechadas', achieved: closedCount >= 10 },
      { label: '50 depositantes', achieved: totalDeps >= 50 },
      { label: '100 depositantes', achieved: totalDeps >= 100 },
      { label: '500 depositantes', achieved: totalDeps >= 500 },
    ]
  }, [metas])

  /* ── Active meta ── */
  const activeMeta = useMemo(() => {
    return metas.find(m => (m.status || 'ativa') === 'ativa' && m.status_fechamento !== 'fechada') || null
  }, [metas])

  /* ── Helper: get remessas for a meta ── */
  function getMetaRemessas(metaId) {
    return remessas.filter(r => r.meta_id === metaId)
  }

  /* ── Helper: meta status string ── */
  function getMetaStatus(meta) {
    if (meta.status_fechamento === 'fechada') return 'fechada'
    if (meta.status === 'finalizada') return 'finalizada'
    return 'ativa'
  }

  /* ═══════ RENDER ═══════ */
  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} userId={user?.id} tenantId={profile?.tenant_id}>

        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)', margin: '0 0 4px' }}>
                Ola, {getName(profile)}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
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
              <button
                onClick={() => setShowForm(!showForm)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px', fontSize: 13, fontWeight: 700,
                  color: showForm ? 'var(--t2)' : '#fff',
                  background: showForm ? 'transparent' : '#e53935',
                  border: showForm ? '1px solid var(--b2)' : '1px solid #e53935',
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: showForm ? 'none' : '0 2px 12px rgba(229,57,53,0.25)',
                }}
              >
                <IconPlus /> {showForm ? 'Fechar' : 'Nova meta'}
              </button>
            </div>
          </div>

          {/* ── KPI CARDS (4 cards, neutral) ── */}
          <div className="nxc-kpi-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}>
            <KpiCard
              index={0}
              icon={<IconTarget />}
              label="Metas ativas"
              value={stats.ativas}
              integer
              sub={`${stats.total} total`}
            />
            <KpiCard
              index={1}
              icon={<IconBox />}
              label="Total remessas"
              value={stats.nRem}
              integer
              sub="Registradas"
            />
            <KpiCard
              index={2}
              icon={<IconUsers />}
              label="Total depositantes"
              value={stats.totalDepositantes}
              integer
              sub={`Soma de contas de todas as metas`}
            />
            <KpiCard
              index={3}
              icon={<IconPercent />}
              label="Taxa de conclusao"
              value={stats.taxaConclusao}
              suffix="%"
              integer
              sub={`${stats.fechadas} de ${stats.total} metas fechadas`}
            />
          </div>

          {/* ── RESPONSIVE STYLES ── */}
          <style>{`
            @media (max-width: 1100px) {
              .nxc-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
              .nxc-main-layout { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 700px) {
              .nxc-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
              .nxc-form-row2 { grid-template-columns: 1fr !important; }
              .nxc-form-row1 { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 480px) {
              .nxc-kpi-grid { grid-template-columns: 1fr !important; }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          {/* ── META CREATION FORM (slide-down) ── */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: 28, borderRadius: 14,
                  background: 'var(--surface)', border: '1px solid var(--b1)',
                }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: '0 0 4px' }}>Iniciar nova meta</h2>
                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 24px' }}>Ao criar, voce vai direto para a pagina da meta</p>
                  <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Row 1 */}
                    <div className="nxc-form-row1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plataforma *</label>
                        <input
                          value={plataforma}
                          onChange={e => setPlataforma(e.target.value)}
                          placeholder="Nome da plataforma"
                          required
                          style={{
                            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
                            color: 'var(--t1)', background: 'var(--void)',
                            border: '1px solid var(--b2)', borderRadius: 11,
                            outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={e => { e.target.style.borderColor = '#e53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                      <div ref={redeRef} style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rede *</label>
                        <button
                          type="button"
                          onClick={() => setRedeOpen(!redeOpen)}
                          style={{
                            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
                            color: rede ? 'var(--t1)' : 'var(--t4)',
                            background: redeOpen ? 'rgba(229,57,53,0.04)' : 'var(--void)',
                            border: `1px solid ${redeOpen ? '#e53935' : 'var(--b2)'}`,
                            borderRadius: 11, outline: 'none', cursor: 'pointer',
                            textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                            boxShadow: redeOpen ? '0 0 0 3px rgba(229,57,53,0.1)' : 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span>{rede || 'Selecione a rede'}</span>
                          <IconDown open={redeOpen} />
                        </button>
                        {redeOpen && (
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                            background: 'var(--surface)', border: '1px solid var(--b2)', borderRadius: 14,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            maxHeight: 260, overflowY: 'auto', padding: 6,
                          }}>
                            {REDES.map(r => (
                              <button
                                key={r} type="button"
                                onClick={() => { setRede(r); setRedeOpen(false) }}
                                onMouseEnter={e => { if (rede !== r) e.currentTarget.style.background = 'var(--raised)' }}
                                onMouseLeave={e => { if (rede !== r) e.currentTarget.style.background = 'transparent' }}
                                style={{
                                  width: '100%', display: 'block', padding: '9px 14px',
                                  border: 'none', borderRadius: 9, textAlign: 'left',
                                  cursor: 'pointer', fontSize: 13, fontWeight: rede === r ? 700 : 500,
                                  color: rede === r ? 'white' : 'var(--t2)',
                                  background: rede === r ? 'rgba(229,57,53,0.2)' : 'transparent',
                                  transition: 'background 0.12s',
                                }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="nxc-form-row2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Titulo *</label>
                        <input
                          value={titulo}
                          onChange={e => setTitulo(e.target.value)}
                          placeholder="Ex: Meta Abril — VOY 5543"
                          required
                          style={{
                            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
                            color: 'var(--t1)', background: 'var(--void)',
                            border: '1px solid var(--b2)', borderRadius: 11,
                            outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={e => { e.target.style.borderColor = '#e53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observacoes</label>
                        <input
                          value={obs}
                          onChange={e => setObs(e.target.value)}
                          placeholder="Detalhes opcionais..."
                          style={{
                            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
                            color: 'var(--t1)', background: 'var(--void)',
                            border: '1px solid var(--b2)', borderRadius: 11,
                            outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={e => { e.target.style.borderColor = '#e53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qtd. Contas</label>
                        <input
                          type="number" min="1"
                          value={contas}
                          onChange={e => setContas(e.target.value)}
                          style={{
                            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
                            color: 'var(--t1)', background: 'var(--void)',
                            border: '1px solid var(--b2)', borderRadius: 11,
                            outline: 'none', boxSizing: 'border-box',
                            fontFamily: 'var(--mono)',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={e => { e.target.style.borderColor = '#e53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={saving || !titulo.trim() || !plataforma.trim() || !rede}
                      style={{
                        width: '100%', padding: '14px 24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 14, fontWeight: 700, color: '#fff',
                        background: (saving || !titulo.trim() || !plataforma.trim() || !rede) ? 'rgba(229,57,53,0.4)' : '#e53935',
                        border: 'none', borderRadius: 11, cursor: (saving || !titulo.trim() || !plataforma.trim() || !rede) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 12px rgba(229,57,53,0.25)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {saving ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          Criando...
                        </>
                      ) : (
                        <><IconBolt /> Iniciar meta</>
                      )}
                    </button>
                  </form>

                  {error && (
                    <div style={{
                      marginTop: 14, padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── MAIN TWO-COLUMN LAYOUT ── */}
          <div className="nxc-main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

            {/* ════════════════════════════════════════════
                LEFT COLUMN: Metas
               ════════════════════════════════════════════ */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: '0 0 2px' }}>Suas metas</h2>
                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Acompanhe o progresso das suas operacoes</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3, border: '1px solid var(--b1)' }}>
                  {[
                    { k: 'todas', l: 'Todas', c: metas.length },
                    { k: 'ativas', l: 'Ativas', c: metas.filter(m => m.status === 'ativa' || m.status === 'em_andamento').length },
                    { k: 'fechadas', l: 'Fechadas', c: metas.filter(m => m.status_fechamento === 'fechada').length },
                  ].map(f => (
                    <button key={f.k} onClick={() => setMetaFilter(f.k)} style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: metaFilter === f.k ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: metaFilter === f.k ? 'var(--t1)' : 'var(--t4)',
                      transition: 'all 0.2s',
                    }}>
                      {f.l} <span style={{ fontFamily: 'var(--mono)', fontSize: 10, marginLeft: 3, opacity: 0.6 }}>{f.c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid var(--b2)', borderTopColor: '#e53935', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <p style={{ fontSize: 12, color: 'var(--t3)' }}>Carregando...</p>
                </div>
              ) : metas.length === 0 ? (
                <div style={{
                  border: '1px dashed var(--b2)', borderRadius: 16,
                  padding: 60, textAlign: 'center',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--raised)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  </div>
                  <p style={{ color: 'var(--t2)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhuma meta criada</p>
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 20 }}>Inicie sua primeira operacao agora.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      padding: '10px 24px', fontSize: 13, fontWeight: 700,
                      color: '#fff', background: '#e53935', border: 'none',
                      borderRadius: 10, cursor: 'pointer',
                      boxShadow: '0 2px 12px rgba(229,57,53,0.25)',
                    }}
                  >
                    + Criar primeira meta
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* ── META ATIVA EM DESTAQUE ── */}
                  {activeMeta && (() => {
                    const mRem = getMetaRemessas(activeMeta.id)
                    const target = Number(activeMeta.quantidade_contas || 0)
                    const done = mRem.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
                    const progress = target > 0 ? Math.min(Math.round((done / target) * 100), 100) : 0
                    const totalDep = mRem.reduce((a, r) => a + Number(r.deposito || 0), 0)
                    const totalSaq = mRem.reduce((a, r) => a + Number(r.saque || 0), 0)
                    return (
                      <motion.div
                        custom={0}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        style={{
                          padding: '24px 28px',
                          borderRadius: 16,
                          background: 'var(--surface)',
                          border: '1px solid rgba(34,197,94,0.25)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Green accent line at top */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #22C55E, rgba(34,197,94,0.3))' }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>
                              {activeMeta.titulo}
                            </h3>
                            <RedeBadge rede={activeMeta.rede} />
                            <StatusBadge status="ativa" />
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Progresso</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
                              {done}/{target} contas
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--b1)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                              style={{
                                height: '100%', borderRadius: 3,
                                background: 'linear-gradient(90deg, #22C55E, #16A34A)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                          <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'var(--raised)' }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: 'var(--t2)', margin: '0 0 2px' }}>{mRem.length}</p>
                            <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0 }}>Remessas</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'var(--raised)' }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: 'var(--profit)', margin: '0 0 2px' }}>{done}</p>
                            <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0 }}>Contas</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'var(--raised)' }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: '0 0 2px' }}>R$ {fmt(totalDep)}</p>
                            <p style={{ fontSize: 10, color: 'var(--t3)', margin: 0 }}>Deposito</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'var(--raised)' }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: '0 0 2px' }}>R$ {fmt(totalSaq)}</p>
                            <p style={{ fontSize: 10, color: 'var(--t3)', margin: 0 }}>Saque</p>
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/meta/${activeMeta.id}`)}
                          style={{
                            width: '100%', padding: '12px 24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontSize: 14, fontWeight: 700, color: '#fff',
                            background: '#22C55E', border: 'none', borderRadius: 11,
                            cursor: 'pointer', boxShadow: '0 2px 12px rgba(34,197,94,0.25)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#16A34A' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#22C55E' }}
                        >
                          <IconPlay /> Continuar operando
                        </button>
                      </motion.div>
                    )
                  })()}

                  {/* ── LISTA DE METAS ── */}
                  <div style={{ marginTop: activeMeta ? 8 : 0 }}>
                    {activeMeta && (
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Todas as metas</h3>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {metas.filter(m => {
                        if (metaFilter === 'ativas') return m.status === 'ativa' || m.status === 'em_andamento'
                        if (metaFilter === 'fechadas') return m.status_fechamento === 'fechada'
                        return true
                      }).map((meta, i) => {
                        const mRem = getMetaRemessas(meta.id)
                        const status = getMetaStatus(meta)
                        const totalDep = mRem.reduce((a, r) => a + Number(r.deposito || 0), 0)
                        const totalSaq = mRem.reduce((a, r) => a + Number(r.saque || 0), 0)

                        return (
                          <motion.div
                            key={meta.id}
                            custom={i + (activeMeta ? 1 : 0)}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ y: -2, borderColor: 'rgba(229,57,53,0.3)', transition: { duration: 0.15 } }}
                            onClick={() => router.push(`/meta/${meta.id}`)}
                            style={{
                              padding: '16px 20px',
                              borderRadius: 14,
                              background: 'var(--surface)',
                              border: '1px solid var(--b1)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {/* Top row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                                <h4 style={{
                                  fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0,
                                  letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                                  overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220,
                                }}>
                                  {meta.titulo}
                                </h4>
                                <RedeBadge rede={meta.rede} />
                                <StatusBadge status={status} />
                              </div>
                              <IconChevron />
                            </div>

                            {/* Info row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              {meta.plataforma && (
                                <span style={{
                                  fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 5,
                                  background: 'var(--raised)', color: 'var(--t2)', border: '1px solid var(--b1)',
                                }}>
                                  {meta.plataforma}
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                                {meta.quantidade_contas || 0} contas
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--t4)' }}>
                                {mRem.length} remessas
                              </span>
                              {mRem.length > 0 && (
                                <>
                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t3)' }}>
                                    D: R$ {fmt(totalDep)}
                                  </span>
                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t3)' }}>
                                    S: R$ {fmt(totalSaq)}
                                  </span>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════
                RIGHT SIDEBAR
               ════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ── Stats pessoais ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: '0 0 16px' }}>Stats pessoais</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Metas fechadas', value: String(perfStats.fechadasCount) },
                    { label: 'Total de depositantes', value: String(perfStats.totalDeps) },
                    { label: 'Media depositantes/meta', value: String(perfStats.mediaDeps) },
                    { label: 'Media remessas/meta', value: String(perfStats.mediaRem) },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: i < 3 ? '1px solid var(--b1)' : 'none',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--t2)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── Ranking pessoal ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ color: '#F59E0B' }}><IconAward /></div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Ranking pessoal</h3>
                </div>
                <div style={{
                  padding: '14px 16px', borderRadius: 10, background: 'var(--raised)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 800, color: '#F59E0B', margin: '0 0 4px', lineHeight: 1 }}>
                    {perfStats.totalDeps}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>depositantes totais</p>
                </div>
              </motion.div>

              {/* ── Conquistas / Marcos ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.22 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px' }}>Conquistas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {milestones.map((m, i) => (
                    <MilestoneBadge key={i} label={m.label} achieved={m.achieved} />
                  ))}
                </div>
              </motion.div>

              {/* ── Alertas ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.28 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ color: alertas.total > 0 ? '#F59E0B' : 'var(--t3)' }}><IconAlert /></div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Alertas</h3>
                  {alertas.total > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                      background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}>
                      {alertas.total}
                    </span>
                  )}
                </div>
                {alertas.total === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>Nenhum alerta no momento.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {alertas.sp > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                      }}>
                        <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Saque pendente</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{alertas.sp}</span>
                      </div>
                    )}
                    {alertas.cb > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      }}>
                        <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Conta bloqueada</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{alertas.cb}</span>
                      </div>
                    )}
                    {alertas.ba > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                      }}>
                        <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>Banco em analise</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>{alertas.ba}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* ── Acoes rapidas ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.34 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px' }}>Acoes rapidas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      width: '100%', padding: '10px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 13, fontWeight: 700, color: '#fff',
                      background: '#e53935', border: 'none', borderRadius: 10,
                      cursor: 'pointer', boxShadow: '0 2px 12px rgba(229,57,53,0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <IconPlus /> Iniciar nova meta
                  </button>
                  {activeMeta && (
                    <button
                      onClick={() => router.push(`/meta/${activeMeta.id}`)}
                      style={{
                        width: '100%', padding: '10px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 13, fontWeight: 500, color: 'var(--t2)',
                        background: 'transparent', border: '1px solid var(--b2)',
                        borderRadius: 10, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IconPlay /> Abrir meta ativa
                    </button>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </AppLayout>
    </main>
  )
}
