'use client'
import { getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'

/**
 * Badge inline pra rank.
 * size: 'xs' (lista compacta), 'sm' (default), 'md', 'lg' (hero)
 */
export default function RankBadge({ contas, size = 'sm', showName = true, showTier = false, style }) {
  const { current } = getRank(contas)
  const dims = {
    xs: { iconBox: 18, icon: 11, fontSize: 9,  pad: '2px 6px',  gap: 4, radius: 4 },
    sm: { iconBox: 22, icon: 13, fontSize: 10, pad: '3px 8px',  gap: 6, radius: 6 },
    md: { iconBox: 28, icon: 16, fontSize: 12, pad: '5px 10px', gap: 7, radius: 7 },
    lg: { iconBox: 40, icon: 22, fontSize: 14, pad: '8px 14px', gap: 10, radius: 10 },
  }[size] || {}

  const bg = rankBackground(current)
  const textColor = rankTextColor(current)
  const isPrismatic = current.primary === 'prismatic'
  const isApex = current.tier === 15

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: dims.gap,
      padding: dims.pad,
      borderRadius: dims.radius,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${current.primary === 'prismatic' ? 'rgba(255,255,255,0.25)' : `rgba(${current.glow.match(/\d+,\d+,\d+/)?.[0] || '255,255,255'},0.4)`}`,
      ...style,
    }}>
      <span style={{
        width: dims.iconBox, height: dims.iconBox, borderRadius: dims.radius,
        background: bg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 12px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : current.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <RankIcon name={current.icon} size={dims.icon} color={textColor} />
        {isApex && (
          <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.25) 0%, transparent 70%)' }} />
        )}
      </span>
      {showName && (
        <span style={{
          fontSize: dims.fontSize,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: isPrismatic ? '#E0E0FF' : current.primary,
          textTransform: 'uppercase',
          fontFamily: 'var(--font-sans, Inter)',
        }}>
          {current.name}{showTier ? ` · ${current.tier}` : ''}
        </span>
      )}
    </span>
  )
}
