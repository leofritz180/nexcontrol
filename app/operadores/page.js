'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: base + i * 0.07, ease },
})

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

function KpiCard({ label, value, suffix, rgb, i }) {
  const [h, setH] = useState(false)
  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '24px 22px',
        background: `linear-gradient(145deg, rgba(${rgb},0.14), rgba(${rgb},0.03) 50%, transparent 80%)`,
        border: `1px solid rgba(${rgb},0.2)`,
        borderRadius: 16,
        boxShadow: h ? `0 0 60px rgba(${rgb},0.18), 0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)` : `0 0 20px rgba(${rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: h ? 'translateY(-4px)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, rgba(${rgb},${h ? 0.12 : 0.05}), transparent 70%)`, transition: 'all 0.4s', pointerEvents: 'none' }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: `rgb(${rgb})`, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--mono, monospace)' }}>
        {value}{suffix && <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4 }}>{suffix}</span>}
      </p>
    </motion.div>
  )
}

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
  const [tab, setTab] = useState('visao')

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

  // Derived data
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
      }
    })
  }, [operators, metas, closedMetas, remessas])

  const ranking = useMemo(() =>
    [...operatorStats].filter(o => o.closedCount > 0).sort((a, b) => b.lucroFinal - a.lucroFinal),
    [operatorStats]
  )

  const totalActive = useMemo(() => operatorStats.filter(o => o.activeMetas > 0).length, [operatorStats])
  const avgWinRate = useMemo(() => {
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length === 0) return 0
    return withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
  }, [operatorStats])

  const insights = useMemo(() => {
    const lines = []
    if (ranking.length > 0) {
      const best = ranking[0]
      lines.push(`Melhor operador: ${getName(best)} com R$ ${fmt(best.lucroFinal)} de lucro final.`)
    }
    if (ranking.length > 1) {
      const worst = ranking[ranking.length - 1]
      if (worst.lucroFinal < 0) {
        lines.push(`${getName(worst)} esta com resultado negativo: R$ ${fmt(worst.lucroFinal)}. Considere acompanhar de perto.`)
      }
    }
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length > 0) {
      const avg = withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
      lines.push(`Media de acerto da equipe: ${avg.toFixed(1)}%`)
    }
    const inactive = operatorStats.filter(o => !o.isActive && o.metasCount > 0)
    if (inactive.length > 0) {
      lines.push(`${inactive.length} operador(es) sem atividade nos ultimos 7 dias.`)
    }
    if (lines.length === 0) lines.push('Ainda sem dados suficientes para gerar insights.')
    return lines
  }, [ranking, operatorStats])

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
    { key: 'visao', label: 'Visao geral' },
    { key: 'equipe', label: 'Equipe' },
  ]

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>Operadores</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Gerencie sua equipe de operadores e acompanhe a performance individual.</p>
        </motion.div>

        {/* Tabs */}
        <motion.div {...fadeUp(1)} style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 600,
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: tab === t.key ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.25s ease',
              }}>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* VISAO GERAL */}
        {tab === 'visao' && (
          <motion.div key="visao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <KpiCard label="Total operadores" value={operators.length} rgb="59,130,246" i={0} />
              <KpiCard label="Ativos (com metas)" value={totalActive} rgb="34,197,94" i={1} />
              <KpiCard label="Performance media" value={`${avgWinRate.toFixed(1)}`} suffix="%" rgb="168,85,247" i={2} />
            </div>

            {/* Ranking */}
            <motion.div {...fadeUp(3)} style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 16, padding: '24px 22px', marginBottom: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Ranking de operadores</h2>
              </div>

              {ranking.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>Nenhuma meta fechada ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ranking.map((op, idx) => {
                    const isTop3 = idx < 3
                    const accentColor = isTop3 ? medalColors[idx] : 'rgba(255,255,255,0.15)'
                    return (
                      <motion.div key={op.id} {...fadeUp(idx, 0.1)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                          background: isTop3 ? `linear-gradient(135deg, ${accentColor}10, transparent 60%)` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isTop3 ? `${accentColor}30` : 'rgba(255,255,255,0.04)'}`,
                          borderRadius: 14, transition: 'all 0.3s ease',
                        }}>
                        {/* Position */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: isTop3 ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isTop3 ? `${accentColor}40` : 'rgba(255,255,255,0.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: isTop3 ? accentColor : 'rgba(255,255,255,0.4)',
                          fontFamily: 'var(--mono, monospace)',
                        }}>
                          {idx + 1}
                        </div>

                        {/* Avatar */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 12,
                          background: `linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))`,
                          border: '1px solid rgba(59,130,246,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color: '#fff',
                        }}>
                          {getInitial(op)}
                        </div>

                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{op.closedCount} meta{op.closedCount !== 1 ? 's' : ''} fechada{op.closedCount !== 1 ? 's' : ''}</p>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Depositantes</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.totalDeposit}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro final</p>
                            <p style={{
                              fontSize: 16, fontWeight: 800, margin: 0, fontFamily: 'var(--mono, monospace)',
                              color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444',
                            }}>
                              {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* AI Insights */}
            <motion.div {...fadeUp(4)} style={{
              background: 'linear-gradient(145deg, rgba(168,85,247,0.08), rgba(59,130,246,0.04) 50%, rgba(255,255,255,0.01))',
              border: '1px solid rgba(168,85,247,0.15)',
              borderRadius: 16, padding: '24px 22px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><line x1="9" y1="21" x2="15" y2="21" /></svg>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Insights da equipe</h2>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#a855f7', background: 'rgba(168,85,247,0.12)', padding: '3px 8px', borderRadius: 6 }}>AI</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insights.map((line, i) => (
                  <motion.div key={i} {...fadeUp(i, 0.2)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ color: '#a855f7', fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>&#8226;</span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '20px' }}>{line}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* EQUIPE */}
        {tab === 'equipe' && (
          <motion.div key="equipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            {/* Invite button */}
            <motion.div {...fadeUp(0)} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <motion.button
                onClick={() => router.push('/admin')}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))',
                  border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, color: '#60a5fa',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s ease',
                }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Convidar operador
              </motion.button>
            </motion.div>

            {/* Operators list */}
            {operators.length === 0 ? (
              <motion.div {...fadeUp(1)} style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Nenhum operador na equipe ainda.</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Use o botao acima para convidar seu primeiro operador.</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {operatorStats.map((op, idx) => (
                  <motion.div key={op.id} {...fadeUp(idx, 0.05)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 14, transition: 'all 0.3s ease',
                    }}>
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: `linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))`,
                      border: '1px solid rgba(59,130,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {getInitial(op)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: op.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                          color: op.isActive ? '#22c55e' : 'rgba(255,255,255,0.3)',
                          border: `1px solid ${op.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {op.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{op.email}</p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metas</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.metasCount}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remessas</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.remessasCount}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
