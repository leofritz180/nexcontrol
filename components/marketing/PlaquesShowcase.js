'use client'
// ─────────────────────────────────────────────────────────────────────────
// PlaquesShowcase — as ARTES REAIS das placas de faturamento (public/premiacoes/
// <id>.png, 1122x1402). Desktop: duas fileiras em marquee, direções opostas,
// leve tilt, hover sobe + ilumina (vermelho, nunca dourado). Mobile: carrossel
// scroll-snap. Dados reais de lib/premiacoes (7 marcos, todos available).
// Sem promessa de envio/entrega automática — apenas reconhecimento.
// ─────────────────────────────────────────────────────────────────────────
import Image from 'next/image'
import { PREMIACOES, previewPath } from '../../lib/premiacoes'

function Plaque({ p, w }) {
  return (
    <div className="nx-plaque" style={{ position: 'relative', width: w, flexShrink: 0, scrollSnapAlign: 'center' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1122 / 1402', borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg, #121216, #08080a)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 22px 50px rgba(0,0,0,0.55)' }}>
        <Image
          src={previewPath(p)}
          alt={`Placa de faturamento ${p.label} — nível ${p.tier}`}
          fill sizes="(max-width: 760px) 70vw, 220px"
          style={{ objectFit: 'contain', padding: 12 }}
        />
        {/* reflexo vermelho sutil */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 120%, rgba(225,29,29,0.16), transparent 60%)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px 0' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>{p.label}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{p.tier}</span>
      </div>
    </div>
  )
}

function MarqueeRow({ dir, w }) {
  const items = [...PREMIACOES, ...PREMIACOES]
  return (
    <div className="nx-plaque-row" style={{ display: 'flex', gap: 22, width: 'max-content', animation: `${dir === 'left' ? 'nxPlaqL' : 'nxPlaqR'} 46s linear infinite` }}>
      {items.map((p, i) => <Plaque key={`${p.id}-${i}`} p={p} w={w} />)}
    </div>
  )
}

export default function PlaquesShowcase() {
  return (
    <section id="premiacoes" style={{ padding: '64px 0 68px', position: 'relative', overflow: 'hidden', scrollMarginTop: 100 }}>
      <div aria-hidden style={{ position: 'absolute', inset: '10% 0', background: 'radial-gradient(ellipse at 50% 50%, rgba(225,29,29,0.1), transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 24px', position: 'relative' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 12px' }}>Premiações</p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 12px', lineHeight: 1.1 }}>Resultados que merecem reconhecimento.</h2>
        <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.55)', margin: '0 auto', maxWidth: 540, lineHeight: 1.6 }}>Cada marco da operação vira parte da história de quem está construindo algo maior.</p>
      </div>

      {/* Desktop: duas fileiras marquee opostas */}
      <div className="nx-plaques-desktop" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 26, maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}>
        <div style={{ transform: 'rotate(-1deg)' }}><MarqueeRow dir="left" w={210} /></div>
        <div style={{ transform: 'rotate(1deg)' }}><MarqueeRow dir="right" w={210} /></div>
      </div>

      {/* Mobile: carrossel scroll-snap */}
      <div className="nx-plaques-mobile" style={{ display: 'none', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 24px 8px', WebkitOverflowScrolling: 'touch' }}>
        {PREMIACOES.map(p => <Plaque key={p.id} p={p} w="70vw" />)}
      </div>

      <style>{`
        @keyframes nxPlaqL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes nxPlaqR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .nx-plaque { transition: transform 0.3s ease; }
        .nx-plaque:hover { transform: translateY(-8px); }
        .nx-plaque:hover > div:first-child { box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 0 44px rgba(225,29,29,0.28); border-color: rgba(225,29,29,0.4); }
        .nx-plaque-row:hover { animation-play-state: paused; }
        @media (max-width: 760px) {
          .nx-plaques-desktop { display: none !important; }
          .nx-plaques-mobile { display: flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-plaque-row { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
