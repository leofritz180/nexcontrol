'use client'
// ─────────────────────────────────────────────────────────────────────────
// MarqueeBands — duas faixas diagonais cruzadas com os recursos do ecossistema
// Nex. Conteúdo duplicado internamente => loop contínuo sem salto (translateX
// 0 -> -50%). Uma inclinada +2deg (vermelha), outra -2deg (grafite). Só transform.
// Termos = nomenclatura real (BETTIFY PROXY com logo, BOT CASH HUNTER, etc.).
// ─────────────────────────────────────────────────────────────────────────

// termo pode ser string OU { t, logo }
const TERMS_A = ['CAPTURA DE DEPÓSITOS', 'NOTIFICAÇÃO NO CELULAR', 'NETWORK', 'INSIGHTS DE IA', 'BOT CASH HUNTER']
const TERMS_B = [{ t: 'BETTIFY PROXY', logo: '/bettify-logo.png' }, 'METAS', 'REMESSAS', 'AULAS VIP', 'PREMIAÇÕES', 'SLOTS PREMIUM']

function Sep({ color }) {
  return <span aria-hidden style={{ display: 'inline-flex', width: 5, height: 5, borderRadius: '50%', background: color, margin: '0 44px', flexShrink: 0 }} />
}

function Term({ item, textStyle }) {
  const label = typeof item === 'string' ? item : item.t
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      {typeof item !== 'string' && item.logo && (
        <img src={item.logo} alt="" width={22} height={22} style={{ width: 22, height: 22, objectFit: 'contain', display: 'block' }} />
      )}
      <span style={{ fontSize: 'clamp(12px, 1.6vw, 15px)', fontWeight: 800, letterSpacing: '0.09em', whiteSpace: 'nowrap', ...textStyle }}>{label}</span>
    </span>
  )
}

function Row({ terms, dir, sepColor, textStyle }) {
  const items = [...terms, ...terms] // duplicado -> loop sem salto
  return (
    <div style={{ display: 'flex', width: 'max-content', animation: `${dir === 'left' ? 'nxMarqueeL' : 'nxMarqueeR'} 34s linear infinite` }}>
      {items.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          <Term item={t} textStyle={textStyle} />
          <Sep color={sepColor} />
        </span>
      ))}
    </div>
  )
}

export default function MarqueeBands() {
  return (
    <section aria-hidden style={{ position: 'relative', padding: '46px 0', overflow: 'hidden' }}>
      {/* faixa 1 — vermelha, +2deg, esquerda */}
      <div className="nx-band" style={{ transform: 'rotate(2deg) scale(1.06)', background: 'linear-gradient(90deg, #b01611, #e11d1d 50%, #b01611)', borderTop: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(0,0,0,0.3)', padding: '13px 0', marginBottom: 14 }}>
        <Row terms={TERMS_A} dir="left" sepColor="rgba(255,255,255,0.55)" textStyle={{ color: '#fff' }} />
      </div>
      {/* faixa 2 — grafite, -2deg, direita */}
      <div className="nx-band" style={{ transform: 'rotate(-2deg) scale(1.06)', background: 'linear-gradient(90deg, #131317, #1c1c22 50%, #131317)', border: '1px solid rgba(225,29,29,0.3)', padding: '13px 0' }}>
        <Row terms={TERMS_B} dir="right" sepColor="#e11d1d" textStyle={{ color: 'rgba(255,255,255,0.92)' }} />
      </div>

      <style>{`
        @keyframes nxMarqueeL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes nxMarqueeR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .nx-band { height: 48px; display: flex; align-items: center; }
        @media (max-width: 760px) {
          .nx-band { height: 34px; padding: 8px 0 !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-band div { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
