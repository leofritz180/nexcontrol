'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RANK_TIERS, getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'

/**
 * Vitrine de todos os 15 ranks.
 * Pode ser renderizada inline (compact={false}) ou abrir como modal.
 *
 * Marca os ranks: conquistados (check), atual (highlight), futuros próximos (next 3 destacados),
 * elite (12-15: glow extra, borda animada).
 */
export default function RankShowcase({ contas, mode = 'inline', open = false, onClose }) {
  const { current } = getRank(contas)
  const currentTier = current.tier

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {RANK_TIERS.map((rank, i) => {
        const isAchieved = currentTier >= rank.tier
        const isCurrent = currentTier === rank.tier
        const isNext = currentTier === rank.tier - 1
        const isElite = rank.tier >= 12
        const isApex = rank.tier === 15
        const isPrismatic = rank.primary === 'prismatic'

        return <RankRow key={rank.tier} rank={rank} contas={contas} index={i}
          isAchieved={isAchieved} isCurrent={isCurrent} isNext={isNext}
          isElite={isElite} isApex={isApex} isPrismatic={isPrismatic} />
      })}
    </div>
  )

  if (mode === 'inline') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{
            fontFamily: 'var(--font-display, serif)', fontSize: 22, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0,
          }}>
            Todos os 15 ranks
          </h3>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Você está em <span style={{ color: current.primary === 'prismatic' ? '#E0E0FF' : current.primary }}>{current.name}</span>
          </span>
        </div>
        {content}
      </div>
    )
  }

  // Modal
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              background: '#000', borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display, serif)', fontSize: 26, fontWeight: 400,
                  letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0, lineHeight: 1.1,
                }}>
                  Sistema de Ranks
                </h2>
                <p style={{ fontSize: 13, color: 'var(--t3)', margin: '4px 0 0' }}>
                  15 níveis · Você está em <span style={{ color: current.primary === 'prismatic' ? '#E0E0FF' : current.primary, fontWeight: 700 }}>{current.name}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', color: 'var(--t2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Linha individual de cada rank ── */
function RankRow({ rank, contas, index, isAchieved, isCurrent, isNext, isElite, isApex, isPrismatic }) {
  const bg = rankBackground(rank)
  const textColor = rankTextColor(rank)
  const remaining = isAchieved ? 0 : Math.max(0, rank.min - contas)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3 }}
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isElite ? '14px 16px' : '11px 14px',
        borderRadius: isElite ? 12 : 10,
        background: isCurrent
          ? `linear-gradient(90deg, ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.12)' : rank.glow.replace(/0\.\d+/, '0.12')} 0%, transparent 100%)`
          : isElite ? 'rgba(255,255,255,0.02)' : '#000',
        border: isCurrent
          ? `1px solid ${isPrismatic ? 'rgba(255,255,255,0.4)' : `rgba(${rank.glow.match(/\d+,\d+,\d+/)?.[0] || '255,255,255'},0.5)`}`
          : isElite
            ? `1px solid ${isPrismatic ? 'rgba(255,255,255,0.18)' : `rgba(${rank.glow.match(/\d+,\d+,\d+/)?.[0] || '255,255,255'},0.25)`}`
            : '1px solid rgba(255,255,255,0.06)',
        opacity: isAchieved || isCurrent || isNext ? 1 : 0.55,
        transition: 'all 0.2s ease',
        boxShadow: isCurrent
          ? `0 0 24px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.3)' : rank.glow.replace(/0\.\d+/, '0.25')}`
          : isElite
            ? `inset 0 1px 0 rgba(255,255,255,0.04)`
            : 'none',
      }}
    >
      {/* Aura animada nos elite (12-15) */}
      {isElite && (
        <motion.span
          aria-hidden
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4 + (rank.tier - 12) * 0.5, repeat: Infinity, ease: 'linear', delay: index * 0.3 }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
            background: `linear-gradient(90deg, transparent, ${isPrismatic ? 'rgba(255,215,0,0.06)' : rank.glow.replace(/0\.\d+/, '0.06')}, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tier number */}
      <div style={{
        flexShrink: 0,
        minWidth: 24, textAlign: 'center',
        fontSize: 10, fontWeight: 800,
        color: isCurrent ? (isPrismatic ? '#E0E0FF' : rank.primary) : 'var(--t4)',
        fontFamily: 'var(--mono)', letterSpacing: '0.04em',
      }}>
        {String(rank.tier).padStart(2, '0')}
      </div>

      {/* Ícone */}
      <div style={{
        width: isElite ? 38 : 32, height: isElite ? 38 : 32, borderRadius: 9,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isAchieved || isCurrent
          ? `0 0 ${isElite ? 18 : 12}px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : rank.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
        filter: !isAchieved && !isCurrent && !isNext ? 'grayscale(0.4) brightness(0.85)' : 'none',
      }}>
        <RankIcon name={rank.icon} size={isElite ? 20 : 17} color={textColor} />
        {isApex && (
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -6, pointerEvents: 'none',
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.2) 30deg, transparent 60deg, transparent 360deg)',
            }}
          />
        )}
      </div>

      {/* Nome + faixa */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <p style={{
            fontSize: isElite ? 14 : 13, fontWeight: 700,
            color: isPrismatic ? '#E0E0FF' : (isAchieved || isCurrent || isNext ? rank.primary : 'var(--t3)'),
            margin: 0, letterSpacing: '0.01em',
            textShadow: isCurrent ? `0 0 10px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow}` : 'none',
          }}>
            {rank.name}
          </p>
          {isCurrent && (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: isPrismatic ? 'rgba(180,120,255,0.18)' : `${rank.primary}22`,
              color: isPrismatic ? '#E0E0FF' : rank.primary,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              border: `1px solid ${isPrismatic ? 'rgba(180,120,255,0.35)' : `${rank.primary}44`}`,
            }}>VOCÊ</span>
          )}
          {isElite && !isCurrent && (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
              background: isPrismatic ? 'rgba(255,215,0,0.08)' : 'rgba(255,215,0,0.06)',
              color: '#FFD700', letterSpacing: '0.08em', textTransform: 'uppercase',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>{rank.tier === 15 ? 'APEX' : 'ELITE'}</span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0, fontFamily: 'var(--mono)' }}>
          {rank.min.toLocaleString('pt-BR')}+ depositantes
        </p>
      </div>

      {/* Status à direita */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {isAchieved && !isCurrent && (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(209,250,229,0.08)',
            border: '1px solid rgba(209,250,229,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        )}
        {isCurrent && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mono)',
            background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 5,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>{contas.toLocaleString('pt-BR')}</span>
        )}
        {!isAchieved && !isCurrent && remaining > 0 && (
          <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
            faltam <span style={{ color: 'var(--t3)', fontWeight: 700 }}>{remaining.toLocaleString('pt-BR')}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}

/* ── Hook helper pra abrir modal de qualquer lugar ── */
export function useShowcase() {
  const [open, setOpen] = useState(false)
  return { open, openShowcase: () => setOpen(true), closeShowcase: () => setOpen(false) }
}
