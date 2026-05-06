'use client'
import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RANK_TIERS, getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'
import { ShinePass, OrbitalParticles } from './RankFX'

/**
 * Vitrine HORIZONTAL cinematográfica — staircase de 15 ranks subindo até o Apex.
 * Cada rank é uma coluna/pilar com altura progressiva.
 *
 * Mobile: scroll horizontal suave. Desktop: cabe inteiro até ~1100px largura.
 */

// Alturas progressivas dos pilares — Apex tem salto dramático
const PILLAR_HEIGHTS = [44, 52, 62, 74, 86, 98, 108, 118, 130, 142, 154, 168, 182, 198, 240]

export default function RankShowcase({ contas, mode = 'inline', open = false, onClose, forceApex = false }) {
  const { current } = getRank(contas, { forceApex })
  const currentTier = current.tier
  const [hoverTier, setHoverTier] = useState(null)
  const [selectedTier, setSelectedTier] = useState(null)

  // Detalhes do rank ativo (hover ou click) — fallback no atual
  const focusTier = hoverTier || selectedTier || currentTier
  const focusRank = RANK_TIERS.find(r => r.tier === focusTier) || current

  const content = (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 22,
      }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display, serif)', fontSize: 32, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0, lineHeight: 1,
          }}>
            Sistema de Ranks
          </h3>
          <p style={{
            fontSize: 11, fontWeight: 800, color: 'var(--t3)',
            letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--mono)',
            margin: '6px 0 0',
          }}>
            15 níveis · Elos · MMR competitivo
          </p>
        </div>
        <CurrentRankBadgeBig rank={current} contas={contas} />
      </div>

      {/* Stage da staircase */}
      <Staircase
        contas={contas}
        currentTier={currentTier}
        hoverTier={hoverTier}
        setHoverTier={setHoverTier}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
        forceApex={forceApex}
      />

      {/* Painel inferior — info do rank em foco */}
      <FocusPanel rank={focusRank} contas={contas} currentTier={currentTier} />
    </div>
  )

  if (mode === 'inline') return content

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }} onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(28px) saturate(140%)', WebkitBackdropFilter: 'blur(28px) saturate(140%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 1100, width: '100%', maxHeight: '92vh', overflowY: 'auto',
              background: '#000', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              padding: 28,
            }}
          >
            <button type="button" onClick={onClose} aria-label="Fechar"
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 36, height: 36, borderRadius: 10, zIndex: 2,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', color: 'var(--t2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────────────────────────────────────
   CURRENT RANK BADGE — destaque no header
   ─────────────────────────────────────────── */
function CurrentRankBadgeBig({ rank, contas }) {
  const isPrismatic = rank.primary === 'prismatic'
  const rgb = rank.rgb || '255,255,255'
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      display: 'inline-flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderRadius: 12,
      background: `linear-gradient(135deg, rgba(${rgb},0.12), rgba(0,0,0,0.4))`,
      border: `1px solid rgba(${rgb},0.35)`,
      boxShadow: `0 8px 22px rgba(0,0,0,0.4), 0 0 24px rgba(${rgb},0.22)`,
    }}>
      <ShinePass duration={2.2} interval={5} color={`rgba(${rgb},0.25)`} />
      <span style={{
        width: 36, height: 36, borderRadius: 10,
        background: rankBackground(rank),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}>
        <RankIcon name={rank.icon} size={18} color={rankTextColor(rank)} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--t3)', margin: 0, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
          Seu rank atual
        </p>
        <p style={{
          fontSize: 16, fontWeight: 800, margin: '2px 0 0', lineHeight: 1,
          color: isPrismatic ? '#E0E0FF' : rank.primary, letterSpacing: '0.04em',
          textShadow: `0 0 10px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow}`,
          fontFamily: 'var(--font-display, serif)', fontWeight: 400, fontSize: 20,
        }}>
          {rank.name}
        </p>
      </div>
      <motion.span
        animate={{ boxShadow: [`0 0 8px rgba(${rgb},0.4)`, `0 0 16px rgba(${rgb},0.7)`, `0 0 8px rgba(${rgb},0.4)`] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 999,
          background: `rgba(${rgb},0.22)`, color: isPrismatic ? '#E0E0FF' : rank.primary,
          border: `1px solid rgba(${rgb},0.5)`, letterSpacing: '0.16em', textTransform: 'uppercase',
        }}
      >
        VOCÊ
      </motion.span>
    </div>
  )
}

/* ───────────────────────────────────────────
   STAIRCASE — 15 pilares horizontais
   ─────────────────────────────────────────── */
function Staircase({ contas, currentTier, hoverTier, setHoverTier, selectedTier, setSelectedTier, forceApex }) {
  const scrollRef = useRef(null)
  const maxHeight = Math.max(...PILLAR_HEIGHTS) + 80 // espaço pra label + nome de cima
  const baseHeight = 280

  return (
    <div style={{
      position: 'relative',
      borderRadius: 16,
      background: 'linear-gradient(180deg, rgba(20,18,28,0.4) 0%, rgba(0,0,0,0.5) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>
      {/* Stars background — vibe espacial */}
      <StaircaseStars />

      <div ref={scrollRef} style={{
        position: 'relative',
        overflowX: 'auto', overflowY: 'hidden',
        padding: '20px 24px 18px',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      }} className="rank-stairs-scroll">
        <div style={{
          position: 'relative',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 4, minWidth: 'min-content',
          minHeight: baseHeight,
        }}>
          {/* Energy line conectando pilares no topo (SVG) */}
          <ConnectingEnergyLine highestTier={currentTier} />

          {RANK_TIERS.map((rank, i) => (
            <Pillar
              key={rank.tier}
              rank={rank}
              height={PILLAR_HEIGHTS[i]}
              currentTier={currentTier}
              isHovered={hoverTier === rank.tier}
              isSelected={selectedTier === rank.tier}
              onHover={() => setHoverTier(rank.tier)}
              onUnhover={() => setHoverTier(null)}
              onClick={() => setSelectedTier(selectedTier === rank.tier ? null : rank.tier)}
              contas={contas}
            />
          ))}
        </div>
      </div>

      {/* Base line — chão */}
      <div aria-hidden style={{
        position: 'absolute', left: 24, right: 24, bottom: 12, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.18), rgba(255,255,255,0.12), transparent)',
        boxShadow: '0 0 8px rgba(255,255,255,0.08)',
      }}/>

      <style>{`
        .rank-stairs-scroll::-webkit-scrollbar { height: 6px; }
        .rank-stairs-scroll::-webkit-scrollbar-track { background: transparent; }
        .rank-stairs-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        .rank-stairs-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}

/* ───────────────────────────────────────────
   PILLAR — coluna individual de cada rank
   ─────────────────────────────────────────── */
function Pillar({ rank, height, currentTier, isHovered, isSelected, onHover, onUnhover, onClick, contas }) {
  const isCurrent = currentTier === rank.tier
  const isAchieved = currentTier >= rank.tier
  const isApex = rank.tier === 15
  const isElite = rank.tier >= 12
  const isPrismatic = rank.primary === 'prismatic'
  const rgb = rank.rgb || '255,255,255'
  const active = isHovered || isSelected || isCurrent

  // Apex tem largura maior pra ter mais presença
  const width = isApex ? 78 : isElite ? 60 : 54
  const iconSize = isApex ? 56 : isElite ? 46 : 40
  const liftY = isHovered ? -8 : 0

  return (
    <motion.button
      type="button"
      onMouseEnter={onHover} onMouseLeave={onUnhover} onClick={onClick}
      animate={{ y: liftY }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flexShrink: 0,
        width, padding: 0,
        background: 'transparent', border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* Nome do rank no topo */}
      <span style={{
        position: 'relative', zIndex: 2,
        fontSize: isApex ? 11 : 9,
        fontWeight: 900,
        color: isPrismatic ? '#E0E0FF' : (isAchieved || isCurrent || isHovered ? rank.primary : 'var(--t4)'),
        letterSpacing: '0.16em', textTransform: 'uppercase',
        fontFamily: 'var(--mono)',
        marginBottom: 6,
        textShadow: active ? `0 0 10px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}` : 'none',
        whiteSpace: 'nowrap',
        opacity: isAchieved || isCurrent || isHovered || isElite ? 1 : 0.6,
        transition: 'text-shadow 0.25s, color 0.25s, opacity 0.25s',
      }}>
        {rank.name}
      </span>

      {/* Badge VOCÊ acima do rank atual */}
      {isCurrent && (
        <motion.span
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            zIndex: 5,
            fontSize: 8, fontWeight: 900, padding: '3px 8px', borderRadius: 999,
            background: `rgba(${rgb},0.22)`, color: isPrismatic ? '#E0E0FF' : rank.primary,
            border: `1px solid rgba(${rgb},0.55)`,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            boxShadow: `0 0 14px rgba(${rgb},0.5)`,
            whiteSpace: 'nowrap',
          }}
        >
          VOCÊ
        </motion.span>
      )}

      {/* Emblema flutuante acima do pilar */}
      <PillarEmblem rank={rank} size={iconSize} active={active} isApex={isApex} isCurrent={isCurrent} />

      {/* Pilar/coluna */}
      <PillarColumn rank={rank} height={height} active={active} isApex={isApex} isCurrent={isCurrent} isAchieved={isAchieved} />

      {/* Tier number */}
      <span style={{
        marginTop: 8, fontSize: 11, fontWeight: 800,
        color: isCurrent ? (isPrismatic ? '#E0E0FF' : rank.primary) : (isAchieved || isHovered ? 'var(--t1)' : 'var(--t4)'),
        fontFamily: 'var(--mono)', letterSpacing: '0.04em',
        opacity: isAchieved || isCurrent || isHovered || isElite ? 1 : 0.65,
        transition: 'color 0.25s, opacity 0.25s',
      }}>
        {String(rank.tier).padStart(2, '0')}
      </span>

      {/* Min deps na base */}
      <span style={{
        fontSize: 8, fontWeight: 700, color: 'var(--t4)',
        letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--mono)',
        marginTop: 2,
      }}>
        min. deps
      </span>
      <span style={{
        fontSize: 11, fontWeight: 800,
        color: isCurrent ? (isPrismatic ? '#E0E0FF' : rank.primary) : 'var(--t2)',
        fontFamily: 'var(--mono)',
      }}>
        {rank.min === 0 ? '0+' : rank.min < 1000 ? `${rank.min}+` : `${(rank.min / 1000).toFixed(rank.min % 1000 === 0 ? 0 : 1).replace('.0', '')}k+`}
      </span>
    </motion.button>
  )
}

/* ───────────────────────────────────────────
   EMBLEMA flutuante acima do pilar
   ─────────────────────────────────────────── */
function PillarEmblem({ rank, size, active, isApex, isCurrent }) {
  const isPrismatic = rank.primary === 'prismatic'

  return (
    <motion.div
      animate={isApex ? { y: [0, -2, 0] } : (isCurrent ? { scale: [1, 1.04, 1] } : {})}
      transition={{ duration: isApex ? 2.4 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'relative',
        width: size, height: size, borderRadius: 12,
        background: rankBackground(rank),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active
          ? `0 0 0 1.5px rgba(255,255,255,0.22), 0 8px 26px rgba(0,0,0,0.5), 0 0 ${isApex ? 36 : 22}px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.65)' : rank.glow}, inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -2px 0 rgba(0,0,0,0.22)`
          : `0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.4), 0 0 ${isApex ? 22 : 10}px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.3)' : rank.glow.replace(/0\.\d+/, '0.32')}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        overflow: 'hidden',
        marginBottom: 4,
        zIndex: 2,
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* Reflexo top-left */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 55%)',
        pointerEvents: 'none',
      }}/>
      {active && <ShinePass duration={2} interval={4.5} color="rgba(255,255,255,0.4)" />}
      <RankIcon name={rank.icon} size={Math.round(size * 0.55)} color={rankTextColor(rank)} />

      {/* Apex effects */}
      {isApex && (
        <>
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -6, pointerEvents: 'none',
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.4) 30deg, transparent 60deg, transparent 360deg)',
            }}
          />
          <motion.span
            aria-hidden
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -3, pointerEvents: 'none',
              background: 'conic-gradient(from 90deg, transparent 0deg, rgba(180,120,255,0.32) 40deg, transparent 80deg, transparent 360deg)',
            }}
          />
        </>
      )}

      {/* Apex orbital particles */}
      {isApex && (
        <div aria-hidden style={{ position: 'absolute', inset: -10, pointerEvents: 'none' }}>
          <OrbitalParticles rank={rank} count={5} radius={size * 0.7} size={2.5} speed={11} />
        </div>
      )}

      {/* Halo ao hover */}
      {active && (
        <motion.div
          aria-hidden
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.4, opacity: [0, 0.6, 0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            background: `radial-gradient(circle, ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : rank.glow.replace(/0\.\d+/, '0.5')} 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )}
    </motion.div>
  )
}

/* ───────────────────────────────────────────
   PILLAR COLUMN — barra vertical com gradient + light
   ─────────────────────────────────────────── */
function PillarColumn({ rank, height, active, isApex, isCurrent, isAchieved }) {
  const isPrismatic = rank.primary === 'prismatic'
  const rgb = rank.rgb || '255,255,255'

  // Conic gradient pra apex, normal pros outros
  const fillBg = isApex
    ? 'linear-gradient(180deg, rgba(180,120,255,0.7) 0%, rgba(120,60,200,0.5) 50%, rgba(60,30,120,0.3) 100%)'
    : isPrismatic
      ? 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(180,120,255,0.4) 50%, rgba(120,60,200,0.2) 100%)'
      : `linear-gradient(180deg, rgba(${rgb},0.7) 0%, rgba(${rgb},0.4) 60%, rgba(${rgb},0.15) 100%)`

  return (
    <div style={{
      position: 'relative',
      width: isApex ? 36 : 26,
      height,
      borderRadius: '8px 8px 4px 4px',
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid rgba(${rgb},${active ? 0.45 : 0.18})`,
      overflow: 'hidden',
      boxShadow: active
        ? `0 0 0 1px rgba(${rgb},0.28), 0 0 ${isApex ? 26 : 18}px rgba(${rgb},0.45), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)`
        : `inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 ${isAchieved ? 12 : 6}px rgba(${rgb},${isAchieved ? 0.25 : 0.08})`,
      transition: 'box-shadow 0.3s, border-color 0.3s',
    }}>
      {/* Fill animado */}
      <motion.div
        initial={{ height: '0%' }}
        animate={{ height: isAchieved || isCurrent ? '100%' : `${Math.min(80, 40 + (isApex ? 30 : 0))}%` }}
        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1], delay: rank.tier * 0.04 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: fillBg,
        }}
      />

      {/* Light traveling vertical (energia subindo) */}
      {(active || isCurrent || isApex) && (
        <motion.span
          aria-hidden
          initial={{ y: '120%' }}
          animate={{ y: '-120%' }}
          transition={{ duration: isApex ? 2.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: 0, right: 0, height: '40%',
            background: `linear-gradient(0deg, transparent, ${isPrismatic ? 'rgba(255,255,255,0.55)' : `rgba(${rgb},0.55)`}, transparent)`,
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top cap glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(180deg, ${isPrismatic ? 'rgba(255,255,255,0.7)' : `rgba(${rgb},0.7)`}, transparent)`,
        boxShadow: `0 0 ${active ? 12 : 6}px ${isPrismatic ? 'rgba(180,120,255,0.5)' : `rgba(${rgb},0.5)`}`,
      }}/>

      {/* Apex extra: stardust caindo */}
      {isApex && (
        <ApexPillarStardust />
      )}
    </div>
  )
}

function ApexPillarStardust() {
  const dust = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    x: 15 + (i * 22) % 70,
    delay: i * 1.1,
    dur: 3 + (i % 2),
    size: 1.5 + (i % 2),
  })), [])
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {dust.map((d, i) => (
        <motion.span
          key={i}
          initial={{ y: '-10%', opacity: 0 }}
          animate={{ y: '120%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: d.dur, repeat: Infinity, ease: 'linear', delay: d.delay }}
          style={{
            position: 'absolute', left: `${d.x}%`,
            width: d.size, height: d.size, borderRadius: '50%',
            background: i % 2 === 0 ? '#FFD700' : '#B478FF',
            boxShadow: `0 0 ${d.size * 4}px ${i % 2 === 0 ? '#FFD700' : '#B478FF'}`,
          }}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────
   CONNECTING ENERGY LINE — entre os topos dos pilares
   ─────────────────────────────────────────── */
function ConnectingEnergyLine({ highestTier }) {
  // Linha SVG que sobe em degraus seguindo PILLAR_HEIGHTS
  // Largura por step: ajustamos pra somar 100% do container
  return null // Por simplicidade visual (e consistência cross-screen), o efeito
              // de progressão fica no GLOW dos topos + light traveling. Adicionar
              // SVG bate em edge cases de scroll horizontal.
}

/* ───────────────────────────────────────────
   STARS BACKGROUND
   ─────────────────────────────────────────── */
function StaircaseStars() {
  const stars = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const seed = (i * 13 + 7) % 100
    return {
      x: (seed * 17) % 100,
      y: (seed * 11) % 70,
      size: 0.8 + (seed % 100) / 100,
      delay: (seed % 30) / 10,
      dur: 2 + (seed % 30) / 10,
    }
  }), [])
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.15, 0.8, 0.15], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: i % 7 === 0 ? '#FFD700' : '#FFFFFF',
            boxShadow: `0 0 ${s.size * 3}px ${i % 7 === 0 ? '#FFD700' : 'rgba(180,120,255,0.4)'}`,
          }}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────
   FOCUS PANEL — detalhe do rank em foco (atual/hover/clicado)
   ─────────────────────────────────────────── */
function FocusPanel({ rank, contas, currentTier }) {
  const isPrismatic = rank.primary === 'prismatic'
  const rgb = rank.rgb || '255,255,255'
  const isAchieved = currentTier >= rank.tier
  const isCurrent = currentTier === rank.tier
  const remaining = isAchieved ? 0 : Math.max(0, rank.min - contas)

  const desc = {
    1: 'Iniciante. Cada conta processada é um passo na sua jornada.',
    2: 'Bronze. Os primeiros resultados começaram a aparecer.',
    3: 'Prata. Volume consistente, ritmo profissional.',
    4: 'Ouro. Não é mais iniciante — está construindo legado.',
    5: 'Platina. Território de quem opera de verdade.',
    6: 'Esmeralda. Alto desempenho reconhecido pelo time.',
    7: 'Safira. Top performer da operação.',
    8: 'Rubi. Elite operacional — referência.',
    9: 'Diamante. Excelência rara, poucos chegam aqui.',
    10: 'Mestre. Você define o padrão da casa.',
    11: 'Elite. Domínio total da operação — quase intocável.',
    12: 'Lendário. Hall of Fame — sua história entra na lenda.',
    13: 'Imortal. Inalcançável pra maioria, eterno no ranking.',
    14: 'Supremo. Mítico. Praticamente um fenômeno.',
    15: 'APEX. O topo absoluto. Ninguém acima de você.',
  }[rank.tier] || ''

  // Posição global (rank.tier de 15)
  const positionLabel = `Top ${rank.tier} de 15`

  return (
    <motion.div
      key={rank.tier}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      style={{
        position: 'relative', overflow: 'hidden',
        marginTop: 18, padding: '18px 22px', borderRadius: 14,
        background: `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(0,0,0,0.55) 100%)`,
        border: `1px solid rgba(${rgb},${isCurrent ? 0.45 : 0.22})`,
        boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 24px rgba(${rgb},${isCurrent ? 0.3 : 0.12})`,
      }}
    >
      <div aria-hidden style={{
        position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
        background: `radial-gradient(circle at 100% 50%, rgba(${rgb},0.16) 0%, transparent 65%)`,
        filter: 'blur(20px)',
      }}/>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{
          width: 50, height: 50, borderRadius: 12,
          background: rankBackground(rank),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 22px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.55)' : rank.glow}, inset 0 2px 0 rgba(255,255,255,0.28), 0 0 0 1px rgba(255,255,255,0.18)`,
          flexShrink: 0,
        }}>
          <RankIcon name={rank.icon} size={26} color={rankTextColor(rank)} />
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h4 style={{
              fontFamily: 'var(--font-display, serif)', fontSize: 24, fontWeight: 400,
              color: isPrismatic ? '#E0E0FF' : rank.primary,
              margin: 0, letterSpacing: '-0.01em', lineHeight: 1,
              textShadow: `0 0 14px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : rank.glow}`,
            }}>{rank.name}</h4>
            {isCurrent && (
              <span style={{
                fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 999,
                background: `rgba(${rgb},0.22)`, color: isPrismatic ? '#E0E0FF' : rank.primary,
                border: `1px solid rgba(${rgb},0.5)`, letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>VOCÊ</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.55 }}>{desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <FocusStat label="Posição" value={positionLabel} icon="users" />
          {isCurrent ? (
            <FocusStat label="Próximo" value={rank.tier === 15 ? 'TOPO' : `${RANK_TIERS.find(r => r.tier === rank.tier + 1)?.name}`} icon="trophy" />
          ) : (
            <FocusStat label={isAchieved ? 'Status' : 'Faltam'} value={isAchieved ? 'Conquistado' : `${remaining.toLocaleString('pt-BR')} deps`} icon={isAchieved ? 'check' : 'target'} />
          )}
          <FocusStat label="Mínimo" value={`${rank.min.toLocaleString('pt-BR')}+`} icon="anchor" />
        </div>
      </div>
    </motion.div>
  )
}

function FocusStat({ label, value, icon }) {
  return (
    <div style={{ minWidth: 90 }}>
      <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0, fontFamily: 'var(--mono)' }}>{value}</p>
    </div>
  )
}

/* Hook helper */
export function useShowcase() {
  const [open, setOpen] = useState(false)
  return { open, openShowcase: () => setOpen(true), closeShowcase: () => setOpen(false) }
}
