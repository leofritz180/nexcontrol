'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const ease = [0.33, 1, 0.68, 1]

// LIBERADO GERAL: loja embutida (SSO) para todas as contas logadas.
// (Pra voltar a restringir por conta, listar emails aqui.)
const SSO_TEST_EMAILS = []

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

  const ssoEnabled = SSO_TEST_EMAILS.length ? SSO_TEST_EMAILS.includes(user?.email?.toLowerCase()) : true

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
        <div style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 480, background: '#000' }}>
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
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation"
                  referrerPolicy="origin-when-cross-origin"
                  allow="payment; clipboard-write; clipboard-read; fullscreen" />
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
        /* Demais contas — em manutenção / disponível em breve */
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '52px 36px', background: 'var(--surface)', border: '1px solid var(--b1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ position: 'absolute', top: -60, left: '50%', marginLeft: -130, width: 260, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.10), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 22px', background: 'rgba(229,57,53,0.10)', border: '1px solid rgba(229,57,53,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', margin: '0 0 10px', position: 'relative' }}>
              Loja Proxy — disponivel em breve
            </h1>
            <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto', position: 'relative' }}>
              Estamos finalizando os ultimos ajustes da loja integrada. Em breve voce vai comprar seus proxies direto por aqui. Obrigado pela paciencia.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, padding: '8px 14px', borderRadius: 999, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.22)', position: 'relative' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e53935' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#e53935' }}>Em manutencao</span>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}
