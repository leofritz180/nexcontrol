'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ease = [0.33, 1, 0.68, 1]

const REDES = ['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']

const REDE_COLORS = {
  W1:'#e53935',WE:'#2979FF',VOY:'#ab47bc','91':'#ff9800',DZ:'#00e676',A8:'#ffeb3b',
  OKOK:'#ff5722',ANJO:'#ec407a',XW:'#26c6da',EK:'#8d6e63',DY:'#66bb6a','777':'#ffd600',
  '888':'#ef5350',WP:'#42a5f5',BRA:'#66bb6a',GAME:'#ab47bc',ALFA:'#29b6f6',KK:'#ffa726',
  MK:'#9ccc65',M9:'#7e57c2',KF:'#26a69a',PU:'#ec407a',COROA:'#fdd835',MANGA:'#ff7043',
  AA:'#5c6bc0',FP:'#78909c',DEFAULT:'#546e7a',
}
const getRedeColor = r => REDE_COLORS[r] || REDE_COLORS.DEFAULT

const STATUSES = [
  { key: 'pendente', label: 'Pendente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: 'clock' },
  { key: 'em_andamento', label: 'Em andamento', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', icon: 'play' },
  { key: 'concluido', label: 'Concluido', color: '#22C55E', bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.25)', icon: 'check' },
  { key: 'problema', label: 'Problema', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', icon: 'alert' },
]
const getStatus = k => STATUSES.find(s => s.key === k) || STATUSES[0]

const EMPTY_ROW = { rede: '', quantidade: 0, agente: '', apostas: '', link: '', operator_id: null, operator_name: '', status: 'pendente', concluido: false, observacao: '', prejuizo: 0, tipo_resultado: 'prejuizo', custos: 0, salario_bau: 0, lucro_final: 0, lucro_parcial: 0 }

function StatusIcon({ icon, size = 10, color }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' }
  if (icon === 'check') return <svg {...s}><polyline points="20 6 9 17 4 12"/></svg>
  if (icon === 'play') return <svg {...s}><polygon points="5 3 19 12 5 21 5 3" fill={color} stroke="none"/></svg>
  if (icon === 'alert') return <svg {...s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  return <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}

function CellInput({ value, onChange, type = 'text', placeholder, mono, style: s, ...rest }) {
  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const td = e.target.closest('td')
      if (!td) return
      const tr = td.closest('tr')
      if (!tr) return
      const cellIdx = Array.from(tr.cells).indexOf(td)
      const nextRow = tr.nextElementSibling
      if (nextRow && nextRow.cells[cellIdx]) {
        const inp = nextRow.cells[cellIdx].querySelector('input,select')
        if (inp) inp.focus()
      }
    }
  }
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? e.target.value : e.target.value)}
      onKeyDown={handleKey}
      placeholder={placeholder} {...rest}
      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--t1)', fontSize: 12, fontWeight: 500, padding: '8px 10px', fontFamily: mono ? 'var(--mono)' : 'inherit', ...s }}
    />
  )
}

function OperatorAvatar({ name, color }) {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color }}>{(name || '?')[0].toUpperCase()}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════ */

export default function PlanejamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [rows, setRows] = useState([])
  const [operators, setOperators] = useState([])
  const [filter, setFilter] = useState('todos')
  const [_showAdd, _setShowAdd] = useState(false) // unused — kept for compat
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | 'error'
  const saveTimerRef = useRef(null)
  const debounceRef = useRef({})

  const getName = op => op?.nome || op?.email?.split('@')[0] || 'Operador'

  const fetchRows = useCallback(async (email) => {
    const res = await fetch(`/api/admin/planilha?email=${encodeURIComponent(email)}`)
    if (res.ok) { const j = await res.json(); setRows(j.rows || []) }
  }, [])

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u || u.email !== OWNER) { router.push('/admin'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p || p.role !== 'admin') { router.push('/admin'); return }
      setProfile(p)
      if (p.tenant_id) {
        const [{ data: t }, { data: ops }] = await Promise.all([
          supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
          supabase.from('profiles').select('id,nome,email').eq('tenant_id', p.tenant_id).eq('role', 'operator'),
        ])
        setTenant(t)
        setOperators(ops || [])
      }
      await fetchRows(u.email)
      setLoading(false)
    }
    init()
  }, [])

  async function saveRow(row) {
    setSaving(row.id || 'new')
    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const res = await fetch('/api/admin/planilha', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, row }),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(null)
    if (j.ok && j.row) {
      setRows(prev => {
        const idx = prev.findIndex(r => r.id === j.row.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = j.row; return next }
        return [...prev, j.row]
      })
      setSaveStatus('saved')
      saveTimerRef.current = setTimeout(() => setSaveStatus(null), 2000)
    } else {
      setSaveStatus('error')
      saveTimerRef.current = setTimeout(() => setSaveStatus(null), 3000)
    }
    return j
  }

  function debounceSave(row, field) {
    const key = row.id + '_' + field
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key])
    setSaveStatus('saving')
    debounceRef.current[key] = setTimeout(() => saveRow(row), 400)
  }

  function updateField(id, field, value) {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (['prejuizo', 'custos', 'salario_bau', 'tipo_resultado'].includes(field)) {
        const val = Number(updated.prejuizo || 0)
        const resultado = (updated.tipo_resultado === 'lucro') ? val : -val
        updated.lucro_final = Number((Number(updated.salario_bau || 0) + resultado - Number(updated.custos || 0)).toFixed(2))
      }
      debounceSave(updated, field)
      return updated
    }))
  }

  function cycleStatus(row) {
    const order = ['pendente', 'em_andamento', 'concluido', 'problema']
    const idx = order.indexOf(row.status || 'pendente')
    const next = order[(idx + 1) % order.length]
    updateField(row.id, 'status', next)
  }

  async function addRow() {
    await saveRow({ ...EMPTY_ROW, sort_order: rows.length })
  }

  async function deleteRow(id) {
    if (!confirm('Excluir esta linha?')) return
    await fetch('/api/admin/planilha', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, id }),
    })
    setRows(prev => prev.filter(r => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  if (loading) return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 22, height: 22, borderTopColor: '#e53935' }} />
      </main>
    </AppLayout>
  )

  const isRowEmpty = r => !r.rede && !r.agente && Number(r.quantidade || 0) === 0
  const filtered = filter === 'todos' ? rows
    : filter === 'vazia' ? rows.filter(r => isRowEmpty(r))
    : rows.filter(r => (r.status || 'pendente') === filter)

  // KPIs
  const totalRows = rows.length
  const totalContas = rows.reduce((s, r) => s + Number(r.quantidade || 0), 0)
  const done = rows.filter(r => r.status === 'concluido').length
  const pctDone = totalRows > 0 ? Math.round((done / totalRows) * 100) : 0
  const withPrej = rows.filter(r => Number(r.prejuizo || 0) > 0).length
  const totalPrej = rows.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalSalBau = rows.reduce((s, r) => s + Number(r.salario_bau || 0), 0)
  const totalLucro = rows.reduce((s, r) => s + Number(r.lucro_final || 0), 0)
  const totalLucroParcial = rows.reduce((s, r) => s + Number(r.lucro_parcial || 0), 0)
  const problemas = rows.filter(r => r.status === 'problema').length

  // Operator color map (stable per operator)
  const opColors = ['#3B82F6','#a855f7','#ec4899','#06b6d4','#f97316','#84cc16','#f43f5e','#14b8a6']
  const opColorMap = {}
  operators.forEach((op, i) => { opColorMap[op.id] = opColors[i % opColors.length] })

  return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', padding: '32px 24px 80px', maxWidth: 1600, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Controle Operacional</h1>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Planejamento de metas e plataformas</p>
            </div>
          </div>
          {/* Indicador de salvamento */}
          <AnimatePresence>
            {saveStatus && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
                  background: saveStatus === 'saving' ? 'rgba(59,130,246,0.1)' : saveStatus === 'saved' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${saveStatus === 'saving' ? 'rgba(59,130,246,0.2)' : saveStatus === 'saved' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                {saveStatus === 'saving' && <div className="spinner" style={{ width: 10, height: 10, borderTopColor: '#3B82F6', borderWidth: 2 }} />}
                {saveStatus === 'saved' && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                {saveStatus === 'error' && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                <span style={{ fontSize: 10, fontWeight: 600, color: saveStatus === 'saving' ? '#60A5FA' : saveStatus === 'saved' ? '#22C55E' : '#EF4444' }}>
                  {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : 'Erro ao salvar'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* KPIs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.04, ease }}>
          <div className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 18 }}>
            {[
              { l: 'Linhas', v: totalRows, c: 'var(--t1)', sub: `${totalContas} contas` },
              { l: 'Concluido', v: `${pctDone}%`, c: '#22C55E', sub: `${done}/${totalRows}` },
              { l: 'Com prejuizo', v: withPrej, c: '#EF4444', sub: `R$ ${fmt(totalPrej)}` },
              { l: 'Problemas', v: problemas, c: problemas > 0 ? '#EF4444' : '#64748B', sub: problemas > 0 ? 'Atencao!' : 'Nenhum' },
              { l: 'Sal. + Bau', v: `R$ ${fmt(totalSalBau)}`, c: '#a855f7' },
              { l: 'Lucro parcial', v: `${totalLucroParcial >= 0 ? '+' : ''}R$ ${fmt(totalLucroParcial)}`, c: totalLucroParcial >= 0 ? '#22C55E' : '#EF4444', sub: 'Soma parcial' },
              { l: 'Lucro total', v: `${totalLucro >= 0 ? '+' : ''}R$ ${fmt(totalLucro)}`, c: totalLucro >= 0 ? '#22C55E' : '#EF4444' },
            ].map((k, i) => (
              <motion.div key={k.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 + i * 0.03, ease }}
                style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(145deg, #0c1424, #080e1a)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 9, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: '0 0 5px' }}>{k.l}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: k.c, margin: 0, lineHeight: 1 }}>{k.v}</p>
                {k.sub && <p style={{ fontSize: 10, color: 'var(--t4)', margin: '4px 0 0' }}>{k.sub}</p>}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['todos', 'Todos', null], ...STATUSES.map(s => [s.key, s.label, s.color]), ['vazia', 'Vazias', '#64748B']].map(([k, l, c]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '5px 14px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              background: filter === k ? `${c || '#e53935'}18` : 'rgba(255,255,255,0.02)',
              color: filter === k ? (c || '#e53935') : 'var(--t3)',
              border: `1px solid ${filter === k ? `${c || '#e53935'}40` : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.15s', letterSpacing: '0.03em',
            }}>{l}</button>
          ))}
        </div>

        {/* ═══ TABLE (Desktop) ═══ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease }}
          className="plan-table-wrap"
          style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(145deg, #0c1424, #080e1a)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
              <thead>
                <tr style={{ background: 'rgba(229,57,53,0.04)' }}>
                  <th style={{ width: 5, padding: 0 }}/>
                  {['REDE', 'QTD', 'AGENTE', 'APOSTAS', 'LINK', 'OPERADOR', 'STATUS', 'OBS/FALTA', 'PREJ./LUCRO', 'CUSTOS', 'SAL+BAU', 'LUCRO TOTAL', 'LUCRO PARCIAL', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '2px solid rgba(229,57,53,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((r, i) => {
                    const lf = Number(r.lucro_final || 0)
                    const isPos = lf >= 0
                    const empty = isRowEmpty(r)
                    const st = getStatus(r.status)
                    const redeC = getRedeColor(r.rede)
                    const isExpanded = expandedId === r.id
                    const stripe = i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent'

                    return (
                      <motion.tr key={r.id} layout
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0, x: 12 }}
                        transition={{ duration: 0.25, ease }}
                        className="plan-row"
                        style={{
                          borderBottom: `1px solid ${st.key === 'problema' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)'}`,
                          background: st.key === 'concluido' ? 'rgba(34,197,94,0.04)' : st.key === 'problema' ? 'rgba(239,68,68,0.04)' : stripe,
                          opacity: st.key === 'concluido' ? 0.55 : empty ? 0.4 : 1,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        {/* Accent bar */}
                        <td style={{ width: 5, padding: 0 }}>
                          <div style={{ width: 5, height: '100%', minHeight: 44, background: empty ? 'rgba(255,255,255,0.04)' : `linear-gradient(180deg, ${redeC}, ${redeC}88)`, borderRadius: '0 3px 3px 0' }} />
                        </td>
                        {/* Rede */}
                        <td style={{ padding: '4px 6px', minWidth: 80 }} onClick={e => e.stopPropagation()}>
                          <select value={r.rede || ''} onChange={e => updateField(r.id, 'rede', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: redeC, fontSize: 13, fontWeight: 900, cursor: 'pointer', outline: 'none', width: '100%', padding: '6px 4px', letterSpacing: '0.02em' }}>
                            <option value="" style={{ background: '#0c1424' }}>--</option>
                            {REDES.map(rd => <option key={rd} value={rd} style={{ background: '#0c1424' }}>{rd}</option>)}
                          </select>
                        </td>
                        {/* Qtd */}
                        <td style={{ padding: '4px 2px', minWidth: 55 }} onClick={e => e.stopPropagation()}>
                          <CellInput type="number" value={r.quantidade} onChange={v => updateField(r.id, 'quantidade', Number(v) || 0)} mono min="0" step="1" />
                        </td>
                        {/* Agente */}
                        <td style={{ padding: '4px 2px', minWidth: 100 }} onClick={e => e.stopPropagation()}>
                          <CellInput value={r.agente} onChange={v => updateField(r.id, 'agente', v)} placeholder="Nome..." style={{ fontWeight: 700, color: '#F59E0B' }} />
                        </td>
                        {/* Apostas */}
                        <td style={{ padding: '4px 2px', minWidth: 80 }} onClick={e => e.stopPropagation()}>
                          <CellInput value={r.apostas} onChange={v => updateField(r.id, 'apostas', v)} placeholder="70 - 1,5X" style={{ color: '#22C55E', fontWeight: 600 }} />
                        </td>
                        {/* Link */}
                        <td style={{ padding: '4px 6px', minWidth: 220 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CellInput value={r.link} onChange={v => updateField(r.id, 'link', v)} placeholder="https://..." style={{ fontSize: 11 }} />
                            {r.link && (
                              <>
                                <button type="button" title="Ver link completo" onClick={() => alert(r.link)}
                                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                </button>
                                <a href={r.link} target="_blank" rel="noopener noreferrer" title="Abrir link"
                                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4, transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                        {/* Operador */}
                        <td style={{ padding: '4px 6px', minWidth: 130 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {r.operator_id && <OperatorAvatar name={r.operator_name || '?'} color={opColorMap[r.operator_id] || '#3B82F6'} />}
                            <select value={r.operator_id || ''} onChange={e => {
                              const op = operators.find(o => o.id === e.target.value)
                              updateField(r.id, 'operator_id', e.target.value || null)
                              updateField(r.id, 'operator_name', op ? getName(op) : '')
                            }} style={{ background: 'transparent', border: 'none', color: r.operator_id ? (opColorMap[r.operator_id] || '#60A5FA') : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', flex: 1, padding: '4px 2px' }}>
                              <option value="" style={{ background: '#0c1424' }}>Disponivel</option>
                              {operators.map(op => <option key={op.id} value={op.id} style={{ background: '#0c1424' }}>{getName(op)}</option>)}
                            </select>
                          </div>
                        </td>
                        {/* Status */}
                        <td style={{ padding: '4px 6px', minWidth: 110 }} onClick={e => e.stopPropagation()}>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => cycleStatus(r)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                              transition: 'all 0.15s', whiteSpace: 'nowrap',
                              animation: st.key === 'em_andamento' ? 'plan-pulse 2.5s ease-in-out infinite' : 'none',
                            }}>
                            <StatusIcon icon={st.icon} size={10} color={st.color} />
                            {st.label.toUpperCase()}
                          </motion.button>
                        </td>
                        {/* Obs */}
                        <td style={{ padding: '4px 2px', minWidth: 110 }} onClick={e => e.stopPropagation()}>
                          <CellInput value={r.observacao} onChange={v => updateField(r.id, 'observacao', v)} placeholder="Obs..." style={{ fontSize: 11, color: 'var(--t3)' }} />
                        </td>
                        {/* Prej./Lucro */}
                        <td style={{ padding: '4px 2px', minWidth: 95 }} onClick={e => e.stopPropagation()}>
                          {(() => {
                            const isLucro = (r.tipo_resultado || 'prejuizo') === 'lucro'
                            const val = Number(r.prejuizo || 0)
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button type="button" onClick={() => updateField(r.id, 'tipo_resultado', isLucro ? 'prejuizo' : 'lucro')} title={isLucro ? 'Lucro (clique p/ prejuizo)' : 'Prejuizo (clique p/ lucro)'}
                                  style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isLucro ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', transition: 'all 0.15s' }}>
                                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={isLucro ? '#22C55E' : '#EF4444'} strokeWidth="3" strokeLinecap="round"><polyline points={isLucro ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/></svg>
                                </button>
                                <CellInput type="number" value={r.prejuizo} onChange={v => updateField(r.id, 'prejuizo', Number(v) || 0)} mono step="0.01"
                                  style={{ color: val > 0 ? (isLucro ? '#22C55E' : '#EF4444') : 'var(--t4)', fontWeight: val > 0 ? 700 : 400 }} />
                              </div>
                            )
                          })()}
                        </td>
                        {/* Custos */}
                        <td style={{ padding: '4px 2px', minWidth: 75 }} onClick={e => e.stopPropagation()}>
                          <CellInput type="number" value={r.custos} onChange={v => updateField(r.id, 'custos', Number(v) || 0)} mono step="0.01" style={{ color: '#F59E0B' }} />
                        </td>
                        {/* Sal+Bau */}
                        <td style={{ padding: '4px 2px', minWidth: 75 }} onClick={e => e.stopPropagation()}>
                          <CellInput type="number" value={r.salario_bau} onChange={v => updateField(r.id, 'salario_bau', Number(v) || 0)} mono step="0.01" style={{ color: '#a855f7' }} />
                        </td>
                        {/* Lucro Total (auto-calculado) */}
                        <td style={{ padding: '6px 8px', minWidth: 90 }}>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800,
                            color: lf === 0 ? 'var(--t4)' : isPos ? '#22C55E' : '#EF4444',
                            textShadow: Math.abs(lf) > 100 ? `0 0 10px ${isPos ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` : 'none',
                          }}>
                            {lf === 0 ? '—' : `${isPos ? '+' : ''}R$ ${fmt(lf)}`}
                          </span>
                        </td>
                        {/* Lucro Parcial (manual) */}
                        <td style={{ padding: '4px 2px', minWidth: 90 }} onClick={e => e.stopPropagation()}>
                          {(() => { const lp = Number(r.lucro_parcial || 0); const lpPos = lp >= 0; return (
                            <CellInput type="number" value={r.lucro_parcial} onChange={v => updateField(r.id, 'lucro_parcial', Number(v) || 0)} mono step="0.01"
                              style={{ color: lp === 0 ? 'var(--t4)' : lpPos ? '#4ade80' : '#fca5a5', fontWeight: 700 }} />
                          )})()}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '4px 6px', width: 32 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => deleteRow(r.id)} title="Excluir"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.25, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.25'}>
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>
                {filter !== 'todos' ? 'Nenhuma linha nesse filtro' : 'Nenhuma linha — clique "Nova linha"'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Botao nova linha (abaixo da tabela) */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={addRow}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 20px', marginTop: 12, marginBottom: 8, borderRadius: 12, border: '1px dashed rgba(229,57,53,0.3)', background: 'rgba(229,57,53,0.04)', color: '#e53935', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,57,53,0.08)'; e.currentTarget.style.borderColor = 'rgba(229,57,53,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(229,57,53,0.04)'; e.currentTarget.style.borderColor = 'rgba(229,57,53,0.3)' }}
          className="plan-add-btn">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova linha
        </motion.button>

        {/* ═══ MOBILE CARDS ═══ */}
        <div className="plan-mobile-cards">
          {filtered.map((r, i) => {
            const lf = Number(r.lucro_final || 0)
            const st = getStatus(r.status)
            const redeC = getRedeColor(r.rede)
            const isExpanded = expandedId === r.id
            return (
              <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02, ease }}
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                style={{
                  borderRadius: 14, overflow: 'hidden', marginBottom: 10,
                  background: 'var(--surface)', border: `1px solid ${st.key === 'problema' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: st.key === 'concluido' ? 0.6 : isRowEmpty(r) ? 0.4 : 1,
                }}>
                {/* Color top bar */}
                <div style={{ height: 3, background: r.rede ? `linear-gradient(90deg, ${redeC}, ${redeC}66)` : 'rgba(255,255,255,0.04)' }} />
                <div style={{ padding: '14px 16px' }}>
                  {/* Top line */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: redeC }}>{r.rede || '--'}</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{r.quantidade || 0} contas</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); cycleStatus(r) }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, cursor: 'pointer' }}>
                      <StatusIcon icon={st.icon} size={9} color={st.color} />
                      {st.label.toUpperCase()}
                    </button>
                  </div>
                  {/* Info */}
                  {(r.agente || r.operator_name) && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 11 }}>
                      {r.agente && <span style={{ color: '#F59E0B', fontWeight: 600 }}>{r.agente}</span>}
                      {r.operator_name && <span style={{ color: '#60A5FA' }}>{r.operator_name}</span>}
                    </div>
                  )}
                  {/* Lucro */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800, color: lf === 0 ? 'var(--t4)' : lf >= 0 ? '#22C55E' : '#EF4444' }}>
                      {lf === 0 ? 'R$ 0,00' : `${lf >= 0 ? '+' : ''}R$ ${fmt(lf)}`}
                    </span>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  {/* Expanded */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={{ fontSize: 9, color: 'var(--t4)', fontWeight: 700 }}>APOSTAS</label><CellInput value={r.apostas} onChange={v => updateField(r.id, 'apostas', v)} placeholder="70 - 1,5X" style={{ color: '#22C55E', fontWeight: 600 }} /></div>
                            <div><label style={{ fontSize: 9, color: 'var(--t4)', fontWeight: 700 }}>LINK</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CellInput value={r.link} onChange={v => updateField(r.id, 'link', v)} placeholder="https://..." style={{ fontSize: 11 }} />
                                {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ padding: 2 }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>}
                              </div>
                            </div>
                          </div>
                          <div><label style={{ fontSize: 9, color: 'var(--t4)', fontWeight: 700 }}>OBS / FALTA</label><CellInput value={r.observacao} onChange={v => updateField(r.id, 'observacao', v)} placeholder="Observacao..." /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <div><label style={{ fontSize: 9, color: '#EF4444', fontWeight: 700 }}>PREJUIZO</label><CellInput type="number" value={r.prejuizo} onChange={v => updateField(r.id, 'prejuizo', Number(v) || 0)} mono step="0.01" style={{ color: '#EF4444' }} /></div>
                            <div><label style={{ fontSize: 9, color: '#F59E0B', fontWeight: 700 }}>CUSTOS</label><CellInput type="number" value={r.custos} onChange={v => updateField(r.id, 'custos', Number(v) || 0)} mono step="0.01" style={{ color: '#F59E0B' }} /></div>
                            <div><label style={{ fontSize: 9, color: '#a855f7', fontWeight: 700 }}>SAL+BAU</label><CellInput type="number" value={r.salario_bau} onChange={v => updateField(r.id, 'salario_bau', Number(v) || 0)} mono step="0.01" style={{ color: '#a855f7' }} /></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                            <button onClick={() => deleteRow(r.id)} style={{ fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>Excluir</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* modal removido — botao Nova linha cria direto */}

        <style>{`
          .plan-mobile-cards { display: none; }
          .plan-row:hover { opacity: 1 !important; transform: scale(1.004); box-shadow: 0 0 20px rgba(255,255,255,0.02); z-index: 2; position: relative; }
          @keyframes plan-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } 50% { box-shadow: 0 0 0 4px rgba(59,130,246,0.12); } }
          @media (max-width: 768px) {
            .plan-table-wrap { display: none !important; }
            .plan-mobile-cards { display: block; }
          }
        `}</style>
      </main>
    </AppLayout>
  )
}
