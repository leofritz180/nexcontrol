'use client'
import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/* Curva suave (Catmull-Rom -> Bezier) */
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d
}

/* ══════════════════════════════════════════
   AreaChart — linha branca, area em fade,
   crosshair + tooltip no hover (estilo Resend)
   ══════════════════════════════════════════ */
export function AreaChart({ values, labels, height = 240, format = (v) => v }) {
  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 1000, H = height, PAD = { t: 18, r: 0, b: 26, l: 0 }

  const geo = useMemo(() => {
    const min = Math.min(...values, 0)
    const max = Math.max(...values, 1)
    const span = (max - min) || 1
    const innerH = H - PAD.t - PAD.b
    const stepX = values.length > 1 ? W / (values.length - 1) : W
    const pts = values.map((v, i) => [i * stepX, PAD.t + innerH * (1 - (v - min) / span)])
    const zeroY = PAD.t + innerH * (1 - (0 - min) / span)
    return { pts, min, max, zeroY, stepX, innerH }
  }, [values, H])

  const line = smoothPath(geo.pts)
  const area = `${line} L ${W} ${H - PAD.b} L 0 ${H - PAD.b} Z`

  function onMove(e) {
    const box = wrapRef.current?.getBoundingClientRect()
    if (!box) return
    const rel = (e.clientX - box.left) / box.width
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(rel * (values.length - 1))))
    setHover({ idx, x: rel * box.width })
  }

  const hp = hover ? geo.pts[hover.idx] : null

  return (
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
      style={{ position: 'relative', width: '100%', height: H, cursor: 'crosshair' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="v2Fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.035" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1="0" x2={W}
            y1={PAD.t + geo.innerH * p} y2={PAD.t + geo.innerH * p}
            stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
        ))}

        {/* linha do zero */}
        {geo.min < 0 && (
          <line x1="0" x2={W} y1={geo.zeroY} y2={geo.zeroY}
            stroke="rgba(239,68,68,0.28)" strokeWidth="1" strokeDasharray="3 4" />
        )}

        <motion.path d={area} fill="url(#v2Fill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.15 }} />

        <motion.path d={line} fill="none" stroke="rgba(255,255,255,0.92)"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.33, 1, 0.68, 1] }} />

        {hp && (
          <>
            <line x1={hp[0]} x2={hp[0]} y1={PAD.t} y2={H - PAD.b}
              stroke="rgba(255,255,255,0.22)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={hp[0]} cy={hp[1]} r="3.5" fill="#000" stroke="#fff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {/* eixo X — primeiro / meio / ultimo */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between' }}>
        {[labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]].map((l, i) => (
          <span key={i} style={{ fontSize: 10.5, color: 'var(--t4)', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>{l}</span>
        ))}
      </div>

      {/* tooltip */}
      {hover && (
        <div style={{
          position: 'absolute', top: 4, pointerEvents: 'none',
          left: Math.min(Math.max(hover.x - 60, 0), (wrapRef.current?.offsetWidth || 600) - 132),
          width: 132, background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '8px 10px', boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
        }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{labels[hover.idx]}</p>
          <p style={{
            margin: '3px 0 0', fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 700,
            color: values[hover.idx] >= 0 ? 'var(--profit)' : 'var(--loss)',
          }}>{format(values[hover.idx])}</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Sparkline minima (KPI cells / operadores)
   ══════════════════════════════════════════ */
export function Sparkline({ values, width = 68, height = 22, color = 'rgba(255,255,255,0.5)' }) {
  const min = Math.min(...values), max = Math.max(...values)
  const span = (max - min) || 1
  const step = values.length > 1 ? width / (values.length - 1) : width
  const pts = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 3) - 1.5])
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="1.8" fill={color} />
    </svg>
  )
}

/* ══════════════════════════════════════════
   Barra horizontal (redes / custos)
   ══════════════════════════════════════════ */
export function Bar({ value, tone = 'neutral', delay = 0 }) {
  const bg = tone === 'profit' ? 'var(--profit)' : tone === 'loss' ? 'var(--loss)' : 'rgba(255,255,255,0.42)'
  return (
    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, delay, ease: [0.33, 1, 0.68, 1] }}
        style={{ height: '100%', background: bg, borderRadius: 99 }} />
    </div>
  )
}
