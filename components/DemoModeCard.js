'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { exitDemoMode } from '../lib/demo-data'

/**
 * Card interativo que avisa o usuario que esta no MODO DEMO.
 * Aparece 3 segundos apos a pagina carregar (so na primeira vez por sessao
 * de browser pra nao virar spam). Tem botao vermelho proeminente "SAIR DO MODO DEMO".
 *
 * Props:
 *  - userId: pra persistir o exit em localStorage
 *  - onExit: callback opcional disparado depois de exitDemoMode
 *  - delay: ms antes de aparecer (default 3000)
 */
export default function DemoModeCard({ userId, onExit, delay = 3000 }) {
  const [show, setShow] = useState(false)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (!userId) return
    if (typeof window === 'undefined') return
    // Ja viu nessa sessao? skip
    let seen = false
    try { seen = sessionStorage.getItem(`nx_demo_card_seen_${userId}`) === '1' } catch {}
    if (seen) return
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [userId, delay])

  function handleClose() {
    setClosed(true)
    setShow(false)
    try { sessionStorage.setItem(`nx_demo_card_seen_${userId}`, '1') } catch {}
  }

  function handleExit() {
    exitDemoMode(userId)
    setClosed(true)
    setShow(false)
    try { sessionStorage.setItem(`nx_demo_card_seen_${userId}`, '1') } catch {}
    if (onExit) onExit()
  }

  return (
    <AnimatePresence>
      {show && !closed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          style={{
            position: 'fixed',
            bottom: 24, right: 24,
            maxWidth: 440, width: 'calc(100% - 48px)',
            zIndex: 9990,
            borderRadius: 18,
            padding: 1, // pra glow border
            background: 'linear-gradient(135deg, rgba(229,57,53,0.6), rgba(229,57,53,0.2), rgba(255,140,140,0.4))',
            boxShadow: '0 28px 60px rgba(0,0,0,0.6), 0 0 50px rgba(229,57,53,0.25)',
          }}
        >
          {/* Animated border gradient */}
          <motion.div
            aria-hidden
            animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 18, padding: 1,
              background: 'linear-gradient(110deg, rgba(229,57,53,0.6) 0%, rgba(255,140,140,0.4) 50%, rgba(229,57,53,0.6) 100%)',
              backgroundSize: '200% 100%',
              mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              maskComposite: 'exclude', WebkitMaskComposite: 'xor',
              pointerEvents: 'none',
            }}
          />

          <div style={{
            position: 'relative',
            background: 'linear-gradient(145deg, #0a0a0a 0%, #050505 100%)',
            borderRadius: 17,
            padding: '20px 22px',
            overflow: 'hidden',
          }}>
            {/* Decorative glow orb */}
            <motion.div
              aria-hidden
              animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], opacity: [0.4, 0.7, 0.5, 0.4] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: -30, right: -30, width: 160, height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229,57,53,0.18) 0%, transparent 70%)',
                filter: 'blur(20px)',
                pointerEvents: 'none',
              }}
            />

            {/* Close button */}
            <button
              type="button" onClick={handleClose} aria-label="Fechar"
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 26, height: 26, borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--t3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='var(--t1)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--t3)' }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Header com pulse de atenção */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <motion.span
                animate={{ boxShadow: [
                  '0 0 0 0 rgba(229,57,53,0.6)',
                  '0 0 0 8px rgba(229,57,53,0)',
                  '0 0 0 0 rgba(229,57,53,0)',
                ] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#e53935', flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: 10, fontWeight: 900, color: '#ff6b6b',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                fontFamily: 'var(--mono)',
              }}>
                Você está no modo demonstração
              </span>
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: 'var(--font-display, serif)', fontSize: 22, fontWeight: 400,
              color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>
              Os dados que você vê não são reais.
            </h3>

            <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 16px', lineHeight: 1.55 }}>
              Esses números, operadores e remessas são <strong style={{ color: 'var(--t1)' }}>exemplos</strong> pra você
              entender como o NexControl funciona. Saia do modo demo quando quiser começar a operar de verdade.
            </p>

            {/* Bullet points */}
            <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'Crie sua primeira meta real',
                'Convide seus operadores',
                'Acompanhe lucro em tempo real',
              ].map((t, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)' }}
                >
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </motion.li>
              ))}
            </ul>

            {/* CTA button */}
            <motion.button
              type="button" onClick={handleExit}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(229,57,53,0.55), 0 0 40px rgba(229,57,53,0.25)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 20px',
                fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                letterSpacing: '0.06em',
                color: '#fff',
                background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
                border: 'none', borderRadius: 10,
                cursor: 'pointer',
                boxShadow: '0 8px 22px rgba(229,57,53,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'box-shadow 0.2s',
              }}
            >
              {/* Shine pass */}
              <motion.span
                aria-hidden
                animate={{ x: ['-150%', '150%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                  background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.25), transparent)',
                  pointerEvents: 'none',
                }}
              />
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              SAIR DO MODO DEMO
            </motion.button>

            <button
              type="button" onClick={handleClose}
              style={{
                marginTop: 10,
                width: '100%', padding: '8px',
                background: 'transparent', border: 'none',
                fontSize: 11, fontWeight: 600, color: 'var(--t4)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--t2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
            >
              Continuar explorando o demo
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
