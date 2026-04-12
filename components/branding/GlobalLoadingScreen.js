'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../Logo'

export default function GlobalLoadingScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setShow(false); return
    }
    const t = setTimeout(() => setShow(false), 1100)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position:'fixed', inset:0, zIndex:99999,
            background:'#04070e',
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
          }}
        >
          <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.06), transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          >
            <Logo size={1.88} showText={false} glow/>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{ marginTop: 16 }}
          >
            <Logo showIcon={false} textSize={17} style={{ fontWeight: 800 }}/>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
