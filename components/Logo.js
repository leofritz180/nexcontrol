'use client'

/**
 * NexControl Logo — alive, animated brand component
 *
 * Props:
 *   size     — scale factor (1 = default ~32px icon)
 *   showText — show "NexControl" text next to the icon (default true)
 *   showIcon — show the icon square (default true)
 *   glow     — animate a subtle red glow + orbital particles (default false)
 *   textSize — override font size for the text in px
 *   style    — style overrides on the wrapper div
 *   iconOnly — shortcut: icon without text at given size
 */
export default function Logo({
  size = 1,
  showText = true,
  showIcon = true,
  glow = false,
  textSize,
  style,
  iconOnly,
}) {
  if (iconOnly) { showText = false; showIcon = true }

  const iconPx = Math.round(32 * size)
  const svgPx = Math.round(14 * size)
  const radius = Math.round(9 * size)
  const fontSize = textSize || Math.round(15 * size)
  const gap = Math.round(10 * size)
  const auraPx = Math.round(iconPx * 2.2)
  const particleSize = Math.max(2, Math.round(2.5 * size))

  const iconEl = showIcon ? (
    <div style={{
      position: 'relative',
      width: iconPx,
      height: iconPx,
      flexShrink: 0,
    }}>
      {/* Aura — breathing radial glow */}
      <div
        className="logo-aura"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: auraPx,
          height: auraPx,
          marginTop: -(auraPx / 2),
          marginLeft: -(auraPx / 2),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,57,53,0.18) 0%, rgba(229,57,53,0.04) 50%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'breathe 4s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* Icon square */}
      <div style={{
        position: 'relative',
        width: iconPx,
        height: iconPx,
        borderRadius: radius,
        background: '#e53935',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: glow
          ? '0 0 16px rgba(229,57,53,0.3)'
          : '0 0 16px rgba(229,57,53,0.2)',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <NexIcon size={svgPx} />

        {/* Shine pass */}
        <div
          className="logo-shine"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.13) 50%, transparent 60%)',
            animation: 'shine 4s ease-in-out infinite',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Orbital particles — only when glow is true */}
      {glow && (
        <>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: iconPx + 16 * size,
            height: iconPx + 16 * size,
            marginTop: -((iconPx + 16 * size) / 2),
            marginLeft: -((iconPx + 16 * size) / 2),
            animation: 'orbit 18s linear infinite',
            pointerEvents: 'none',
            willChange: 'transform',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: particleSize,
              height: particleSize,
              borderRadius: '50%',
              background: '#e53935',
              opacity: 0.25,
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: iconPx + 22 * size,
            height: iconPx + 22 * size,
            marginTop: -((iconPx + 22 * size) / 2),
            marginLeft: -((iconPx + 22 * size) / 2),
            animation: 'orbit 15s linear infinite reverse',
            pointerEvents: 'none',
            willChange: 'transform',
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: particleSize,
              height: particleSize,
              borderRadius: '50%',
              background: '#e53935',
              opacity: 0.2,
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: iconPx + 12 * size,
            height: iconPx + 12 * size,
            marginTop: -((iconPx + 12 * size) / 2),
            marginLeft: -((iconPx + 12 * size) / 2),
            animation: 'orbit 20s linear infinite',
            animationDelay: '-7s',
            pointerEvents: 'none',
            willChange: 'transform',
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: Math.max(2, particleSize - 1),
              height: Math.max(2, particleSize - 1),
              borderRadius: '50%',
              background: '#e53935',
              opacity: 0.22,
            }} />
          </div>
        </>
      )}
    </div>
  ) : null

  const textEl = showText ? (
    <span
      className="logo-text"
      style={{
        fontSize,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#F1F5F9',
        lineHeight: 1,
        transition: 'text-shadow 0.3s ease',
      }}
    >
      Nex<span style={{ color: '#e53935' }}>Control</span>
    </span>
  ) : null

  return (
    <div
      className="logo-wrapper"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        cursor: 'default',
        transition: 'transform 0.3s ease, filter 0.3s ease',
        ...style,
      }}
    >
      {iconEl}
      {textEl}
    </div>
  )
}

/** The bar-chart "N" icon used inside the square */
export function NexIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5} />
      <path d="M12 22L18 22L18 6L12 6Z" fill="white" />
      <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7} />
    </svg>
  )
}
