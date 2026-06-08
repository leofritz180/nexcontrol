'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * RedesignFunnel — funil premium da operação (vermelho sangue).
 * Cada nível é um trapézio ARREDONDADO com extrusão 3D (espessura),
 * gradiente glossy e brilho superior — desenhado em SVG. Texto em HTML
 * sobreposto (fonte mono + count-up). Só usado no redesign (gated).
 *
 * props.items: [{ label, value, prefix?, suffix?, currency? }]
 */

const ease = [0.33, 1, 0.68, 1]

// geometria (unidades do viewBox)
const VBW = 320
const CX = VBW / 2
const UW = 300            // largura útil (deixa margem p/ o stroke arredondar)
const SEG_H = 54
const GAP = 13
const DEPTH = 10
const PAD_T = 6
const STROKE = 13         // espessura do stroke = raio dos cantos arredondados

// largura (fração de UW) topo/base de cada nível → funil que estreita
const FRACS = [
  { t: 1.00, b: 0.90 },
  { t: 0.88, b: 0.78 },
  { t: 0.76, b: 0.66 },
  { t: 0.63, b: 0.53 },
  { t: 0.50, b: 0.41 },
]

// gradiente glossy por nível (mais profundo conforme desce) [claro, base]
const GRADS = [
  ['#ff5252', '#e60000', '#b00000'],
  ['#f53b3b', '#d60000', '#a00000'],
  ['#e82a2a', '#c40000', '#900000'],
  ['#d61c1c', '#ad0000', '#7e0000'],
  ['#c41212', '#990000', '#6c0000'],
]
const SIDE = ['#7a0000', '#700000', '#660000', '#5c0000', '#520000'] // espessura 3D

function fmtCurrency(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(v) { return Number(v || 0).toLocaleString('pt-BR') }

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

// trapézio (pontos) centrado em CX
function trap(topW, botW, yTop, h) {
  const yBot = yTop + h
  return `${CX - topW / 2},${yTop} ${CX + topW / 2},${yTop} ${CX + botW / 2},${yBot} ${CX - botW / 2},${yBot}`
}

export default function RedesignFunnel({ items = [] }) {
  const data = items.slice(0, 5)
  const N = data.length
  const VBH = PAD_T + N * SEG_H + (N - 1) * GAP + DEPTH + 4

  const segs = data.map((it, i) => {
    const f = FRACS[i] || FRACS[FRACS.length - 1]
    const topW = UW * f.t
    const botW = UW * f.b
    const yTop = PAD_T + i * (SEG_H + GAP)
    const centerPct = ((yTop + SEG_H / 2) / VBH) * 100
    return { it, i, topW, botW, yTop, centerPct }
  })

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
      {/* glow ambiente */}
      <div style={{ position: 'absolute', top: -70, right: -50, width: 240, height: 240, background: 'radial-gradient(circle, rgba(230,0,0,0.18), transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, #e10000, #a80000)', boxShadow: '0 4px 14px rgba(209,0,0,0.4)' }}>
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              {GRADS.map((g, i) => (
                <linearGradient key={i} id={`fnl-g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={g[0]} />
                  <stop offset="48%" stopColor={g[1]} />
                  <stop offset="100%" stopColor={g[2]} />
                </linearGradient>
              ))}
              <linearGradient id="fnl-gloss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.38)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {segs.map(({ i, topW, botW, yTop }) => {
              const facePts = trap(topW, botW, yTop, SEG_H)
              const basePts = trap(topW, botW, yTop + DEPTH, SEG_H)
              const glossPts = trap(topW, (topW + botW) / 2, yTop, SEG_H * 0.5)
              return (
                <motion.g key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.07 * i, ease }}>
                  {/* espessura 3D (base extrudada) */}
                  <polygon points={basePts} fill={SIDE[i]}
                    stroke={SIDE[i]} strokeWidth={STROKE} strokeLinejoin="round" paintOrder="stroke" />
                  {/* face glossy */}
                  <polygon points={facePts} fill={`url(#fnl-g${i})`}
                    stroke={`url(#fnl-g${i})`} strokeWidth={STROKE} strokeLinejoin="round" paintOrder="stroke" />
                  {/* brilho superior */}
                  <polygon points={glossPts} fill="url(#fnl-gloss)"
                    stroke="url(#fnl-gloss)" strokeWidth={STROKE * 0.7} strokeLinejoin="round" paintOrder="stroke" />
                </motion.g>
              )
            })}
          </svg>

          {/* Texto sobreposto */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {segs.map(({ it, i, centerPct }) => (
              <div key={i} style={{
                position: 'absolute', left: 0, right: 0, top: `${centerPct}%`,
                transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textShadow: '0 1px 4px rgba(0,0,0,0.45)',
              }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 2, whiteSpace: 'nowrap' }}>{it.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff', fontSize: i === 0 ? 21 : i === 1 ? 19 : i === 2 ? 18 : 16, lineHeight: 1, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  {it.prefix || ''}<CountUp value={it.value} currency={it.currency} />{it.suffix || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
