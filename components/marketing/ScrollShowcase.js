'use client'
// ─────────────────────────────────────────────────────────────────────────
// ScrollShowcase — demonstracao 3D: um frame com a interface real fica sticky
// e "deita/levanta" conforme o scroll (rotateX 15 -> 0 -> -2), com leve zoom e
// glow vermelho por tras. So transform/opacity. No mobile e com reduced-motion
// vira um frame estatico (sem tilt, sem sticky longo).
// ─────────────────────────────────────────────────────────────────────────
import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion'
import DashboardMock from './DashboardMock'

export default function ScrollShowcase() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const spring = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 })

  const rotateX = useTransform(spring, [0, 0.42, 0.75, 1], [15, 0, 0, -2])
  const scale = useTransform(spring, [0, 0.42, 1], [0.92, 1, 1])
  const glow = useTransform(spring, [0, 0.42, 0.75, 1], [0.15, 0.4, 0.4, 0.2])

  return (
    <section ref={ref} id="demonstracao" style={{ position: 'relative', padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b6b', margin: '0 0 10px' }}>A plataforma por dentro</p>
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: 0, lineHeight: 1.12 }}>
          Não é planilha. É a sua operação viva.
        </h2>
      </div>

      <div className="ss-sticky" style={{ position: 'sticky', top: 90, perspective: 1200 }}>
        <motion.div
          className="ss-frame"
          style={reduce ? {} : { rotateX, scale, transformStyle: 'preserve-3d' }}
        >
          {/* glow vermelho por tras */}
          {!reduce && (
            <motion.div aria-hidden style={{
              position: 'absolute', inset: '-8% -4%', borderRadius: 40, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at 50% 40%, rgba(229,57,53,0.35), transparent 65%)',
              filter: 'blur(50px)', opacity: glow, zIndex: -1,
            }} />
          )}
          <div style={{
            borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.65)', background: '#0a0a0b', padding: 16,
          }}>
            <DashboardMock variant="dashboard" />
          </div>
        </motion.div>
      </div>

      {/* espaco pro scroll acontecer no desktop */}
      <div className="ss-spacer" style={{ height: 340 }} />

      <style>{`
        @media (max-width: 760px) {
          .ss-sticky { position: relative !important; top: 0 !important; perspective: none !important; }
          .ss-spacer { height: 0 !important; }
        }
      `}</style>
    </section>
  )
}
