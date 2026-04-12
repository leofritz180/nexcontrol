'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

/**
 * ProBanner — appears after 60s in dashboard
 * Shows blocked feature count + subtle upgrade CTA
 * Dismissible, doesn't show again for 24h
 */
const BANNER_KEY = 'nexcontrol_pro_banner_dismissed'

export default function ProBanner({ blockedCount = 3 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_KEY)
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return // 24h cooldown

    const timer = setTimeout(() => setShow(true), 60000) // show after 60s
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem(BANNER_KEY, String(Date.now()))
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:20 }}
          transition={{ duration:0.4, ease:[0.33,1,0.68,1] }}
          style={{
            position:'fixed', bottom:24, right:24, zIndex:9000,
            maxWidth:340, padding:'16px 20px', borderRadius:14,
            background:'linear-gradient(145deg, #0c1424, #080e1a)',
            border:'1px solid rgba(229,57,53,0.15)',
            boxShadow:'0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(229,57,53,0.05)',
          }}
        >
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{
              width:32, height:32, borderRadius:9, background:'rgba(229,57,53,0.12)',
              border:'1px solid rgba(229,57,53,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2} strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 4px' }}>
                {blockedCount} recursos bloqueados
              </p>
              <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 12px', lineHeight:1.4 }}>
                Ative o PRO para ver previsoes, rankings e insights da sua operacao
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <Link href="/billing" onClick={dismiss}
                  style={{ fontSize:11, fontWeight:700, padding:'6px 14px', borderRadius:7, background:'#e53935', color:'white', textDecoration:'none' }}>
                  Desbloquear PRO
                </Link>
                <button onClick={dismiss}
                  style={{ fontSize:11, fontWeight:600, padding:'6px 12px', borderRadius:7, background:'transparent', color:'var(--t3)', border:'1px solid var(--b2)', cursor:'pointer' }}>
                  Depois
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
