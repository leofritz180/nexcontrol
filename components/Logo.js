'use client'

/**
 * NexControl Logo — usa a imagem oficial /nexcontrol-icon.png
 *
 * Props:
 *   size     — fator de escala (1 = ~32px icon)
 *   showText — exibe "NexControl" ao lado (default true)
 *   showIcon — exibe o icon (default true)
 *   glow     — aura/halo sutil (default false)
 *   textSize — tamanho da fonte em px
 *   style    — overrides do wrapper
 *   iconOnly — atalho: so o icon
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
  const fontSize = textSize || Math.round(15 * size)
  const gap = Math.round(10 * size)
  const auraPx = Math.round(iconPx * 2)

  const iconEl = showIcon ? (
    <div style={{
      position: 'relative',
      width: iconPx,
      height: iconPx,
      flexShrink: 0,
    }}>
      {glow && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: auraPx,
            height: auraPx,
            marginTop: -(auraPx / 2),
            marginLeft: -(auraPx / 2),
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 50%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'breathe 4s ease-in-out infinite',
            willChange: 'transform, opacity',
          }}
        />
      )}
      <img
        src="/icons/nexcontrol-icon-clean.png"
        alt="NexControl"
        width={iconPx}
        height={iconPx}
        style={{
          width: iconPx,
          height: iconPx,
          objectFit: 'contain',
          display: 'block',
          position: 'relative',
          zIndex: 1,
          filter: glow ? 'drop-shadow(0 0 8px rgba(255,255,255,0.15))' : 'none',
        }}
      />
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

/** Mantido como wrapper de compatibilidade — agora renderiza a imagem oficial */
export function NexIcon({ size = 14 }) {
  return (
    <img
      src="/icons/nexcontrol-icon-clean.png"
      alt="NexControl"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  )
}
