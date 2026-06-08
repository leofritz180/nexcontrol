'use client'
// Gráfico de área em SVG puro — sem dependência externa.

function buildLine(data, w, h, pad = 8) {
  const min = Math.min(...data), max = Math.max(...data)
  const span = max - min || 1
  const stepX = (w - pad * 2) / (data.length - 1)
  const pts = data.map((v, i) => [pad + i * stepX, pad + (h - pad * 2) * (1 - (v - min) / span)])
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`
  return { line, area, pts }
}

export function AreaChart({ data, color = '#FF3131', h = 180 }) {
  const w = 1000
  const { line, area, pts } = buildLine(data, w, h, 8)
  const last = pts[pts.length - 1]
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cpaArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="60%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="cpaGlow" x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.33, 0.66].map((p, i) => (
        <line key={i} x1="0" y1={h * p} x2={w} y2={h * p} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#cpaArea)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#cpaGlow)" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="6" />
    </svg>
  )
}
