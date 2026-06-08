'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * RedesignFunnel — funil premium da operação (vermelho sangue).
 * Cada segmento é um trapézio (clip-path) que estreita de cima pra baixo,
 * com gradiente glossy e contagem animada. Só usado no redesign (gated).
 *
 * props.items: [{ label, value, prefix?, suffix?, currency? }]
 *   value numérico; currency=true formata como R$ pt-BR.
 */

const ease = [0.33, 1, 0.68, 1]

// inset (%) de cada lado no topo/base de cada segmento → forma o funil contínuo
const SHAPE = [
  { top: 0,  bot: 6 },
  { top: 6,  bot: 13 },
  { top: 13, bot: 21 },
  { top: 21, bot: 30 },
  { top: 30, bot: 40 },
]

// gradiente fica mais profundo conforme desce (sensação de profundidade)
const FILLS = [
  'linear-gradient(180deg, #ff3b3b 0%, #e10000 52%, #c40000 100%)',
  'linear-gradient(180deg, #f12626 0%, #d10000 52%, #b00000 100%)',
  'linear-gradient(180deg, #e21414 0%, #bd0000 52%, #9c0000 100%)',
  'linear-gradient(180deg, #cf0d0d 0%, #a80000 52%, #890000 100%)',
  'linear-gradient(180deg, #ba0808 0%, #930000 52%, #760000 100%)',
]

function fmtCurrency(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(v) {
  return Number(v || 0).toLocaleString('pt-BR')
}

function CountUp({ value, currency, duration = 1.4 }) {
  const [d, setD] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  useEffect(() => {
    if (!inView) return
    const to = Number(value) || 0
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setD(to * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  return <span ref={ref}>{currency ? fmtCurrency(d) : fmtInt(Math.round(d))}</span>
}

export default function RedesignFunnel({ items = [] }) {
  const data = items.slice(0, 5)
  return (
    <div style={{
      position: 'relative', height: '100%',
      padding: '24px 22px 26px',
      background: 'var(--surface)',
      border: '1px solid var(--b1)',
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* glow ambiente vermelho */}
      <div style={{
        position: 'absolute', top: -60, right: -40, width: 220, height: 220,
        background: 'radial-gradient(circle, rgba(209,0,0,0.16), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(145deg, #e10000, #a80000)',
          boxShadow: '0 4px 14px rgba(209,0,0,0.4)',
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em' }}>Funil da Operação</p>
          <p style={{ fontSize: 10.5, color: 'var(--t3)', margin: '1px 0 0', letterSpacing: '0.02em' }}>Visão consolidada do sistema</p>
        </div>
      </div>

      {/* Funil */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center', position: 'relative' }}>
        {data.map((it, i) => {
          const s = SHAPE[i] || SHAPE[SHAPE.length - 1]
          const fill = FILLS[i] || FILLS[FILLS.length - 1]
          const clip = `polygon(${s.top}% 0, ${100 - s.top}% 0, ${100 - s.bot}% 100%, ${s.bot}% 100%)`
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.06 * i, ease }}
              style={{ position: 'relative', height: 60 }}
            >
              {/* corpo trapézio */}
              <div style={{
                position: 'absolute', inset: 0,
                clipPath: clip, WebkitClipPath: clip,
                background: fill,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -10px 18px rgba(0,0,0,0.22)',
              }} />
              {/* brilho superior */}
              <div style={{
                position: 'absolute', left: 0, right: 0, top: 0, height: '46%',
                clipPath: clip, WebkitClipPath: clip,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
                pointerEvents: 'none',
              }} />
              {/* conteúdo */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '0 12%',
                textShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}>
                <span style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.82)', marginBottom: 2, whiteSpace: 'nowrap',
                }}>{it.label}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff',
                  fontSize: i === 0 ? 22 : i === 1 ? 20 : 18, lineHeight: 1,
                  letterSpacing: '-0.02em', whiteSpace: 'nowrap',
                }}>
                  {it.prefix || ''}<CountUp value={it.value} currency={it.currency} />{it.suffix || ''}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
