'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const ease = [0.33,1,0.68,1]
const fadeUp = (i=0) => ({initial:{opacity:0,y:12},animate:{opacity:1,y:0},transition:{duration:0.3,delay:i*0.05,ease}})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

const MEDALS = ['#FFD700','#C0C0C0','#CD7F32']

export default function RedesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [loading, setLoading] = useState(true)

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
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
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

    // 7-day trend
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
      list.push({ type: 'success', text: `Foco ideal: ${top.nome} com R$ ${fmt(top.lucroFinal)}` })
    }
    const negative = redesData.filter(r => r.lucroFinal < 0)
    if (negative.length > 0) {
      list.push({ type: 'warning', text: `Rede ${negative[0].nome} com queda -- considere reduzir` })
    }
    const growing = redesData.filter(r => r.trend === 'up')
    if (growing.length > 0) {
      list.push({ type: 'info', text: `${growing[0].nome} em crescimento` })
    }
    return list
  }, [redesData])

  /* ── Loading state ── */
  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, #0c1424, #080e1a)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 32, height: 32, border: '3px solid rgba(229,57,53,0.2)', borderTopColor: '#e53935', borderRadius: '50%' }} />
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ padding: '32px 24px 64px', maxWidth: 1100, margin: '0 auto' }}>

          {/* ── Header ── */}
          <motion.div {...fadeUp(0)} style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Redes
            </h1>
            <p style={{ fontSize: 13, color: 'var(--t3)' }}>
              Performance por rede -- ranking, lucro e tendencias
            </p>
          </motion.div>

          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total de redes', value: totalRedes, prefix: '', rgb: '99,102,241' },
              { label: 'Redes ativas', value: redesAtivas, prefix: '', rgb: '34,197,94' },
              { label: 'Lucro total', value: fmt(lucroTotal), prefix: 'R$ ', rgb: '229,57,53', raw: true },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} {...fadeUp(i + 1)}>
                <div className="card" style={{
                  padding: '24px', position: 'relative', overflow: 'hidden',
                  background: `linear-gradient(145deg, rgba(${kpi.rgb},0.12), rgba(${kpi.rgb},0.03) 50%, var(--surface) 80%)`,
                  borderColor: `rgba(${kpi.rgb},0.18)`,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, rgba(${kpi.rgb},0.08), transparent 70%)`, pointerEvents: 'none' }} />
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{kpi.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: `rgb(${kpi.rgb})`, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--mono)' }}>
                    {kpi.raw ? `${kpi.prefix}${kpi.value}` : kpi.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Insights ── */}
          {insights.length > 0 && (
            <motion.div {...fadeUp(4)} style={{ marginBottom: 32 }}>
              <div className="card" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth={2} strokeLinecap="round">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insights</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {insights.map((ins, i) => (
                    <motion.div key={i} {...fadeUp(5 + i)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      background: ins.type === 'success' ? 'rgba(34,197,94,0.06)' : ins.type === 'warning' ? 'rgba(251,191,36,0.06)' : 'rgba(99,102,241,0.06)',
                      border: `1px solid ${ins.type === 'success' ? 'rgba(34,197,94,0.12)' : ins.type === 'warning' ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.12)'}`,
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round"
                        stroke={ins.type === 'success' ? '#22C55E' : ins.type === 'warning' ? '#FBBF24' : '#6366F1'}>
                        {ins.type === 'success' && <path d="M5 13l4 4L19 7" />}
                        {ins.type === 'warning' && <><path d="M12 9v2m0 4h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></>}
                        {ins.type === 'info' && <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                      </svg>
                      <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>{ins.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Ranking ── */}
          <motion.div {...fadeUp(5)} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth={2} strokeLinecap="round">
                <path d="M8 21h8m-4-4v4m-4.5-9.5L12 7l4.5 4.5M12 3v4" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Ranking de redes</span>
            </div>

            {redesData.length === 0 ? (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 16px' }}>
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p style={{ fontSize: 14, color: 'var(--t3)', fontWeight: 500 }}>Nenhuma rede com metas fechadas ainda</p>
                <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 6 }}>Feche metas para ver o ranking aqui</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {redesData.map((rede, i) => {
                  const pct = topLucro > 0 ? Math.max(0, (rede.lucroFinal / topLucro) * 100) : 0
                  const isMedal = i < 3
                  return (
                    <motion.div key={rede.nome} {...fadeUp(6 + i)}>
                      <div className="card" style={{
                        padding: '18px 22px', position: 'relative', overflow: 'hidden',
                        background: isMedal ? `linear-gradient(135deg, rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.04), var(--surface))` : 'var(--surface)',
                        borderColor: isMedal ? `rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.15)` : 'var(--b1)',
                        transition: 'all 0.3s ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                          {/* Position */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isMedal ? `rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.12)` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isMedal ? `rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.2)` : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            {isMedal ? (
                              <svg width={16} height={16} viewBox="0 0 24 24" fill={MEDALS[i]} stroke="none">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>#{i + 1}</span>
                            )}
                          </div>

                          {/* Name + stats */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{rede.nome}</span>
                              {/* Trend arrow */}
                              {rede.trend === 'up' && (
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round">
                                  <path d="M7 17l5-5 5 5M7 7l5 5 5-5" />
                                </svg>
                              )}
                              {rede.trend === 'down' && (
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round">
                                  <path d="M17 7l-5 5-5-5M17 17l-5-5-5 5" />
                                </svg>
                              )}
                              {rede.trend === 'stable' && (
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2} strokeLinecap="round">
                                  <path d="M5 12h14" />
                                </svg>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--t2)' }}>{rede.metas.length}</span> metas fechadas
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--t2)' }}>{rede.depositantes}</span> depositantes
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--t2)' }}>{rede.remessaCount}</span> remessas
                              </span>
                            </div>
                          </div>

                          {/* Lucro */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{
                              fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', letterSpacing: '-0.02em',
                              color: rede.lucroFinal >= 0 ? 'var(--profit)' : 'var(--loss)',
                            }}>
                              R$ {fmt(rede.lucroFinal)}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>lucro final</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, pct)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.06, ease }}
                            style={{
                              height: '100%', borderRadius: 2,
                              background: rede.lucroFinal >= 0
                                ? `linear-gradient(90deg, rgba(34,197,94,0.6), rgba(34,197,94,0.3))`
                                : `linear-gradient(90deg, rgba(239,68,68,0.6), rgba(239,68,68,0.3))`,
                            }}
                          />
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
    </main>
  )
}
