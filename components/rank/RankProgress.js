'use client'
import { motion } from 'framer-motion'
import { getRank, rankBackground, rankTextColor, getNextRanks } from '../../lib/rank-system'
import RankIcon from './RankIcon'

/**
 * Card hero — mostra rank atual, progresso pra próximo, próximos 3 níveis.
 * Usado em /performance (operator) e /operadores (drawer).
 */
export default function RankProgress({ contas, name = 'Voce', compact = false }) {
  const { current, next, progress, isMax, remaining } = getRank(contas)
  const nextRanks = getNextRanks(current.tier, 3)
  const bg = rankBackground(current)
  const textColor = rankTextColor(current)
  const isPrismatic = current.primary === 'prismatic'

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 16,
      background: '#000',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: compact ? 18 : 24,
    }}>
      {/* Glow lateral do rank atual */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, right: 0, width: '60%', height: '100%',
        background: `radial-gradient(circle at 100% 50%, ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.18)' : current.glow.replace(/0\.\d+/, '0.18')} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>

      {/* Linha 1: ícone + nome + tier */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          style={{
            width: compact ? 56 : 72, height: compact ? 56 : 72,
            borderRadius: 14,
            background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 32px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.55)' : current.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            flexShrink: 0,
            position: 'relative', overflow: 'hidden',
          }}
        >
          <RankIcon name={current.icon} size={compact ? 28 : 38} color={textColor} />
          {/* Shine pass */}
          <motion.span
            aria-hidden
            initial={{ x: '-150%' }}
            animate={{ x: '150%' }}
            transition={{ delay: 0.3, duration: 1.4, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 0, left: 0, width: '60%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, marginBottom: 2 }}>
            Rank atual · Tier {current.tier}/15
          </p>
          <h2 style={{
            fontSize: compact ? 22 : 28, fontWeight: 800, letterSpacing: '-0.02em',
            color: isPrismatic ? '#E0E0FF' : current.primary,
            margin: 0, lineHeight: 1.1,
            textShadow: `0 0 16px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : current.glow}`,
            fontFamily: 'var(--font-display, serif)',
          }}>
            {current.name}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0' }}>
            <span style={{ color: 'var(--t1)', fontWeight: 700, fontFamily: 'var(--mono)' }}>{contas.toLocaleString('pt-BR')}</span> depositantes processados
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      {!isMax && (
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>
              Próximo: <span style={{ color: next.primary === 'prismatic' ? '#E0E0FF' : next.primary, fontWeight: 700 }}>{next.name}</span>
            </span>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--t3)', fontWeight: 600 }}>
              faltam <span style={{ color: 'var(--t1)' }}>{remaining.toLocaleString('pt-BR')}</span>
            </span>
          </div>
          <div style={{
            height: 8, borderRadius: 4, overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.4, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
              style={{
                height: '100%', borderRadius: 4,
                background: bg,
                boxShadow: `0 0 12px ${current.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : current.glow}`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Animated shimmer */}
              <motion.span
                aria-hidden
                initial={{ x: '-100%' }}
                animate={{ x: '300%' }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1.6 }}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                }}
              />
            </motion.div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t4)' }}>{current.min.toLocaleString('pt-BR')}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t1)', fontWeight: 700 }}>{progress.toFixed(1)}%</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t4)' }}>{next.min.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      )}

      {isMax && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(255,215,0,0.04)',
          border: '1px solid rgba(255,215,0,0.2)',
          marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <RankIcon name="apex" size={18} color="#FFD700" />
          <span style={{ fontSize: 12, color: '#FFD700', fontWeight: 700, letterSpacing: '0.04em' }}>
            TOPO ABSOLUTO ATINGIDO — Nenhum operador acima de você.
          </span>
        </div>
      )}

      {/* Próximos 3 ranks como teaser */}
      {!compact && nextRanks.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, marginBottom: 8 }}>
            Próximos níveis
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${nextRanks.length}, 1fr)`, gap: 6 }}>
            {nextRanks.map(r => (
              <div key={r.tier} style={{
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 5,
                  background: rankBackground(r),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, opacity: 0.85,
                }}>
                  <RankIcon name={r.icon} size={12} color={rankTextColor(r)} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: r.primary === 'prismatic' ? '#E0E0FF' : r.primary, margin: 0, lineHeight: 1, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.name}
                  </p>
                  <p style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--t4)', margin: '2px 0 0' }}>
                    {r.min.toLocaleString('pt-BR')}+
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
