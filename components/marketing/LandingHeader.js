'use client'
// ─────────────────────────────────────────────────────────────────────────
// LandingHeader — barra de aviso fina + header em cápsula. Começa integrado ao
// hero (transparente) e vira uma cápsula escura sólida após a rolagem. Âncoras
// internas + Entrar/Testar grátis. Drawer mobile enxuto. SOMENTE na landing.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV = [
  { href: '#produto', label: 'Produto' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#premiacoes', label: 'Premiações' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
]

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = (href) => {
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* barra de aviso fina */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 101,
        paddingTop: 'env(safe-area-inset-top)',
        background: 'linear-gradient(90deg, #7a0e0c, #b01611 50%, #7a0e0c)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 34, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ opacity: 0.95 }}>Ativação imediata via PIX</span>
            <span className="ab-hide" style={{ opacity: 0.5, margin: '0 8px' }}>•</span>
            <span className="ab-hide" style={{ opacity: 0.95 }}>Sem fidelidade — cancele quando quiser</span>
          </p>
          <a href="#planos" onClick={(e) => { e.preventDefault(); go('#planos') }} className="ab-cta"
            style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', textDecoration: 'none', padding: '3px 11px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
            Começar agora
          </a>
        </div>
      </div>

      {/* header em cápsula */}
      <div style={{ position: 'fixed', top: 'calc(34px + env(safe-area-inset-top))', left: 0, right: 0, zIndex: 100, padding: scrolled ? '10px 14px 0' : '16px 14px 0', transition: 'padding 0.35s ease' }}>
        <header style={{
          maxWidth: 1140, margin: '0 auto', borderRadius: 16,
          background: scrolled ? 'rgba(10,10,12,0.82)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px) saturate(1.3)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(1.3)' : 'none',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
          boxShadow: scrolled ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
          transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        }}>
          <div className="lh-inner" style={{ height: 58, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" aria-label="NexControl" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <img src="/icons/nexcontrol-icon-clean.png" alt="" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }} />
              <span style={{ fontSize: 16.5, fontWeight: 900, letterSpacing: '-0.03em' }}>
                <span style={{ color: '#F5F5F5' }}>Nex</span><span style={{ color: '#e11d1d' }}>Control</span>
              </span>
            </Link>

            <nav className="lh-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {NAV.map(({ href, label }) => (
                <a key={href} href={href} onClick={(e) => { e.preventDefault(); go(href) }}
                  style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(245,245,245,0.62)', padding: '8px 13px', borderRadius: 8, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245,245,245,0.62)'}>
                  {label}
                </a>
              ))}
            </nav>

            <div className="lh-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/login" style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(245,245,245,0.78)', textDecoration: 'none', padding: '8px 6px' }}>Entrar</Link>
              <Link href="/signup" className="btn btn-brand" style={{ fontSize: 13.5, fontWeight: 800, padding: '9px 18px', borderRadius: 10 }}>Assinar agora</Link>
            </div>

            <button type="button" aria-label="Abrir menu" aria-expanded={open} className="lh-burger"
              onClick={() => setOpen(v => !v)}
              style={{ display: 'none', background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
              <div style={{ width: 22, height: 15, position: 'relative' }}>
                {[0, 6.5, 13].map((t, i) => (
                  <span key={i} style={{
                    position: 'absolute', left: 0, top: open ? 6.5 : t, width: 22, height: 2, borderRadius: 2, background: '#fff',
                    transform: open ? (i === 0 ? 'rotate(45deg)' : i === 2 ? 'rotate(-45deg)' : 'scaleX(0)') : 'none',
                    opacity: open && i === 1 ? 0 : 1,
                    transition: 'transform 0.3s ease, top 0.3s ease, opacity 0.2s ease',
                  }} />
                ))}
              </div>
            </button>
          </div>
        </header>
      </div>

      {/* drawer mobile */}
      <div className="lh-drawer" style={{
        position: 'fixed', inset: 0, zIndex: 99, display: 'none',
        pointerEvents: open ? 'auto' : 'none',
        background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        opacity: open ? 1 : 0, transition: 'opacity 0.3s ease',
        paddingTop: 'calc(100px + env(safe-area-inset-top))', flexDirection: 'column',
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '18px 24px', gap: 2 }}>
          {NAV.map(({ href, label }) => (
            <a key={href} href={href} onClick={(e) => { e.preventDefault(); go(href) }}
              style={{ fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {label}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
            <Link href="/signup" onClick={() => setOpen(false)} className="btn btn-brand btn-lg" style={{ justifyContent: 'center', fontSize: 15.5, fontWeight: 800 }}>Assinar agora</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost btn-lg" style={{ justifyContent: 'center', fontSize: 14 }}>Já tenho conta</Link>
          </div>
        </nav>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .lh-nav { display: none !important; }
          .lh-cta { display: none !important; }
          .lh-burger { display: block !important; }
          .lh-drawer { display: flex !important; }
        }
        @media (max-width: 480px) {
          .ab-hide { display: none !important; }
        }
      `}</style>
    </>
  )
}
