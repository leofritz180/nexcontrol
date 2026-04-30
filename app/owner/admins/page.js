'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = v => Number(v || 0).toLocaleString('pt-BR')
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: base + i * 0.06, ease } })

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

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'PRO', label: 'PRO' },
  { key: 'TRIAL', label: 'Trial' },
  { key: 'FREE', label: 'Free' },
  { key: 'active', label: 'Ativos (7d)' },
  { key: 'inactive', label: 'Inativos' },
]

const planColors = {
  PRO: { bg: 'rgba(236,253,245,0.08)', c: '#ECFDF5', b: 'rgba(236,253,245,0.2)' },
  TRIAL: { bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.78)', b: 'rgba(255,255,255,0.2)' },
  FREE: { bg: 'rgba(100,116,139,0.08)', c: '#64748B', b: 'rgba(100,116,139,0.2)' },
}

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
    borderRadius: 18,
    background: 'linear-gradient(145deg, #000000, #000000)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
      <div className="spinner" style={{ width: 24, height: 24, borderTopColor: '#e53935' }} />
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#000000', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 28px 80px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => router.push('/owner')}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94A3B8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
              Voltar
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0, letterSpacing: '-0.03em' }}>Todos os admins</h1>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{filtered.length} de {admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </motion.div>

        {/* Search + Filters */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Buscar admin..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 14px 9px 34px', fontSize: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#F1F5F9', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(229,57,53,0.3)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: filter === f.key ? '1px solid rgba(229,57,53,0.3)' : '1px solid rgba(255,255,255,0.06)', background: filter === f.key ? 'rgba(229,57,53,0.1)' : 'transparent', color: filter === f.key ? '#e53935' : '#64748B', transition: 'all 0.2s' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top 3 podium */}
        {filtered.length >= 3 && (
          <motion.div {...fadeUp(2)} style={{ marginBottom: 20 }}>
            <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filtered.slice(0, 3).map((a, i) => {
                const medals = ['#FFD700', '#C0C0C0', '#CD7F32']
                const maxM = Math.max(...filtered.slice(0, 3).map(x => x.metas), 1)
                const plan = planColors[a.planStatus] || planColors.FREE
                return (
                  <motion.div key={a.id} {...fadeUp(i, 0.2)}
                    onClick={() => setSelectedAdmin(a)}
                    style={{ ...card, padding: '18px 16px', cursor: 'pointer', textAlign: 'center', borderColor: `${medals[i]}22`, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${medals[i]}44`; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${medals[i]}22`; e.currentTarget.style.background = card.background }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${medals[i]}15`, border: `2px solid ${medals[i]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: medals[i] }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || a.email.split('@')[0]}</p>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: plan.bg, color: plan.c, border: `1px solid ${plan.b}` }}>{a.planStatus}</span>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: '#ECFDF5', margin: '8px 0 6px' }}>{a.metas} metas</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: (a.lucroFinal || 0) >= 0 ? '#ECFDF5' : '#EF4444', margin: '0 0 8px' }}>{(a.lucroFinal || 0) >= 0 ? '+' : ''}R$ {fmt(a.lucroFinal || 0)}</p>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(a.metas / maxM) * 100}%`, borderRadius: 2, background: medals[i], opacity: 0.6 }} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div {...fadeUp(3, 0.1)} style={{ ...card, padding: 24 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['#', 'Admin', 'Metas', 'Ops', 'Lucro', 'Plano', 'Atividade'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: h === 'Metas' || h === 'Ops' || h === 'Atividade' ? 'pointer' : 'default' }}
                      onClick={() => { if (h === 'Metas') setSortBy('metas'); if (h === 'Ops') setSortBy('operators'); if (h === 'Atividade') setSortBy('activity') }}
                    >{h}{sortBy === 'metas' && h === 'Metas' ? ' ↓' : sortBy === 'operators' && h === 'Ops' ? ' ↓' : sortBy === 'activity' && h === 'Atividade' ? ' ↓' : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px 14px', textAlign: 'center', color: '#64748B', fontSize: 12 }}>Nenhum admin encontrado</td></tr>
                )}
                {filtered.map((a, i) => {
                  const plan = planColors[a.planStatus] || planColors.FREE
                  const days = a.daysSinceActivity
                  const dot = days <= 0 ? '#ECFDF5' : days <= 7 ? 'rgba(255,255,255,0.78)' : '#EF4444'
                  return (
                    <tr key={a.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => setSelectedAdmin(a)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: i < 3 ? '#ECFDF5' : '#64748B', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: i < 3 ? 'rgba(236,253,245,0.1)' : '#000000', border: `1px solid ${i < 3 ? 'rgba(236,253,245,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#ECFDF5' : '#94A3B8' }}>{(a.name || a.email)[0].toUpperCase()}</span>
                            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: dot, border: '2px solid #000000' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{a.name || a.email.split('@')[0]}</p>
                            <p style={{ fontSize: 9, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: '#F1F5F9' }}>{a.metas}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{a.operators}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: (a.lucroFinal || 0) >= 0 ? '#ECFDF5' : '#EF4444' }}>{(a.lucroFinal || 0) >= 0 ? '+' : ''}R$ {fmt(a.lucroFinal || 0)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: plan.bg, color: plan.c, border: `1px solid ${plan.b}` }}>{a.planStatus}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 10, color: days <= 0 ? '#ECFDF5' : days <= 7 ? '#94A3B8' : '#EF4444' }}>{relativeTime(a.lastActivity)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
              style={{ width: '100%', maxWidth: 520, padding: 28, borderRadius: 20, background: 'linear-gradient(160deg, #000000, #000000)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', position: 'relative', maxHeight: 'calc(100dvh - 48px)', overflowY: 'auto' }}>
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
                {(() => { const p = planColors[selectedAdmin.planStatus] || planColors.FREE; return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: p.bg, color: p.c, border: `1px solid ${p.b}` }}>{selectedAdmin.planStatus}</span> })()}
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 14, marginBottom: 14, background: (selectedAdmin.lucroFinal || 0) >= 0 ? 'rgba(236,253,245,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${(selectedAdmin.lucroFinal || 0) >= 0 ? 'rgba(236,253,245,0.12)' : 'rgba(239,68,68,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Lucro final</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{selectedAdmin.totalContas || 0} contas · R$ {fmt(selectedAdmin.lucroPerConta || 0)}/conta</p>
                </div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 900, color: (selectedAdmin.lucroFinal || 0) >= 0 ? '#ECFDF5' : '#EF4444', margin: 0 }}>{(selectedAdmin.lucroFinal || 0) >= 0 ? '+' : ''}R$ {fmt(selectedAdmin.lucroFinal || 0)}</p>
              </div>
              <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[{ l: 'Metas', v: selectedAdmin.metas, c: '#F1F5F9' }, { l: 'Fechadas', v: selectedAdmin.fechadas, c: '#ECFDF5' }, { l: 'Ops', v: selectedAdmin.operators, c: '#F1F5F9' }, { l: 'Remessas', v: selectedAdmin.totalRemessas || selectedAdmin.remessas, c: '#F1F5F9' }].map((s, i) => (
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
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: r.lucro >= 0 ? '#ECFDF5' : '#EF4444' }}>{r.lucro >= 0 ? '+' : ''}R$ {fmt(r.lucro)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Pago', v: `R$ ${fmt(selectedAdmin.totalPaid)}`, c: selectedAdmin.totalPaid > 0 ? '#ECFDF5' : '#64748B', mono: true },
                  { l: 'Atividade', v: relativeTime(selectedAdmin.lastActivity), c: selectedAdmin.daysSinceActivity <= 0 ? '#ECFDF5' : selectedAdmin.daysSinceActivity <= 7 ? '#F1F5F9' : '#EF4444' },
                  { l: 'Criado', v: selectedAdmin.created_at ? new Date(selectedAdmin.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '--', c: '#94A3B8' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 8, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: s.c, margin: 0, fontFamily: s.mono ? 'var(--mono)' : 'inherit' }}>{s.v}</p>
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
