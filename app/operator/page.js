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
function IconTrend() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
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
function IconDollar() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}
function IconFire() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.04-2-4-1.398 1-2 2-4 1z"/></svg>
}
function IconAward() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
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
function KpiCard({ icon, label, value, sub, color, prefix, suffix, integer, index }) {
  const dynamicColor = color || 'var(--t1)'
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
          color: dynamicColor,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{
        fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800,
        color: dynamicColor, margin: 0, lineHeight: 1, letterSpacing: '-0.02em'
      }}>
        <CountUp value={Math.abs(Number(value || 0))} prefix={prefix || ''} suffix={suffix || ''} integer={!!integer} />
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 10 }}>{sub}</p>}
    </motion.div>
  )
}

/* ── Tab button ── */
function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--t1)' : 'var(--t3)',
        background: active ? 'var(--surface)' : 'transparent',
        border: active ? '1px solid var(--b1)' : '1px solid transparent',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const cfg = {
    ativa: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: 'rgba(59,130,246,0.25)', label: 'Ativa' },
    finalizada: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)', label: 'Finalizada' },
    fechada: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E', border: 'rgba(34,197,94,0.25)', label: 'Fechada' },
  }
  const c = cfg[status] || cfg.ativa
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  )
}

/* ── Meta card ── */
function MetaCard({ meta, remessas, index, onClick }) {
  const mRem = remessas.filter(r => r.meta_id === meta.id)
  const lucro = mRem.reduce((a, r) => a + Number(r.lucro || 0), 0)
  const prej = mRem.reduce((a, r) => a + Number(r.prejuizo || 0), 0)
  const liq = lucro - prej
  const pct = (lucro + prej) > 0 ? Math.round((lucro / (lucro + prej)) * 100) : 0
  const fechada = meta.status_fechamento === 'fechada'
  const finalizada = meta.status === 'finalizada'
  const status = fechada ? 'fechada' : finalizada ? 'finalizada' : 'ativa'
  const hasDeposit = meta.observacoes && meta.observacoes.toLowerCase().includes('redeposito')

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, borderColor: 'rgba(229,57,53,0.3)', transition: { duration: 0.15 } }}
      onClick={onClick}
      style={{
        padding: '18px 20px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--b1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top row: title + badges + result */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
            {meta.titulo}
          </h3>
          {meta.rede && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: 'rgba(229,57,53,0.1)', color: '#e53935',
              border: '1px solid rgba(229,57,53,0.2)',
            }}>
              {meta.rede}
            </span>
          )}
          <StatusBadge status={status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700,
            color: liq >= 0 ? 'var(--profit)' : 'var(--loss)',
          }}>
            {liq >= 0 ? '+' : '-'}R$ {fmt(Math.abs(liq))}
          </span>
          <IconChevron />
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: mRem.length > 0 ? 12 : 0 }}>
        {meta.plataforma && (
          <span style={{
            fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 5,
            background: 'var(--raised)', color: 'var(--t2)', border: '1px solid var(--b1)',
          }}>
            {meta.plataforma}
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>
          {meta.quantidade_contas || 0} contas · {mRem.length} remessas
        </span>
        {!hasDeposit && (
          <span style={{ fontSize: 10, color: 'var(--t4)', fontStyle: 'italic' }}>sem redeposito</span>
        )}
      </div>

      {/* Progress bar */}
      {mRem.length > 0 && (
        <>
          <div style={{ height: 3, borderRadius: 2, background: 'var(--b1)', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: 2,
              background: pct >= 50 ? 'var(--profit)' : 'var(--loss)',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0 }}>
            {pct}% acerto · L: R$ {fmt(lucro)} · P: R$ {fmt(prej)}
          </p>
        </>
      )}
    </motion.div>
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
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('metas')
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
      const { data: r } = await supabase.from('remessas').select('lucro,prejuizo,resultado,meta_id,created_at').in('meta_id', metaIds).order('created_at', { ascending: false })
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
    const lucro = remessas.reduce((a, r) => a + Number(r.lucro || 0), 0)
    const prej = remessas.reduce((a, r) => a + Number(r.prejuizo || 0), 0)
    const today = new Date().toISOString().slice(0, 10)
    const remHoje = remessas.filter(r => (r.created_at || '').slice(0, 10) === today)
    const lucroHoje = remHoje.reduce((a, r) => {
      const res = r.resultado != null ? Number(r.resultado) : (Number(r.lucro || 0) - Number(r.prejuizo || 0))
      return a + res
    }, 0)
    const ativas = metas.filter(m => (m.status || 'ativa') === 'ativa').length
    const fechadas = metas.filter(m => m.status_fechamento === 'fechada')
    const positivas = remessas.filter(r => {
      const res = r.resultado != null ? Number(r.resultado) : (Number(r.lucro || 0) - Number(r.prejuizo || 0))
      return res > 0
    }).length
    const taxa = remessas.length > 0 ? Math.round((positivas / remessas.length) * 100) : 0
    const totalDepositantes = fechadas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    return {
      lucro, prej, liq: lucro - prej,
      lucroHoje, ativas, taxa,
      total: metas.length, nRem: remessas.length,
      fechadas: fechadas.length,
      totalDepositantes,
    }
  }, [metas, remessas])

  /* ── Performance stats ── */
  const perfStats = useMemo(() => {
    const fechadas = metas.filter(m => m.status_fechamento === 'fechada')
    if (fechadas.length === 0) return null

    // compute lucro per meta
    const metaLucros = fechadas.map(m => {
      const mRem = remessas.filter(r => r.meta_id === m.id)
      const lucro = mRem.reduce((a, r) => a + Number(r.lucro || 0), 0)
      const prej = mRem.reduce((a, r) => a + Number(r.prejuizo || 0), 0)
      return { ...m, lucroFinal: m.lucro_final != null ? Number(m.lucro_final) : lucro - prej }
    })

    const totalLucro = metaLucros.reduce((a, m) => a + m.lucroFinal, 0)
    const mediaPorMeta = totalLucro / metaLucros.length
    const totalContas = fechadas.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
    const mediaPorConta = totalContas > 0 ? totalLucro / totalContas : 0
    const sorted = [...metaLucros].sort((a, b) => b.lucroFinal - a.lucroFinal)
    const melhor = sorted[0]
    const pior = sorted[sorted.length - 1]

    // streak - consecutive profitable from most recent
    const byDate = [...metaLucros].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    let streak = 0
    for (const m of byDate) {
      if (m.lucroFinal > 0) streak++
      else break
    }

    // last 10
    const last10 = byDate.slice(0, 10)

    return { totalLucro, mediaPorMeta, mediaPorConta, melhor, pior, streak, last10 }
  }, [metas, remessas])

  const hojeColor = stats.lucroHoje >= 0 ? 'var(--profit)' : 'var(--loss)'

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

          {/* ── KPI CARDS ── */}
          <div className="nxc-kpi-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}>
            <KpiCard
              index={0}
              icon={<IconTrend />}
              label="Resultado hoje"
              value={stats.lucroHoje}
              prefix={stats.lucroHoje >= 0 ? '+R$ ' : '-R$ '}
              color={hojeColor}
              sub={stats.lucroHoje >= 0 ? 'Lucro do dia' : 'Prejuizo do dia'}
            />
            <KpiCard
              index={1}
              icon={<IconTarget />}
              label="Metas ativas"
              value={stats.ativas}
              integer
              sub={`${stats.total} total`}
            />
            <KpiCard
              index={2}
              icon={<IconBox />}
              label="Total remessas"
              value={stats.nRem}
              integer
              sub="Registradas"
            />
            <KpiCard
              index={3}
              icon={<IconUsers />}
              label="Total depositantes"
              value={stats.totalDepositantes}
              integer
              sub={`${stats.fechadas} metas fechadas`}
            />
            <KpiCard
              index={4}
              icon={<IconPercent />}
              label="Taxa de acerto"
              value={stats.taxa}
              suffix="%"
              integer
              sub={`${stats.nRem} remessas analisadas`}
            />
          </div>

          {/* ── RESPONSIVE: add style tag for grid breakpoints ── */}
          <style>{`
            @media (max-width: 1100px) {
              .nxc-kpi-grid { grid-template-columns: repeat(3, 1fr) !important; }
              .nxc-main-grid { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 700px) {
              .nxc-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
              .nxc-form-row2 { grid-template-columns: 1fr !important; }
              .nxc-form-row1 { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 480px) {
              .nxc-kpi-grid { grid-template-columns: 1fr !important; }
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

          {/* ── MAIN GRID: content + sidebar ── */}
          <div className="nxc-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

            {/* ── LEFT: Tabs content ── */}
            <div>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'var(--raised)', borderRadius: 12, width: 'fit-content' }}>
                <TabBtn label="Metas" active={activeTab === 'metas'} onClick={() => setActiveTab('metas')} />
                <TabBtn label="Performance" active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
              </div>

              {/* ── TAB: METAS ── */}
              {activeTab === 'metas' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: '0 0 2px' }}>Centro de metas</h2>
                      <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Performance individual em tempo real</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{stats.ativas} ativas</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    ) : metas.map((m, i) => (
                      <MetaCard
                        key={m.id}
                        meta={m}
                        remessas={remessas}
                        index={i}
                        onClick={() => router.push(`/meta/${m.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: PERFORMANCE ── */}
              {activeTab === 'performance' && (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: '0 0 2px' }}>Performance pessoal</h2>
                    <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Analise detalhada das suas metas fechadas</p>
                  </div>

                  {!perfStats ? (
                    <div style={{
                      padding: 60, textAlign: 'center', borderRadius: 14,
                      background: 'var(--surface)', border: '1px solid var(--b1)',
                    }}>
                      <p style={{ color: 'var(--t3)', fontSize: 13 }}>Nenhuma meta fechada ainda. Feche metas para ver sua performance.</p>
                    </div>
                  ) : (
                    <>
                      {/* Big stats row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                        {/* Lucro total */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0 }}
                          style={{
                            padding: '24px 22px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ color: 'var(--profit)' }}><IconDollar /></div>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Seu lucro total</span>
                          </div>
                          <p style={{
                            fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 800,
                            color: perfStats.totalLucro >= 0 ? 'var(--profit)' : 'var(--loss)',
                            margin: 0, lineHeight: 1,
                          }}>
                            <CountUp
                              value={Math.abs(perfStats.totalLucro)}
                              prefix={perfStats.totalLucro >= 0 ? 'R$ ' : '-R$ '}
                            />
                          </p>
                        </motion.div>

                        {/* Lucro medio por meta */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.06 }}
                          style={{
                            padding: '24px 22px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ color: 'var(--t2)' }}><IconTarget /></div>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Lucro medio por meta</span>
                          </div>
                          <p style={{
                            fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700,
                            color: perfStats.mediaPorMeta >= 0 ? 'var(--profit)' : 'var(--loss)',
                            margin: 0, lineHeight: 1,
                          }}>
                            <CountUp
                              value={Math.abs(perfStats.mediaPorMeta)}
                              prefix={perfStats.mediaPorMeta >= 0 ? 'R$ ' : '-R$ '}
                            />
                          </p>
                        </motion.div>

                        {/* Lucro medio por conta */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.12 }}
                          style={{
                            padding: '24px 22px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ color: 'var(--t2)' }}><IconUsers /></div>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Lucro medio por conta</span>
                          </div>
                          <p style={{
                            fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700,
                            color: perfStats.mediaPorConta >= 0 ? 'var(--profit)' : 'var(--loss)',
                            margin: 0, lineHeight: 1,
                          }}>
                            <CountUp
                              value={Math.abs(perfStats.mediaPorConta)}
                              prefix={perfStats.mediaPorConta >= 0 ? 'R$ ' : '-R$ '}
                            />
                          </p>
                        </motion.div>
                      </div>

                      {/* Melhor / Pior / Streak row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                        {/* Melhor meta */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.18 }}
                          style={{
                            padding: '20px 22px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ color: 'var(--profit)' }}><IconAward /></div>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Melhor meta</span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {perfStats.melhor?.titulo || '-'}
                          </p>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--profit)', margin: 0 }}>
                            +R$ {fmt(Math.abs(perfStats.melhor?.lucroFinal || 0))}
                          </p>
                        </motion.div>

                        {/* Pior meta */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.24 }}
                          style={{
                            padding: '20px 22px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ color: 'var(--loss)' }}><IconAward /></div>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Pior meta</span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {perfStats.pior?.titulo || '-'}
                          </p>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: perfStats.pior?.lucroFinal >= 0 ? 'var(--profit)' : 'var(--loss)', margin: 0 }}>
                            {perfStats.pior?.lucroFinal >= 0 ? '+' : '-'}R$ {fmt(Math.abs(perfStats.pior?.lucroFinal || 0))}
                          </p>
                        </motion.div>

                        {/* Streak */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.3 }}
                          style={{
                            padding: '20px 22px', borderRadius: 14,
                            background: 'var(--surface)', border: '1px solid var(--b1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ color: '#F59E0B' }}><IconFire /></div>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Sequencia lucrativa</span>
                          </div>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 800, color: perfStats.streak > 0 ? '#F59E0B' : 'var(--t3)', margin: '0 0 4px', lineHeight: 1 }}>
                            {perfStats.streak}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
                            {perfStats.streak === 1 ? 'meta consecutiva no lucro' : 'metas consecutivas no lucro'}
                          </p>
                        </motion.div>
                      </div>

                      {/* Evolution: last 10 */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.36 }}
                        style={{
                          padding: '22px 24px', borderRadius: 14,
                          background: 'var(--surface)', border: '1px solid var(--b1)',
                        }}
                      >
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '0 0 16px' }}>Evolucao — ultimas {perfStats.last10.length} metas fechadas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {perfStats.last10.map((m, i) => (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 0',
                                borderBottom: i < perfStats.last10.length - 1 ? '1px solid var(--b1)' : 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <span style={{
                                  fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t4)',
                                  width: 20, textAlign: 'right', flexShrink: 0,
                                }}>
                                  {i + 1}.
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {m.titulo}
                                </span>
                                {m.rede && (
                                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--raised)', color: 'var(--t3)', flexShrink: 0 }}>
                                    {m.rede}
                                  </span>
                                )}
                              </div>
                              <span style={{
                                fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, flexShrink: 0, marginLeft: 12,
                                color: m.lucroFinal >= 0 ? 'var(--profit)' : 'var(--loss)',
                              }}>
                                {m.lucroFinal >= 0 ? '+' : '-'}R$ {fmt(Math.abs(m.lucroFinal))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Resultado acumulado */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: '0 0 16px' }}>Resultado acumulado</h3>
                {[
                  { l: 'Lucro bruto', v: `R$ ${fmt(stats.lucro)}`, c: 'var(--profit)' },
                  { l: 'Prejuizo bruto', v: `R$ ${fmt(stats.prej)}`, c: 'var(--loss)' },
                  { l: 'Resultado liquido', v: `${stats.liq >= 0 ? '+' : '-'}R$ ${fmt(Math.abs(stats.liq))}`, c: stats.liq >= 0 ? 'var(--profit)' : 'var(--loss)' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--b1)' : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{s.l}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</span>
                  </div>
                ))}
              </motion.div>

              {/* Metas mini stats */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.16 }}
                style={{ padding: 22, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--b1)' }}
              >
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px' }}>Metas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Total', v: stats.total },
                    { l: 'Ativas', v: stats.ativas },
                    { l: 'Fechadas', v: stats.fechadas },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'var(--raised)' }}>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: '0 0 2px' }}>{v}</p>
                      <p style={{ fontSize: 10, color: 'var(--t3)', margin: 0 }}>{l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Acoes rapidas */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.22 }}
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
                  {metas.find(m => (m.status || 'ativa') === 'ativa') && (
                    <button
                      onClick={() => router.push(`/meta/${metas.find(m => (m.status || 'ativa') === 'ativa').id}`)}
                      style={{
                        width: '100%', padding: '10px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 13, fontWeight: 500, color: 'var(--t2)',
                        background: 'transparent', border: '1px solid var(--b2)',
                        borderRadius: 10, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Abrir meta ativa
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Spinner keyframes */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

      </AppLayout>
    </main>
  )
}
