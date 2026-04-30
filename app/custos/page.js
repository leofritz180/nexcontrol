'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { DEMO_COSTS, DEMO_BANNER_TEXT, shouldShowDemo } from '../../lib/demo-data'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || '?'

const COST_TYPES = [
  { id: 'proxy', label: 'Proxy', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', color: 'rgba(255,255,255,0.78)' },
  { id: 'sms', label: 'SMS', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', color: '#008C5E' },
  { id: 'instagram', label: 'Postagem Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z', color: '#E53935' },
  { id: 'bot', label: 'Bot / Automacao', icon: 'M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a2 2 0 010 4h-1a7 7 0 01-7 7h-2a7 7 0 01-7-7H4a2 2 0 010-4h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z', color: 'rgba(255,255,255,0.78)' },
  { id: 'vps', label: 'VPS / Servidor', icon: 'M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11zM6 16h.01M10 16h.01', color: 'rgba(255,255,255,0.78)' },
  { id: 'outros', label: 'Outros', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6', color: '#94A3B8' },
]

const typeMap = Object.fromEntries(COST_TYPES.map(t => [t.id, t]))

export default function CustosPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [costs, setCosts] = useState([])
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formType, setFormType] = useState('proxy')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => { checkAndLoad() }, [])

  async function checkAndLoad() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    loadData(p.tenant_id)
  }

  async function loadData(tid) {
    setLoading(true)
    const tenantId = tid || profile?.tenant_id
    const [costsRes, metasRes] = await Promise.all([
      supabase
        .from('costs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('metas')
        .select('lucro_final,fechada_em,deleted_at')
        .eq('tenant_id', tenantId),
    ])
    setCosts(costsRes.data || [])
    setMetas((metasRes.data || []).filter(m => !m.deleted_at && m.fechada_em))
    setLoading(false)
  }

  async function handleSave() {
    if (!formAmount || Number(formAmount) <= 0) return
    setSaving(true)
    await supabase.from('costs').insert({
      tenant_id: profile.tenant_id,
      type: formType,
      amount: Number(formAmount),
      date: formDate,
      note: formNote || null,
    })
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setShowModal(false)
      setFormType('proxy')
      setFormAmount('')
      setFormDate(new Date().toISOString().slice(0, 10))
      setFormNote('')
    }, 800)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este custo?')) return
    await supabase.from('costs').delete().eq('id', id)
    loadData()
  }

  const isDemo = !loading && shouldShowDemo(metas)
  const displayCosts = isDemo ? DEMO_COSTS : costs

  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const daysElapsed = new Date().getDate()

  const kpis = useMemo(() => {
    const custoHoje = displayCosts.filter(c => c.date === today).reduce((a, c) => a + Number(c.amount || 0), 0)
    const custoMes = displayCosts.filter(c => (c.date || '').slice(0, 7) === currentMonth).reduce((a, c) => a + Number(c.amount || 0), 0)

    const lucroHoje = metas
      .filter(m => (m.fechada_em || '').slice(0, 10) === today)
      .reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    const lucroTotal = metas.reduce((a, m) => a + Number(m.lucro_final || 0), 0)

    const mediaDia = daysElapsed > 0 ? custoMes / daysElapsed : 0
    const pctLucro = lucroHoje > 0 ? (custoHoje / lucroHoje * 100) : null
    const lucroLiquido = lucroHoje - custoHoje

    return { custoHoje, custoMes, lucroHoje, lucroTotal, lucroLiquido, mediaDia, pctLucro }
  }, [displayCosts, metas, today, currentMonth, daysElapsed])

  // Chart data: costs grouped by type
  const chartData = useMemo(() => {
    const grouped = {}
    displayCosts.forEach(c => {
      const key = c.type || 'outros'
      grouped[key] = (grouped[key] || 0) + Number(c.amount || 0)
    })
    const entries = Object.entries(grouped)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
    const max = entries.length > 0 ? entries[0][1] : 1
    return entries.map(([type, total]) => ({
      type,
      total,
      pct: (total / max) * 100,
      ct: typeMap[type] || typeMap['outros'],
    }))
  }, [displayCosts])

  if (loading) return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div className="spinner" style={{ width: 28, height: 28, borderTopColor: 'var(--brand-bright)' }} />
        </div>
      </AppLayout>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>

          {/* Hero — clean */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.03em', margin:'0 0 6px' }}>Custos</h1>
              <p style={{ fontSize:13, color:'var(--t3)', margin:0, fontWeight:400 }}>
                Proxy, SMS, bot, VPS e outros gastos operacionais
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 8, border: 'none', fontFamily:'inherit',
                background: 'rgba(255,255,255,0.78)', color: '#fff', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition:'background 0.15s ease',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background = '#2563eb' }}
              onMouseLeave={e=>{ e.currentTarget.style.background = 'rgba(255,255,255,0.78)' }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar custo
            </button>
          </div>

          {/* Demo Banner */}
          {isDemo && (
            <motion.div className="demo-banner" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
              style={{ padding:'12px 20px', borderRadius:12, marginBottom:24, background:'linear-gradient(135deg, rgba(229,57,53,0.08), rgba(229,57,53,0.03))', border:'1px solid rgba(229,57,53,0.15)', display:'flex', alignItems:'center', gap:10 }}>
              <div className="demo-banner-dot" style={{ width:8, height:8, borderRadius:'50%', background:'#e53935', flexShrink:0 }} />
              <span style={{ fontSize:13, color:'var(--t2)', fontWeight:500 }}>{DEMO_BANNER_TEXT}</span>
            </motion.div>
          )}

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>

            {/* Card 1: Custo do dia */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y:-3, boxShadow:'0 14px 36px rgba(0,0,0,0.5), 0 0 28px rgba(239,68,68,0.12)', transition:{duration:0.2} }}
              transition={{ delay: 0 }}
              style={{
                position:'relative', overflow:'hidden',
                padding: '20px 22px', borderRadius: 14,
                background:'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
                backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ position:'absolute', left:0, top:'22%', bottom:'22%', width:2, borderRadius:'0 2px 2px 0', background:'#EF4444', boxShadow:'0 0 8px #EF4444' }}/>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Custo do dia</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#EF4444', fontFamily: 'var(--mono)', letterSpacing: '-0.025em', margin: 0, textShadow:'0 0 18px rgba(239,68,68,0.22)' }}>
                R$ {fmt(kpis.custoHoje)}
              </p>
              <p style={{
                fontSize: 11, marginTop: 8, margin: '8px 0 0', fontWeight: 600,
                color: kpis.pctLucro !== null && kpis.pctLucro > 30 ? 'rgba(255,255,255,0.78)' : 'var(--t4)',
              }}>
                {kpis.pctLucro !== null
                  ? `${kpis.pctLucro.toFixed(1)}% do lucro de hoje`
                  : 'sem lucro registrado hoje'}
              </p>
            </motion.div>

            {/* Card 2: Lucro vs Custo — HIGHLIGHT */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y:-3, transition:{duration:0.2} }}
              transition={{ delay: 0.08 }}
              style={{
                padding: '20px 22px', borderRadius: 14,
                background: kpis.lucroLiquido>=0
                  ? 'linear-gradient(145deg, rgba(0,140,94,0.08), rgba(14,22,38,0.7))'
                  : 'linear-gradient(145deg, rgba(239,68,68,0.08), rgba(14,22,38,0.7))',
                backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
                border: `1px solid ${kpis.lucroLiquido>=0?'rgba(0,140,94,0.18)':'rgba(239,68,68,0.18)'}`,
                boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 32px ${kpis.lucroLiquido>=0?'rgba(0,140,94,0.08)':'rgba(239,68,68,0.08)'}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* subtle glow */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                borderRadius: '50%', pointerEvents: 'none',
                background: kpis.lucroLiquido >= 0
                  ? 'radial-gradient(circle, rgba(0,140,94,0.08) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
              }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Lucro vs Custo (hoje)</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Lucro bruto</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#008C5E', fontFamily: 'var(--mono)' }}>R$ {fmt(kpis.lucroHoje)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Custos</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--mono)' }}>- R$ {fmt(kpis.custoHoje)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--b2)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 700 }}>Lucro liquido</span>
                <span style={{
                  fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', letterSpacing: '-0.02em',
                  color: kpis.lucroLiquido >= 0 ? '#008C5E' : '#EF4444',
                }}>
                  R$ {fmt(kpis.lucroLiquido)}
                </span>
              </div>
            </motion.div>

            {/* Card 3: Custo do mes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y:-3, boxShadow:'0 14px 36px rgba(0,0,0,0.5), 0 0 28px rgba(255,255,255,0.12)', transition:{duration:0.2} }}
              transition={{ delay: 0.16 }}
              style={{
                position:'relative', overflow:'hidden',
                padding: '20px 22px', borderRadius: 14,
                background:'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
                backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ position:'absolute', left:0, top:'22%', bottom:'22%', width:2, borderRadius:'0 2px 2px 0', background:'rgba(255,255,255,0.78)', boxShadow:'0 0 8px rgba(255,255,255,0.78)' }}/>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Custo do mes</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--mono)', letterSpacing: '-0.025em', margin: 0, textShadow:'0 0 18px rgba(255,255,255,0.22)' }}>
                R$ {fmt(kpis.custoMes)}
              </p>
              <p style={{ fontSize: 11, marginTop: 8, margin: '8px 0 0', color: 'var(--t4)', fontWeight: 500 }}>
                Media de R$ {fmt(kpis.mediaDia)}/dia
              </p>
            </motion.div>
          </div>

          {/* Chart: Costs by type */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card a2"
              style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 32 }}
            >
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--b2)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Custos por tipo</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {chartData.map((item, i) => (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    {/* icon */}
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${item.ct.color}18`,
                      border: `1px solid ${item.ct.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={item.ct.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.ct.icon} />
                      </svg>
                    </div>
                    {/* label */}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', minWidth: 110, flexShrink: 0 }}>{item.ct.label}</span>
                    {/* bar */}
                    <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                        style={{
                          height: '100%', borderRadius: 6,
                          background: `linear-gradient(90deg, ${item.ct.color}50, ${item.ct.color}90)`,
                        }}
                      />
                    </div>
                    {/* value */}
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mono)', minWidth: 100, textAlign: 'right', flexShrink: 0 }}>
                      R$ {fmt(item.total)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* History List */}
          <div className="card a2" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--b2)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Historico de custos</p>
            </div>

            {displayCosts.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={1.2} strokeLinecap="round" style={{ marginBottom: 16, opacity: 0.4 }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <p style={{ fontSize: 15, color: 'var(--t2)', margin: 0, fontWeight: 600 }}>Adicione seu primeiro custo e entenda para onde seu dinheiro esta indo</p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowModal(true)}
                  style={{
                    marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#e53935', color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(229,57,53,0.25)',
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Adicionar custo
                </motion.button>
              </div>
            ) : (
              <div>
                {displayCosts.map((cost, i) => {
                  const ct = typeMap[cost.type] || typeMap['outros']
                  const isEven = i % 2 === 0
                  return (
                    <motion.div
                      key={cost.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="cost-row"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 24px',
                        background: isEven ? 'transparent' : 'rgba(255,255,255,0.015)',
                        borderBottom: i < displayCosts.length - 1 ? '1px solid var(--b1)' : 'none',
                        transition: 'all 0.15s',
                        cursor: 'default',
                        position: 'relative',
                      }}
                      whileHover={{
                        y: -1,
                        borderColor: 'var(--b2)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = 'var(--b2)'
                        const btn = e.currentTarget.querySelector('.del-btn')
                        if (btn) btn.style.opacity = '1'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isEven ? 'transparent' : 'rgba(255,255,255,0.015)'
                        const btn = e.currentTarget.querySelector('.del-btn')
                        if (btn) btn.style.opacity = '0'
                      }}
                    >
                      {/* Type icon */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `${ct.color}18`,
                        border: `1px solid ${ct.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ct.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d={ct.icon} />
                        </svg>
                      </div>

                      {/* Type label + note */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{ct.label}</p>
                        {cost.note && (
                          <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                            {cost.note}
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mono)', margin: 0, flexShrink: 0 }}>
                        R$ {fmt(cost.amount)}
                      </p>

                      {/* Date */}
                      <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0, flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                        {cost.date ? new Date(cost.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </p>

                      {/* Delete — hidden until hover (hidden in demo mode) */}
                      {!isDemo && <motion.button
                        className="del-btn"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(cost.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 7, border: 'none', flexShrink: 0,
                          background: 'rgba(239,68,68,0.1)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                      >
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.2} strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </motion.button>}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Cost Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => { if (!saving) setShowModal(false) }}
              style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 480, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
                  background: 'linear-gradient(160deg, #000000, #000000)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 22,
                  padding: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)',
                  position: 'relative',
                }}
              >
                {/* Success flash overlay */}
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute', inset: 0, zIndex: 20,
                        background: 'rgba(0,140,94,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 18,
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                      >
                        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#008C5E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal header premium */}
                <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(239,68,68,0.45), transparent)', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(239,68,68,0.08), transparent 65%)', filter:'blur(30px)', pointerEvents:'none' }}/>

                <div style={{ position:'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:38, height:38, borderRadius:11,
                      background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.28)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 0 16px rgba(239,68,68,0.18)',
                    }}>
                      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    </div>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing:'-0.02em' }}>Novo custo</h2>
                      <p style={{ fontSize:11, color:'var(--t4)', margin:'2px 0 0', fontWeight:500 }}>Registre um gasto operacional</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t3)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--t3)' }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Type selector — pills with icon + colored border */}
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {COST_TYPES.map(ct => {
                    const active = formType === ct.id
                    return (
                      <motion.button
                        key={ct.id}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setFormType(ct.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: active ? `${ct.color}20` : 'rgba(255,255,255,0.03)',
                          border: active ? `2px solid ${ct.color}` : '1px solid var(--b1)',
                          color: active ? ct.color : 'var(--t3)',
                          boxShadow: active ? `0 0 12px ${ct.color}25` : 'none',
                        }}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={active ? ct.color : 'var(--t4)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d={ct.icon} />
                        </svg>
                        {ct.label}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Amount — larger font */}
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</p>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--t4)', fontWeight: 700, fontFamily: 'var(--mono)' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="input"
                    style={{
                      width: '100%', padding: '14px 14px 14px 52px',
                      fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '-0.01em',
                      borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--b2)', color: 'var(--t1)',
                    }}
                  />
                </div>

                {/* Date */}
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</p>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b2)', color: 'var(--t1)', marginBottom: 16 }}
                />

                {/* Note */}
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nota (opcional)</p>
                <textarea
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="Descricao do custo..."
                  rows={3}
                  className="input"
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b2)', color: 'var(--t1)', resize: 'vertical', marginBottom: 24 }}
                />

                {/* Submit premium */}
                <motion.button
                  whileHover={saving || !formAmount || Number(formAmount) <= 0 ? {} : { scale: 1.015, boxShadow:'0 12px 36px rgba(229,57,53,0.5), 0 0 50px rgba(229,57,53,0.18)' }}
                  whileTap={saving || !formAmount || Number(formAmount) <= 0 ? {} : { scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving || !formAmount || Number(formAmount) <= 0}
                  style={{
                    width: '100%', padding: '14px 22px', borderRadius: 12, border: 'none', fontFamily:'inherit',
                    background: saving || !formAmount || Number(formAmount) <= 0 ? 'rgba(229,57,53,0.35)' : 'linear-gradient(145deg, #e53935, #c62828)',
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    cursor: saving || !formAmount || Number(formAmount) <= 0 ? 'not-allowed' : 'pointer',
                    opacity: saving || !formAmount || Number(formAmount) <= 0 ? 0.6 : 1,
                    boxShadow: saving || !formAmount || Number(formAmount) <= 0 ? 'none' : '0 6px 22px rgba(229,57,53,0.4), 0 0 30px rgba(229,57,53,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transition: 'all 0.2s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8, letterSpacing:'-0.01em',
                  }}
                >
                  {saving ? (
                    <>
                      <motion.div animate={{ rotate:360 }} transition={{ duration:0.7, repeat:Infinity, ease:'linear' }}
                        style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff' }}/>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Adicionar custo
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <style>{`
          @media (max-width: 768px) { .del-btn { opacity: 1 !important; } }
          @media (hover: none) { .del-btn { opacity: 0.6 !important; } }
        `}</style>
      </AppLayout>
    </main>
  )
}
