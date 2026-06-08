'use client'
import { motion } from 'framer-motion'

// Gráfico de lucro — vermelho NexControl, premium e criativo (preview).
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

export default function LucroAreaChart({ data, color = '#FF3131', height = 140 }) {
  const series = (data && data.length >= 2) ? data : [3, 5, 4, 7, 6, 9, 8, 12, 11, 15]
  const w = 600, h = height, padY = 14, padX = 6
  const min = Math.min(...series), max = Math.max(...series)
  const span = (max - min) || 1
  const stepX = (w - padX * 2) / (series.length - 1)
  const pts = series.map((v, i) => [padX + i * stepX, padY + (h - padY * 2) * (1 - (v - min) / span)])
  const line = smoothPath(pts)
  const area = `${line} L ${w - padX} ${h} L ${padX} ${h} Z`
  const last = pts[pts.length - 1]
  const peakIdx = series.indexOf(max)
  const peak = pts[peakIdx]

  return (
    <div style={{ width: '100%', height }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="lucroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="45%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lucroStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff7a7a" />
            <stop offset="55%" stopColor={color} />
            <stop offset="100%" stopColor="#ff4d4d" />
          </linearGradient>
          <filter id="lucroGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* grid horizontal sutil */}
        {[0.5].map((p, i) => (
          <line key={i} x1="0" y1={h * p} x2={w} y2={h * p} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 5" />
        ))}

        {/* guia vertical no pico */}
        <motion.line x1={peak[0]} y1={peak[1]} x2={peak[0]} y2={h} stroke={color} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.4 }} />

        {/* área preenchida */}
        <motion.path d={area} fill="url(#lucroFill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }} />

        {/* linha com brilho + gradiente */}
        <motion.path d={line} fill="none" stroke="url(#lucroStroke)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#lucroGlow)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }} />

        {/* pontos aparecendo em sequência */}
        {pts.map((p, i) => (
          <motion.circle key={i} cx={p[0]} cy={p[1]} r={i === peakIdx ? 3.4 : 2.2} fill={i === peakIdx ? '#fff' : color}
            stroke={i === peakIdx ? color : 'none'} strokeWidth={i === peakIdx ? 2 : 0}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.05, duration: 0.3, ease: 'backOut' }} />
        ))}

        {/* ponto final pulsante */}
        <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
        <motion.circle cx={last[0]} cy={last[1]} r="3.5" fill="none" stroke={color} strokeWidth="2"
          animate={{ r: [3.5, 11], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />
      </svg>
    </div>
  )
}
