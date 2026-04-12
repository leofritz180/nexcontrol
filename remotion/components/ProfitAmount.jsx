import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion'

const fmt = v => Number(v||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ProfitAmount({ amount, isPositive, metasFechadas = 0, color }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const abs = Math.abs(amount)

  // Count-up: 1.5s - 3.5s (frames 90-210)
  const countProgress = interpolate(frame, [90, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // Ease out exponential
  const eased = 1 - Math.pow(2, -10 * countProgress)
  const currentValue = abs * eased

  // Impact bounce at 3s (frame 180)
  const impactScale = spring({ frame: frame - 180, fps, config: { damping: 12, stiffness: 150, mass: 0.8 } })
  const scale = frame < 180 ? 0.8 + countProgress * 0.2 : 0.8 + 0.2 + (impactScale - 1) * -0.15 + impactScale * 0.15

  // Fade in
  const opacity = interpolate(frame, [85, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Breathing after stable (3.5s+)
  const breathe = frame > 210 ? Math.sin((frame - 210) / fps * 1.5) * 0.01 : 0

  // Shine sweep at impact (3-3.6s)
  const shineProgress = interpolate(frame, [180, 216], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Meta count fade
  const metaOpacity = interpolate(frame, [210, 240], [0, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${scale + breathe})`,
      opacity,
    }}>
      {/* Prefix */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 64, fontWeight: 900, color,
        opacity: 0.85,
        textShadow: `0 0 80px ${color}80`,
        lineHeight: 1,
      }}>
        {isPositive ? '+' : '-'}R$
      </span>

      {/* Value */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 80, fontWeight: 900, color,
        textShadow: `0 0 60px ${color}80, 0 0 120px ${color}40`,
        lineHeight: 1, marginTop: -5,
        position: 'relative', overflow: 'hidden',
      }}>
        {fmt(currentValue)}

        {/* Shine sweep */}
        {shineProgress > 0 && shineProgress < 1 && (
          <div style={{
            position: 'absolute', top: 0, left: `${-20 + shineProgress * 120}%`,
            width: '30%', height: '100%',
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.15 * (1 - shineProgress)}), transparent)`,
          }}/>
        )}
      </span>

      {/* Meta count */}
      <span style={{
        fontSize: 16, color: 'rgba(255,255,255,' + metaOpacity + ')',
        marginTop: 16,
        fontFamily: "'Inter', sans-serif", fontWeight: 500,
      }}>
        {metasFechadas} metas fechadas
      </span>
    </div>
  )
}
