'use client'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
const ThemeToggle = dynamic(() => import('./ThemeToggle'), { ssr: false })

// Header em faixa do REDESIGN (real). Aditivo — renderizado no topo do conteúdo
// SÓ pras contas do redesign (via AppLayout). Não altera nada do resto.
export default function RedesignHeader() {
  return (
    <div style={{ padding: '14px 18px 0' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
        style={{
          height: 74, borderRadius: 16, padding: '0 22px',
          background: '#D10000',
          boxShadow: '0 10px 30px rgba(209,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-brand)', margin: 0, letterSpacing: '-0.01em', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Dashboard Operacional</p>
          <p style={{ fontSize: 12, color: 'var(--on-brand)', margin: '2px 0 0' }}>Central de operações</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <ThemeToggle />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--on-brand)', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.22)', padding: '6px 12px', borderRadius: 9, letterSpacing: '0.03em' }}>PRO</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', padding: '7px 12px', borderRadius: 9 }}>
            <span style={{ position: 'relative', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
              <motion.span animate={{ scale: [1, 2.4], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--on-brand)' }}>Online</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
