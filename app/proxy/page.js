'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const ease = [0.33, 1, 0.68, 1]

// FASE DE TESTE: só esta conta vê o botão SSO; os demais seguem com o link
// externo atual. Pra liberar geral, deixar SSO_TEST_EMAIL = null.
const SSO_TEST_EMAIL = 'leofritz178@gmail.com'

export default function ProxyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [iframeUrl, setIframeUrl] = useState(null)
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

  // Loja Bettify EMBUTIDA: pede a URL SSO ao server e carrega no iframe (sem sair do NexControl)
  async function carregarLoja() {
    setIframeErr(false); setIframeUrl(null)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s?.session?.access_token
      const res = await fetch('/api/proxy-sso', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
      if (!res.ok) throw new Error('falha')
      const { url } = await res.json()
      if (!url) throw new Error('sem url')
      setIframeUrl(url)
    } catch { setIframeErr(true) }
  }

  useEffect(() => {
    if (!ssoEnabled || !user) return
    let alive = true
    ;(async () => {
      setIframeErr(false)
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, var(--surface), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </motion.div>
      </div>
    )
  }

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: ssoEnabled ? 1180 : 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Hero — clean */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 28 }}
        >
          <h1 style={{ fontSize:28, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.03em', margin:'0 0 6px' }}>Loja Proxy</h1>
          <p style={{ fontSize:13, color:'var(--t3)', margin:0, fontWeight:400 }}>
            Infraestrutura de proxies residenciais para operacoes em escala · parceiro oficial
          </p>
        </motion.div>

        {ssoEnabled ? (
          /* Loja embutida (iframe SSO) — sem sair do NexControl */
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--b1)', background: 'var(--surface)' }}
          >
            {iframeErr ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--t2)', fontSize: 14, margin: '0 0 14px' }}>Nao consegui carregar a loja aqui dentro.</p>
                <button type="button" onClick={carregarLoja}
                  style={{ padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff', background: '#e53935', fontFamily: 'inherit' }}>
                  Tentar de novo
                </button>
                <p style={{ marginTop: 14, fontSize: 12, color: 'var(--t3)' }}>
                  Se persistir, <a href="https://bettifyproxy.com" target="_blank" rel="noopener noreferrer" style={{ color: '#e53935', fontWeight: 600 }}>abrir em nova aba</a>
                </p>
              </div>
            ) : !iframeUrl ? (
              <div style={{ padding: '90px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div className="spinner" style={{ width: 26, height: 26 }} />
                <p style={{ color: 'var(--t3)', fontSize: 13, margin: 0 }}>Conectando a loja...</p>
              </div>
            ) : (
              <iframe src={iframeUrl} title="Loja Bettify Proxy"
                style={{ width: '100%', height: 'calc(100vh - 170px)', minHeight: 560, border: 'none', display: 'block', background: 'var(--surface)' }}
                allow="clipboard-write; payment" />
            )}
          </motion.div>
        ) : (<>
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          style={{
            borderRadius: 24, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(160deg, var(--surface), var(--surface))',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02), 0 0 80px rgba(255,255,255,0.04)',
          }}
        >
          {/* Top visual area */}
          <div style={{
            padding: '48px 40px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04) 50%, transparent)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', marginLeft: -150,
              width: 300, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(255,255,255,0.12)',
              position: 'relative',
            }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            <h2 style={{
              fontSize: 26, fontWeight: 800, color: '#fff',
              letterSpacing: '-0.03em', marginBottom: 12,
              position: 'relative',
            }}>
              Proxies Premium de Alta Performance
            </h2>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.45)', maxWidth: 460,
              margin: '0 auto 28px', lineHeight: 1.6, position: 'relative',
            }}>
              Parceiro oficial do NexControl para conexoes rapidas, seguras e preparadas para alta demanda operacional. Escale sua operacao com infraestrutura profissional.
            </p>

            {/* Stats */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 4,
              position: 'relative',
            }}>
              {[
                { icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', label: 'Baixa latencia' },
                { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Protecao avancada' },
                { icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Cobertura global' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom action area */}
          <div style={{ padding: '32px 40px 36px', textAlign: 'center' }}>
            {/* Features */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              marginBottom: 28, maxWidth: 400, margin: '0 auto 28px',
            }}>
              {[
                { icon: 'M9 12l2 2 4-4', label: 'IPs residenciais de alta qualidade' },
                { icon: 'M9 12l2 2 4-4', label: 'Suporte tecnico especializado' },
                { icon: 'M9 12l2 2 4-4', label: 'Gerenciamento completo de conexoes' },
                { icon: 'M9 12l2 2 4-4', label: 'Condicoes exclusivas NexControl' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA (demais contas) — link externo atual */}
            <a href="https://bettifyproxy.com" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '15px 40px', borderRadius: 14,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.78), #2563eb)', color: '#fff',
                boxShadow: '0 6px 24px rgba(255,255,255,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,255,255,0.25)' }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Acessar Proxy Premium
            </a>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>
              Acesso externo seguro — plataforma verificada
            </p>
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 24,
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Infraestrutura verificada — Parceiro oficial NexControl</span>
        </motion.div>
        </>)}
      </div>
    </AppLayout>
  )
}
