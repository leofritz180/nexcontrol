'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ONBOARDING_STEPS, calculateOnboardingProgress,
  isDismissed, dismiss, markCompletedNow, getCompletedAt,
} from '../lib/onboarding-steps'

/* ───────────────────────────────────────────
   Icones SVG por step
   ─────────────────────────────────────────── */
function StepIcon({ name, size = 16, color = 'currentColor' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'user':   return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'target': return <svg {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    case 'box':    return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    case 'check':  return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>
    case 'users':  return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'pix':    return <svg {...props}><path d="M12 2L2 12l10 10 10-10z"/><path d="M7 12l5-5 5 5-5 5z"/></svg>
    default: return <svg {...props}><circle cx="12" cy="12" r="10"/></svg>
  }
}

/* ───────────────────────────────────────────
   Component principal
   ─────────────────────────────────────────── */
export default function OnboardingChecklist({ data, userId, onActionTab }) {
  const router = useRouter()
  const [dismissed, setDismissedState] = useState(true) // start true pra evitar flash
  const [collapsed, setCollapsed] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (userId) setDismissedState(isDismissed(userId))
  }, [userId])

  const progress = useMemo(() => calculateOnboardingProgress(data || {}), [data])

  // Detecta conclusao e dispara celebracao 1x
  useEffect(() => {
    if (!userId || !mounted) return
    const completedAt = getCompletedAt(userId)
    if (progress.isComplete && !completedAt) {
      markCompletedNow(userId)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 6000)
    }
  }, [progress.isComplete, userId, mounted])

  if (!mounted || dismissed) return null
  // Esconde 5 dias depois de concluir
  if (userId) {
    const completedAt = getCompletedAt(userId)
    if (completedAt && Date.now() - completedAt > 5 * 86400000) return null
  }

  function handleDismiss() {
    if (!userId) return
    dismiss(userId)
    setDismissedState(true)
  }

  function handleStepClick(step) {
    if (step.done) return
    if (step.actionTab && onActionTab) onActionTab(step.actionTab)
    if (step.href) router.push(step.href)
  }

  return (
    <>
      {/* Celebration full-screen 6s */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9995,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
              cursor: 'pointer',
            }}
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 140 }}
              style={{ textAlign: 'center', position: 'relative' }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 120, height: 120, borderRadius: 30, margin: '0 auto 24px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #e53935 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 80px rgba(255,215,0,0.5), 0 0 160px rgba(229,57,53,0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
                }}
              >
                <svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l3 9h12l3-9-5 4-4-7-4 7z"/><circle cx="12" cy="4" r="1.5" fill="#fff"/><circle cx="3" cy="9" r="1.2" fill="#fff"/><circle cx="21" cy="9" r="1.2" fill="#fff"/></svg>
              </motion.div>
              <h2 style={{
                fontFamily: 'var(--font-display, serif)', fontSize: 48, fontWeight: 400,
                color: '#FFD700', margin: 0, letterSpacing: '-0.02em',
                textShadow: '0 0 24px rgba(255,215,0,0.6)',
              }}>
                Operador iniciado
              </h2>
              <p style={{ fontSize: 16, color: 'var(--t1)', margin: '12px 0 0', fontWeight: 600 }}>
                Voce dominou os fundamentos do NexControl.
              </p>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '24px 0 0', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                Toque pra continuar
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card flutuante */}
      <motion.div
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        style={{
          position: 'fixed',
          right: 18, bottom: 110, // acima da sticky bar de upgrade
          zIndex: 9989,
          width: collapsed ? 'auto' : 340,
          maxWidth: 'calc(100vw - 36px)',
        }}
      >
        {collapsed ? (
          <motion.button
            type="button" onClick={() => setCollapsed(false)}
            whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(229,57,53,0.18), rgba(0,0,0,0.85))',
              border: '1px solid rgba(229,57,53,0.4)',
              color: 'var(--t1)', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 0 22px rgba(229,57,53,0.25)',
            }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'rgba(229,57,53,0.2)', border: '1px solid rgba(229,57,53,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: '#ff6b6b', fontFamily: 'var(--mono)',
            }}>
              {progress.completed}/{progress.total}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              Setup do NexControl
            </span>
          </motion.button>
        ) : (
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: 16, padding: 1,
            background: 'linear-gradient(135deg, rgba(229,57,53,0.5), rgba(255,140,140,0.3), rgba(229,57,53,0.5))',
            boxShadow: '0 24px 50px rgba(0,0,0,0.6), 0 0 40px rgba(229,57,53,0.18)',
          }}>
            {/* Animated gradient border */}
            <motion.div
              aria-hidden
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 0, borderRadius: 16, padding: 1,
                background: 'linear-gradient(110deg, rgba(229,57,53,0.6) 0%, rgba(255,180,180,0.4) 50%, rgba(229,57,53,0.6) 100%)',
                backgroundSize: '200% 100%',
                mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                maskComposite: 'exclude', WebkitMaskComposite: 'xor',
                pointerEvents: 'none',
              }}
            />

            <div style={{
              background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
              borderRadius: 15, padding: 18,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 9, fontWeight: 800, color: '#ff6b6b',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    fontFamily: 'var(--mono)', margin: '0 0 4px',
                  }}>
                    {progress.isComplete ? 'Setup completo · +' + progress.xpTotal + ' xp' : 'Comece por aqui'}
                  </p>
                  <h3 style={{
                    fontFamily: 'var(--font-display, serif)', fontSize: 19, fontWeight: 400,
                    color: 'var(--t1)', margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em',
                  }}>
                    {progress.isComplete ? 'Voce dominou o setup' : `Faltam ${progress.total - progress.completed} passos pro acesso completo`}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button type="button" onClick={() => setCollapsed(true)} aria-label="Recolher"
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--t3)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="5 9 12 16 19 9"/></svg>
                  </button>
                  <button type="button" onClick={handleDismiss} aria-label="Dispensar"
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--t3)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Progress bar + XP */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, letterSpacing: '0.06em' }}>
                    {progress.completed} de {progress.total}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#FFD700', fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>
                    {progress.xpEarned}/{progress.xpTotal} XP
                  </span>
                </div>
                <div style={{
                  height: 8, borderRadius: 4, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
                    style={{
                      height: '100%', borderRadius: 4,
                      background: progress.isComplete
                        ? 'linear-gradient(90deg, #FFD700, #ff8a47)'
                        : 'linear-gradient(90deg, #e53935, #ff6b6b)',
                      boxShadow: `0 0 12px ${progress.isComplete ? 'rgba(255,215,0,0.6)' : 'rgba(229,57,53,0.5)'}`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                    <motion.span
                      aria-hidden
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1 }}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'min(380px, 50vh)', overflowY: 'auto' }} className="onboarding-steps">
                {progress.steps.map((step) => {
                  const isNext = !step.done && progress.nextStep?.id === step.id
                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepClick(step)}
                      disabled={step.done}
                      whileHover={!step.done ? { x: 3 } : {}}
                      whileTap={!step.done ? { scale: 0.98 } : {}}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: step.done
                          ? 'rgba(31,228,168,0.04)'
                          : isNext
                            ? 'rgba(229,57,53,0.08)'
                            : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${step.done ? 'rgba(31,228,168,0.18)' : isNext ? 'rgba(229,57,53,0.32)' : 'rgba(255,255,255,0.06)'}`,
                        cursor: step.done ? 'default' : 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        opacity: step.done ? 0.65 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Status */}
                      <span style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: step.done ? 'rgba(31,228,168,0.18)' : isNext ? 'rgba(229,57,53,0.18)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${step.done ? 'rgba(31,228,168,0.4)' : isNext ? 'rgba(229,57,53,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: step.done ? '#1FE4A8' : isNext ? '#ff6b6b' : 'var(--t3)',
                      }}>
                        {step.done ? (
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <StepIcon name={step.icon} size={13} />
                        )}
                      </span>

                      {/* Texto */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 700,
                          color: step.done ? 'var(--t3)' : 'var(--t1)',
                          margin: 0, lineHeight: 1.25, letterSpacing: '-0.005em',
                          textDecoration: step.done ? 'line-through' : 'none',
                        }}>
                          {step.title}
                        </p>
                        <p style={{
                          fontSize: 11, color: 'var(--t3)', margin: '2px 0 0',
                          lineHeight: 1.3,
                        }}>
                          {step.desc}
                        </p>
                      </div>

                      {/* XP + arrow */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          color: step.done ? '#1FE4A8' : '#FFD700',
                          fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                        }}>
                          +{step.xp} XP
                        </span>
                        {!step.done && isNext && (
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <style>{`
        .onboarding-steps::-webkit-scrollbar { width: 4px; }
        .onboarding-steps::-webkit-scrollbar-track { background: transparent; }
        .onboarding-steps::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </>
  )
}
