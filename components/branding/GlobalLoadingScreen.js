'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

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
            background:'#0B0F1A',
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
          }}
        >
          <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.07), transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          >
            <Image src="/branding/logo-nexcontrol.png" alt="NexControl" width={64} height={64} priority quality={100}
              style={{ filter:'drop-shadow(0 0 20px rgba(79,110,247,0.35))' }}/>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:17, letterSpacing:'-0.03em', color:'#eef2ff', marginTop:16 }}
          >
            Nex<span style={{ color:'#6b84ff' }}>Control</span>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
