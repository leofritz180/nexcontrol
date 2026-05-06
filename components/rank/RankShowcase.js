'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RANK_TIERS, getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'
import { RankAura, OrbitalParticles, GlowBorder, ShinePass, SignatureOverlay } from './RankFX'

/**
 * Vitrine premium dos 15 ranks.
 * Cada linha é uma cena visual: aura de cor, hover vivo, badges premium,
 * tratamento especial pros tiers 12-15 e Apex absurdo.
 */
export default function RankShowcase({ contas, mode = 'inline', open = false, onClose }) {
  const { current } = getRank(contas)
  const currentTier = current.tier

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {RANK_TIERS.map((rank, i) => (
        <RankRow key={rank.tier} rank={rank} contas={contas} index={i} currentTier={currentTier} />
      ))}
    </div>
  )

  if (mode === 'inline') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{
            fontFamily: 'var(--font-display, serif)', fontSize: 26, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0,
          }}>
            Todos os 15 ranks
          </h3>
          <span style={{
            fontSize: 12, fontWeight: 800, color: 'var(--t3)',
            letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--mono)',
            padding: '4px 12px', borderRadius: 6,
            background: `rgba(${current.rgb || '255,255,255'},0.06)`,
            border: `1px solid rgba(${current.rgb || '255,255,255'},0.2)`,
          }}>
            Você está em <span style={{
              color: current.primary === 'prismatic' ? '#E0E0FF' : current.primary,
              marginLeft: 4,
            }}>{current.name}</span>
          </span>
        </div>
        {content}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(24px) saturate(140%)', WebkitBackdropFilter: 'blur(24px) saturate(140%)',
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
              maxWidth: 620, width: '100%', maxHeight: '92vh', overflowY: 'auto',
              background: '#000', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display, serif)', fontSize: 30, fontWeight: 400,
                  letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0, lineHeight: 1.05,
                }}>
                  Sistema de Ranks
                </h2>
                <p style={{ fontSize: 14, color: 'var(--t3)', margin: '6px 0 0' }}>
                  15 níveis · Você está em <span style={{ color: current.primary === 'prismatic' ? '#E0E0FF' : current.primary, fontWeight: 800 }}>{current.name}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', color: 'var(--t2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--t1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--t2)' }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────────────────────────────────────
   Linha individual — alma do showcase
   ─────────────────────────────────────────── */
function RankRow({ rank, contas, index, currentTier }) {
  const [hover, setHover] = useState(false)
  const isAchieved = currentTier >= rank.tier
  const isCurrent = currentTier === rank.tier
  const isNext = currentTier === rank.tier - 1
  const isElite = rank.tier >= 12
  const isApex = rank.tier === 15
  const isSupremo = rank.tier === 14
  const isPrismatic = rank.primary === 'prismatic'
  const remaining = isAchieved ? 0 : Math.max(0, rank.min - contas)
  const rgb = rank.rgb || '255,255,255'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 3, y: -2 }}
      transition={{ delay: index * 0.025, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isElite ? '15px 18px' : (isCurrent ? '14px 16px' : '12px 16px'),
        borderRadius: isElite ? 14 : 12,
        cursor: 'default',
        background: isCurrent
          ? `linear-gradient(90deg, rgba(${rgb},0.14) 0%, rgba(${rgb},0.04) 60%, rgba(0,0,0,0.5) 100%)`
          : isElite
            ? `linear-gradient(90deg, rgba(${rgb},${hover ? 0.08 : 0.04}) 0%, rgba(0,0,0,0.5) 100%)`
            : (hover ? `rgba(${rgb},0.04)` : 'rgba(255,255,255,0.015)'),
        border: isCurrent
          ? `1px solid rgba(${rgb},0.55)`
          : `1px solid rgba(${rgb},${isElite ? (hover ? 0.4 : 0.22) : (hover ? 0.22 : 0.08)})`,
        opacity: isAchieved || isCurrent || isNext || isElite ? 1 : 0.65,
        boxShadow: isCurrent
          ? `0 14px 36px rgba(0,0,0,0.5), 0 0 32px rgba(${rgb},0.32), inset 0 1px 0 rgba(255,255,255,0.06)`
          : isElite
            ? `0 8px 24px rgba(0,0,0,0.4), 0 0 ${hover ? 28 : 18}px rgba(${rgb},${hover ? 0.30 : 0.18}), inset 0 1px 0 rgba(255,255,255,0.05)`
            : hover
              ? `0 6px 18px rgba(0,0,0,0.35), 0 0 16px rgba(${rgb},0.18)`
              : 'none',
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Camadas para elite */}
      {isElite && <RankAura rank={rank} intensity={hover || isCurrent ? 1.1 : 0.6} />}
      {(isCurrent || (isElite && hover)) && <SignatureOverlay rank={rank} />}

      {/* Border glow especial pra Apex/Supremo */}
      {(isApex || isSupremo) && (isCurrent || hover) && <GlowBorder rank={rank} thickness={1.5} intensity={isCurrent ? 1.4 : 0.9} />}

      {/* Particles orbitais — Apex sempre, Supremo/Imortal/Lendario quando hover/current */}
      {(isApex || (isElite && (isCurrent || hover))) && (
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0, width: 110, height: '100%', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <OrbitalParticles
            rank={rank}
            count={isApex ? 5 : 3}
            radius={isElite ? 40 : 30}
            size={isApex ? 3 : 2}
            speed={isApex ? 12 : 16}
          />
        </div>
      )}

      {/* Shine pass on hover */}
      {hover && <ShinePass duration={1.4} interval={2.5} color={`rgba(${rgb},0.22)`} />}

      {/* Tier number */}
      <div style={{
        position: 'relative', flexShrink: 0,
        minWidth: 30, textAlign: 'center',
        fontSize: 12, fontWeight: 900,
        color: isCurrent ? (isPrismatic ? '#E0E0FF' : rank.primary) : (isAchieved ? 'var(--t2)' : 'var(--t4)'),
        fontFamily: 'var(--mono)', letterSpacing: '0.04em',
        textShadow: isCurrent ? `0 0 10px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}` : 'none',
      }}>
        {String(rank.tier).padStart(2, '0')}
      </div>

      {/* Ícone — refinado */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Halo */}
        {(isAchieved || isCurrent || (isElite && hover)) && (
          <div aria-hidden style={{
            position: 'absolute', inset: -6, borderRadius: 14,
            background: `radial-gradient(circle, ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow.replace(/0\.\d+/, hover || isCurrent ? '0.45' : '0.25')} 0%, transparent 65%)`,
            filter: 'blur(8px)', pointerEvents: 'none',
          }}/>
        )}
        <div style={{
          position: 'relative',
          width: isElite ? 46 : (isCurrent ? 42 : 38),
          height: isElite ? 46 : (isCurrent ? 42 : 38),
          borderRadius: 11,
          background: rankBackground(rank),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: isAchieved || isCurrent || (isElite && hover)
            ? `0 0 0 1px rgba(255,255,255,0.18), 0 0 ${isElite ? 22 : 14}px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.55)' : rank.glow}, inset 0 2px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.2)`
            : 'inset 0 1px 0 rgba(255,255,255,0.08)',
          filter: !isAchieved && !isCurrent && !isNext && !isElite ? 'grayscale(0.55) brightness(0.75)' : 'none',
          transition: 'box-shadow 0.25s, filter 0.25s',
        }}>
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22) 0%, transparent 55%)`,
            pointerEvents: 'none',
          }}/>
          {(isElite || isCurrent) && <ShinePass duration={2.2} interval={5 + index * 0.4} color="rgba(255,255,255,0.3)" />}
          <RankIcon name={rank.icon} size={isElite ? 23 : (isCurrent ? 21 : 19)} color={rankTextColor(rank)} />
          {isApex && (
            <motion.span
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: -6, pointerEvents: 'none',
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.32) 35deg, transparent 70deg, transparent 360deg)',
              }}
            />
          )}
        </div>
      </div>

      {/* Conteúdo central */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <p style={{
            fontSize: isElite ? 16 : (isCurrent ? 15 : 14), fontWeight: 800,
            color: isPrismatic ? '#E0E0FF' : (isAchieved || isCurrent || isNext || isElite ? rank.primary : 'var(--t3)'),
            margin: 0, letterSpacing: '0.01em', lineHeight: 1.1,
            textShadow: isCurrent || (isElite && hover)
              ? `0 0 12px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : rank.glow}`
              : 'none',
            transition: 'text-shadow 0.25s',
            fontFamily: isElite ? 'var(--font-display, serif)' : 'var(--font-sans, Inter)',
            fontWeight: isElite ? 400 : 800,
          }}>
            {rank.name}
          </p>
          {isCurrent && <PremiumBadge label="VOCÊ" rank={rank} variant="current" />}
          {isApex && !isCurrent && <PremiumBadge label="APEX" rank={rank} variant="apex" />}
          {isSupremo && !isCurrent && <PremiumBadge label="SUPREMO" rank={rank} variant="supreme" />}
          {isElite && !isApex && !isSupremo && !isCurrent && <PremiumBadge label="ELITE" rank={rank} variant="elite" />}
        </div>
        <p style={{
          fontSize: 12, color: 'var(--t4)', margin: 0,
          fontFamily: 'var(--mono)', letterSpacing: '0.02em', fontWeight: 600,
        }}>
          {rank.min.toLocaleString('pt-BR')}+ depositantes
        </p>
      </div>

      {/* Status à direita */}
      <div style={{ position: 'relative', flexShrink: 0, textAlign: 'right' }}>
        {isAchieved && !isCurrent && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(31,228,168,0.1)',
              border: '1px solid rgba(31,228,168,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(31,228,168,0.25)',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#1FE4A8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </motion.div>
        )}
        {isCurrent && (
          <span style={{
            fontSize: 13, fontWeight: 900, color: 'var(--t1)', fontFamily: 'var(--mono)',
            background: `rgba(${rgb},0.12)`,
            padding: '5px 12px', borderRadius: 8,
            border: `1px solid rgba(${rgb},0.35)`,
            boxShadow: `0 0 14px rgba(${rgb},0.25), inset 0 1px 0 rgba(255,255,255,0.08)`,
            letterSpacing: '0.02em',
          }}>
            {contas.toLocaleString('pt-BR')}
          </span>
        )}
        {!isAchieved && !isCurrent && remaining > 0 && (
          <span style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
            faltam <span style={{ color: 'var(--t2)', fontWeight: 800 }}>{remaining.toLocaleString('pt-BR')}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}

/* ───────────────────────────────────────────
   Badge premium — cápsula com glow + breathing
   ─────────────────────────────────────────── */
function PremiumBadge({ label, rank, variant = 'current' }) {
  const rgb = rank.rgb || '255,255,255'
  const isApex = variant === 'apex'
  const isSupreme = variant === 'supreme'
  const isCurrent = variant === 'current'

  const bg = isApex
    ? 'linear-gradient(90deg, rgba(180,120,255,0.18), rgba(255,215,0,0.18))'
    : isSupreme
      ? 'linear-gradient(90deg, rgba(255,107,157,0.12), rgba(199,125,255,0.12), rgba(79,195,247,0.12))'
      : `rgba(${rgb},0.18)`
  const borderColor = isApex
    ? 'rgba(255,215,0,0.55)'
    : isSupreme
      ? 'rgba(199,125,255,0.45)'
      : `rgba(${rgb},0.45)`
  const textColor = isApex
    ? '#FFD700'
    : isSupreme
      ? '#E0E0FF'
      : (rank.primary === 'prismatic' ? '#E0E0FF' : rank.primary)

  return (
    <motion.span
      animate={isApex || isSupreme
        ? { boxShadow: [
            `0 0 8px ${isApex ? 'rgba(255,215,0,0.3)' : 'rgba(199,125,255,0.3)'}`,
            `0 0 16px ${isApex ? 'rgba(255,215,0,0.5)' : 'rgba(199,125,255,0.5)'}`,
            `0 0 8px ${isApex ? 'rgba(255,215,0,0.3)' : 'rgba(199,125,255,0.3)'}`,
          ]}
        : {}
      }
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        fontSize: 9, fontWeight: 900,
        padding: '3px 9px', borderRadius: 999,
        background: bg, color: textColor,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: isCurrent ? `0 0 12px rgba(${rgb},0.4)` : `0 0 10px rgba(${rgb},0.25)`,
        textShadow: `0 0 8px ${isApex ? 'rgba(255,215,0,0.5)' : (rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow)}`,
      }}
    >
      <ShinePass duration={1.6} interval={3.5} color="rgba(255,255,255,0.35)" />
      {label}
    </motion.span>
  )
}

/* ── Hook helper pra abrir modal de qualquer lugar ── */
export function useShowcase() {
  const [open, setOpen] = useState(false)
  return { open, openShowcase: () => setOpen(true), closeShowcase: () => setOpen(false) }
}
