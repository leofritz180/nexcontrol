'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const ease = [0.33, 1, 0.68, 1]

// FASE DE TESTE: só esta conta vê a loja embutida (SSO). Demais seguem com o
// card + link externo. Pra liberar geral, deixar SSO_TEST_EMAIL = null.
const SSO_TEST_EMAIL = 'leofritz178@gmail.com'

export default function ProxyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [iframeUrl, setIframeUrl] = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeErr, setIframeErr] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
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
    if (t) setTenant(t)
    if (s2) setSub(s2)
    setLoading(false)
  }

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

  const ssoEnabled = SSO_TEST_EMAIL ? user?.email?.toLowerCase() === SSO_TEST_EMAIL : true

  // Gera a URL SSO (token fresco, server-side) assim que entra — loja embutida.
  useEffect(() => {
    if (!ssoEnabled || !user) return
    let alive = true
    setIframeErr(false); setIframeLoading(true)
    ;(async () => {
      try {
        const { data: s } = await supabase.auth.getSession()
        const token = s?.session?.access_token
        const res = await fetch('/api/proxy-sso', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
        if (!res.ok) throw new Error('falha')
        const { url } = await res.json()
        if (alive && url) setIframeUrl(url)
        else if (alive) setIframeErr(true)
      } catch { if (alive) setIframeErr(true) }
    })()
    return () => { alive = false }
  }, [ssoEnabled, user])

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </motion.div>
      </div>
    )
  }

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      {ssoEnabled ? (
        /* Loja Bettify embutida — ocupa toda a area de conteudo, ja logada */
        <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 92px)', minHeight: 480, background: '#000' }}>
          {iframeErr ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--surface)', textAlign: 'center', padding: 24 }}>
              <p style={{ color: 'var(--t2)', fontSize: 14, margin: 0 }}>Nao consegui carregar a loja aqui dentro.</p>
              <a href={iframeUrl || 'https://bettifyproxy.com'} target="_blank" rel="noopener noreferrer" style={{ color: '#e53935', fontWeight: 600, fontSize: 13 }}>Abrir em nova aba</a>
            </div>
          ) : (
            <>
              {(iframeLoading || !iframeUrl) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
                  <div className="spinner" style={{ width: 30, height: 30 }} />
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Carregando loja...</p>
                </div>
              )}
              {iframeUrl && (
                <iframe src={iframeUrl} title="Loja Bettify Proxy" onLoad={() => setIframeLoading(false)}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
                  referrerPolicy="origin-when-cross-origin"
                  allow="payment; clipboard-write" />
              )}
              {iframeUrl && (
                <a href={iframeUrl} target="_blank" rel="noopener noreferrer" title="Abrir em nova aba"
                  style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Nova aba
                </a>
              )}
            </>
          )}
        </div>
      ) : (
        /* Demais contas — card de marketing + link externo */
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Loja Proxy</h1>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, fontWeight: 400 }}>
              Infraestrutura de proxies residenciais para operacoes em escala · parceiro oficial
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}
            style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', background: 'var(--surface)', border: '1px solid var(--b1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '48px 40px 40px', textAlign: 'center', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px', background: 'var(--fill-2)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.03em', marginBottom: 12 }}>
                Proxies Premium de Alta Performance
              </h2>
              <p style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.6 }}>
                Parceiro oficial do NexControl para conexoes rapidas, seguras e preparadas para alta demanda operacional.
              </p>
            </div>

            <div style={{ padding: '32px 40px 36px', textAlign: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                {['IPs residenciais de alta qualidade', 'Suporte tecnico especializado', 'Gerenciamento completo de conexoes', 'Condicoes exclusivas NexControl'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /></svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>

              <a href="https://bettifyproxy.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '15px 40px', borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.78), #2563eb)', color: '#fff', boxShadow: '0 6px 24px rgba(255,255,255,0.25)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Acessar Proxy Premium
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}
