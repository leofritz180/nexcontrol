import { useMemo } from 'react'
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

export function ParticleField({ color = '#22C55E', count = 25 }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const sec = frame / fps

  const fadeIn = interpolate(frame, [15, 60], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  const dots = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.sin(i * 137.5 + 0.1) * 0.5 + 0.5) * width,
      y: (Math.cos(i * 91.3 + 0.3) * 0.5 + 0.5) * height,
      size: 1 + (i % 4),
      driftX: 12 + (i % 7) * 4,
      driftY: 8 + (i % 5) * 3,
      speedX: 0.2 + (i % 3) * 0.15,
      speedY: 0.15 + (i % 4) * 0.1,
      phase: (i * 1.3) % (Math.PI * 2),
      brightness: 0.08 + (i % 5) * 0.06,
    }))
  , [count, width, height])

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {dots.map((d, i) => {
        const x = d.x + Math.sin(sec * d.speedX + d.phase) * d.driftX
        const y = d.y + Math.cos(sec * d.speedY + d.phase) * d.driftY
        const pulse = 0.4 + Math.sin(sec * 2 + d.phase) * 0.6
        const a = fadeIn * pulse * d.brightness

        return (
          <div key={i} style={{
            position:'absolute', left: x, top: y,
            width: d.size, height: d.size, borderRadius:'50%',
            background: color, opacity: a,
            boxShadow: `0 0 ${d.size * 6}px ${color}${Math.round(a * 40).toString(16).padStart(2,'0')}`,
          }}/>
        )
      })}
    </div>
  )
}
