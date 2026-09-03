'use client'
// ─────────────────────────────────────────────────────────────────────────
// HeroStage — composição de MOCKUPS de dispositivos reais (notebook + celular +
// tablet) exibindo as SCREENSHOTS reais da NexControl, com notificações
// flutuantes pingando ao redor. Identidade preto + vermelho (não dourado).
// Micro-parallax pelo cursor (poucos graus, desktop-only), respeita reduced-
// motion e touch. Screenshots servidas como PNG original (unoptimized) pra não
// borrar o texto fino. Notificações = fila determinística de eventos reais.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Image from 'next/image'

const SHOT_DESKTOP = { src: '/landing/dashboard.png', w: 1752, h: 1003 }
const SHOT_MOBILE = { src: '/landing/mobile.png', w: 1320, h: 2868 }

// Eventos compatíveis com funcionalidades REAIS da Nex (sem número enganoso).
const NOTIFS = [
  { t: 'Captura de depósitos', d: '+R$ 95,00 registrado', c: 'var(--profit)' },
  { t: 'Meta concluída', d: 'Equipe Alpha', c: 'var(--profit)' },
  { t: 'Remessa registrada', d: '+R$ 340,00', c: 'var(--profit)' },
  { t: 'Insight de IA', d: 'Performance atualizada', c: '#ff6b6b' },
  { t: 'Novo operador ativo', d: 'entrou na equipe', c: '#ff6b6b' },
  { t: 'Depósito confirmado', d: 'via PIX', c: 'var(--profit)' },
  { t: 'Resultado atualizado', d: 'em tempo real', c: 'var(--profit)' },
  { t: 'Prejuízo acima da média', d: 'OKOK · reveja a alocação', c: 'var(--loss)' },
]

function NotifCard({ n }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 12,
      background: 'rgba(16,16,19,0.94)', border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 12px 34px rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      width: '100%',
    }}>
      <img src="/icons/nexcontrol-icon-clean.png" alt="" width={30} height={30} style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0, display: 'block' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: n.c, boxShadow: `0 0 7px ${n.c}`, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.t}</span>
        </div>
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.d}</p>
      </div>
    </div>
  )
}

// Notificações empilhadas no canto superior direito (uma embaixo da outra),
// entram por cima e empurram as de baixo — estilo toast real. Determinístico.
function FloatingNotifications({ reduce }) {
  const [isMobile, setIsMobile] = useState(false)
  const [items, setItems] = useState([{ k: 0, n: NOTIFS[0] }])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const on = () => setIsMobile(mq.matches)
    on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (reduce) { setItems([{ k: 1, n: NOTIFS[1] }, { k: 0, n: NOTIFS[0] }]); return }
    const max = isMobile ? 2 : 3
    let c = 1
    setItems([{ k: 0, n: NOTIFS[0] }])
    const iv = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      const key = c, n = NOTIFS[c % NOTIFS.length]; c++
      setItems(prev => [{ k: key, n }, ...prev].slice(0, max))
    }, 2600)
    return () => clearInterval(iv)
  }, [reduce, isMobile])

  return (
    <div aria-live="off" aria-hidden className="lp-notifs" style={{ position: 'absolute', top: '-5%', right: '-1%', width: 210, display: 'flex', flexDirection: 'column', gap: 9, zIndex: 20, pointerEvents: 'none' }}>
      <AnimatePresence initial={false}>
        {items.map(it => (
          <motion.div key={it.k} layout
            initial={{ opacity: 0, x: 26, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.28 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <NotifCard n={it.n} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Notebook (chassi + tela) ──
function Laptop() {
  return (
    <div style={{ width: '100%' }}>
      {/* tela */}
      <div style={{ position: 'relative', width: '86%', margin: '0 auto', borderRadius: '14px 14px 5px 5px', background: 'linear-gradient(160deg, #141418, #08080a)', padding: 8, border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', aspectRatio: `${SHOT_DESKTOP.w} / ${SHOT_DESKTOP.h}`, background: '#060607' }}>
          <Image src={SHOT_DESKTOP.src} alt="Painel executivo da NexControl — lucro consolidado, redes e funil da operação" fill priority unoptimized sizes="(max-width: 760px) 92vw, 620px" style={{ objectFit: 'cover' }} />
        </div>
      </div>
      {/* base / teclado */}
      <div style={{ position: 'relative', height: 15, width: '100%', margin: '0 auto', background: 'linear-gradient(180deg, #34343a 0%, #1a1a1e 55%, #101013 100%)', borderRadius: '3px 3px 11px 11px', clipPath: 'polygon(2.5% 0, 97.5% 0, 100% 100%, 0 100%)', boxShadow: '0 24px 34px rgba(0,0,0,0.5)' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 92, height: 5, borderRadius: '0 0 7px 7px', background: '#0a0a0c' }} />
      </div>
    </div>
  )
}

// ── Tablet (chassi landscape) ──
function Tablet() {
  return (
    <div style={{ width: '100%', borderRadius: 16, background: 'linear-gradient(160deg, #141418, #08080a)', padding: 7, border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: `${SHOT_DESKTOP.w} / ${SHOT_DESKTOP.h}`, background: '#060607' }}>
        <Image src={SHOT_DESKTOP.src} alt="" fill unoptimized sizes="240px" style={{ objectFit: 'cover' }} />
      </div>
    </div>
  )
}

// ── Celular (chassi) ──
function Phone() {
  return (
    <div style={{ width: '100%', borderRadius: 26, background: 'linear-gradient(160deg, #1c1c20, #050506)', padding: 5, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 34px 60px rgba(0,0,0,0.62)' }}>
      <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', background: '#060607', aspectRatio: `${SHOT_MOBILE.w} / ${SHOT_MOBILE.h}` }}>
        <Image src={SHOT_MOBILE.src} alt="App da NexControl — feed de remessas e ranking de operadores" fill unoptimized sizes="180px" style={{ objectFit: 'cover' }} />
      </div>
    </div>
  )
}

export default function HeroStage() {
  const reduce = useReducedMotion()
  const stageRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (reduce) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!fine.matches) return
    const el = stageRef.current
    if (!el) return
    let raf = null
    const onMove = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        setTilt({ x: Math.max(-1, Math.min(1, py)) * -2, y: Math.max(-1, Math.min(1, px)) * 2.6 })
      })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => { if (raf) cancelAnimationFrame(raf); el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave) }
  }, [reduce])

  const baseRotX = reduce ? 0 : 6
  const baseRotY = reduce ? 0 : -7

  return (
    <div ref={stageRef} className="lp-stage" style={{ position: 'relative', width: '100%' }}>
      {/* luz radial vermelha por trás */}
      <div aria-hidden style={{ position: 'absolute', inset: '-16% -10%', borderRadius: 60, background: 'radial-gradient(ellipse at 55% 45%, rgba(225,29,29,0.4), transparent 62%)', filter: 'blur(66px)', pointerEvents: 'none' }} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
        style={{ position: 'relative', perspective: 1500 }}
      >
        <div style={{
          transform: `rotateX(${baseRotX + tilt.x}deg) rotateY(${baseRotY + tilt.y}deg)`,
          transformStyle: 'preserve-3d', transition: 'transform 0.25s ease-out',
        }}>
          {/* composição de dispositivos */}
          <div className="lp-devices" style={{ position: 'relative', maxWidth: 580, margin: '0 auto', paddingBottom: '6%' }}>
            {/* tablet atrás, à direita */}
            <div className="lp-dev-tablet" style={{ position: 'absolute', right: '-11%', top: '14%', width: '42%', transform: 'translateZ(-40px) rotate(3deg)', opacity: 0.72, zIndex: 1, filter: 'brightness(0.82)' }}>
              <Tablet />
            </div>
            {/* notebook, centro */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <Laptop />
            </div>
            {/* celular na frente, à esquerda */}
            <div className="lp-dev-phone" style={{ position: 'absolute', left: '-3%', bottom: '-11%', width: '25%', transform: 'translateZ(80px) rotate(-5deg)', zIndex: 4 }}>
              <Phone />
            </div>
          </div>
        </div>
      </motion.div>

      {/* notificações flutuantes — FORA do contexto 3D, sempre por cima dos aparelhos */}
      <FloatingNotifications reduce={reduce} />

      <style>{`
        @media (max-width: 760px) {
          .lp-dev-tablet { display: none !important; }
          .lp-dev-phone { left: -3% !important; width: 30% !important; }
        }
        @media (max-width: 460px) {
          .lp-dev-phone { display: none !important; }
        }
      `}</style>
    </div>
  )
}
