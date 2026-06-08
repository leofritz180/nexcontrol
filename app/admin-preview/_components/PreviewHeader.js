'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function PreviewHeader({ onRefresh }) {
  const [spin, setSpin] = useState(false)
  function refresh() {
    setSpin(true)
    try { onRefresh && onRefresh() } catch {}
    setTimeout(() => setSpin(false), 700)
  }
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
        style={{
          height: 82, borderRadius: 16, padding: '0 22px',
          background: '#FF3131',
          boxShadow: '0 10px 34px rgba(255,49,49,0.22), inset 0 1px 0 rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}
      >
        {/* Esquerda — logo + titulo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <img src="/icons/nexcontrol-icon-clean.png" alt="NexControl" style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, objectFit: 'contain', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.18)' }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>Dashboard Operacional</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '2px 0 0' }}>Visão Geral</p>
          </div>
        </div>

        {/* Direita — plano + atualizar + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.22)', padding: '6px 12px', borderRadius: 9, letterSpacing: '0.03em' }}>PRO · vitalício</span>

          <button type="button" onClick={refresh} title="Atualizar"
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#fff', cursor: 'pointer', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', padding: '7px 13px', borderRadius: 9 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}>
            <motion.svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
              animate={spin ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.7, ease: 'easeInOut' }}>
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </motion.svg>
            Atualizar
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 12px', borderRadius: 9 }}>
            <span style={{ position: 'relative', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
              <motion.span animate={{ scale: [1, 2.4], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>Online</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
