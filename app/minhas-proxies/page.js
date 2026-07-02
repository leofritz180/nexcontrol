'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import BettifyTips from '../../components/BettifyTips'
import { supabase } from '../../lib/supabase/client'

const ease = [0.33, 1, 0.68, 1]
const MINT = '#34d399'
const RED = '#e53935'

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Cliente'

// Formata GB: >=1 -> "X.XX GB" | <1 -> "XXX MB"
function fmtData(gb) {
  if (gb === null || gb === undefined) return '—'
  const n = Number(gb)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1) return `${n.toFixed(2).replace('.', ',')} GB`
  return `${Math.round(n * 1024)} MB`
}

function colorFor(pct) {
  if (pct === null) return 'rgba(255,255,255,0.5)'
  if (pct > 30) return MINT
  if (pct > 10) return 'rgba(255,255,255,0.85)'
  return RED
}

export default function MinhasProxiesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [proxies, setProxies] = useState([])
  const [err, setErr] = useState(false)
  const [copied, setCopied] = useState(null)

  async function load() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p) { router.push('/login'); return }
    setProfile(p)
    const [{ data: t }, { data: s2 }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (t) setTenant(t); if (s2) setSub(s2)
    await fetchProxies(s.session.access_token)
    setLoading(false)
  }

  async function fetchProxies(token) {
    try {
      const res = await fetch('/api/proxies/me', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
      const d = await res.json()
      setProxies(Array.isArray(d?.proxies) ? d.proxies : [])
      setErr(!res.ok)
    } catch { setErr(true) }
  }

  async function refresh() {
    const { data: s } = await supabase.auth.getSession()
    if (s?.session?.access_token) { setLoading(true); await fetchProxies(s.session.access_token); setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function copyLine(line, id) {
    try { await navigator.clipboard.writeText(line); setCopied(id); setTimeout(() => setCopied(null), 1500) } catch {}
  }

  if (loading && !profile) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Minhas Proxies</h1>
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '2px 0 0' }}>Tráfego restante de cada proxy, em tempo real</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={refresh} style={{ padding: '9px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--b2)', color: 'var(--t2)', cursor: 'pointer' }}>Atualizar</button>
            <button type="button" onClick={() => router.push('/proxy')} style={{ padding: '9px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)', color: '#FF6B00', cursor: 'pointer' }}>Comprar proxy</button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}><BettifyTips /></div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ width: 26, height: 26, margin: '0 auto' }} /></div>
        ) : proxies.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--b2)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 6px' }}>Você ainda não tem proxies</p>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: '0 0 20px' }}>{err ? 'Não foi possível carregar agora. Tente atualizar.' : 'Compre uma proxy na loja e ela aparece aqui com a giga em tempo real.'}</p>
            <button type="button" onClick={() => router.push('/proxy')} style={{ padding: '12px 26px', borderRadius: 10, background: '#FF6B00', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Ir para a Loja Proxy</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {proxies.map((px, i) => {
              const total = px.gb_total
              const rem = px.gb_remaining
              const pct = (total && total > 0 && rem !== null && rem !== undefined) ? Math.max(0, Math.min(100, (rem / total) * 100)) : (rem === null ? null : 0)
              const c = colorFor(pct)
              const line = px.line || `${px.host}:${px.port}`
              return (
                <motion.div key={px.id || i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease }}
                  style={{ padding: '20px 22px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--b1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Sua proxy{px.product_name ? ` · ${px.product_name}` : ''}</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>tempo real</span>
                  </div>

                  {/* proxy line + copiar */}
                  <div onClick={() => copyLine(line, px.id || i)} title="Clique para copiar"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b1)', cursor: 'pointer', marginBottom: 16 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: copied === (px.id || i) ? MINT : '#FF6B00', flexShrink: 0 }}>{copied === (px.id || i) ? 'copiado!' : 'copiar'}</span>
                  </div>

                  {/* barra de giga */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tráfego restante</p>
                      <p style={{ fontSize: 30, fontWeight: 900, color: c, margin: 0, lineHeight: 1, fontFamily: 'var(--mono)' }}>{fmtData(rem)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 0 3px' }}>Total</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)', margin: 0, fontFamily: 'var(--mono)' }}>{fmtData(total)}</p>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct === null ? 0 : pct}%` }} transition={{ duration: 1, ease }}
                      style={{ height: '100%', borderRadius: 5, background: c }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--t4)', margin: '7px 0 0' }}>
                    {px.gb_used !== null && px.gb_used !== undefined ? `${fmtData(px.gb_used)} usado` : ''}
                    {pct !== null ? ` · ${pct.toFixed(1).replace('.', ',')}% restante` : ''}
                    {px.status && px.status !== 'active' && px.status !== 'unknown' ? ` · ${px.status}` : ''}
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
