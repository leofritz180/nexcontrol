'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: base + i * 0.06, ease } })

function relativeTime(dateStr) {
  if (!dateStr) return 'nunca'
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `ha ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `ha ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ha 1 dia'
  if (days < 30) return `ha ${days} dias`
  const months = Math.floor(days / 30)
  return `ha ${months}m`
}

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'PRO', label: 'PRO' },
  { key: 'TRIAL', label: 'Trial' },
  { key: 'FREE', label: 'Free' },
  { key: 'active', label: 'Ativos (7d)' },
  { key: 'inactive', label: 'Inativos' },
]

const SORT_OPTIONS = [
  { key: 'metas', label: 'Metas' },
  { key: 'operators', label: 'Operadores' },
  { key: 'activity', label: 'Atividade' },
  { key: 'plan', label: 'Plano' },
]

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function AdminsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('metas')
  const [selectedAdmin, setSelectedAdmin] = useState(null)

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
      const data = await res.json()
      setAdmins(data.adminStats || [])
      setLoading(false)
    }
    init()
  }, [])

  const planOrder = { PRO: 0, TRIAL: 1, FREE: 2 }

  const filtered = admins
    .filter(a => {
      if (search) {
        const q = search.toLowerCase()
        if (!(a.name || '').toLowerCase().includes(q) && !(a.email || '').toLowerCase().includes(q)) return false
      }
      if (filter === 'all') return true
      if (filter === 'PRO' || filter === 'TRIAL' || filter === 'FREE') return a.planStatus === filter
      if (filter === 'active') return a.daysSinceActivity <= 7
      if (filter === 'inactive') return a.daysSinceActivity > 7
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'metas') return b.metas - a.metas
      if (sortBy === 'operators') return b.operators - a.operators
      if (sortBy === 'activity') return (a.daysSinceActivity || 999) - (b.daysSinceActivity || 999)
      if (sortBy === 'plan') return (planOrder[a.planStatus] ?? 2) - (planOrder[b.planStatus] ?? 2)
      return 0
    })

  const card = {
    padding: '28px', borderRadius: 16,
    background: 'linear-gradient(145deg, #0c1424, #080e1a)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
  }

  const planColors = {
    PRO: { bg: 'rgba(34,197,94,0.08)', color: '#22C55E', border: 'rgba(34,197,94,0.2)' },
    TRIAL: { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    FREE: { bg: 'rgba(100,116,139,0.08)', color: '#64748B', border: 'rgba(100,116,139,0.2)' },
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04070e' }}>
      <div className="spinner" style={{ width: 24, height: 24, borderTopColor: '#e53935' }} />
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#04070e', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 28px 80px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
            <button
              onClick={() => router.push('/owner')}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94A3B8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
              Voltar
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0, letterSpacing: '-0.03em' }}>
                Todos os admins
              </h1>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>{filtered.length} de {admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </motion.div>

        {/* Search + Filters */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 260px', maxWidth: 360, padding: '10px 16px', borderRadius: 10,
                background: '#0c1424', border: '1px solid rgba(255,255,255,0.08)',
                color: '#F1F5F9', fontSize: 13, outline: 'none', transition: 'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(229,57,53,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                    border: filter === f.key ? '1px solid rgba(229,57,53,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    background: filter === f.key ? 'rgba(229,57,53,0.1)' : 'transparent',
                    color: filter === f.key ? '#e53935' : '#64748B',
                    transition: 'all 0.2s',
                  }}
                >{f.label}</button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sort */}
        <motion.div {...fadeUp(2)} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ordenar:</span>
            {SORT_OPTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                  border: sortBy === s.key ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                  background: sortBy === s.key ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: sortBy === s.key ? '#F1F5F9' : '#64748B',
                  transition: 'all 0.2s',
                }}
              >{s.label}</button>
            ))}
          </div>
        </motion.div>

        {/* Desktop Table */}
        <motion.div {...fadeUp(3)} className="admins-desktop" style={{ ...card }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['#', 'Admin', 'Metas', 'Ops', 'Remessas', 'Plano', 'Atividade'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px 14px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>Nenhum admin encontrado</td></tr>
                )}
                {filtered.map((a, i) => {
                  const plan = planColors[a.planStatus] || planColors.FREE
                  const days = a.daysSinceActivity
                  const activityDot = days <= 1 ? '#22C55E' : days <= 7 ? '#F59E0B' : '#EF4444'
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s', cursor: 'pointer' }}
                      onClick={() => setSelectedAdmin(selectedAdmin?.id === a.id ? null : a)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontWeight: 700, color: i < 3 ? '#22C55E' : '#64748B', fontSize: 13 }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: i < 3 ? 'rgba(34,197,94,0.1)' : '#0c1424', border: `1px solid ${i < 3 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? '#22C55E' : '#94A3B8' }}>{(a.name || a.email)[0].toUpperCase()}</span>
                            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: activityDot, border: '2px solid #0c1424' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{a.name || a.email.split('@')[0]}</p>
                            <p style={{ fontSize: 10, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>{a.metas}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{a.operators}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{a.totalRemessas || a.remessas || 0}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
                          background: plan.bg, color: plan.color, border: `1px solid ${plan.border}`,
                        }}>
                          {a.planStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: days <= 1 ? '#22C55E' : days <= 7 ? '#94A3B8' : '#64748B' }}>{relativeTime(a.lastActivity)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Mobile Cards */}
        <motion.div {...fadeUp(3)} className="admins-mobile" style={{ display: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 && (
              <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: '#64748B', fontSize: 13 }}>Nenhum admin encontrado</p>
              </div>
            )}
            {filtered.map((a, i) => {
              const plan = planColors[a.planStatus] || planColors.FREE
              const days = a.daysSinceActivity
              const activityDot = days <= 1 ? '#22C55E' : days <= 7 ? '#F59E0B' : '#EF4444'
              return (
                <div key={a.id} onClick={() => setSelectedAdmin(selectedAdmin?.id === a.id ? null : a)} style={{ ...card, padding: '16px 18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: i < 3 ? 'rgba(34,197,94,0.1)' : '#0c1424', border: `1px solid ${i < 3 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? '#22C55E' : '#94A3B8' }}>{(a.name || a.email)[0].toUpperCase()}</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: activityDot, border: '2px solid #080e1a' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontWeight: 700, color: i < 3 ? '#22C55E' : '#64748B', fontSize: 12 }}>#{i + 1}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || a.email.split('@')[0]}</p>
                      </div>
                      <p style={{ fontSize: 10, color: '#64748B', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
                      background: plan.bg, color: plan.color, border: `1px solid ${plan.border}`, flexShrink: 0,
                    }}>
                      {a.planStatus}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Metas: </span>
                      <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontWeight: 700, color: '#F1F5F9' }}>{a.metas}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Ops: </span>
                      <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontWeight: 600, color: '#94A3B8' }}>{a.operators}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Remessas: </span>
                      <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontWeight: 600, color: '#94A3B8' }}>{a.totalRemessas || a.remessas || 0}</span>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ color: days <= 1 ? '#22C55E' : days <= 7 ? '#94A3B8' : '#64748B' }}>{relativeTime(a.lastActivity)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

      </div>

      {/* ═══ ADMIN DETAIL MODAL ═══ */}
      {selectedAdmin && (
        <div
          onClick={() => setSelectedAdmin(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(4,8,16,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, padding: 28, borderRadius: 20, background: 'linear-gradient(160deg, #10141e, #080b14)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', position: 'relative', maxHeight: 'calc(100dvh - 48px)', overflowY: 'auto' }}
          >
            <button onClick={() => setSelectedAdmin(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#e53935' }}>{(selectedAdmin.name || selectedAdmin.email)[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{selectedAdmin.name || selectedAdmin.email.split('@')[0]}</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{selectedAdmin.email}</p>
              </div>
              {(() => {
                const plan = planColors[selectedAdmin.planStatus] || planColors.FREE
                return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>{selectedAdmin.planStatus}</span>
              })()}
            </div>

            {/* Lucro final */}
            <div style={{ padding: '16px 18px', borderRadius: 14, marginBottom: 14, background: (selectedAdmin.lucroFinal||0) >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${(selectedAdmin.lucroFinal||0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Lucro final</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{selectedAdmin.totalContas || 0} contas · R$ {fmt(selectedAdmin.lucroPerConta || 0)}/conta</p>
              </div>
              <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 24, fontWeight: 900, color: (selectedAdmin.lucroFinal||0) >= 0 ? '#22C55E' : '#EF4444', margin: 0 }}>
                {(selectedAdmin.lucroFinal||0) >= 0 ? '+' : ''}R$ {fmt(selectedAdmin.lucroFinal || 0)}
              </p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { l: 'Metas', v: selectedAdmin.metas, c: '#F1F5F9' },
                { l: 'Fechadas', v: selectedAdmin.fechadas, c: '#22C55E' },
                { l: 'Operadores', v: selectedAdmin.operators, c: '#F1F5F9' },
                { l: 'Remessas', v: selectedAdmin.totalRemessas || selectedAdmin.remessas, c: '#F1F5F9' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 20, fontWeight: 800, color: s.c, margin: '0 0 3px' }}>{s.v}</p>
                  <p style={{ fontSize: 8, color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Movimentacao */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Depositado</p>
                <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>R$ {fmt(selectedAdmin.totalDep || 0)}</p>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Sacado</p>
                <p style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>R$ {fmt(selectedAdmin.totalSaq || 0)}</p>
              </div>
            </div>

            {/* Top redes */}
            {selectedAdmin.topRedes && selectedAdmin.topRedes.length > 0 && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 }}>
                <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Melhores redes</p>
                {selectedAdmin.topRedes.map((r, i) => (
                  <div key={r.rede} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < selectedAdmin.topRedes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#e53935', width: 14, textAlign: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{r.rede}</span>
                      <span style={{ fontSize: 10, color: '#64748B' }}>{r.metas} meta{r.metas !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', fontSize: 12, fontWeight: 700, color: r.lucro >= 0 ? '#22C55E' : '#EF4444' }}>
                      {r.lucro >= 0 ? '+' : ''}R$ {fmt(r.lucro)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 8, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Pago</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: selectedAdmin.totalPaid > 0 ? '#22C55E' : '#64748B', margin: 0 }}>R$ {fmt(selectedAdmin.totalPaid)}</p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 8, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Atividade</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: selectedAdmin.daysSinceActivity <= 0 ? '#22C55E' : selectedAdmin.daysSinceActivity <= 7 ? '#F1F5F9' : '#EF4444', margin: 0 }}>{relativeTime(selectedAdmin.lastActivity)}</p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 8, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Criado</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{selectedAdmin.created_at ? new Date(selectedAdmin.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '--'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .admins-desktop { display: none !important; }
          .admins-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .admins-desktop { display: block !important; }
          .admins-mobile { display: none !important; }
        }
      `}</style>
    </main>
  )
}
