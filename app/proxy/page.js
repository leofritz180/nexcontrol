'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const ease = [0.33, 1, 0.68, 1]

export default function ProxyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0c1424, #080e1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </motion.div>
      </div>
    )
  }

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Loja Proxy</h1>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.2)', letterSpacing: '0.06em',
            }}>PARCEIRO OFICIAL</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Infraestrutura de proxy para operacoes em escala
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          style={{
            borderRadius: 24, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(160deg, #0e1322, #0a0e18)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02), 0 0 80px rgba(59,130,246,0.04)',
          }}
        >
          {/* Top visual area */}
          <div style={{
            padding: '48px 40px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04) 50%, transparent)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', marginLeft: -150,
              width: 300, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(59,130,246,0.12)',
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
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="https://bettifyproxy.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '15px 40px', borderRadius: 14,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
                boxShadow: '0 6px 24px rgba(59,130,246,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(59,130,246,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.25)' }}
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
      </div>
    </AppLayout>
  )
}
