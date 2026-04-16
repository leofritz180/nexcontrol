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

const EMPTY_ROW = { rede: '', quantidade: 0, agente: '', apostas: '', link: '', operator_id: null, operator_name: '', concluido: false, observacao: '', prejuizo: 0, custos: 0, salario_bau: 0, lucro_final: 0 }

function CellInput({ value, onChange, type = 'text', placeholder, mono, min, step, style: s }) {
  return (
    <input
      type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? e.target.value : e.target.value)}
      placeholder={placeholder} min={min} step={step}
      style={{
        width: '100%', background: 'transparent', border: 'none', outline: 'none',
        color: 'var(--t1)', fontSize: 12, fontWeight: 500, padding: '8px 10px',
        fontFamily: mono ? 'var(--mono)' : 'inherit', ...s,
      }}
    />
  )
}

export default function PlanejamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [rows, setRows] = useState([])
  const [operators, setOperators] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(null)
  const [filter, setFilter] = useState('todos')
  const [showAdd, setShowAdd] = useState(false)
  const [newRow, setNewRow] = useState({ ...EMPTY_ROW })
  const debounceRef = useRef({})

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
    }
    return j
  }

  function debounceSave(row, field) {
    const key = row.id + '_' + field
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key])
    debounceRef.current[key] = setTimeout(() => saveRow(row), 600)
  }

  function updateField(id, field, value) {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (['prejuizo', 'custos', 'salario_bau'].includes(field)) {
        updated.lucro_final = Number((Number(updated.salario_bau || 0) - Number(updated.prejuizo || 0) - Number(updated.custos || 0)).toFixed(2))
      }
      debounceSave(updated, field)
      return updated
    }))
  }

  async function addRow() {
    if (!newRow.rede) return
    const j = await saveRow({ ...newRow, sort_order: rows.length })
    if (j.ok) { setShowAdd(false); setNewRow({ ...EMPTY_ROW }) }
  }

  async function deleteRow(id) {
    if (!confirm('Excluir esta linha?')) return
    await fetch('/api/admin/planilha', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, id }),
    })
    setRows(prev => prev.filter(r => r.id !== id))
  }

  async function toggleConcluido(row) {
    const updated = { ...row, concluido: !row.concluido }
    setRows(prev => prev.map(r => r.id === row.id ? updated : r))
    await saveRow(updated)
  }

  const getName = op => op?.nome || op?.email?.split('@')[0] || 'Operador'

  if (loading) return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 22, height: 22, borderTopColor: '#e53935' }} />
      </main>
    </AppLayout>
  )

  const isRowEmpty = r => !r.rede && !r.agente && Number(r.quantidade || 0) === 0
  const filtered = filter === 'todos' ? rows
    : filter === 'concluido' ? rows.filter(r => r.concluido)
    : filter === 'pendente' ? rows.filter(r => !r.concluido && !isRowEmpty(r))
    : rows.filter(r => isRowEmpty(r) && !r.concluido)

  // Totalizadores
  const totalPrej = rows.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalCustos = rows.reduce((s, r) => s + Number(r.custos || 0), 0)
  const totalSalBau = rows.reduce((s, r) => s + Number(r.salario_bau || 0), 0)
  const totalLucro = rows.reduce((s, r) => s + Number(r.lucro_final || 0), 0)
  const totalContas = rows.reduce((s, r) => s + Number(r.quantidade || 0), 0)
  const concluidas = rows.filter(r => r.concluido).length

  return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', padding: '32px 24px 80px', maxWidth: 1600, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Controle Operacional</h1>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Planejamento de metas e plataformas</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#e53935', color: '#fff', fontSize: 13, fontWeight: 700 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova linha
          </motion.button>
        </motion.div>

        {/* KPI row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05, ease }}>
          <div className="g-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'Linhas', v: rows.length, c: 'var(--t1)' },
              { l: 'Contas total', v: totalContas, c: '#60A5FA' },
              { l: 'Concluidas', v: `${concluidas}/${rows.length}`, c: '#22C55E' },
              { l: 'Prejuizo', v: `R$ ${fmt(totalPrej)}`, c: '#EF4444' },
              { l: 'Sal. + Bau', v: `R$ ${fmt(totalSalBau)}`, c: '#a855f7' },
              { l: 'Lucro final', v: `${totalLucro >= 0 ? '+' : ''}R$ ${fmt(totalLucro)}`, c: totalLucro >= 0 ? '#22C55E' : '#EF4444' },
            ].map((k, i) => (
              <div key={k.l} style={{ borderRadius: 12, padding: '14px 16px', background: 'linear-gradient(145deg, #0c1424, #080e1a)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 9, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: '0 0 5px' }}>{k.l}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: k.c, margin: 0, lineHeight: 1 }}>{k.v}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {[['todos', 'Todos'], ['pendente', 'Pendentes'], ['concluido', 'Concluidos'], ['vazia', 'Vazias']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: filter === k ? 'rgba(229,57,53,0.12)' : 'rgba(255,255,255,0.03)',
              color: filter === k ? '#e53935' : 'var(--t3)',
              border: `1px solid ${filter === k ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease }}
          style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(145deg, #0c1424, #080e1a)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['', 'REDE', 'QUANT.', 'AGENTE/BLOG', 'APOSTAS', 'LINK', 'OPERADOR', 'STATUS', 'OBS/FALTA', 'PREJUIZO', 'CUSTOS', 'SAL.+BAU', 'LUCRO', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '2px solid rgba(229,57,53,0.15)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((r, i) => {
                    const lf = Number(r.lucro_final || 0)
                    const isPos = lf >= 0
                    // Estado visual: vazia (sem rede preenchida), pendente (tem rede, nao concluido), concluida
                    const isEmpty = !r.rede && !r.agente && Number(r.quantidade || 0) === 0
                    const isPending = !isEmpty && !r.concluido
                    const isDone = !!r.concluido
                    const hasHighLoss = lf < -100 && !isDone

                    const rowBg = isDone
                      ? 'rgba(34,197,94,0.05)'
                      : hasHighLoss
                        ? 'rgba(239,68,68,0.04)'
                        : isPending
                          ? 'rgba(245,158,11,0.03)'
                          : 'rgba(255,255,255,0.01)'
                    const rowBorder = isDone
                      ? 'rgba(34,197,94,0.1)'
                      : isPending
                        ? 'rgba(245,158,11,0.06)'
                        : 'rgba(255,255,255,0.03)'
                    const accentColor = isDone ? '#22C55E' : isPending ? '#F59E0B' : hasHighLoss ? '#EF4444' : 'rgba(255,255,255,0.06)'

                    return (
                      <motion.tr key={r.id} layout
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.25, ease }}
                        style={{
                          borderBottom: `1px solid ${rowBorder}`,
                          background: rowBg,
                          opacity: isDone ? 0.6 : isEmpty ? 0.45 : 1,
                          transition: 'background 0.2s, opacity 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = isDone ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = isDone ? '0.6' : isEmpty ? '0.45' : '1'; e.currentTarget.style.background = rowBg }}
                      >
                        {/* Barra lateral de status */}
                        <td style={{ width: 4, padding: 0 }}>
                          <div style={{ width: 4, height: '100%', minHeight: 42, background: accentColor, borderRadius: '0 2px 2px 0' }} />
                        </td>
                        {/* Rede */}
                        <td style={{ padding: '4px 6px', minWidth: 80 }}>
                          <select value={r.rede || ''} onChange={e => updateField(r.id, 'rede', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#e53935', fontSize: 12, fontWeight: 800, cursor: 'pointer', outline: 'none', width: '100%', padding: '6px 4px' }}>
                            <option value="" style={{ background: '#0c1424' }}>—</option>
                            {REDES.map(rd => <option key={rd} value={rd} style={{ background: '#0c1424' }}>{rd}</option>)}
                          </select>
                        </td>
                        {/* Quant */}
                        <td style={{ padding: '4px 2px', minWidth: 60 }}>
                          <CellInput type="number" value={r.quantidade} onChange={v => updateField(r.id, 'quantidade', Number(v) || 0)} mono min="0" step="1" />
                        </td>
                        {/* Agente */}
                        <td style={{ padding: '4px 2px', minWidth: 100 }}>
                          <CellInput value={r.agente} onChange={v => updateField(r.id, 'agente', v)} placeholder="Nome..." style={{ fontWeight: 700, color: '#F59E0B' }} />
                        </td>
                        {/* Apostas */}
                        <td style={{ padding: '4px 2px', minWidth: 80 }}>
                          <CellInput value={r.apostas} onChange={v => updateField(r.id, 'apostas', v)} placeholder="Ex: 70 - 1,5X" style={{ color: '#22C55E', fontWeight: 600 }} />
                        </td>
                        {/* Link */}
                        <td style={{ padding: '4px 6px', minWidth: 100, maxWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CellInput value={r.link} onChange={v => updateField(r.id, 'link', v)} placeholder="https://..." style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                            {r.link && (
                              <a href={r.link} target="_blank" rel="noopener noreferrer" title="Abrir link" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: 4 }}>
                                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            )}
                          </div>
                        </td>
                        {/* Operador */}
                        <td style={{ padding: '4px 6px', minWidth: 120 }}>
                          <select value={r.operator_id || ''} onChange={e => {
                            const op = operators.find(o => o.id === e.target.value)
                            updateField(r.id, 'operator_id', e.target.value || null)
                            if (op) updateField(r.id, 'operator_name', getName(op))
                            else updateField(r.id, 'operator_name', '')
                          }} style={{ background: 'transparent', border: 'none', color: r.operator_id ? '#60A5FA' : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', width: '100%', padding: '6px 4px' }}>
                            <option value="" style={{ background: '#0c1424' }}>Disponivel</option>
                            {operators.map(op => <option key={op.id} value={op.id} style={{ background: '#0c1424' }}>{getName(op)}</option>)}
                          </select>
                        </td>
                        {/* Status */}
                        <td style={{ padding: '4px 8px', minWidth: 100 }}>
                          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => toggleConcluido(r)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                              background: isDone ? 'rgba(34,197,94,0.14)' : isEmpty ? 'rgba(100,116,139,0.08)' : 'rgba(245,158,11,0.12)',
                              color: isDone ? '#22C55E' : isEmpty ? '#64748B' : '#F59E0B',
                              border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : isEmpty ? 'rgba(100,116,139,0.15)' : 'rgba(245,158,11,0.22)'}`,
                              transition: 'all 0.15s',
                            }}>
                            {isDone ? (
                              <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>CONCLUIDO</>
                            ) : isEmpty ? (
                              'VAZIA'
                            ) : (
                              <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>PENDENTE</>
                            )}
                          </motion.button>
                        </td>
                        {/* Obs */}
                        <td style={{ padding: '4px 2px', minWidth: 120 }}>
                          <CellInput value={r.observacao} onChange={v => updateField(r.id, 'observacao', v)} placeholder="Obs..." style={{ fontSize: 11, color: 'var(--t3)' }} />
                        </td>
                        {/* Prejuizo */}
                        <td style={{ padding: '4px 2px', minWidth: 80 }}>
                          <CellInput type="number" value={r.prejuizo} onChange={v => updateField(r.id, 'prejuizo', Number(v) || 0)} mono step="0.01" style={{ color: '#EF4444' }} />
                        </td>
                        {/* Custos */}
                        <td style={{ padding: '4px 2px', minWidth: 80 }}>
                          <CellInput type="number" value={r.custos} onChange={v => updateField(r.id, 'custos', Number(v) || 0)} mono step="0.01" style={{ color: '#F59E0B' }} />
                        </td>
                        {/* Sal+Bau */}
                        <td style={{ padding: '4px 2px', minWidth: 80 }}>
                          <CellInput type="number" value={r.salario_bau} onChange={v => updateField(r.id, 'salario_bau', Number(v) || 0)} mono step="0.01" style={{ color: '#a855f7' }} />
                        </td>
                        {/* Lucro */}
                        <td style={{ padding: '6px 10px', minWidth: 90 }}>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800,
                            color: isPos ? '#22C55E' : '#EF4444',
                            textShadow: Math.abs(lf) > 100 ? `0 0 8px ${isPos ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` : 'none',
                          }}>
                            {isPos ? '+' : ''}R$ {fmt(lf)}
                          </span>
                        </td>
                        {/* Delete */}
                        <td style={{ padding: '4px 8px', width: 36 }}>
                          <button onClick={() => deleteRow(r.id)} title="Excluir"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.3, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}>
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
                {filter !== 'todos' ? 'Nenhuma linha nesse filtro' : 'Nenhuma linha adicionada — clique "Nova linha" para comecar'}
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Add Row Modal ── */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(4,8,16,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={() => setShowAdd(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.28, ease }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 560, background: 'var(--surface)', borderRadius: 20, border: '1px solid rgba(229,57,53,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}
              >
                <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Nova linha</h3>
                  </div>
                  <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="g-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Rede *</label>
                      <select className="input" value={newRow.rede} onChange={e => setNewRow(p => ({ ...p, rede: e.target.value }))}>
                        <option value="">Selecione</option>
                        {REDES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Quantidade</label>
                      <input className="input" type="number" min="0" value={newRow.quantidade} onChange={e => setNewRow(p => ({ ...p, quantidade: Number(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Agente/Blog</label>
                      <input className="input" value={newRow.agente} onChange={e => setNewRow(p => ({ ...p, agente: e.target.value }))} placeholder="Nome" />
                    </div>
                  </div>
                  <div className="g-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Apostas</label>
                      <input className="input" value={newRow.apostas} onChange={e => setNewRow(p => ({ ...p, apostas: e.target.value }))} placeholder="Ex: 70 - 1,5X" />
                    </div>
                    <div>
                      <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Operador</label>
                      <select className="input" value={newRow.operator_id || ''} onChange={e => {
                        const op = operators.find(o => o.id === e.target.value)
                        setNewRow(p => ({ ...p, operator_id: e.target.value || null, operator_name: op ? getName(op) : '' }))
                      }}>
                        <option value="">Disponivel</option>
                        {operators.map(op => <option key={op.id} value={op.id}>{getName(op)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Link da plataforma</label>
                    <input className="input" value={newRow.link} onChange={e => setNewRow(p => ({ ...p, link: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="t-label" style={{ display: 'block', marginBottom: 5 }}>Observacao</label>
                    <input className="input" value={newRow.observacao} onChange={e => setNewRow(p => ({ ...p, observacao: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button onClick={() => setShowAdd(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                    <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} onClick={addRow} disabled={!newRow.rede}
                      style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, border: 'none', cursor: newRow.rede ? 'pointer' : 'not-allowed', background: newRow.rede ? '#e53935' : '#333', color: '#fff', fontSize: 13, fontWeight: 700, opacity: newRow.rede ? 1 : 0.5 }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Adicionar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AppLayout>
  )
}
