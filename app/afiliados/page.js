'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import RouteTour from '../../components/RouteTour'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtN = v => Number(v || 0).toLocaleString('pt-BR')
const ease = [0.33, 1, 0.68, 1]

/* ── Animated count-up ── */
function CountUp({ value, prefix = '', suffix = '', duration = 1.5, decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return
    const start = Date.now()
    const from = 0
    const to = Number(value) || 0
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, value, duration])

  const formatted = decimals > 0
    ? display.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(display).toLocaleString('pt-BR')

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>
}

export default function AfiliadosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [data, setData] = useState(null)
  const [globalStats, setGlobalStats] = useState({ totalPaid: 0, activeAffiliates: 0 })
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
      <main style={{ position: 'relative', overflow: 'hidden' }}>

        {!enabled ? <LockedHero /> : (
          <>
            <HeroFullBleed rate={rate} totals={totals} link={link} code={data?.code} />
            <ActivityMarquee referrals={referrals} />
            <ContentBlock>
              <HowItWorks rate={rate} />
            </ContentBlock>
            <ContentBlock>
              <WithdrawalCode code={data?.code} />
            </ContentBlock>
            <ContentBlock>
              <KPISection totals={totals} />
            </ContentBlock>
            <ContentBlock>
              <ShareKitImersive link={link} userName={profile?.nome} />
            </ContentBlock>
            <ContentBlock>
              <ReferralsAndTop referrals={referrals} />
            </ContentBlock>
            <ContentBlock>
              <FAQImersive rate={rate} />
            </ContentBlock>
            <FinalCTA link={link} rate={rate} />
          </>
        )}
      </main>
      <RouteTour tourId="afiliados" />

      <style jsx global>{`
        @keyframes mesh-pulse {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          33% { transform: translate(40px, -30px) scale(1.1); opacity: 0.9; }
          66% { transform: translate(-30px, 40px) scale(0.95); opacity: 0.6; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float-up {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) translateX(40px); opacity: 0; }
        }
        @media (max-width: 768px) {
          .aff-hero-h1 { font-size: 56px !important; }
          .aff-grid-3 { grid-template-columns: 1fr !important; }
          .aff-grid-2 { grid-template-columns: 1fr !important; }

          /* MOBILE PERFORMANCE — mata animacoes pesadas que causavam jitter */
          /* Orbs gigantes com blur 80px = GPU killer no mobile.
             Substitui por gradient estatico + sem blur. */
          .aff-orb {
            animation: none !important;
            filter: none !important;
            opacity: 0.5 !important;
          }
          /* Reduz altura do hero (92vh + barras chrome = layout shift) */
          .aff-hero { min-height: auto !important; padding: 40px 20px 32px !important; }
          /* Para shimmer text */
          .aff-shimmer {
            animation: none !important;
            -webkit-text-fill-color: #ef4444 !important;
            background: none !important;
          }
          /* Marquee mais lento OU desabilitado pra evitar repaints constantes */
          .aff-marquee { animation-duration: 90s !important; }
          /* Remove all backdrop-filter on mobile (GPU heavy) */
          .aff-hero *[style*="backdropFilter"],
          main *[style*="backdropFilter"] {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          /* Hide scroll indicator do hero (animacao bounce extra) */
          .aff-hero > div[style*="bottom: 24"] { display: none !important; }
        }
      `}</style>
    </AppLayout>
  )
}

/* ── Helpers ── */
function ContentBlock({ children }) {
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 28px' }}>
      {children}
    </section>
  )
}

function SectionEyebrow({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--mono, monospace)', fontSize: 10, fontWeight: 700,
      color: '#e53935', letterSpacing: '0.28em', textTransform: 'uppercase',
      marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 20, height: 1, background: '#e53935' }} />
      {children}
    </div>
  )
}

function SectionTitle({ children, size = 40 }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-serif, "Instrument Serif", serif)',
      fontSize: size, fontWeight: 400, color: '#fff',
      letterSpacing: '-0.025em', lineHeight: 1.05,
      margin: '0 0 16px',
    }}>{children}</h2>
  )
}

/* ── LOCKED ── */
function LockedHero() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        style={{ maxWidth: 480, borderRadius: 20, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', padding: '64px 36px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 32, fontWeight: 400, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Programa em ativação</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 auto', maxWidth: 360, lineHeight: 1.6 }}>Liberação acontece automaticamente nas próximas horas. Volte em breve.</p>
      </motion.div>
    </div>
  )
}

/* ── HERO FULL-BLEED ── */
function HeroFullBleed({ rate, totals, link, code }) {
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  // Parallax SO no desktop — mobile tinha jitter pesado
  const heroYDesktop = useTransform(scrollY, [0, 600], [0, -120])
  const heroOpacityDesktop = useTransform(scrollY, [0, 400], [1, 0.3])
  const heroY = isMobile ? 0 : heroYDesktop
  const heroOpacity = isMobile ? 1 : heroOpacityDesktop

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NexControl', text: 'Sistema profissional pra gerenciar sua operação de CPA', url: link })
      } catch {}
    } else copyLink()
  }

  return (
    <section ref={heroRef} className="aff-hero" style={{
      position: 'relative',
      minHeight: '92vh',
      display: 'flex', alignItems: 'center',
      padding: '80px 28px 60px',
      overflow: 'hidden',
    }}>
      {/* MESH GRADIENT animado */}
      <div className="aff-orbs" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="aff-orb" style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '60vw', height: '60vw', maxWidth: 900, maxHeight: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,57,53,0.22), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'mesh-pulse 18s ease-in-out infinite',
        }} />
        <div className="aff-orb" style={{
          position: 'absolute', top: '20%', right: '-15%',
          width: '50vw', height: '50vw', maxWidth: 800, maxHeight: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,57,53,0.18), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'mesh-pulse 22s ease-in-out infinite reverse',
        }} />
        <div className="aff-orb" style={{
          position: 'absolute', bottom: '-20%', left: '30%',
          width: '50vw', height: '50vw', maxWidth: 700, maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(209,250,229,0.06), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'mesh-pulse 25s ease-in-out infinite',
        }} />
      </div>

      {/* Grid background sutil */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        zIndex: 0,
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
      }} />

      <motion.div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', width: '100%', y: heroY, opacity: heroOpacity }}>

        {/* Eyebrow flutuante */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '7px 16px', borderRadius: 999,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 28, backdropFilter: 'blur(8px)',
          }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10.5, color: 'rgba(255,255,255,0.78)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Programa de Afiliados · {Math.round(rate * 100)}% de comissão
          </span>
        </motion.div>

        {/* Headline gigante */}
        <motion.h1 className="aff-hero-h1"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease }}
          style={{
            fontFamily: 'var(--font-serif, "Instrument Serif", serif)',
            fontSize: 112, fontWeight: 400, color: '#fff',
            letterSpacing: '-0.045em', lineHeight: 0.9,
            margin: '0 0 28px', maxWidth: 1000,
          }}>
          Indique. <span className="aff-shimmer" style={{
            background: 'linear-gradient(90deg, #fff 20%, #ef4444 60%, #fff 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
            fontStyle: 'italic',
          }}>Ganhe.</span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease }}
          style={{
            fontSize: 19, color: 'rgba(255,255,255,0.65)',
            maxWidth: 620, margin: '0 0 40px',
            lineHeight: 1.5, fontWeight: 300,
          }}>
          Indique clientes pro NexControl, ganhe <strong style={{ color: '#fff', fontWeight: 500 }}>{Math.round(rate * 100)}%</strong> de comissão em cada assinatura. Direto na sua chave PIX, sem burocracia.
        </motion.p>

        {/* CTAs duplos */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
          <motion.button onClick={shareLink} whileHover={{ scale: 1.03, boxShadow: '0 16px 48px rgba(229,57,53,0.5)' }} whileTap={{ scale: 0.97 }}
            style={{
              padding: '16px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(180deg, #ef4444, #c62828)',
              color: '#fff', fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(229,57,53,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Compartilhar meu link
          </motion.button>
          <motion.button onClick={copyLink} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              padding: '16px 24px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
            {copied ? (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg><span style={{ color: '#10B981' }}>Copiado</span></>)
              : (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar link</>)}
          </motion.button>
        </motion.div>

        {/* Link preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55, ease }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)', marginBottom: 80,
            maxWidth: '100%', overflow: 'hidden',
          }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: 'rgba(255,255,255,0.78)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', flexShrink: 0 }}>
            <span style={{ color: '#D1FAE5' }}>{code}</span>
          </span>
        </motion.div>

        {/* Hero stats strip — 3 grandes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease }}
          className="aff-grid-3"
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
            background: 'rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          {[
            { l: 'Indicados', v: totals.totalIndicados || 0, prefix: '', suffix: '', dec: 0, c: '#fff' },
            { l: 'Comissão acumulada', v: totals.totalComissao || 0, prefix: 'R$ ', suffix: '', dec: 2, c: '#D1FAE5' },
            { l: 'A receber', v: totals.pendente || 0, prefix: 'R$ ', suffix: '', dec: 2, c: '#ef4444' },
          ].map((k, i) => (
            <div key={k.l} style={{ background: '#050505', padding: '24px 28px' }}>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 8px' }}>{k.l}</p>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 32, fontWeight: 800, color: k.c, margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>
                <CountUp value={k.v} prefix={k.prefix} suffix={k.suffix} decimals={k.dec} />
              </p>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,0.35)',
          }}>
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Explorar</span>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ── ACTIVITY MARQUEE (feed simulado) ── */
function ActivityMarquee({ referrals }) {
  // Combina indicados reais com mockup pra parecer movimentado
  const realItems = referrals.slice(0, 6).map(r => ({
    name: r.tenant_name,
    action: `gerou R$ ${fmt(r.commission || 0)} de comissão`,
    when: 'recente',
  }))
  const mockItems = [
    { name: '@davir', action: 'recebeu R$ 28,02 em comissão', when: 'há 2h' },
    { name: '@rodrigo', action: 'indicou novo cliente', when: 'há 5h' },
    { name: '@sergio_g', action: 'solicitou pagamento via @nexcpa', when: 'há 1d' },
    { name: '@cpalflux', action: 'tornou-se afiliado', when: 'há 1d' },
    { name: '@thiago', action: 'compartilhou link no WhatsApp', when: 'há 2d' },
  ]
  const items = realItems.length > 0 ? [...realItems, ...mockItems] : mockItems
  const doubled = [...items, ...items]

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.015)',
      padding: '16px 0',
    }}>
      <div className="aff-marquee" style={{
        display: 'flex', gap: 28,
        animation: 'marquee 50s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              <strong style={{ color: '#fff', fontWeight: 700 }}>{item.name}</strong> {item.action} <span style={{ color: 'rgba(255,255,255,0.35)' }}>· {item.when}</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
          </div>
        ))}
      </div>
      {/* Fade laterais */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg, #050505, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: 'linear-gradient(-90deg, #050505, transparent)', pointerEvents: 'none' }} />
    </div>
  )
}

/* ── HOW IT WORKS — timeline vertical criativa, sem caixinha vermelha ── */
function HowItWorks({ rate }) {
  const steps = [
    {
      n: '01',
      title: 'Compartilhe seu link',
      desc: 'Cola no grupo, posta no Stories, manda no DM. Sem limite, sem aprovação prévia.',
      accent: '#94A3B8',
    },
    {
      n: '02',
      title: 'Indicado assina o plano',
      desc: 'Quando entra pelo seu link e vira PRO, o sistema te credita automaticamente a comissão.',
      accent: '#D1FAE5',
    },
    {
      n: '03',
      title: 'Solicite seu pagamento',
      desc: `Quando atingir o valor que quiser sacar, chama o suporte com seu código único de afiliado.`,
      accent: '#fff',
      contact: true,
    },
  ]

  return (
    <div>
      <SectionEyebrow>Em 3 passos</SectionEyebrow>
      <SectionTitle size={56}>Simples assim.</SectionTitle>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 0 56px', lineHeight: 1.55 }}>
        Sem código complicado, sem cadastro burocrático. Tudo funciona em segundo plano.
      </p>

      {/* Timeline vertical com linha lateral */}
      <div style={{ position: 'relative', paddingLeft: 100, maxWidth: 900 }}>
        {/* Linha vertical decorativa */}
        <div style={{
          position: 'absolute', left: 39, top: 30, bottom: 30,
          width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.18), rgba(255,255,255,0.18), transparent)',
        }} />

        {steps.map((s, i) => (
          <motion.div key={s.n}
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: i * 0.14, ease }}
            style={{ position: 'relative', marginBottom: i < steps.length - 1 ? 56 : 0 }}>

            {/* Numero gigante outline na lateral */}
            <div style={{
              position: 'absolute', left: -100, top: -6, width: 78,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            }}>
              <span style={{
                fontFamily: 'var(--font-serif, serif)', fontSize: 76, fontWeight: 400,
                color: 'transparent',
                WebkitTextStroke: '1px rgba(255,255,255,0.18)',
                letterSpacing: '-0.04em', lineHeight: 0.9,
              }}>{s.n}</span>
            </div>

            {/* Dot na linha */}
            <div style={{
              position: 'absolute', left: -61, top: 14,
              width: 11, height: 11, borderRadius: '50%',
              background: '#050505',
              border: `1.5px solid ${s.accent}`,
              boxShadow: `0 0 0 4px #050505, 0 0 16px ${s.accent}66`,
            }} />

            {/* Conteúdo do step */}
            <h3 style={{
              fontFamily: 'var(--font-serif, serif)', fontSize: 32, fontWeight: 400,
              color: '#fff', margin: '0 0 10px',
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>{s.title}</h3>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', margin: 0, lineHeight: 1.6, maxWidth: 560 }}>{s.desc}</p>

            {/* Step 3: cards de contato */}
            {s.contact && (
              <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                <a href="https://instagram.com/nexcpa" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 11,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }}>INSTAGRAM</span>
                    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 13, color: '#fff' }}>@nexcpa</span>
                  </span>
                </a>
                <a href="https://wa.me/5532998348889" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 11,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.24)',
                    color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, color: 'rgba(16,185,129,0.7)', letterSpacing: '0.1em' }}>WHATSAPP</span>
                    <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 13, color: '#fff' }}>(32) 99834-8889</span>
                  </span>
                </a>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── WITHDRAWAL CODE — codigo unico de recebimento (anti-fraude) ── */
function WithdrawalCode({ code }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const masked = code ? code.slice(0, 2) + '••••' + code.slice(-2) : '••••••••'

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div>
      <SectionEyebrow>Seu código de afiliado</SectionEyebrow>
      <SectionTitle size={56}>Único. Pessoal. Intransferível.</SectionTitle>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 640, margin: '0 0 36px', lineHeight: 1.55 }}>
        Este código identifica você como dono da conta. Use ele pra solicitar seu pagamento — só assim a gente confirma que é você que está pedindo, e não outra pessoa.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
        style={{
          position: 'relative', overflow: 'hidden',
          padding: '40px 36px', borderRadius: 22,
          background: 'linear-gradient(180deg, #0d0d0d, #050505)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        }}>
        {/* Glow top */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />
        {/* Lateral glow sutil */}
        <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04), transparent 60%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>

          {/* Esquerda — código + ações */}
          <div style={{ flex: '1 1 380px' }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>
              Código de recebimento
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <p style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 48, fontWeight: 800,
                color: '#fff',
                margin: 0, letterSpacing: '-0.025em', lineHeight: 1,
                textShadow: revealed ? '0 0 40px rgba(255,255,255,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {revealed ? code : masked}
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setRevealed(v => !v)} type="button"
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: revealed ? '#ef4444' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                  {revealed ? (
                    <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>Ocultar</>
                  ) : (
                    <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Revelar</>
                  )}
                </button>
                <button onClick={copyCode} type="button" disabled={!revealed}
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: revealed ? 'pointer' : 'not-allowed',
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'),
                    color: copied ? '#10B981' : revealed ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 6, opacity: revealed ? 1 : 0.5,
                  }}>
                  {copied ? (<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copiado</>)
                    : (<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar</>)}
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6, maxWidth: 420 }}>
              <strong style={{ color: '#fff' }}>Mantenha sigilo.</strong> Esse código é a sua chave de identificação. Qualquer pessoa com ele pode tentar resgatar suas comissões em seu nome.
            </p>
          </div>

          {/* Direita — instruções de saque */}
          <div style={{ flex: '0 1 320px', padding: '22px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>
              Como solicitar
            </p>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                'Chama no @nexcpa (Instagram) ou WhatsApp',
                'Envie seu código de recebimento',
                'Confirme dados pra receber via PIX, banco ou outro meio',
                'Pagamento sai em até 24 horas',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0, fontFamily: 'var(--mono, monospace)', fontSize: 10.5, fontWeight: 800, color: '#ef4444', minWidth: 18 }}>{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── CALCULATOR MEGA ── */
function CalculatorMega({ rate }) {
  const [n, setN] = useState(15)
  const ticket = 39.90
  const earnings = n * ticket * rate
  const annual = earnings * 12 / 3 // simulando renovação 3x

  return (
    <div>
      <SectionEyebrow>Calculadora</SectionEyebrow>
      <SectionTitle size={56}>Quanto você pode ganhar?</SectionTitle>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 0 40px', lineHeight: 1.55 }}>
        Mova o controle e veja em tempo real. Cada indicado pagante = comissão na sua conta.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
        className="aff-grid-2"
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 0,
          borderRadius: 22, overflow: 'hidden',
          background: 'linear-gradient(180deg, #0d0d0d, #050505)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}>

        {/* Controle */}
        <div style={{ padding: '40px 36px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 18px' }}>Indicados pagantes</p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 30 }}>
            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 72, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 0.9 }}>{n}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>pessoas</span>
          </div>

          <input type="range" min="1" max="100" value={n} onChange={e => setN(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#e53935', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontFamily: 'var(--mono, monospace)' }}>
            <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>

          <div style={{ marginTop: 28, padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              Cálculo baseado em ticket médio de <strong style={{ color: '#fff' }}>R$ {fmt(ticket)}</strong>/mês × <strong style={{ color: '#fff' }}>{Math.round(rate * 100)}% de comissão</strong>.
            </p>
          </div>
        </div>

        {/* Resultados */}
        <div style={{ position: 'relative', padding: '40px 36px', background: 'linear-gradient(135deg, rgba(229,57,53,0.05), rgba(229,57,53,0)) , #050505' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.15), transparent 70%)', filter: 'blur(40px)' }} />

          <div style={{ position: 'relative' }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>Sua comissão</p>

            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 64, fontWeight: 800, color: '#D1FAE5', margin: 0, letterSpacing: '-0.035em', lineHeight: 0.95, textShadow: '0 0 60px rgba(209,250,229,0.3)' }}>
              R$ <CountUp value={earnings} decimals={2} duration={0.6} />
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 30 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 4px', letterSpacing: '0.06em' }}>POR INDICADO</p>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>R$ {fmt(ticket * rate)}</p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 4px', letterSpacing: '0.06em' }}>SE INDICAR 100</p>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 16, fontWeight: 800, color: '#D1FAE5', margin: 0 }}>R$ {fmt(100 * ticket * rate)}</p>
              </div>
            </div>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '20px 0 0', lineHeight: 1.55 }}>
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Realidade:</strong> tickets reais variam de R$ 39 (Solo) a R$ 219+ (Admin + operadores). Quem indica conta grande, ganha proporcionalmente mais.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── KPI SECTION ── */
function KPISection({ totals }) {
  const items = [
    { l: 'Pessoas indicadas', v: totals.totalIndicados || 0, dec: 0, prefix: '', c: '#fff' },
    { l: 'Faturamento gerado', v: totals.totalFaturado || 0, dec: 2, prefix: 'R$ ', c: 'rgba(255,255,255,0.78)' },
    { l: 'Comissão paga até hoje', v: totals.pago || 0, dec: 2, prefix: 'R$ ', c: '#D1FAE5' },
    { l: 'A receber via PIX', v: totals.pendente || 0, dec: 2, prefix: 'R$ ', c: '#ef4444' },
  ]
  return (
    <div>
      <SectionEyebrow>Seus números</SectionEyebrow>
      <SectionTitle size={56}>Sua performance.</SectionTitle>

      <div className="aff-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 32 }}>
        {items.map((k, i) => (
          <motion.div key={k.l}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08, ease }}
            style={{
              padding: '26px 24px', borderRadius: 16,
              background: 'linear-gradient(180deg, #0a0a0a, #050505)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 10px' }}>{k.l}</p>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 28, fontWeight: 800, color: k.c, margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>
              <CountUp value={k.v} prefix={k.prefix} decimals={k.dec} />
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── SHARE KIT IMERSIVE (com phone mockup) ── */
function ShareKitImersive({ link, userName }) {
  const [tab, setTab] = useState('whatsapp')
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
      text: `Olá!\n\nQueria te apresentar o NexControl — sistema completo pra gerenciar operação de CPA / iGaming.\n\nO sistema cobre:\n- Gestão de metas e remessas\n- Operadores ilimitados\n- BAU e lucro automático\n- Push em tempo real\n- Painel de fechamento\n\n3 dias grátis: ${link}\n\nAbraço${userName ? ',\n' + userName : ''}`,
    },
  }

  function copyTpl() {
    try {
      navigator.clipboard.writeText(TEMPLATES[tab].text)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div>
      <SectionEyebrow>Kit de divulgação</SectionEyebrow>
      <SectionTitle size={56}>Copie. Cole. Envie.</SectionTitle>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 0 40px', lineHeight: 1.55 }}>
        Mensagens prontas pensadas pra cada canal. Sem precisar inventar nada.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5, ease }}
        className="aff-grid-2"
        style={{
          display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24,
          alignItems: 'start',
        }}>

        {/* Tabs + Preview */}
        <div style={{ borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', padding: 28 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 18, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 11, border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
            {Object.entries(TEMPLATES).map(([k, v]) => {
              const active = k === tab
              return (
                <button key={k} onClick={() => setTab(k)} type="button"
                  style={{
                    flex: '1 0 auto', padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(229,57,53,0.14)' : 'transparent',
                    color: active ? '#e53935' : 'rgba(255,255,255,0.55)',
                    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}>
                  {v.icon}{v.label}
                </button>
              )
            })}
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: '#050505', border: '1px solid rgba(255,255,255,0.06)', minHeight: 220 }}>
            <p style={{ fontSize: 13.5, color: '#CBD5E1', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{TEMPLATES[tab].text}</p>
          </div>

          <motion.button onClick={copyTpl} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', marginTop: 14, padding: '14px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: copied ? 'rgba(16,185,129,0.18)' : 'linear-gradient(180deg, #ef4444, #c62828)',
              color: copied ? '#10B981' : '#fff',
              fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: copied ? 'none' : '0 4px 16px rgba(229,57,53,0.35)',
            }}>
            {copied ? (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copiado pra área de transferência</>)
              : (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar esta mensagem</>)}
          </motion.button>
        </div>

        {/* Phone Mockup Preview */}
        <PhoneMockup text={TEMPLATES[tab].text} channel={tab} />
      </motion.div>
    </div>
  )
}

function PhoneMockup({ text, channel }) {
  const isWhats = channel === 'whatsapp'
  return (
    <div style={{
      position: 'relative',
      width: '100%', maxWidth: 320,
      aspectRatio: '9/19.5',
      borderRadius: 38,
      background: 'linear-gradient(180deg, #1a1a1a, #050505)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: 8,
      boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(229,57,53,0.08)',
      margin: '0 auto',
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 24, borderRadius: 12, background: '#000', zIndex: 2,
      }} />
      {/* Tela */}
      <div style={{
        width: '100%', height: '100%', borderRadius: 32,
        background: isWhats ? '#0b141a' : '#000', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header phone */}
        <div style={{ padding: '42px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(145deg, #e53935, #c62828)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>V</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>Você</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: '1px 0 0' }}>online · agora</p>
            </div>
          </div>
        </div>
        {/* Mensagem */}
        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            alignSelf: 'flex-end',
            maxWidth: '85%',
            padding: '8px 12px',
            borderRadius: '14px 14px 4px 14px',
            background: isWhats ? '#005c4b' : 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
          }}>
            <p style={{ fontSize: 10.5, color: '#fff', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{text}</p>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', textAlign: 'right' }}>20:30 ✓✓</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── PIX SECTION ── */
function PixSection({ data, userEmail, onRefresh }) {
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
      if (res.ok) { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2000); onRefresh?.() }
    } finally { setSaving(false) }
  }

  const hasPix = !!data?.pix_key

  return (
    <div>
      <SectionEyebrow>Onde você recebe</SectionEyebrow>
      <SectionTitle size={56}>Sua chave PIX.</SectionTitle>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 0 40px', lineHeight: 1.55 }}>
        {hasPix ? 'Tudo pronto. Comissões cairão direto na chave abaixo.' : 'Cadastre uma chave pra que suas comissões possam ser enviadas.'}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5, ease }}
        className="aff-grid-2"
        style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
        }}>

        {/* Form */}
        <div style={{
          padding: 32, borderRadius: 18,
          background: 'linear-gradient(180deg, #0a0a0a, #050505)',
          border: '1px solid ' + (hasPix ? 'rgba(16,185,129,0.22)' : 'rgba(229,57,53,0.25)'),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>Chave atual</p>
            <span style={{
              fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 800, padding: '5px 10px', borderRadius: 6,
              background: hasPix ? 'rgba(16,185,129,0.12)' : 'rgba(229,57,53,0.12)',
              color: hasPix ? '#10B981' : '#e53935',
              border: '1px solid ' + (hasPix ? 'rgba(16,185,129,0.3)' : 'rgba(229,57,53,0.3)'),
              letterSpacing: '0.12em',
            }}>{hasPix ? '● CADASTRADA' : '⚠ PENDENTE'}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <select value={pixType} onChange={e => setPixType(e.target.value)}
              style={{ padding: '14px 14px', borderRadius: 11, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Aleatória</option>
            </select>
            <input value={pixKey} onChange={e => setPixKey(e.target.value)}
              placeholder={pixType === 'cpf' ? '000.000.000-00' : pixType === 'email' ? 'voce@email.com' : pixType === 'phone' ? '+55 31 99999-9999' : 'chave aleatória'}
              style={{ flex: 1, padding: '14px 14px', borderRadius: 11, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'var(--mono, monospace)', outline: 'none' }} />
          </div>

          <button onClick={save} disabled={saving || !pixKey.trim()}
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 11, border: 'none',
              cursor: saving || !pixKey.trim() ? 'not-allowed' : 'pointer',
              background: savedFlash ? 'rgba(16,185,129,0.18)' : (saving || !pixKey.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg, #ef4444, #c62828)',
              color: savedFlash ? '#10B981' : (saving || !pixKey.trim()) ? 'rgba(255,255,255,0.35)' : '#fff',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: (savedFlash || saving || !pixKey.trim()) ? 'none' : '0 4px 16px rgba(229,57,53,0.3)',
            }}>
            {savedFlash ? '✓ Chave salva' : saving ? 'Salvando...' : 'Salvar chave PIX'}
          </button>
        </div>

        {/* Info card */}
        <div style={{
          padding: 28, borderRadius: 18,
          background: 'linear-gradient(180deg, #0a0a0a, #050505)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h4 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, fontWeight: 400, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.015em' }}>Como funciona</h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Comissão aparece em "A receber"',
              'Pagamento manual via PIX em até 24 horas',
              'Você recebe push aqui quando for pago',
              'Chave pode ser alterada a qualquer momento',
            ].map((t, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="3" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  )
}

/* ── REFERRALS + TOP ── */
function ReferralsAndTop({ referrals }) {
  if (referrals.length === 0) {
    return (
      <div>
        <SectionEyebrow>Seus indicados</SectionEyebrow>
        <SectionTitle size={56}>Esperando o primeiro.</SectionTitle>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 540, margin: '0 0 28px', lineHeight: 1.55 }}>
          Compartilhe seu link com 3 pessoas hoje. Sério: literalmente 3 mensagens no WhatsApp.
        </p>
      </div>
    )
  }

  const withComm = referrals.filter(r => r.commission > 0).sort((a, b) => b.commission - a.commission).slice(0, 5)

  return (
    <div>
      <SectionEyebrow>Seus indicados</SectionEyebrow>
      <SectionTitle size={56}>Quem entrou pelo seu link.</SectionTitle>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5, ease }}
        style={{
          borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)',
          border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 28,
        }}>
        <AnimatePresence initial={false}>
          {referrals.map((r, i) => (
            <motion.div key={r.tenant_id} layout
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderBottom: i < referrals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(145deg, rgba(229,57,53,0.2), rgba(229,57,53,0.04))', border: '1px solid rgba(229,57,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{(r.tenant_name || '?')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.tenant_name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {r.email && <span>{r.email}</span>}
                  <StatusBadge status={r.subscription_status} />
                  {r.payments_count > 0 && <span style={{ color: 'rgba(255,255,255,0.55)' }}>· {r.payments_count} pagto(s)</span>}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 18, fontWeight: 800, color: '#D1FAE5', margin: 0, letterSpacing: '-0.015em' }}>+R$ {fmt(r.commission)}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>de R$ {fmt(r.generated)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {withComm.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>🏆 Seu top 5</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {withComm.map((r, i) => (
              <div key={r.tenant_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 11, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 16, fontWeight: 800, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.35)', minWidth: 32 }}>#{i + 1}</span>
                <p style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#fff', margin: 0 }}>{r.tenant_name}</p>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 14, fontWeight: 800, color: '#D1FAE5', margin: 0 }}>R$ {fmt(r.commission)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

/* ── FAQ IMERSIVO ── */
function FAQImersive({ rate }) {
  const [open, setOpen] = useState(0)
  const items = [
    { q: 'Como recebo minha comissão?', a: `Quando algum indicado seu paga, automaticamente gera ${Math.round(rate * 100)}% de comissão pra você. Pra solicitar o pagamento, chama o @nexcpa no Instagram ou WhatsApp (32) 99834-8889 com seu código de afiliado.` },
    { q: 'Pra que serve o código de afiliado?', a: 'É a sua chave de identificação. Sem ele, ninguém consegue resgatar suas comissões — nem alguém se passando por você. É a forma da gente confirmar que é VOCÊ quem está pedindo.' },
    { q: 'E se eu perder meu código?', a: 'Você consegue ver ele aqui mesmo no painel, é só clicar em "Revelar". Recomenda salvar num gerenciador de senhas.' },
    { q: 'Quanto custa pra começar?', a: 'Nada. Programa é grátis pra todo cliente PRO. Seu link e código já estão prontos pra usar.' },
    { q: 'Tenho limite de indicações?', a: 'Não. Indique quantas pessoas quiser. Cada indicado pagante gera comissão pra você.' },
    { q: 'Tem valor mínimo pra solicitar?', a: 'Sem mínimo oficial. Mas recomenda acumular pelo menos R$ 50 antes de pedir pra valer o esforço de fazer o pagamento.' },
    { q: 'E se o cliente cancelar depois?', a: 'A comissão que você já recebeu fica com você. Não tem clawback (devolução).' },
    { q: 'Posso indicar meus próprios operadores?', a: 'Não. Cada tenant pode ter só um afiliado, e auto-indicação é bloqueada automaticamente.' },
    { q: 'Quanto tempo demora pra cair?', a: 'Após o contato e confirmação dos dados, o pagamento sai em até 24 horas. Geralmente em poucas horas.' },
    { q: 'Como vou receber? PIX, banco?', a: 'Você decide na hora do contato. PIX é o mais rápido (mesmo dia), mas a gente também faz transferência bancária ou outras formas.' },
  ]

  return (
    <div>
      <SectionEyebrow>Tirando dúvidas</SectionEyebrow>
      <SectionTitle size={56}>Perguntas frequentes.</SectionTitle>

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5, ease }}
        style={{ marginTop: 32, borderRadius: 18, background: 'linear-gradient(180deg, #0a0a0a, #050505)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <button type="button" onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ width: '100%', padding: '22px 26px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', paddingRight: 16 }}>{item.q}</span>
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.22, ease }} style={{ flexShrink: 0 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease }}
                    style={{ overflow: 'hidden' }}>
                    <p style={{ padding: '0 26px 22px', fontSize: 14, color: 'rgba(255,255,255,0.62)', margin: 0, lineHeight: 1.65 }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ── FINAL CTA ── */
function FinalCTA({ link, rate }) {
  const [copied, setCopied] = useState(false)
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '100px 28px 120px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      textAlign: 'center',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '70vw', maxWidth: 900, maxHeight: 900,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,57,53,0.15), transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10.5, color: '#e53935', letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 24px' }}>
          Pronto pra começar?
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif, serif)', fontSize: 72, fontWeight: 400,
          color: '#fff', margin: '0 0 24px', letterSpacing: '-0.035em', lineHeight: 0.95,
        }}>
          {Math.round(rate * 100)}% de comissão.<br/>
          <span style={{ background: 'linear-gradient(90deg, #fff, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic' }}>Sua, sem trabalho.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 36px', lineHeight: 1.55 }}>
          Pega seu link, manda no grupo, espera o pagamento entrar.
        </p>
        <motion.button onClick={copyLink} whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(229,57,53,0.6)' }} whileTap={{ scale: 0.97 }}
          style={{
            padding: '18px 36px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(180deg, #ef4444, #c62828)',
            color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            boxShadow: '0 12px 40px rgba(229,57,53,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}>
          {copied ? (<><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Link copiado · agora cola onde quiser</>)
            : (<><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar meu link agora</>)}
        </motion.button>
      </motion.div>
    </section>
  )
}
