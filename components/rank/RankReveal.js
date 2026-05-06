'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRank, rankBackground, rankTextColor } from '../../lib/rank-system'
import RankIcon from './RankIcon'

/**
 * Modal full-screen pra reveal do rank.
 *
 * Modos:
 *  - alwaysShow=false (default): toca uma vez por sessão de browser (primeira entrada
 *    + cada upgrade de tier). Persistência em localStorage[`nx_rank_v1_${userId}`].
 *  - alwaysShow=true: toca TODA vez que a página é montada (uso em /performance).
 *
 * IMPORTANTE: SÓ DISPARA depois que `ready=true` E `contas` está definido.
 * Sem isso, abre com Ferro (contas=0) durante loading e salva tier errado.
 */
export default function RankReveal({ userId, contas, name = 'Operador', ready = true, alwaysShow = false }) {
  const [show, setShow] = useState(false)
  const [data, setData] = useState(null)
  const triggered = useRef(false)

  useEffect(() => {
    if (triggered.current) return
    if (!ready) return
    if (!userId) return
    if (contas === undefined || contas === null) return
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return

    triggered.current = true

    const { current } = getRank(contas)

    if (alwaysShow) {
      // Toca TODA vez — sem checar localStorage
      setData({ rank: current, isUpgrade: false, prevTier: null })
      setTimeout(() => setShow(true), 700)
      return
    }

    // Modo padrão: localStorage decide
    const key = `nx_rank_v1_${userId}`
    let last = null
    try { last = localStorage.getItem(key) } catch {}
    const lastTier = last ? Number(last) : null

    // Mostra se: nunca viu (primeira vez) OU subiu de rank
    if (lastTier === null || current.tier > lastTier) {
      setData({ rank: current, isUpgrade: lastTier !== null && current.tier > lastTier, prevTier: lastTier })
      setTimeout(() => setShow(true), 700)
      try { localStorage.setItem(key, String(current.tier)) } catch {}
    }
  }, [userId, contas, ready, alwaysShow])

  function handleClose() { setShow(false) }

  if (!data) return null
  const { rank, isUpgrade } = data
  const bg = rankBackground(rank)
  const textColor = rankTextColor(rank)
  const isPrismatic = rank.primary === 'prismatic'
  const isApex = rank.tier === 15

  // Particle positions (pre-computed)
  const particles = Array.from({ length: 24 }, (_, i) => ({
    x: 50 + Math.cos((i / 24) * Math.PI * 2) * (35 + (i % 3) * 8),
    y: 50 + Math.sin((i / 24) * Math.PI * 2) * (35 + (i % 3) * 8),
    delay: 0.5 + (i % 6) * 0.05,
    size: 2 + (i % 3),
  }))

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'pointer',
          }}
        >
          {/* Ambient glow background */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.7 }}
            transition={{ delay: 0.2, duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: 'absolute', width: '60vmin', height: '60vmin', borderRadius: '50%',
              background: `radial-gradient(circle, ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.4)' : rank.glow.replace(/0\.\d+/, '0.45')} 0%, transparent 60%)`,
              filter: 'blur(40px)', pointerEvents: 'none',
            }}
          />

          {/* Particles orbital */}
          {particles.map((p, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.6, 0.8], scale: [0, 1.4, 1, 1.2] }}
              transition={{ delay: p.delay, duration: 1.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size,
                borderRadius: '50%',
                background: isPrismatic ? '#FFD700' : (isApex ? '#FFD700' : rank.primary),
                boxShadow: `0 0 8px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Pulse rings — eco de energia */}
          {[0, 0.3, 0.6].map((delay, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.4, opacity: 0.7 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ delay: 0.4 + delay, duration: 1.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 180, height: 180, borderRadius: '50%',
                border: `2px solid ${isPrismatic ? 'rgba(255,215,0,0.5)' : rank.primary}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Conteúdo */}
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 0.3 }}
            style={{
              position: 'relative', zIndex: 2,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 24,
              maxWidth: 460, width: '100%', cursor: 'default',
            }}
          >
            {/* Etiqueta superior */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
                color: 'var(--t2)', textTransform: 'uppercase',
              }}
            >
              {isUpgrade ? '⬆ Nível desbloqueado' : 'Seu nível atual'}
            </motion.div>

            {/* Ícone gigante com glow */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 110, delay: 0.6 }}
              style={{
                width: 160, height: 160, borderRadius: 32,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 80px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.6)' : rank.glow}, 0 0 200px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.3)' : rank.glow.replace(/0\.\d+/, '0.3')}, inset 0 2px 0 rgba(255,255,255,0.25)`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Shine sweep contínuo */}
              <motion.span
                aria-hidden
                animate={{ x: ['-150%', '150%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  pointerEvents: 'none',
                }}
              />
              <RankIcon name={rank.icon} size={88} color={textColor} />
              {isApex && (
                <motion.span
                  aria-hidden
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', inset: -10, pointerEvents: 'none',
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.18) 30deg, transparent 60deg, transparent 360deg)',
                  }}
                />
              )}
            </motion.div>

            {/* Tier number */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              style={{
                fontSize: 11, fontWeight: 800, color: 'var(--t3)',
                letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0,
                fontFamily: 'var(--mono)',
              }}
            >
              Tier {rank.tier} de 15
            </motion.p>

            {/* Nome do rank — gigante serif */}
            <motion.h1
              initial={{ scale: 0.85, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.33, 1, 0.68, 1] }}
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontSize: 56, fontWeight: 400, letterSpacing: '-0.03em',
                color: isPrismatic ? '#E0E0FF' : rank.primary,
                margin: 0, lineHeight: 1, textAlign: 'center',
                textShadow: `0 0 32px ${rank.glow === 'prismatic' ? 'rgba(180,120,255,0.5)' : rank.glow}`,
              }}
            >
              {rank.name}
            </motion.h1>

            {/* Descrição contextual */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              style={{
                fontSize: 14, color: 'var(--t2)', textAlign: 'center', lineHeight: 1.5,
                margin: 0, maxWidth: 380,
              }}
            >
              {rank.tier === 1 && 'Bem-vindo, ' + name + '. Sua jornada começa aqui — cada conta processada é um passo.'}
              {rank.tier === 2 && 'Bronze conquistado. Os primeiros resultados aparecem.'}
              {rank.tier === 3 && 'Prata alcançada. Volume consistente, ritmo profissional.'}
              {rank.tier === 4 && 'Ouro. Você não é mais iniciante.'}
              {rank.tier === 5 && 'Platina — território de quem opera de verdade.'}
              {rank.tier === 6 && 'Esmeralda. Alto desempenho reconhecido.'}
              {rank.tier === 7 && 'Safira. Top performer da sua operação.'}
              {rank.tier === 8 && 'Rubi. Elite operacional.'}
              {rank.tier === 9 && 'Diamante. Excelência rara.'}
              {rank.tier === 10 && 'Mestre. Você define o padrão.'}
              {rank.tier === 11 && 'Elite. Domínio total da operação.'}
              {rank.tier === 12 && 'Lendário. Hall of Fame.'}
              {rank.tier === 13 && 'Imortal. Inalcançável pra maioria.'}
              {rank.tier === 14 && 'Supremo. Mítico.'}
              {rank.tier === 15 && 'APEX. Topo absoluto. Ninguém acima.'}
            </motion.p>

            {/* CTA */}
            <motion.button
              type="button"
              onClick={handleClose}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 8,
                padding: '12px 28px', borderRadius: 10,
                background: '#e53935', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(229,57,53,0.4)',
              }}
            >
              Continuar
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              style={{ fontSize: 10, color: 'var(--t4)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Toque fora pra fechar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
