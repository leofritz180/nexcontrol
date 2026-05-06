'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { getRank, rankBackground, rankTextColor, getNextRanks } from '../../lib/rank-system'
import RankIcon from './RankIcon'
import { RankAura, OrbitalParticles, GlowBorder, ShinePass, SignatureOverlay } from './RankFX'

/**
 * Card hero premium do rank atual.
 * Camadas: aura ambiente → partículas orbitais (elite+) → glass overlay →
 *          conteúdo (ícone com glow refinado, título serif gradient, barra
 *          de energia com light traveling, próximos níveis com hover).
 */
export default function RankProgress({ contas, name = 'Voce', compact = false, forceApex = false }) {
  const { current, next, progress, isMax, remaining } = getRank(contas, { forceApex })
  const nextRanks = getNextRanks(current.tier, 3)
  const bg = rankBackground(current)
  const textColor = rankTextColor(current)
  const isPrismatic = current.primary === 'prismatic'
  const isApex = current.tier === 15
  const isElite = current.tier >= 12
  const rgb = current.rgb || '255,255,255'

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', damping: 22, stiffness: 240 }}
      style={{
        position: 'relative',
        borderRadius: 20,
        background: '#000',
        padding: 1, // espaço pra GlowBorder
        overflow: 'hidden',
        boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 60px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.12)' : current.glow.replace(/0\.\d+/, '0.12')}`,
      }}
    >
      <GlowBorder rank={current} thickness={1} intensity={1.2} />

      <div style={{
        position: 'relative',
        borderRadius: 19,
        background: '#000',
        padding: compact ? 22 : 28,
        overflow: 'hidden',
      }}>
        {/* Camadas de fundo */}
        <RankAura rank={current} intensity={1.2} />
        <SignatureOverlay rank={current} />

        {/* Glass overlay */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)',
        }}/>

        {/* Particles only on elite ranks */}
        {isElite && (
          <div aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, pointerEvents: 'none' }}>
            <OrbitalParticles rank={current} count={isApex ? 6 : 4} radius={90} size={3} speed={isApex ? 18 : 14} />
          </div>
        )}

        {/* Linha 1: ícone + nome + tier */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>

          {/* ícone container ABSURDO */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 180 }}
            style={{ position: 'relative', flexShrink: 0 }}
          >
            {/* Halo externo */}
            <motion.div
              aria-hidden
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -14, borderRadius: 22,
                background: `radial-gradient(circle, ${isPrismatic ? 'rgba(180,120,255,0.35)' : current.glow.replace(/0\.\d+/, '0.35')} 0%, transparent 60%)`,
                filter: 'blur(10px)', pointerEvents: 'none',
              }}
            />
            <div style={{
              position: 'relative',
              width: compact ? 76 : 92, height: compact ? 76 : 92,
              borderRadius: 18,
              background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.18),
                0 12px 32px rgba(0,0,0,0.5),
                0 0 38px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.55)' : current.glow},
                inset 0 2px 0 rgba(255,255,255,0.30),
                inset 0 -2px 0 rgba(0,0,0,0.25)
              `,
            }}>
              {/* Inner glow */}
              <div aria-hidden style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)`,
                pointerEvents: 'none',
              }}/>
              <ShinePass duration={2.2} interval={5} color="rgba(255,255,255,0.35)" />
              <RankIcon name={current.icon} size={compact ? 36 : 46} color={textColor} />
              {isApex && (
                <motion.span
                  aria-hidden
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', inset: -8, pointerEvents: 'none',
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.25) 35deg, transparent 70deg, transparent 360deg)',
                  }}
                />
              )}
            </div>
          </motion.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Tier label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.18em',
                textTransform: 'uppercase', fontFamily: 'var(--mono)',
              }}>
                Rank atual
              </span>
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: isPrismatic ? '#E0E0FF' : current.primary,
                letterSpacing: '0.12em', fontFamily: 'var(--mono)',
                padding: '2px 8px', borderRadius: 4,
                background: `rgba(${rgb},0.10)`,
                border: `1px solid rgba(${rgb},0.25)`,
              }}>
                T{current.tier} · {current.tier}/15
              </span>
            </div>
            {/* Nome do rank — gigante com gradient */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
              style={{
                fontSize: compact ? 36 : 48, fontWeight: 400, letterSpacing: '-0.03em',
                margin: 0, lineHeight: 1, fontFamily: 'var(--font-display, serif)',
                background: isPrismatic
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #E0E0FF 50%, #FFD700 100%)'
                  : isApex
                    ? 'linear-gradient(135deg, #B478FF 0%, #FFD700 50%, #4FC3F7 100%)'
                    : `linear-gradient(135deg, ${current.primary} 0%, rgba(255,255,255,0.95) 50%, ${current.primary} 100%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent', color: 'transparent',
                filter: `drop-shadow(0 0 18px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : current.glow})`,
              }}
            >
              {current.name}
            </motion.h2>
            <p style={{ fontSize: 15, color: 'var(--t2)', margin: '8px 0 0' }}>
              <span style={{ color: 'var(--t1)', fontWeight: 800, fontFamily: 'var(--mono)', fontSize: 17 }}>
                {contas.toLocaleString('pt-BR')}
              </span>
              <span style={{ marginLeft: 6, fontSize: 13, color: 'var(--t3)' }}>
                depositantes processados
              </span>
            </p>
          </div>
        </div>

        {/* Barra de progresso premium — energia fluindo */}
        {!isMax && (
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>
                Próximo:{' '}
                <span style={{
                  color: next.primary === 'prismatic' ? '#E0E0FF' : next.primary, fontWeight: 800, letterSpacing: '0.02em',
                  textShadow: `0 0 12px ${next.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : next.glow}`,
                }}>{next.name}</span>
              </span>
              <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--t3)', fontWeight: 600 }}>
                faltam <span style={{ color: 'var(--t1)', fontWeight: 800 }}>{remaining.toLocaleString('pt-BR')}</span>
              </span>
            </div>

            {/* Bar container com depth */}
            <div style={{
              position: 'relative', height: 12, borderRadius: 7, overflow: 'hidden',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.04)',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.6, ease: [0.33, 1, 0.68, 1], delay: 0.3 }}
                style={{
                  position: 'relative', height: '100%', borderRadius: 7,
                  background: bg,
                  boxShadow: `0 0 16px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.55)' : current.glow}, inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.2)`,
                  overflow: 'hidden',
                }}
              >
                {/* Light traveling */}
                <motion.span
                  aria-hidden
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', delay: 1.6 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                  }}
                />
                {/* Pulse no fim */}
                <motion.span
                  aria-hidden
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', right: 0, top: '50%',
                    transform: 'translate(50%, -50%)',
                    width: 18, height: 18, borderRadius: '50%',
                    background: isPrismatic ? '#FFFFFF' : current.primary,
                    boxShadow: `0 0 14px ${current.glow === 'prismatic' ? 'rgba(255,255,255,0.7)' : current.glow}`,
                    filter: 'blur(2px)',
                  }}
                />
              </motion.div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--t3)', fontWeight: 600 }}>
                {current.min.toLocaleString('pt-BR')}
              </span>
              <span style={{
                fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--t1)', fontWeight: 800,
                textShadow: `0 0 10px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : current.glow}`,
              }}>
                {progress.toFixed(1)}%
              </span>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--t3)', fontWeight: 600 }}>
                {next.min.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {isMax && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '14px 18px', borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(255,215,0,0.08) 0%, rgba(180,120,255,0.05) 100%)',
              border: '1px solid rgba(255,215,0,0.3)',
              marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <ShinePass duration={2.5} interval={4} color="rgba(255,215,0,0.25)" />
            <RankIcon name="apex" size={22} color="#FFD700" />
            <div>
              <p style={{ fontSize: 13, color: '#FFD700', fontWeight: 800, letterSpacing: '0.06em', margin: 0, textTransform: 'uppercase' }}>
                APEX · TOPO ABSOLUTO
              </p>
              <p style={{ fontSize: 12, color: 'var(--t2)', margin: '2px 0 0' }}>
                Nenhum operador acima de você. Você define o teto.
              </p>
            </div>
          </motion.div>
        )}

        {/* Próximos níveis com hover vivo */}
        {!compact && nextRanks.length > 0 && (
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0, marginBottom: 10, fontFamily: 'var(--mono)' }}>
              Próximos níveis
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${nextRanks.length}, 1fr)`, gap: 10 }}>
              {nextRanks.map(r => <NextRankCard key={r.tier} rank={r} />)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* Card miniatura do próximo nível com hover refinado */
function NextRankCard({ rank }) {
  const [hover, setHover] = useState(false)
  const isPrismatic = rank.primary === 'prismatic'
  const isApex = rank.tier === 15
  const rgb = rank.rgb || '255,255,255'

  return (
    <motion.div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: '12px 14px', borderRadius: 12,
        background: hover ? `rgba(${rgb},0.06)` : 'rgba(255,255,255,0.025)',
        border: `1px solid rgba(${rgb},${hover ? 0.35 : 0.12})`,
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background 0.25s, border-color 0.25s',
        boxShadow: hover ? `0 8px 24px rgba(0,0,0,0.4), 0 0 24px rgba(${rgb},0.18)` : 'none',
      }}
    >
      {hover && <ShinePass duration={1.4} interval={2.5} color={`rgba(${rgb},0.25)`} />}
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: rankBackground(rank),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: hover
          ? `0 0 16px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
          : `0 0 8px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.3)' : rank.glow.replace(/0\.\d+/, '0.3')}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        transition: 'box-shadow 0.25s',
      }}>
        <RankIcon name={rank.icon} size={17} color={rankTextColor(rank)} />
        {isApex && hover && (
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'conic-gradient(from 0deg, transparent, rgba(255,215,0,0.4), transparent 60deg)',
            }}
          />
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: '0.01em',
          color: isPrismatic ? '#E0E0FF' : rank.primary,
          textShadow: hover ? `0 0 10px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow}` : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {rank.name}
        </p>
        <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--t3)', margin: '4px 0 0', fontWeight: 600 }}>
          {rank.min.toLocaleString('pt-BR')}+
        </p>
      </div>
    </motion.div>
  )
}
