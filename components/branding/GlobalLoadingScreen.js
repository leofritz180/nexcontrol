'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GlobalLoadingScreen() {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState('entering')

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setShow(false)
      return
    }
    const revealTimer = setTimeout(() => setPhase('revealing'), 100)
    const exitTimer = setTimeout(() => setPhase('exiting'), 1200)
    const hideTimer = setTimeout(() => setShow(false), 1600)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const iconPx = 72

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
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            style={{
              width: iconPx,
              height: iconPx,
              flexShrink: 0,
              position: 'relative',
              zIndex: 2,
              filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.10))',
            }}
          >
            <img
              src="/nexcontrol-icon.png"
              alt="NexControl"
              width={iconPx}
              height={iconPx}
              style={{ width: iconPx, height: iconPx, objectFit: 'contain', display: 'block' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            style={{ marginTop: 18, zIndex: 2 }}
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
