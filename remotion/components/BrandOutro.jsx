import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

export function BrandOutro({ brandName = 'NexControl', dateLabel }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Brand enters at 5.5s (frame 330)
  const opacity = interpolate(frame, [330, 366], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Confirm text at 4.8s (frame 288)
  const confirmOpacity = interpolate(frame, [288, 324], [0, 0.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const confirmY = interpolate(frame, [288, 324], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Fade out at 6s (frame 360)
  const fadeOut = interpolate(frame, [360, 420], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const master = Math.min(opacity, fadeOut)

  return (
    <>
      {/* Confirm text */}
      <div style={{
        position: 'absolute', bottom: '32%', left: 0, right: 0,
        textAlign: 'center', opacity: confirmOpacity * fadeOut,
        transform: `translateY(${confirmY}px)`,
      }}>
        <span style={{
          fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.08em',
        }}>
          LUCRO CONFIRMADO
        </span>
      </div>

      {/* Brand */}
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        opacity: master,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo */}
          <div style={{
            width: 30, height: 30, borderRadius: 7, background: '#e53935',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={13} height={13} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
              <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              Nex<span style={{ color: '#ff4444' }}>Control</span>
            </span>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0', letterSpacing: '0.06em' }}>
              Sistema operacional
            </p>
          </div>
        </div>

        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.06em' }}>
          {dateLabel || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>
    </>
  )
}
