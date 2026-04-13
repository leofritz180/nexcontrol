'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || '?'

const COST_TYPES = [
  { id: 'proxy', label: 'Proxy', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', color: '#3B82F6' },
  { id: 'sms', label: 'SMS', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', color: '#22C55E' },
  { id: 'instagram', label: 'Postagem Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z', color: '#E53935' },
  { id: 'bot', label: 'Bot / Automacao', icon: 'M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a2 2 0 010 4h-1a7 7 0 01-7 7h-2a7 7 0 01-7-7H4a2 2 0 010-4h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z', color: '#A855F7' },
  { id: 'vps', label: 'VPS / Servidor', icon: 'M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11zM6 16h.01M10 16h.01', color: '#F59E0B' },
  { id: 'outros', label: 'Outros', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6', color: '#94A3B8' },
]

const typeMap = Object.fromEntries(COST_TYPES.map(t => [t.id, t]))

export default function CustosPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [costs, setCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formType, setFormType] = useState('proxy')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { checkAndLoad() }, [])

  async function checkAndLoad() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    loadCosts(p.tenant_id)
  }

  async function loadCosts(tid) {
    setLoading(true)
    const { data } = await supabase
      .from('costs')
      .select('*')
      .eq('tenant_id', tid || profile?.tenant_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setCosts(data || [])
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
    setShowModal(false)
    setFormType('proxy')
    setFormAmount('')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormNote('')
    loadCosts()
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este custo?')) return
    await supabase.from('costs').delete().eq('id', id)
    loadCosts()
  }

  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const kpis = useMemo(() => {
    const custosHoje = costs.filter(c => c.date === today).reduce((a, c) => a + Number(c.amount || 0), 0)
    const custosMes = costs.filter(c => (c.date || '').slice(0, 7) === currentMonth).reduce((a, c) => a + Number(c.amount || 0), 0)
    const custosTotal = costs.reduce((a, c) => a + Number(c.amount || 0), 0)
    return { custosHoje, custosMes, custosTotal }
  }, [costs, today, currentMonth])

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

          {/* Header */}
          <div className="a1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Custos</h1>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: '4px 0 0' }}>Controle fino da operacao</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, border: 'none',
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

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Custos hoje', value: kpis.custosHoje },
              { label: 'Custos do mes', value: kpis.custosMes },
              { label: 'Custos total', value: kpis.custosTotal },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card a1"
                style={{ padding: '22px 24px', background: 'var(--surface)', border: '1px solid var(--b2)', borderRadius: 14 }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{kpi.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em', margin: 0 }}>
                  R$ {fmt(kpi.value)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Costs List */}
          <div className="card a2" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--b2)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Historico de custos</p>
            </div>

            {costs.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={1.2} strokeLinecap="round" style={{ marginBottom: 12, opacity: 0.5 }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <p style={{ fontSize: 14, color: 'var(--t3)', margin: 0 }}>Nenhum custo registrado</p>
                <p style={{ fontSize: 12, color: 'var(--t4)', margin: '6px 0 0' }}>Clique em "Adicionar custo" para comecar</p>
              </div>
            ) : (
              <div>
                {costs.map((cost, i) => {
                  const ct = typeMap[cost.type] || typeMap['outros']
                  return (
                    <motion.div
                      key={cost.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 24px',
                        borderBottom: i < costs.length - 1 ? '1px solid var(--b1)' : 'none',
                        transition: 'background 0.15s',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
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

                      {/* Type label */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{ct.label}</p>
                        {cost.note && <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cost.note}</p>}
                      </div>

                      {/* Amount */}
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mono)', margin: 0, flexShrink: 0 }}>
                        R$ {fmt(cost.amount)}
                      </p>

                      {/* Date */}
                      <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0, flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                        {cost.date ? new Date(cost.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </p>

                      {/* Delete */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(cost.id)}
                        style={{
                          width: 30, height: 30, borderRadius: 8, border: 'none', flexShrink: 0,
                          background: 'rgba(239,68,68,0.08)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </motion.button>
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
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  zIndex: 510, width: '90%', maxWidth: 520,
                  background: 'var(--surface)', border: '1px solid var(--b2)', borderRadius: 18,
                  padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                }}
              >
                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Novo custo</h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth={2} strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Type selector */}
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
                          border: active ? `1px solid ${ct.color}50` : '1px solid var(--b1)',
                          color: active ? ct.color : 'var(--t3)',
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

                {/* Amount */}
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</p>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--t4)', fontWeight: 600 }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="input"
                    style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14, fontFamily: 'var(--mono)', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b2)', color: 'var(--t1)' }}
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

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !formAmount || Number(formAmount) <= 0}
                  style={{
                    width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
                    background: '#e53935', color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving || !formAmount || Number(formAmount) <= 0 ? 0.5 : 1,
                    boxShadow: '0 4px 20px rgba(229,57,53,0.25)',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {saving ? 'Salvando...' : 'Adicionar custo'}
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </AppLayout>
    </main>
  )
}
