'use client'
import { motion } from 'framer-motion'

// Gráfico de área do card de lucro — estilo Stripe. SVG puro, curva suave,
// gradiente de baixa opacidade, animação de entrada. Só visual (preview).
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

export default function LucroAreaChart({ data, color = '#D1FAE5', height = 130 }) {
  const series = (data && data.length >= 2) ? data : [3, 5, 4, 7, 6, 9, 8, 12, 11, 15]
  const w = 600, h = height, padY = 10
  const min = Math.min(...series), max = Math.max(...series)
  const span = (max - min) || 1
  const stepX = w / (series.length - 1)
  const pts = series.map((v, i) => [i * stepX, padY + (h - padY * 2) * (1 - (v - min) / span)])
  const line = smoothPath(pts)
  const area = `${line} L ${w} ${h} L 0 ${h} Z`

  return (
    <div style={{ width: '100%', height, overflow: 'hidden' }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="lucroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="55%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area} fill="url(#lucroFill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
        />
        <motion.path
          d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{ duration: 1.1, ease: [0.33, 1, 0.68, 1] }}
        />
      </svg>
    </div>
  )
}
