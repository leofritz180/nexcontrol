'use client'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const MODALIDADES = [
  { id: 'metodo_novo',    label: 'Metodo novo' },
  { id: 'delay_esportivo',label: 'Delay esportivo' },
  { id: 'rodadas_gratis', label: 'Rodadas gratis' },
  { id: 'bonus',          label: 'Bonus' },
  { id: 'kamikaze',       label: 'Kamikaze' },
  { id: 'cashback',       label: 'Cashback' },
  { id: 'arbitragem',     label: 'Arbitragem / Surebet' },
  { id: 'promo_casa',     label: 'Promo da casa' },
  { id: 'mentoria',       label: 'Mentoria' },
  { id: 'outro',          label: 'Outro' },
]

const fmtBRL = v => (Number(v) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const fmtDate = d => d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const modLabel = id => MODALIDADES.find(m => m.id === id)?.label || id

function parseValor(s) {
  if (s == null) return 0
  let str = String(s).replace(/[^\d,.-]/g, '')
  if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.')
  return Number(str) || 0
}

export default function MetodosTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ modalidade: 'metodo_novo', tipo: 'lucro', valor: '', descricao: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function authHeader() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ? { Authorization: 'Bearer ' + data.session.access_token } : {}
  }

  async function load() {
    setLoading(true)
    try {
      const h = await authHeader()
      const r = await fetch('/api/metodos', { headers: h, cache: 'no-store' })
      const j = await r.json()
      setItems(j.items || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Comando de voz "lucro 150" / "prejuizo 80" — pre-preenche form e abre
  useEffect(() => {
    function onVoice(e) {
      const d = e?.detail
      if (!d) return
      if (d.tipo && typeof d.valor === 'number' && d.valor > 0) {
        setForm({ modalidade: 'metodo_novo', tipo: d.tipo, valor: String(d.valor).replace('.', ','), descricao: 'via voz' })
        setShowForm(true)
        setError('')
      } else if (d.open) {
        setShowForm(true)
      }
    }
    window.addEventListener('voice:metodo', onVoice)
    return () => window.removeEventListener('voice:metodo', onVoice)
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    const v = parseValor(form.valor)
    if (!v || v <= 0) { setError('Valor invalido'); return }
    setSaving(true)
    try {
      const h = await authHeader()
      const r = await fetch('/api/metodos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...h },
        body: JSON.stringify({ modalidade: form.modalidade, tipo: form.tipo, valor: v, descricao: form.descricao || null }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Erro ao salvar'); setSaving(false); return }
      setForm({ modalidade: 'metodo_novo', tipo: 'lucro', valor: '', descricao: '' })
      setShowForm(false)
      await load()
      try { window.dispatchEvent(new CustomEvent('metodos:updated')) } catch {}
    } catch (e) { setError(e?.message || 'Erro') }
    setSaving(false)
  }

  async function remove(id) {
    if (!confirm('Apagar este registro?')) return
    const h = await authHeader()
    await fetch('/api/metodos?id=' + id, { method: 'DELETE', headers: h })
    await load()
    try { window.dispatchEvent(new CustomEvent('metodos:updated')) } catch {}
  }

  const stats = useMemo(() => {
    const monthKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7)
    let lucroMes = 0, prejuizoMes = 0, lucroTotal = 0, prejuizoTotal = 0
    const byModalidade = {}
    for (const it of items) {
      const v = Number(it.valor || 0)
      const inMonth = String(it.created_at).slice(0, 10).startsWith(monthKey)
      if (it.tipo === 'lucro') {
        lucroTotal += v
        if (inMonth) lucroMes += v
      } else {
        prejuizoTotal += v
        if (inMonth) prejuizoMes += v
      }
      if (!byModalidade[it.modalidade]) byModalidade[it.modalidade] = { lucro: 0, prejuizo: 0, count: 0 }
      byModalidade[it.modalidade][it.tipo] += v
      byModalidade[it.modalidade].count++
    }
    return {
      lucroMes, prejuizoMes, liquidoMes: lucroMes - prejuizoMes,
      lucroTotal, prejuizoTotal, liquidoTotal: lucroTotal - prejuizoTotal,
      byModalidade,
    }
  }, [items])

  const card = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0 }}>
            Metodos
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: '4px 0 0' }}>
            Registre lucros e prejuizos de metodos alternativos (delay, bonus, rodadas, etc). Isolado do fluxo CPA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(s => !s)}
          style={{
            padding: '11px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            color: 'white', background: showForm ? 'rgba(100,100,100,0.4)' : '#e53935',
            transition: 'background 0.15s',
          }}
        >
          {showForm ? 'Cancelar' : '+ Registrar operacao'}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <form onSubmit={submit} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Modalidade</label>
                  <select value={form.modalidade} onChange={e => setForm({ ...form, modalidade: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, color: 'var(--t1)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontFamily: 'inherit' }}>
                    {MODALIDADES.map(m => <option key={m.id} value={m.id} style={{ background: 'var(--raised)' }}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Tipo</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['lucro','prejuizo'].map(t => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          color: form.tipo === t ? (t === 'lucro' ? '#10B981' : 'var(--loss)') : 'var(--t3)',
                          background: form.tipo === t ? (t === 'lucro' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'rgba(255,255,255,0.02)',
                          border: form.tipo === t
                            ? '1px solid ' + (t === 'lucro' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)')
                            : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.15s',
                        }}>
                        {t === 'lucro' ? 'Lucro' : 'Prejuizo'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Valor (R$)</label>
                <input type="text" inputMode="decimal" placeholder="0,00" value={form.valor}
                  onChange={e => setForm({ ...form, valor: e.target.value })} required autoFocus
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, color: 'var(--t1)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontFamily: 'var(--mono)' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Descricao (opcional)</label>
                <input type="text" maxLength={280} placeholder="Detalhes do registro" value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, color: 'var(--t1)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              {error && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: 'var(--loss)' }}>{error}</div>
              )}

              <button type="submit" disabled={saving}
                style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', color: 'white', background: saving ? 'rgba(229,57,53,0.5)' : '#e53935', transition: 'background 0.15s' }}>
                {saving ? 'Salvando...' : 'Salvar registro'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Lucro do mes', value: stats.lucroMes, color: '#10B981' },
          { label: 'Prejuizo do mes', value: stats.prejuizoMes, color: 'var(--loss)' },
          { label: 'Liquido do mes', value: stats.liquidoMes, color: stats.liquidoMes >= 0 ? 'var(--profit)' : 'var(--loss)', signed: true },
        ].map((k, i) => (
          <div key={i} style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: k.color, letterSpacing: '-0.02em' }}>
              {k.signed && k.value >= 0 ? '+' : k.signed && k.value < 0 ? '-' : ''}R$ {fmtBRL(Math.abs(k.value))}
            </div>
          </div>
        ))}
      </div>

      {/* Totais por modalidade */}
      {Object.keys(stats.byModalidade).length > 0 && (
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Total acumulado por modalidade</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(stats.byModalidade)
              .map(([k, v]) => ({ k, ...v, liquido: v.lucro - v.prejuizo }))
              .sort((a, b) => b.liquido - a.liquido)
              .map(row => (
                <div key={row.k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.015)' }}>
                  <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 600, flex: 1 }}>{modLabel(row.k)}</span>
                  <span style={{ fontSize: 11, color: 'var(--t4)' }}>{row.count} reg</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: row.liquido >= 0 ? '#10B981' : 'var(--loss)', minWidth: 110, textAlign: 'right' }}>
                    {row.liquido >= 0 ? '+' : '-'}R$ {fmtBRL(Math.abs(row.liquido))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Lista de registros */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Historico</h3>
          <span style={{ fontSize: 11, color: 'var(--t4)' }}>{items.length} registro{items.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--t4)', fontSize: 12 }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t4)', fontSize: 13 }}>
            Nenhum registro ainda. Clique em "Registrar operacao" pra comecar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map(it => {
              const isLucro = it.tipo === 'lucro'
              return (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLucro ? '#10B981' : 'var(--loss)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 600, minWidth: 130 }}>{modLabel(it.modalidade)}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.descricao || '—'}</span>
                  <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{fmtDate(it.created_at)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: isLucro ? '#10B981' : 'var(--loss)', minWidth: 110, textAlign: 'right' }}>
                    {isLucro ? '+' : '-'}R$ {fmtBRL(it.valor)}
                  </span>
                  <button type="button" onClick={() => remove(it.id)} aria-label="Apagar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--loss)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
