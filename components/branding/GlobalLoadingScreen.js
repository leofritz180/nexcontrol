'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NexIcon } from '../Logo'

export default function GlobalLoadingScreen() {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState('entering') // entering | revealing | exiting

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setShow(false)
      return
    }

    // Phase timing
    const revealTimer = setTimeout(() => setPhase('revealing'), 100)
    const exitTimer = setTimeout(() => setPhase('exiting'), 1200)
    const hideTimer = setTimeout(() => setShow(false), 1600)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  // Particle positions (6-8 tiny dots)
  const particles = [
    { top: '18%', left: '22%', delay: '0s', duration: '6s' },
    { top: '72%', left: '78%', delay: '0.5s', duration: '7s' },
    { top: '35%', left: '85%', delay: '1s', duration: '5.5s' },
    { top: '80%', left: '15%', delay: '0.3s', duration: '6.5s' },
    { top: '12%', left: '65%', delay: '0.8s', duration: '5s' },
    { top: '60%', left: '40%', delay: '0.2s', duration: '7.5s' },
    { top: '45%', left: '10%', delay: '1.2s', duration: '6s' },
  ]

  const iconPx = 60
  const svgPx = 26
  const radius = 17

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Digital particles — pure CSS, no framer-motion */}
          {particles.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: p.top,
                left: p.left,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: '#e53935',
                opacity: 0.15,
                animation: `drift ${p.duration} ease-in-out infinite`,
                animationDelay: p.delay,
                pointerEvents: 'none',
                willChange: 'transform',
              }}
            />
          ))}

          {/* Red glow aura behind logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(229,57,53,0.25) 0%, rgba(229,57,53,0.05) 50%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(40px)',
            }}
          />

          {/* Energy pulse ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: iconPx + 10,
              height: iconPx + 10,
              borderRadius: '50%',
              border: '1.5px solid rgba(229,57,53,0.5)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo icon — inline for blur control */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            style={{
              width: iconPx,
              height: iconPx,
              borderRadius: radius,
              background: '#e53935',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(229,57,53,0.3)',
              flexShrink: 0,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <NexIcon size={svgPx} />
          </motion.div>

          {/* Text "NexControl" */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            style={{
              marginTop: 18,
              zIndex: 2,
            }}
          >
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#F1F5F9',
              lineHeight: 1,
            }}>
              Nex<span style={{ color: '#e53935' }}>Control</span>
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
