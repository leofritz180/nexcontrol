import { useMemo } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

export function ParticleField({ color, count = 20, radius = 220 }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sec = frame / fps

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * 360,
      dist: radius + (Math.sin(i * 137.5) * 40),
      size: 1.5 + (i % 3),
      speed: 0.003 + (i % 5) * 0.001,
      phase: (i * 0.8) % (Math.PI * 2),
    }))
  , [count, radius])

  // Fade in particles 0.5-2s
  const opacity = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map((p, i) => {
        const ang = (p.angle * Math.PI / 180) + sec * p.speed * 12
        const pulse = 0.4 + Math.sin(sec * 2 + p.phase) * 0.6
        const x = Math.cos(ang) * p.dist
        const y = Math.sin(ang) * p.dist
        const a = opacity * pulse * 0.45

        return (
          <div key={i} style={{
            position: 'absolute',
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: color,
            opacity: a,
            boxShadow: `0 0 ${p.size * 4}px ${color}`,
            transform: `scale(${0.8 + pulse * 0.4})`,
          }}/>
        )
      })}
    </div>
  )
}
