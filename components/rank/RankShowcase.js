'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RANK_TIERS, getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'
import { RankAura, OrbitalParticles, ShinePass, SignatureOverlay } from './RankFX'

/**
 * Vitrine cinematográfica AAA dos 15 ranks.
 * Cada linha é uma cena viva com hover/click feedback, idle animation própria,
 * energia fluindo entre os tiers, Apex como espetáculo holográfico.
 */
export default function RankShowcase({ contas, mode = 'inline', open = false, onClose, forceApex = false }) {
  const { current } = getRank(contas, { forceApex })
  const currentTier = current.tier
  const [expanded, setExpanded] = useState(null) // tier expandido por click

  const content = (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* ─── ENERGY SPINE: linha vertical viva conectando todos os ranks ─── */}
      <EnergySpine highestTier={currentTier} />

      {RANK_TIERS.map((rank, i) => (
        <RankRow
          key={rank.tier}
          rank={rank}
          contas={contas}
          index={i}
          currentTier={currentTier}
          isExpanded={expanded === rank.tier}
          onToggle={() => setExpanded(expanded === rank.tier ? null : rank.tier)}
        />
      ))}
    </div>
  )

  if (mode === 'inline') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{
            fontFamily: 'var(--font-display, serif)', fontSize: 28, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'var(--t1)', margin: 0,
          }}>
            Sistema de Ranks
          </h3>
          <span style={{
            position: 'relative', overflow: 'hidden',
            fontSize: 11, fontWeight: 800, color: 'var(--t3)',
            letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)',
            padding: '5px 13px', borderRadius: 8,
            background: `rgba(${current.rgb || '255,255,255'},0.06)`,
            border: `1px solid rgba(${current.rgb || '255,255,255'},0.22)`,
          }}>
            <ShinePass duration={2} interval={5} color="rgba(255,255,255,0.2)" />
            Você está em <span style={{ color: current.primary === 'prismatic' ? '#E0E0FF' : current.primary, marginLeft: 4 }}>{current.name}</span>
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
              maxWidth: 640, width: '100%', maxHeight: '92vh', overflowY: 'auto',
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
                }}
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
   ENERGY SPINE — linha vertical com partículas subindo
   Sensação real de energia fluindo entre os tiers conquistados
   ─────────────────────────────────────────── */
function EnergySpine({ highestTier }) {
  // Partículas que sobem da base até a altura do rank atual
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    delay: i * 1.6,
    dur: 5.5 + (i % 3) * 1.2,
    size: 2 + (i % 3),
    hue: i % 2 === 0 ? 'rgba(180,120,255,0.9)' : 'rgba(255,215,0,0.7)',
  })), [])

  return (
    <div aria-hidden style={{
      position: 'absolute',
      left: 51, top: 28, bottom: 28, width: 2,
      pointerEvents: 'none',
      borderRadius: 2,
      overflow: 'visible',
    }}>
      {/* Trilho base — gradient gentil */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 2,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.05) 8%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.05) 92%, transparent 100%)',
      }}/>

      {/* Glow fluindo — gradiente animado */}
      <motion.div
        animate={{ backgroundPosition: ['0% 200%', '0% -100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0, borderRadius: 2,
          background: 'linear-gradient(180deg, transparent 0%, rgba(180,120,255,0) 30%, rgba(180,120,255,0.55) 50%, rgba(255,215,0,0.3) 65%, transparent 80%)',
          backgroundSize: '100% 300%', filter: 'blur(1px)',
        }}
      />

      {/* Partículas subindo */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '-10%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute', left: '50%',
            transform: 'translateX(-50%)',
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.hue,
            boxShadow: `0 0 ${p.size * 4}px ${p.hue}`,
          }}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────
   RANK ROW — linha cinematográfica
   ─────────────────────────────────────────── */
function RankRow({ rank, contas, index, currentTier, isExpanded, onToggle }) {
  const [hover, setHover] = useState(false)
  const isAchieved = currentTier >= rank.tier
  const isCurrent = currentTier === rank.tier
  const isNext = currentTier === rank.tier - 1
  const isElite = rank.tier >= 12
  const isApex = rank.tier === 15
  const isSupremo = rank.tier === 14
  const isImortal = rank.tier === 13
  const isLendario = rank.tier === 12
  const isPrismatic = rank.primary === 'prismatic'
  const remaining = isAchieved ? 0 : Math.max(0, rank.min - contas)
  const rgb = rank.rgb || '255,255,255'

  // Idle animation per signature
  const idle = rank.idle

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ delay: index * 0.03, duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={onToggle}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: isElite ? '16px 18px' : (isCurrent ? '14px 16px' : '12px 16px'),
        borderRadius: isElite ? 14 : 12,
        cursor: 'pointer',
        background: isCurrent
          ? `linear-gradient(90deg, rgba(${rgb},0.16) 0%, rgba(${rgb},0.05) 60%, rgba(0,0,0,0.6) 100%)`
          : isElite
            ? `linear-gradient(90deg, rgba(${rgb},${hover ? 0.1 : 0.045}) 0%, rgba(0,0,0,0.55) 100%)`
            : (hover ? `rgba(${rgb},0.05)` : 'rgba(255,255,255,0.018)'),
        border: isCurrent
          ? `1px solid rgba(${rgb},0.6)`
          : `1px solid rgba(${rgb},${isElite ? (hover ? 0.42 : 0.22) : (hover ? 0.24 : 0.08)})`,
        opacity: isAchieved || isCurrent || isNext || isElite ? 1 : 0.62,
        boxShadow: isCurrent
          ? `0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(${rgb},0.34), inset 0 1px 0 rgba(255,255,255,0.06)`
          : isElite
            ? `0 10px 28px rgba(0,0,0,0.45), 0 0 ${hover ? 32 : 20}px rgba(${rgb},${hover ? 0.34 : 0.18}), inset 0 1px 0 rgba(255,255,255,0.05)`
            : hover
              ? `0 8px 22px rgba(0,0,0,0.4), 0 0 18px rgba(${rgb},0.2)`
              : 'none',
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Camadas de fundo */}
      {isElite && <RankAura rank={rank} intensity={hover || isCurrent ? 1.2 : 0.6} />}
      {(isCurrent || (isElite && hover) || isApex) && <SignatureOverlay rank={rank} />}

      {/* Travel light na borda — efeito conic mask animado no hover */}
      {(hover || isCurrent || isApex) && <TravelBorder rank={rank} active={hover || isCurrent || isApex} />}

      {/* Particles orbitais */}
      {(isApex || (isElite && (isCurrent || hover))) && (
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0, width: 130, height: '100%', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <OrbitalParticles
            rank={rank}
            count={isApex ? 7 : 4}
            radius={isElite ? 44 : 32}
            size={isApex ? 3 : 2}
            speed={isApex ? 11 : 16}
          />
          {/* Apex: 2ª órbita externa em sentido contrário */}
          {isApex && <OrbitalParticles rank={rank} count={4} radius={68} size={2} speed={18} />}
        </div>
      )}

      {/* Apex extra: stardust */}
      {isApex && <ApexStardust />}

      {/* Shine pass on hover */}
      {hover && <ShinePass duration={1.4} interval={2.2} color={`rgba(${rgb},0.28)`} />}

      {/* Tier number */}
      <div style={{
        position: 'relative', flexShrink: 0,
        minWidth: 30, textAlign: 'center',
        fontSize: 12, fontWeight: 900,
        color: isCurrent ? (isPrismatic ? '#E0E0FF' : rank.primary) : (isAchieved ? 'var(--t2)' : 'var(--t4)'),
        fontFamily: 'var(--mono)', letterSpacing: '0.04em',
        textShadow: isCurrent ? `0 0 12px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}` : 'none',
        zIndex: 1,
      }}>
        {String(rank.tier).padStart(2, '0')}
      </div>

      {/* Ícone — refinado com idle animation */}
      <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
        {/* Halo */}
        {(isAchieved || isCurrent || (isElite && hover)) && (
          <motion.div
            aria-hidden
            animate={isCurrent || isApex ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: -8, borderRadius: 16,
              background: `radial-gradient(circle, ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : rank.glow.replace(/0\.\d+/, hover || isCurrent ? '0.5' : '0.28')} 0%, transparent 65%)`,
              filter: 'blur(10px)', pointerEvents: 'none',
            }}
          />
        )}

        <RankIconBox rank={rank} hover={hover} isCurrent={isCurrent} isElite={isElite} idle={idle} />
      </div>

      {/* Conteúdo central */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <p style={{
            fontSize: isElite ? 17 : (isCurrent ? 15 : 14),
            color: isPrismatic ? '#E0E0FF' : (isAchieved || isCurrent || isNext || isElite ? rank.primary : 'var(--t3)'),
            margin: 0, letterSpacing: '0.01em', lineHeight: 1.1,
            textShadow: isCurrent || (isElite && hover)
              ? `0 0 14px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.55)' : rank.glow}`
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
          {(isImortal || isLendario) && !isCurrent && <PremiumBadge label="ELITE" rank={rank} variant="elite" />}
        </div>
        <p style={{
          fontSize: 12, color: 'var(--t4)', margin: 0,
          fontFamily: 'var(--mono)', letterSpacing: '0.02em', fontWeight: 600,
        }}>
          {rank.min.toLocaleString('pt-BR')}+ depositantes
        </p>
      </div>

      {/* Status à direita */}
      <div style={{ position: 'relative', flexShrink: 0, textAlign: 'right', zIndex: 1 }}>
        {isAchieved && !isCurrent && (
          <motion.div
            whileHover={{ scale: 1.12, rotate: 8 }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(31,228,168,0.1)',
              border: '1px solid rgba(31,228,168,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(31,228,168,0.28)',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#1FE4A8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </motion.div>
        )}
        {isCurrent && (
          <motion.span
            animate={{ boxShadow: [`0 0 14px rgba(${rgb},0.25), inset 0 1px 0 rgba(255,255,255,0.08)`, `0 0 22px rgba(${rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.12)`, `0 0 14px rgba(${rgb},0.25), inset 0 1px 0 rgba(255,255,255,0.08)`] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 13, fontWeight: 900, color: 'var(--t1)', fontFamily: 'var(--mono)',
              background: `rgba(${rgb},0.14)`,
              padding: '6px 14px', borderRadius: 8,
              border: `1px solid rgba(${rgb},0.4)`,
              letterSpacing: '0.02em',
            }}
          >
            {contas.toLocaleString('pt-BR')}
          </motion.span>
        )}
        {!isAchieved && !isCurrent && remaining > 0 && (
          <span style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
            faltam <span style={{ color: 'var(--t2)', fontWeight: 800 }}>{remaining.toLocaleString('pt-BR')}</span>
          </span>
        )}
      </div>

      {/* EXPANDED PANEL — quando user clica no rank */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            style={{ position: 'relative', zIndex: 1, gridColumn: '1 / -1', flexBasis: '100%', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <RankExpandedDetails rank={rank} contas={contas} isAchieved={isAchieved} isCurrent={isCurrent} remaining={remaining} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ───────────────────────────────────────────
   ICON BOX com idle animations distintas
   ─────────────────────────────────────────── */
function RankIconBox({ rank, hover, isCurrent, isElite, idle }) {
  const isApex = rank.tier === 15
  const idleAnim = useMemo(() => {
    if (idle === 'shimmer-gold' || idle === 'shimmer') return { scale: [1, 1.04, 1] }
    if (idle === 'pulse' || idle === 'pulse-slow') return { scale: [1, 1.06, 1] }
    if (idle === 'sparkle') return { rotate: [0, 4, -4, 0] }
    if (idle === 'flicker') return { opacity: [1, 0.85, 1] }
    if (idle === 'fire') return { y: [0, -2, 0] }
    if (idle === 'aura') return { scale: [1, 1.08, 1] }
    if (idle === 'cosmic' || idle === 'apex') return { scale: [1, 1.1, 1] }
    return {}
  }, [idle])
  const idleDur = useMemo(() => {
    if (idle === 'pulse-slow') return 4.5
    if (idle === 'pulse' || idle === 'aura') return 2.6
    if (idle === 'fire') return 1.4
    if (idle === 'flicker') return 0.4
    if (idle === 'shimmer-gold') return 5
    if (idle === 'shimmer') return 3.2
    if (idle === 'sparkle') return 5
    if (idle === 'cosmic') return 6
    if (idle === 'apex') return 3.5
    return 3
  }, [idle])

  return (
    <motion.div
      animate={idleAnim}
      transition={{ duration: idleDur, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'relative',
        width: isElite ? 50 : (isCurrent ? 44 : 40),
        height: isElite ? 50 : (isCurrent ? 44 : 40),
        borderRadius: 12,
        background: rankBackground(rank),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: hover || isCurrent || isApex
          ? `0 0 0 1px rgba(255,255,255,0.22), 0 0 ${isElite ? 24 : 16}px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}, inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -2px 0 rgba(0,0,0,0.22)`
          : `0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.12)`,
        filter: !hover && !isCurrent && rank.tier > 0 && !isElite ? 'none' : 'none',
        transition: 'box-shadow 0.3s, filter 0.3s',
      }}
    >
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.28) 0%, transparent 55%)`,
        pointerEvents: 'none',
      }}/>
      {(isElite || isCurrent) && <ShinePass duration={2.4} interval={5} color="rgba(255,255,255,0.38)" />}
      <RankIcon name={rank.icon} size={isElite ? 25 : (isCurrent ? 22 : 20)} color={rankTextColor(rank)} />
      {isApex && (
        <>
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -6, pointerEvents: 'none',
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.36) 30deg, transparent 60deg, transparent 360deg)',
            }}
          />
          <motion.span
            aria-hidden
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -3, pointerEvents: 'none',
              background: 'conic-gradient(from 90deg, transparent 0deg, rgba(180,120,255,0.3) 40deg, transparent 80deg, transparent 360deg)',
            }}
          />
        </>
      )}
    </motion.div>
  )
}

/* ───────────────────────────────────────────
   TRAVEL BORDER — luz percorrendo a borda no hover
   Usa conic-gradient + mask pra simular um filete de luz dando volta no card
   ─────────────────────────────────────────── */
function TravelBorder({ rank, active }) {
  const rgb = rank.rgb || '255,255,255'
  const isApex = rank.tier === 15

  if (!active) return null

  return (
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: isApex ? 4 : 6, repeat: Infinity, ease: 'linear' }}
      style={{
        position: 'absolute', inset: -1, borderRadius: 'inherit',
        padding: 1, pointerEvents: 'none',
        background: isApex
          ? 'conic-gradient(from 0deg, transparent 0deg, transparent 240deg, rgba(180,120,255,0.9) 300deg, rgba(255,215,0,0.9) 330deg, rgba(180,120,255,0.9) 350deg, transparent 360deg)'
          : `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(${rgb},0.85) 320deg, rgba(255,255,255,0.6) 340deg, rgba(${rgb},0.85) 350deg, transparent 360deg)`,
        mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        maskComposite: 'exclude', WebkitMaskComposite: 'xor',
        opacity: 0.9,
      }}
    />
  )
}

/* ───────────────────────────────────────────
   APEX STARDUST — poeira dourada caindo
   ─────────────────────────────────────────── */
function ApexStardust() {
  const dust = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x: 60 + (i * 8) % 35,
    delay: i * 1.2,
    dur: 4 + (i % 3),
    size: 1 + (i % 2),
  })), [])

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {dust.map((d, i) => (
        <motion.span
          key={i}
          initial={{ y: '-20%', opacity: 0 }}
          animate={{ y: '120%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: d.dur, repeat: Infinity, ease: 'linear', delay: d.delay }}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            width: d.size, height: d.size,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#FFD700' : '#B478FF',
            boxShadow: `0 0 ${d.size * 4}px ${i % 2 === 0 ? '#FFD700' : '#B478FF'}`,
          }}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────
   EXPANDED DETAILS — painel que abre ao clicar no rank
   ─────────────────────────────────────────── */
function RankExpandedDetails({ rank, contas, isAchieved, isCurrent, remaining }) {
  const rgb = rank.rgb || '255,255,255'
  const isPrismatic = rank.primary === 'prismatic'
  const isApex = rank.tier === 15

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

  return (
    <div style={{
      marginTop: 14, padding: '14px 16px', borderRadius: 12,
      background: `linear-gradient(135deg, rgba(${rgb},0.06) 0%, rgba(0,0,0,0.4) 100%)`,
      border: `1px solid rgba(${rgb},0.18)`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <p style={{
        fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.55, fontStyle: 'italic',
      }}>
        “{desc}”
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, fontFamily: 'var(--mono)' }}>
        <span style={{ color: 'var(--t3)' }}>
          MIN: <span style={{ color: isPrismatic ? '#E0E0FF' : rank.primary, fontWeight: 800 }}>{rank.min.toLocaleString('pt-BR')}</span>
        </span>
        {isCurrent && (
          <span style={{ color: 'var(--t3)' }}>
            ATUAL: <span style={{ color: 'var(--t1)', fontWeight: 800 }}>{contas.toLocaleString('pt-BR')}</span>
          </span>
        )}
        {!isAchieved && remaining > 0 && (
          <span style={{ color: 'var(--t3)' }}>
            FALTAM: <span style={{ color: 'var(--t2)', fontWeight: 800 }}>{remaining.toLocaleString('pt-BR')}</span>
          </span>
        )}
        <span style={{ color: 'var(--t3)' }}>
          TIER: <span style={{ color: 'var(--t1)', fontWeight: 800 }}>{rank.tier}/15</span>
        </span>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────
   PREMIUM BADGE — cápsulas com glow respirando
   ─────────────────────────────────────────── */
function PremiumBadge({ label, rank, variant = 'current' }) {
  const rgb = rank.rgb || '255,255,255'
  const isApex = variant === 'apex'
  const isSupreme = variant === 'supreme'
  const isCurrent = variant === 'current'

  const bg = isApex
    ? 'linear-gradient(90deg, rgba(180,120,255,0.22), rgba(255,215,0,0.22))'
    : isSupreme
      ? 'linear-gradient(90deg, rgba(255,107,157,0.14), rgba(199,125,255,0.14), rgba(79,195,247,0.14))'
      : `rgba(${rgb},0.20)`
  const borderColor = isApex
    ? 'rgba(255,215,0,0.6)'
    : isSupreme
      ? 'rgba(199,125,255,0.5)'
      : `rgba(${rgb},0.5)`
  const textColor = isApex
    ? '#FFD700'
    : isSupreme
      ? '#E0E0FF'
      : (rank.primary === 'prismatic' ? '#E0E0FF' : rank.primary)

  return (
    <motion.span
      animate={isApex || isSupreme || isCurrent
        ? { boxShadow: [
            `0 0 8px ${isApex ? 'rgba(255,215,0,0.3)' : isSupreme ? 'rgba(199,125,255,0.3)' : `rgba(${rgb},0.3)`}`,
            `0 0 18px ${isApex ? 'rgba(255,215,0,0.55)' : isSupreme ? 'rgba(199,125,255,0.55)' : `rgba(${rgb},0.55)`}`,
            `0 0 8px ${isApex ? 'rgba(255,215,0,0.3)' : isSupreme ? 'rgba(199,125,255,0.3)' : `rgba(${rgb},0.3)`}`,
          ]}
        : {}
      }
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        fontSize: 9, fontWeight: 900,
        padding: '3px 10px', borderRadius: 999,
        background: bg, color: textColor,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
        textShadow: `0 0 8px ${isApex ? 'rgba(255,215,0,0.5)' : (rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow)}`,
      }}
    >
      <ShinePass duration={1.6} interval={3.5} color="rgba(255,255,255,0.4)" />
      {label}
    </motion.span>
  )
}

/* ── Hook helper pra abrir modal de qualquer lugar ── */
export function useShowcase() {
  const [open, setOpen] = useState(false)
  return { open, openShowcase: () => setOpen(true), closeShowcase: () => setOpen(false) }
}
