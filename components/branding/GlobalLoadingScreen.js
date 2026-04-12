'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
            style={{
              width:60, height:60, borderRadius:16, background:'#e53935',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 30px rgba(229,57,53,0.3)',
            }}
          >
            <svg width={26} height={26} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
              <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            </svg>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:17, letterSpacing:'-0.03em', color:'#f0f4ff', marginTop:16 }}
          >
            Nex<span style={{ color:'#ff4444' }}>Control</span>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
