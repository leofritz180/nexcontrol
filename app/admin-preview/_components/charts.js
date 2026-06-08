'use client'
// Graficos em SVG puro — sem dependencia externa. Visual premium controlado.

function buildLine(data, w, h, pad = 4) {
  const min = Math.min(...data), max = Math.max(...data)
  const span = max - min || 1
  const stepX = (w - pad * 2) / (data.length - 1)
  const pts = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (h - pad * 2) * (1 - (v - min) / span)
    return [x, y]
  })
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`
  return { line, area, pts }
}

// Mini sparkline com area preenchida
export function Sparkline({ data, color = '#FF3131', w = 120, h = 40 }) {
  const id = 'sg' + color.replace(/[^a-z0-9]/gi, '') + data.length
  const { line, area } = buildLine(data, w, h, 3)
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Mini barras
export function MiniBars({ data, color = '#FF3131', w = 120, h = 40 }) {
  const max = Math.max(...data) || 1
  const gap = 3
  const bw = (w - gap * (data.length - 1)) / data.length
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = Math.max(2, (h - 4) * (v / max))
        return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={Math.min(2, bw / 2)} fill={color} opacity={0.35 + 0.55 * (v / max)} />
      })}
    </svg>
  )
}

// Grafico grande de area (lucro acumulado) com grid e linha de glow
export function AreaChart({ data, color = '#FF3131', h = 240 }) {
  const w = 1000
  const { line, area, pts } = buildLine(data, w, h, 8)
  const last = pts[pts.length - 1]
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bigArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="55%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* grid horizontal sutil */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={i} x1="0" y1={h * p} x2={w} y2={h * p} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#bigArea)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glowLine)" />
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="8" fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  )
}
