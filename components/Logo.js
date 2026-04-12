'use client'
import { motion } from 'framer-motion'

/**
 * NexControl Logo — reusable SVG-based brand component
 *
 * Props:
 *   size     — scale factor (1 = default ~32px icon). e.g. 2 = 64px
 *   showText — show "NexControl" text next to the icon (default true)
 *   showIcon — show the icon square (default true)
 *   glow     — animate a subtle red glow on the icon (default false)
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

  const iconEl = showIcon ? (
    glow ? (
      <motion.div
        animate={{
          boxShadow: [
            '0 0 12px rgba(229,57,53,0.15)',
            '0 0 22px rgba(229,57,53,0.35)',
            '0 0 12px rgba(229,57,53,0.15)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          width: iconPx, height: iconPx, borderRadius: radius,
          background: '#e53935',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <NexIcon size={svgPx} />
      </motion.div>
    ) : (
      <div style={{
        width: iconPx, height: iconPx, borderRadius: radius,
        background: '#e53935',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 16px rgba(229,57,53,0.2)',
      }}>
        <NexIcon size={svgPx} />
      </div>
    )
  ) : null

  const textEl = showText ? (
    <span style={{
      fontSize, fontWeight: 700, letterSpacing: '-0.02em',
      color: '#F1F5F9', lineHeight: 1,
    }}>
      Nex<span style={{ color: '#e53935' }}>Control</span>
    </span>
  ) : null

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap,
      ...style,
    }}>
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
