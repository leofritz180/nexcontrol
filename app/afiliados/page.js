'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import RouteTour from '../../components/RouteTour'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtN = v => Number(v || 0).toLocaleString('pt-BR')
const ease = [0.33, 1, 0.68, 1]

export default function AfiliadosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [data, setData] = useState(null)
  const emailRef = useRef(null)

  async function fetchStats(email) {
    const res = await fetch('/api/affiliate/stats', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    let interval
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      emailRef.current = u.email
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p || p.role !== 'admin') { router.push('/admin'); return }
      setProfile(p)
      if (p.tenant_id) {
        const { data: t } = await supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle()
        setTenant(t)
      }
      await fetchStats(u.email)
      setLoading(false)
      interval = setInterval(() => { if (emailRef.current) fetchStats(emailRef.current) }, 20000)
    }
    init()
    return () => { if (interval) clearInterval(interval) }
  }, [])

  if (loading) return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 22, height: 22, borderTopColor: '#e53935' }} />
      </main>
    </AppLayout>
  )

  const enabled = !!data?.enabled
  const totals = data?.totals || {}
  const referrals = data?.referrals || []
  const rate = data?.rate || 0.30
  const link = data?.link || ''

  return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', position: 'relative' }}>

        {/* AMBIENT GLOW */}
        <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.08), transparent 60%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(209,250,229,0.05), transparent 60%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '48px 28px 100px' }}>

          {!enabled ? <LockedHero /> : (
            <>
              <HeroSection rate={rate} totals={totals} />
              <LinkCard link={link} code={data?.code} rate={rate} />
              <HowItWorks rate={rate} />
              <KPIGrid totals={totals} />

              <div className="g-2-1" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
                <ShareKit link={link} userName={profile?.nome} />
                <RightColumn data={data} userEmail={user?.email} onRefresh={() => fetchStats(emailRef.current)} fmt={fmt} rate={rate} />
              </div>

              <ReferralsList referrals={referrals} />
              <HistoryList referrals={referrals} fmt={fmt} />
              <FAQ rate={rate} />
            </>
          )}
        </div>
      </main>
      <RouteTour tourId="afiliados" />

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.g-2-1) { grid-template-columns: 1fr !important; }
          :global(.g-3-aff) { grid-template-columns: 1fr !important; }
          :global(.g-4-kpi) { grid-template-columns: repeat(2, 1fr) !important; }
          :global(.hero-h1) { font-size: 44px !important; }
        }
      `}</style>
    </AppLayout>
  )
}

/* ── LOCKED HERO (caso afiliado nao habilitado) ── */
function LockedHero() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
      style={{ borderRadius: 20, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', padding: '64px 36px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <h2 style={{ fontFamily: 'var(--font-serif, "Instrument Serif", serif)', fontSize: 32, fontWeight: 400, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Programa em ativação</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 auto', maxWidth: 460, lineHeight: 1.6 }}>Liberação acontece automaticamente nas próximas horas. Volte em breve.</p>
    </motion.div>
  )
}

/* ── HERO PREMIUM ── */
function HeroSection({ rate, totals }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }}
      style={{ marginBottom: 40 }}>
      <div style={{
        fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase',
        color: '#e53935', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 24, height: 1, background: '#e53935' }} />
        Programa de Afiliados · {Math.round(rate * 100)}% de comissão
      </div>

      <h1 className="hero-h1" style={{
        fontFamily: 'var(--font-serif, "Instrument Serif", "Times New Roman", serif)',
        fontSize: 64, fontWeight: 400, color: '#fff',
        letterSpacing: '-0.035em', lineHeight: 0.95,
        margin: '0 0 18px',
      }}>
        Indique. Ganhe.<br/>
        <span style={{ background: 'linear-gradient(90deg, #fff 30%, rgba(229,57,53,0.85))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Repita.</span>
      </h1>

      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 0 32px', lineHeight: 1.55, fontWeight: 300 }}>
        Indique clientes pro NexControl e ganhe <strong style={{ color: '#fff', fontWeight: 600 }}>{Math.round(rate * 100)}% de comissão</strong> em cada assinatura. Pagamento via PIX, direto no seu app. Zero burocracia.
      </p>

      {/* HERO KPI strip — 2 grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <div style={{ padding: '22px 26px', borderRadius: 14, background: 'linear-gradient(145deg, rgba(229,57,53,0.06), rgba(229,57,53,0.01))', border: '1px solid rgba(229,57,53,0.18)' }}>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Comissão acumulada</p>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>R$ {fmt(totals.totalComissao)}</p>
        </div>
        <div style={{ padding: '22px 26px', borderRadius: 14, background: 'linear-gradient(145deg, rgba(209,250,229,0.04), rgba(209,250,229,0.01))', border: '1px solid rgba(209,250,229,0.18)' }}>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>A receber</p>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 36, fontWeight: 800, color: '#D1FAE5', margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>R$ {fmt(totals.pendente)}</p>
        </div>
      </div>
    </motion.section>
  )
}

/* ── LINK CARD com QR + share ── */
function LinkCard({ link, code, rate }) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const qrUrl = link ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&color=ffffff&bgcolor=050505&qzone=1&data=${encodeURIComponent(link)}` : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NexControl',
          text: 'Sistema profissional pra gerenciar sua operação de CPA — teste 3 dias grátis',
          url: link,
        })
      } catch {}
    } else {
      copyLink()
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1, ease }}
      style={{ marginBottom: 36 }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20,
        background: 'linear-gradient(180deg, #0d0d0d, #050505)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 80px rgba(229,57,53,0.06)',
      }}>
        {/* glow top */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(229,57,53,0.5), transparent)' }} />
        {/* glow right */}
        <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.12), transparent 60%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: '0 0 6px', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Seu link único</p>
              <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, fontWeight: 400, color: '#fff', margin: 0, letterSpacing: '-0.015em' }}>Compartilhe e ganhe.</p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 800, color: '#10B981', letterSpacing: '0.15em' }}>LINK ATIVO</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{
              flex: 1, minWidth: 260,
              display: 'flex', alignItems: 'center',
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              fontFamily: 'var(--mono, monospace)', fontSize: 13.5, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {link}
            </div>
            <motion.button onClick={copyLink} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                background: copied ? 'rgba(16,185,129,0.18)' : 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
                color: copied ? '#10B981' : '#fff',
                border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.12)',
                display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.18s',
              }}>
              {copied ? (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copiado</>)
                : (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar link</>)}
            </motion.button>
            <motion.button onClick={shareLink} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                background: 'linear-gradient(180deg, #ef4444, #c62828)',
                color: '#fff', boxShadow: '0 4px 16px rgba(229,57,53,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Compartilhar
            </motion.button>
            <motion.button onClick={() => setShowQR(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                background: 'transparent', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              QR
            </motion.button>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 11, color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
            <span>Código: <strong style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--mono, monospace)' }}>{code}</strong></span>
            <span>Comissão: <strong style={{ color: '#D1FAE5', fontFamily: 'var(--mono, monospace)' }}>{Math.round(rate * 100)}%</strong></span>
            <span>Validade: <strong style={{ color: 'rgba(255,255,255,0.78)' }}>Sem prazo</strong></span>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div onClick={() => setShowQR(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 36, textAlign: 'center', maxWidth: 380 }}>
              <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 24, color: '#fff', margin: '0 0 8px' }}>Aponte a câmera</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 22px' }}>QR Code do seu link de indicação</p>
              <img src={qrUrl} alt="QR Code" width={280} height={280} style={{ borderRadius: 12, display: 'block', margin: '0 auto 18px' }} />
              <a href={qrUrl} download="nexcontrol-qr.png" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar QR
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

/* ── HOW IT WORKS · 3 steps ── */
function HowItWorks({ rate }) {
  const steps = [
    {
      n: '01',
      title: 'Compartilhe seu link',
      desc: 'Envia pro grupo, post no Insta, manda no DM. Você usa onde quiser — sem limite.',
      icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    },
    {
      n: '02',
      title: 'Indicado se cadastra e assina',
      desc: 'Quando ele entra pelo seu link e vira PRO, ficamos sabendo automaticamente.',
      icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
    },
    {
      n: '03',
      title: 'Você recebe via PIX',
      desc: `${Math.round(rate * 100)}% de comissão direto na sua chave PIX cadastrada. Acompanha tudo aqui no painel.`,
      icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
  ]

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease }}
      style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: '#fff', margin: '0 0 22px', fontWeight: 400, letterSpacing: '-0.02em' }}>Como funciona</h2>
      <div className="g-3-aff" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {steps.map((s, i) => (
          <motion.div key={s.n}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease }}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '26px 24px', borderRadius: 16,
              background: 'linear-gradient(180deg, #0a0a0a, #050505)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 38, fontWeight: 800, color: 'rgba(255,255,255,0.05)', margin: 0, position: 'absolute', top: 16, right: 22, lineHeight: 1, letterSpacing: '-0.04em' }}>{s.n}</p>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#e53935' }}>
              {s.icon}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{s.title}</h3>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.55 }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

/* ── KPI GRID ── */
function KPIGrid({ totals }) {
  const items = [
    { l: 'Indicados', v: fmtN(totals.totalIndicados || 0), c: '#fff', icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg> },
    { l: 'Faturamento gerado', v: 'R$ ' + fmt(totals.totalFaturado || 0), c: 'rgba(255,255,255,0.78)', icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { l: 'Comissão paga', v: 'R$ ' + fmt(totals.pago || 0), c: '#D1FAE5', icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { l: 'A receber', v: 'R$ ' + fmt(totals.pendente || 0), c: '#e53935', icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ]
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease }}
      className="g-4-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 36 }}>
      {items.map((k, i) => (
        <motion.div key={k.l}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 + i * 0.05, ease }}
          style={{ padding: '20px 22px', borderRadius: 14, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: 0, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{k.l}</p>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{k.icon}</span>
          </div>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 22, fontWeight: 800, color: k.c, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{k.v}</p>
        </motion.div>
      ))}
    </motion.section>
  )
}

/* ── SHARE KIT (tabs WhatsApp/Instagram/DM + preview) ── */
function ShareKit({ link, userName }) {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [copied, setCopied] = useState(false)

  const TEMPLATES = {
    whatsapp: {
      label: 'WhatsApp',
      icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
      text: `Mano, descobri um sistema que organiza toda operação de CPA. Metas, operadores, BAU, lucro líquido — tudo num lugar só. Testa grátis 3 dias 👇\n\n${link}`,
    },
    instagram: {
      label: 'Instagram',
      icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
      text: `🎯 Operação de CPA organizada de verdade.\n\nSistema com metas, operadores, BAU, ranking e fechamento automático.\n\n3 dias grátis 👇\n${link}`,
    },
    dm: {
      label: 'DM longo',
      icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      text: `Cara, se tu opera com CPA isso vai te ajudar muito.\n\nÉ o NexControl — sistema feito pra essa nossa operação:\n\n✅ Metas + remessas organizadas\n✅ BAU automático\n✅ Lucro líquido na hora\n✅ Push em tempo real\n✅ Multi operador\n\nTestei e virei cliente. 3 dias grátis:\n\n${link}\n\nQualquer dúvida me chama.`,
    },
    email: {
      label: 'E-mail',
      icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      text: `Olá!\n\nQueria te apresentar o NexControl — sistema completo pra gerenciar operação de CPA / iGaming.\n\nO sistema cobre:\n- Gestão de metas e remessas\n- Operadores ilimitados\n- BAU e lucro automático\n- Push em tempo real\n- Painel de fechamento\n\nVocê tem 3 dias pra testar grátis: ${link}\n\nAbraço${userName ? ',\n' + userName : ''}`,
    },
  }

  function copyTpl() {
    try {
      navigator.clipboard.writeText(TEMPLATES[activeTab].text)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35, ease }}
      style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', padding: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: '#fff', margin: 0, fontWeight: 400, letterSpacing: '-0.015em' }}>Kit de divulgação</h3>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Copy pronta · cole e envie</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
        {Object.entries(TEMPLATES).map(([k, v]) => {
          const active = k === activeTab
          return (
            <button key={k} type="button" onClick={() => setActiveTab(k)}
              style={{
                flex: '1 0 auto', padding: '9px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(229,57,53,0.12)' : 'transparent',
                color: active ? '#e53935' : 'rgba(255,255,255,0.55)',
                fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              {v.icon}
              {v.label}
            </button>
          )
        })}
      </div>

      {/* Preview */}
      <div style={{ position: 'relative', padding: '18px 18px', borderRadius: 12, background: '#050505', border: '1px solid rgba(255,255,255,0.06)', minHeight: 180 }}>
        <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55, fontFamily: 'inherit' }}>
          {TEMPLATES[activeTab].text}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <motion.button onClick={copyTpl} whileTap={{ scale: 0.97 }}
          style={{
            flex: 1, padding: '13px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
            background: copied ? 'rgba(16,185,129,0.18)' : 'linear-gradient(180deg, #ef4444, #c62828)',
            color: copied ? '#10B981' : '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: copied ? 'none' : '0 4px 16px rgba(229,57,53,0.3)',
          }}>
          {copied ? (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copiado pra área de transferência</>)
            : 'Copiar mensagem'}
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ── RIGHT COLUMN: PIX + Simulator ── */
function RightColumn({ data, userEmail, onRefresh, fmt, rate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PixCard data={data} userEmail={userEmail} onRefresh={onRefresh} />
      <Simulator rate={rate} fmt={fmt} />
    </div>
  )
}

function PixCard({ data, userEmail, onRefresh }) {
  const [pixKey, setPixKey] = useState(data?.pix_key || '')
  const [pixType, setPixType] = useState(data?.pix_type || 'email')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setPixKey(data?.pix_key || '')
    setPixType(data?.pix_type || 'email')
  }, [data?.pix_key, data?.pix_type])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/affiliate/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, pix_key: pixKey, pix_type: pixType }),
      })
      if (res.ok) {
        setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2000)
        onRefresh?.()
      }
    } finally { setSaving(false) }
  }

  const hasPix = !!data?.pix_key

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4, ease }}
      style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid ' + (hasPix ? 'rgba(16,185,129,0.18)' : 'rgba(229,57,53,0.22)'), padding: 22, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: hasPix ? 'linear-gradient(90deg, transparent, rgba(16,185,129,0.35), transparent)' : 'linear-gradient(90deg, transparent, rgba(229,57,53,0.45), transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 18, color: '#fff', margin: '0 0 4px', fontWeight: 400 }}>Sua chave PIX</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sem PIX, comissões ficam paradas</p>
        </div>
        <span style={{
          fontFamily: 'var(--mono, monospace)', fontSize: 9, fontWeight: 800, padding: '4px 9px', borderRadius: 5,
          background: hasPix ? 'rgba(16,185,129,0.1)' : 'rgba(229,57,53,0.1)',
          color: hasPix ? '#10B981' : '#e53935',
          border: hasPix ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(229,57,53,0.25)',
          letterSpacing: '0.08em',
        }}>{hasPix ? 'CADASTRADA' : 'PENDENTE'}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select value={pixType} onChange={e => setPixType(e.target.value)}
          style={{ padding: '11px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
          <option value="cpf">CPF</option>
          <option value="email">E-mail</option>
          <option value="phone">Telefone</option>
          <option value="random">Aleatória</option>
        </select>
        <input value={pixKey} onChange={e => setPixKey(e.target.value)}
          placeholder={pixType === 'cpf' ? '000.000.000-00' : pixType === 'email' ? 'voce@email.com' : pixType === 'phone' ? '+55 31 99999-9999' : 'chave aleatória'}
          style={{ flex: 1, padding: '11px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontFamily: 'var(--mono, monospace)', outline: 'none' }} />
      </div>
      <button onClick={save} disabled={saving || !pixKey.trim()}
        style={{
          width: '100%', padding: '11px 16px', borderRadius: 10, border: 'none',
          cursor: saving || !pixKey.trim() ? 'not-allowed' : 'pointer',
          background: savedFlash ? 'rgba(16,185,129,0.18)' : (saving || !pixKey.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
          color: savedFlash ? '#10B981' : (saving || !pixKey.trim()) ? 'rgba(255,255,255,0.35)' : '#fff',
          border: '1px solid ' + (savedFlash ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)'),
          fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
        }}>
        {savedFlash ? '✓ Chave salva' : saving ? 'Salvando...' : 'Salvar chave PIX'}
      </button>
    </motion.div>
  )
}

function Simulator({ rate, fmt }) {
  const [n, setN] = useState(10)
  const ticket = 39.90
  const earnings = n * ticket * rate

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45, ease }}
      style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', padding: 22 }}>
      <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 18, color: '#fff', margin: '0 0 4px', fontWeight: 400 }}>Simulador</h3>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>Veja seu potencial de ganho</p>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Indicados pagantes</span>
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 13, fontWeight: 800, color: '#fff' }}>{n}</span>
        </div>
        <input type="range" min="1" max="50" value={n} onChange={e => setN(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#e53935' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: 'var(--mono, monospace)' }}>
          <span>1</span><span>25</span><span>50</span>
        </div>
      </div>

      <div style={{ padding: '18px 18px', borderRadius: 12, background: 'linear-gradient(145deg, rgba(209,250,229,0.05), rgba(209,250,229,0.01))', border: '1px solid rgba(209,250,229,0.18)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Sua comissão</p>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 32, fontWeight: 900, color: '#D1FAE5', margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>R$ {fmt(earnings)}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '6px 0 0' }}>{Math.round(rate * 100)}% × R$ {fmt(ticket)} × {n}</p>
      </div>
    </motion.div>
  )
}

/* ── REFERRALS LIST premium ── */
function ReferralsList({ referrals }) {
  if (referrals.length === 0) {
    return (
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.55, ease }}
        style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', padding: 36, textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: '#fff', margin: '0 0 6px', fontWeight: 400 }}>Esperando o primeiro</h3>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Compartilhe seu link e veja seu primeiro indicado aparecer aqui</p>
      </motion.section>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.55, ease }}
      style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: '#fff', margin: 0, fontWeight: 400, letterSpacing: '-0.02em' }}>Seus indicados</h2>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Atualiza a cada 20s</p>
      </div>
      <div style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {referrals.map((r, i) => (
            <motion.div key={r.tenant_id} layout
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 22px',
                borderBottom: i < referrals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(145deg, rgba(229,57,53,0.18), rgba(229,57,53,0.04))', border: '1px solid rgba(229,57,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{(r.tenant_name || '?')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.tenant_name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {r.email && <span>{r.email}</span>}
                  <StatusBadge status={r.subscription_status} />
                  {r.payments_count > 0 && <span style={{ color: 'rgba(255,255,255,0.55)' }}>· {r.payments_count} pagto(s)</span>}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 16, fontWeight: 800, color: '#D1FAE5', margin: 0, letterSpacing: '-0.015em' }}>+R$ {fmt(r.commission)}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>de R$ {fmt(r.generated)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

function StatusBadge({ status }) {
  const map = {
    active: { l: 'PRO', c: '#D1FAE5', bg: 'rgba(209,250,229,0.08)' },
    trial: { l: 'TRIAL', c: 'rgba(255,255,255,0.78)', bg: 'rgba(255,255,255,0.06)' },
    expired: { l: 'VENCIDA', c: '#FCA5A5', bg: 'rgba(239,68,68,0.08)' },
  }
  const cfg = map[status] || { l: status, c: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)' }
  return (
    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: cfg.bg, color: cfg.c, letterSpacing: '0.08em' }}>{cfg.l}</span>
  )
}

/* ── HISTORY (timeline simples por indicado) ── */
function HistoryList({ referrals, fmt }) {
  // Ordena por commission desc, pega os top 5 que geraram dinheiro
  const withComm = referrals.filter(r => r.commission > 0).slice(0, 5)
  if (withComm.length === 0) return null

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6, ease }}
      style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: '#fff', margin: '0 0 14px', fontWeight: 400 }}>Top indicados</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {withComm.map((r, i) => (
          <div key={r.tenant_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 14, fontWeight: 800, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.35)', minWidth: 24 }}>#{i + 1}</span>
            <p style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#fff', margin: 0 }}>{r.tenant_name}</p>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, fontWeight: 700, color: '#D1FAE5', margin: 0 }}>R$ {fmt(r.commission)}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

/* ── FAQ collapsible ── */
function FAQ({ rate }) {
  const [open, setOpen] = useState(null)
  const items = [
    { q: 'Como recebo minha comissão?', a: 'Quando algum indicado seu paga uma mensalidade do NexControl, automaticamente gera uma comissão de ' + Math.round(rate * 100) + '% pra você. Eu pago via PIX manualmente em até 7 dias.' },
    { q: 'Quanto custa pra começar?', a: 'Nada. Programa de afiliados é grátis pra todo cliente PRO. Basta cadastrar sua chave PIX acima e começar a divulgar.' },
    { q: 'Tenho limite de indicações?', a: 'Não. Você pode indicar quantas pessoas quiser. Cada indicado pagante gera comissão pra você.' },
    { q: 'E se o cliente cancelar depois?', a: 'A comissão que você já recebeu fica com você. Não tem clawback.' },
    { q: 'Posso indicar meus operadores?', a: 'Não. Cada tenant pode ter só um afiliado, e indicação de você mesmo (auto-referência) é bloqueada automaticamente.' },
    { q: 'Quando o pagamento PIX cai?', a: 'O pagamento é feito manualmente em até 7 dias úteis após a comissão aparecer como pendente. Você recebe push aqui mesmo quando for pago.' },
    { q: 'Posso mudar minha chave PIX depois?', a: 'Pode, sim. Comissões já marcadas como pagas não voltam, mas qualquer nova vai pra chave atualizada.' },
  ]
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7, ease }}
      style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: '#fff', margin: '0 0 14px', fontWeight: 400, letterSpacing: '-0.02em' }}>Perguntas frequentes</h2>
      <div style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)}
                style={{ width: '100%', padding: '18px 24px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{item.q}</span>
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.22, ease }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    style={{ overflow: 'hidden' }}>
                    <p style={{ padding: '0 24px 18px', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
