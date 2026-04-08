'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { supabase } from '../../lib/supabase/client'

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

function detectTipo(chave) {
  const c = chave.trim()
  if (/^\+?\d{10,13}$/.test(c.replace(/[\s()-]/g, ''))) return 'telefone'
  if (/^\d{11}$/.test(c.replace(/[.\-\/]/g, '')) && c.replace(/\D/g, '').length === 11) return 'cpf'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return 'email'
  return 'evp'
}

const tipoCfg = {
  telefone: { badge: 'badge-profit', icon: 'tel' },
  cpf:      { badge: 'badge-warn',   icon: 'cpf' },
  email:    { badge: 'badge-info',   icon: '@' },
  evp:      { badge: 'badge-brand',  icon: 'evp' },
}

export default function PixPage() {
  const router = useRouter()
  const fileRef = useRef(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [textarea, setTextarea] = useState('')
  const [banco, setBanco] = useState('')
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [copied, setCopied] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const [{ data: p }, { data: k }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', u.id).maybeSingle(),
      supabase.from('pix_keys').select('*').eq('operator_id', u.id).order('created_at', { ascending: false }),
    ])
    setProfile(p)
    setKeys(k || [])
    setLoading(false)
  }

  function parseKeys(text) {
    return text
      .split(/[\n,;]+/)
      .map(l => l.trim())
      .filter(l => l.length >= 5)
  }

  async function handleImport(e) {
    e.preventDefault()
    if (!textarea.trim()) return
    setSaving(true); setError(''); setSuccess('')

    const raw = parseKeys(textarea)
    const existingSet = new Set(keys.map(k => k.chave))
    const seen = new Set()
    const unique = []
    for (const c of raw) {
      const normalized = c.replace(/[\s()-]/g, '')
      if (!seen.has(normalized) && !existingSet.has(c)) {
        seen.add(normalized)
        unique.push(c)
      }
    }

    if (unique.length === 0) {
      setError('Nenhuma chave nova encontrada (todas duplicadas)')
      setSaving(false)
      return
    }

    const rows = unique.map(chave => ({
      operator_id: user.id,
      tenant_id: profile?.tenant_id,
      chave,
      tipo: detectTipo(chave),
      banco: banco.trim() || null,
      status: 'valida',
    }))

    const { error: err } = await supabase.from('pix_keys').insert(rows)
    setSaving(false)
    if (err) { setError(err.message); return }

    const dupes = raw.length - unique.length
    setSuccess(`${unique.length} chave(s) importada(s)${dupes > 0 ? ` · ${dupes} duplicada(s) ignorada(s)` : ''}`)
    setTextarea('')
    setBanco('')
    load()
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setTextarea(prev => prev ? prev + '\n' + ev.target.result : ev.target.result)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleDelete(id) {
    await supabase.from('pix_keys').delete().eq('id', id)
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  async function handleRemoveInvalidas() {
    const invalidas = keys.filter(k => k.status === 'invalida')
    if (invalidas.length === 0) return
    const ids = invalidas.map(k => k.id)
    await supabase.from('pix_keys').delete().in('id', ids)
    setKeys(prev => prev.filter(k => k.status !== 'invalida'))
    setSuccess(`${invalidas.length} chave(s) inválida(s) removida(s)`)
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  function copyAllValid() {
    const validas = filtered.filter(k => k.status === 'valida').map(k => k.chave).join('\n')
    if (!validas) return
    navigator.clipboard.writeText(validas)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  function exportTxt() {
    const validas = filtered.filter(k => k.status === 'valida').map(k => k.chave).join('\n')
    if (!validas) return
    const blob = new Blob([validas], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pix-keys-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    let list = keys
    if (filtro !== 'todos') list = list.filter(k => k.tipo === filtro)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(k => k.chave.toLowerCase().includes(q) || (k.banco || '').toLowerCase().includes(q))
    }
    return list
  }, [keys, filtro, search])

  const stats = useMemo(() => ({
    total: keys.length,
    validas: keys.filter(k => k.status === 'valida').length,
    invalidas: keys.filter(k => k.status === 'invalida').length,
    telefone: keys.filter(k => k.tipo === 'telefone').length,
    cpf: keys.filter(k => k.tipo === 'cpf').length,
    email: keys.filter(k => k.tipo === 'email').length,
    evp: keys.filter(k => k.tipo === 'evp').length,
  }), [keys])

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} />

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>
        {/* Header */}
        <div className="a1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,rgba(5,217,140,0.2),rgba(79,110,247,0.15))', border: '1px solid var(--profit-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 16h.01" /><path d="M10 16h4" /></svg>
              </div>
              <h1 className="t-h1">Chaves PIX</h1>
            </div>
            <p className="t-body">Gerencie suas chaves PIX com importacao em lote</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
              Sync
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="a2 g-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { l: 'Total', v: stats.total, c: 'var(--t1)' },
            { l: 'Validas', v: stats.validas, c: 'var(--profit)' },
            { l: 'Telefone', v: stats.telefone, c: 'var(--profit)' },
            { l: 'CPF', v: stats.cpf, c: 'var(--warn)' },
            { l: 'Email', v: stats.email, c: 'var(--info)' },
            { l: 'EVP', v: stats.evp, c: 'var(--brand-bright)' },
          ].map(({ l, v, c }) => (
            <div key={l} className="stat-pill">
              <p className="t-num" style={{ fontSize: 22, color: c, marginBottom: 2 }}>{v}</p>
              <p style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '0.04em' }}>{l}</p>
            </div>
          ))}
        </div>

        <div className="g-side" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 22 }}>
          {/* Left — Import */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card a3" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <div>
                  <h2 className="t-h3">Importar chaves</h2>
                  <p className="t-small">1 chave por linha · detecta tipo automaticamente</p>
                </div>
              </div>

              <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="t-label" style={{ display: 'block', marginBottom: 8 }}>Chaves PIX</label>
                  <textarea
                    className="input"
                    value={textarea}
                    onChange={e => setTextarea(e.target.value)}
                    placeholder={"11999887766\n123.456.789-00\noperador@email.com\nchave-evp-uuid..."}
                    rows={8}
                    style={{ resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8 }}
                  />
                </div>

                <div>
                  <label className="t-label" style={{ display: 'block', marginBottom: 8 }}>Banco <span style={{ color: 'var(--t4)' }}>(opcional)</span></label>
                  <input className="input" value={banco} onChange={e => setBanco(e.target.value)} placeholder="Ex: Nubank, Inter, C6..." />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-profit" disabled={saving || !textarea.trim()} style={{ flex: 1, padding: '12px' }}>
                    {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#012b1c' }} /> Importando...</> : <>Importar chaves</>}
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost" style={{ padding: '12px 16px' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    .txt
                  </button>
                  <input ref={fileRef} type="file" accept=".txt" onChange={handleFile} style={{ display: 'none' }} />
                </div>

                {error && <div className="alert-error">! {error}</div>}
                {success && <div className="alert-success">{success}</div>}
              </form>
            </div>

            {/* Actions */}
            <div className="card a4" style={{ padding: 22 }}>
              <h3 className="t-h3" style={{ fontSize: 13, marginBottom: 14 }}>Acoes gerais</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={copyAllValid} className="btn btn-brand" style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  {copiedAll ? 'Copiadas!' : `Copiar todas validas (${stats.validas})`}
                </button>
                <button onClick={exportTxt} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Exportar .txt
                </button>
                {stats.invalidas > 0 && (
                  <button onClick={handleRemoveInvalidas} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                    Remover invalidas ({stats.invalidas})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right — List */}
          <div>
            {/* Search + Filter */}
            <div className="a3" style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  className="input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar chave, banco..."
                  style={{ paddingLeft: 38 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 10, padding: 4 }}>
                {['todos', 'telefone', 'cpf', 'email', 'evp'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    style={{
                      fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 600, padding: '6px 14px',
                      borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                      background: filtro === f ? 'var(--raised)' : 'transparent',
                      color: filtro === f ? 'var(--t1)' : 'var(--t3)',
                      boxShadow: filtro === f ? '0 2px 8px rgba(0,0,0,0.3)' : '',
                    }}
                  >
                    {f === 'todos' ? 'Todos' : f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p className="t-small">{filtered.length} chave(s) encontrada(s)</p>
              <span className="badge badge-brand">{filtro === 'todos' ? 'Todas' : filtro.toUpperCase()}</span>
            </div>

            {/* Keys Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div className="spinner" style={{ borderTopColor: 'var(--brand-bright)' }} />
                  <p className="t-small">Carregando...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ border: '1px dashed var(--b2)', borderRadius: 16, padding: 60, textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /></svg>
                  </div>
                  <p style={{ color: 'var(--t2)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhuma chave PIX</p>
                  <p className="t-small">Importe suas chaves usando o painel ao lado.</p>
                </div>
              ) : filtered.map((k, i) => {
                const cfg = tipoCfg[k.tipo] || tipoCfg.evp
                const isInvalida = k.status === 'invalida'
                return (
                  <div key={k.id} className="data-row a1" style={{ animationDelay: `${i * 20}ms`, opacity: isInvalida ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: isInvalida ? 'var(--loss-dim)' : k.tipo === 'telefone' ? 'var(--profit-dim)' : k.tipo === 'cpf' ? 'var(--warn-dim)' : k.tipo === 'email' ? 'var(--info-dim)' : 'var(--brand-dim)',
                        border: `1px solid ${isInvalida ? 'var(--loss-border)' : k.tipo === 'telefone' ? 'var(--profit-border)' : k.tipo === 'cpf' ? 'var(--warn-border)' : k.tipo === 'email' ? 'var(--info-border)' : 'var(--brand-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: isInvalida ? 'var(--loss)' : k.tipo === 'telefone' ? 'var(--profit)' : k.tipo === 'cpf' ? 'var(--warn)' : k.tipo === 'email' ? 'var(--info)' : 'var(--brand-bright)' }}>
                          {cfg.icon}
                        </span>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--t1)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.chave}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`badge ${cfg.badge}`} style={{ fontSize: 9 }}>{k.tipo}</span>
                          {k.banco && <span className="badge badge-neutral" style={{ fontSize: 9 }}>{k.banco}</span>}
                          {isInvalida && <span className="badge badge-loss" style={{ fontSize: 9 }}>invalida</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => copyToClipboard(k.chave, k.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 10px' }}
                      >
                        {copied === k.id ? (
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 10px' }}
                      >
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
