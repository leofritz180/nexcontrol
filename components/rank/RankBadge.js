'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'
import { ShinePass } from './RankFX'

/**
 * Badge inline premium pra rank.
 * size: 'xs' (lista compacta), 'sm' (default), 'md', 'lg' (hero)
 */
export default function RankBadge({ contas, size = 'sm', showName = true, showTier = false, style, forceApex = false }) {
  const [hover, setHover] = useState(false)
  const { current } = getRank(contas, { forceApex })
  const dims = {
    xs: { iconBox: 22, icon: 13, fontSize: 11, pad: '3px 9px',  gap: 6, radius: 6 },
    sm: { iconBox: 28, icon: 16, fontSize: 12, pad: '4px 11px', gap: 8, radius: 7 },
    md: { iconBox: 36, icon: 20, fontSize: 14, pad: '6px 13px', gap: 9, radius: 9 },
    lg: { iconBox: 50, icon: 28, fontSize: 16, pad: '10px 18px', gap: 12, radius: 12 },
  }[size] || {}

  const bg = rankBackground(current)
  const textColor = rankTextColor(current)
  const isPrismatic = current.primary === 'prismatic'
  const isApex = current.tier === 15
  const rgb = current.rgb || '255,255,255'

  return (
    <motion.span
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', gap: dims.gap,
        padding: dims.pad,
        borderRadius: dims.radius,
        background: hover ? `rgba(${rgb},0.10)` : `rgba(${rgb},0.05)`,
        border: `1px solid rgba(${rgb},${hover ? 0.42 : 0.28})`,
        boxShadow: hover
          ? `0 4px 18px rgba(0,0,0,0.4), 0 0 18px rgba(${rgb},0.28), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        ...style,
      }}
    >
      {hover && <ShinePass duration={1.2} interval={2} color={`rgba(${rgb},0.25)`} />}
      <span style={{
        position: 'relative',
        width: dims.iconBox, height: dims.iconBox, borderRadius: Math.round(dims.radius * 0.85),
        background: bg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 ${hover ? 16 : 10}px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : current.glow}, inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2)`,
        overflow: 'hidden',
      }}>
        {/* Inner shine top-left */}
        <span aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 55%)',
        }}/>
        <RankIcon name={current.icon} size={dims.icon} color={textColor} />
        {isApex && (
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -3, pointerEvents: 'none',
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.32) 30deg, transparent 60deg, transparent 360deg)',
            }}
          />
        )}
      </span>
      {showName && (
        <span style={{
          position: 'relative',
          fontSize: dims.fontSize,
          fontWeight: 800,
          letterSpacing: '0.05em',
          color: isPrismatic ? '#E0E0FF' : current.primary,
          textTransform: 'uppercase',
          fontFamily: 'var(--font-sans, Inter)',
          textShadow: hover ? `0 0 8px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : current.glow}` : 'none',
          transition: 'text-shadow 0.2s',
        }}>
          {current.name}{showTier ? ` · ${current.tier}` : ''}
        </span>
      )}
    </motion.span>
  )
}
