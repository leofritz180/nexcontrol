import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion'

export function AnimatedHUD({ goalPct = 0, profitPct = 0, color, size = 400 }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sec = frame / fps

  // Build phase: rings draw 0.8-2.8s
  const buildProgress = interpolate(frame, [48, 168], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const ringData = [
    { r: size/2 - 4, w: 2, progress: goalPct * buildProgress, stroke: 'rgba(255,255,255,0.1)', track: 'rgba(255,255,255,0.03)' },
    { r: size/2 - 24, w: 6, progress: profitPct * buildProgress, stroke: color, track: 'rgba(255,255,255,0.04)' },
    { r: size/2 - 48, w: 1, progress: 0, stroke: 'transparent', track: 'rgba(255,255,255,0.02)' },
  ]

  const circ = (r) => 2 * Math.PI * r

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Decorative dashed ring — slow spin */}
      <svg width={size - 30} height={size - 30} style={{
        position: 'absolute', left: 15, top: 15,
        transform: `rotate(${sec * 4.5}deg)`,
        opacity: buildProgress,
      }}>
        <circle
          cx={(size-30)/2} cy={(size-30)/2} r={(size-38)/2}
          fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth={1}
          strokeDasharray="5 16"
        />
      </svg>

      {/* Inner accent ring — reverse spin */}
      <svg width={size - 90} height={size - 90} style={{
        position: 'absolute', left: 45, top: 45,
        transform: `rotate(${-sec * 3}deg)`,
        opacity: buildProgress * 0.8,
      }}>
        <circle
          cx={(size-90)/2} cy={(size-90)/2} r={(size-96)/2}
          fill="none" stroke={color} strokeWidth={1}
          strokeDasharray="3 13"
          opacity={0.12}
        />
      </svg>

      {/* Main rings */}
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        {ringData.map((ring, i) => (
          <g key={i}>
            {/* Track */}
            <circle cx={size/2} cy={size/2} r={ring.r} fill="none" stroke={ring.track} strokeWidth={ring.w}/>
            {/* Progress */}
            {ring.progress > 0 && (
              <circle
                cx={size/2} cy={size/2} r={ring.r}
                fill="none" stroke={ring.stroke} strokeWidth={ring.w}
                strokeLinecap="round"
                strokeDasharray={circ(ring.r)}
                strokeDashoffset={circ(ring.r) * (1 - ring.progress)}
                style={{ filter: i === 1 ? `drop-shadow(0 0 10px ${color})` : 'none' }}
              />
            )}
          </g>
        ))}
      </svg>

      {/* Glow sweep on main ring tip */}
      {buildProgress > 0.3 && profitPct > 0 && (() => {
        const angle = -Math.PI/2 + profitPct * buildProgress * Math.PI * 2
        const r = size/2 - 24
        const sx = size/2 + Math.cos(angle) * r
        const sy = size/2 + Math.sin(angle) * r
        return (
          <div style={{
            position: 'absolute',
            left: sx - 20, top: sy - 20,
            width: 40, height: 40,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}80, transparent 70%)`,
            opacity: buildProgress,
          }}/>
        )
      })()}
    </div>
  )
}
