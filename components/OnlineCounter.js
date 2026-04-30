'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function OnlineCounter({ userId, variant = 'inline' }) {
  const [count, setCount] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    async function ping() {
      try {
        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        })
        const data = await res.json()
        if (data.online != null) setCount(data.online)
      } catch {}
    }

    ping()
    intervalRef.current = setInterval(ping, 30000)
    return () => clearInterval(intervalRef.current)
  }, [userId])

  if (count <= 0 && variant === 'inline') return null

  // ── Card variant (for Owner dashboard) ──
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
        style={{
          padding: '22px 26px',
          borderRadius: 18,
          background: 'linear-gradient(145deg, #0c1424, #080e1a)',
          border: '1px solid rgba(0,140,94,0.12)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 30px rgba(0,140,94,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
        title="Usuarios ativos na plataforma neste momento"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(0,140,94,0)', '0 0 0 8px rgba(0,140,94,0.2)', '0 0 0 0 rgba(0,140,94,0)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 12, height: 12, borderRadius: '50%', background: '#008C5E', flexShrink: 0 }}
          />
          <div>
            <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Usuarios online agora</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Ativos na plataforma neste momento</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
            fontSize: 36, fontWeight: 900, color: '#008C5E', margin: 0, lineHeight: 1,
            textShadow: '0 0 20px rgba(0,140,94,0.15)',
          }}>
            {count}
          </p>
        </div>
      </motion.div>
    )
  }

  // ── Inline variant (compact) ──
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600, color: 'var(--t3)',
      padding: '4px 10px', borderRadius: 8,
      background: 'rgba(0,140,94,0.04)',
      border: '1px solid rgba(0,140,94,0.1)',
      cursor: 'default',
    }}
      title="Usuarios ativos na plataforma neste momento"
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#008C5E',
        boxShadow: '0 0 6px rgba(0,140,94,0.5)',
        animation: 'onlinePulse 2s ease-in-out infinite',
      }} />
      <span style={{ fontFamily: 'var(--mono, monospace)', fontWeight: 700, color: '#008C5E' }}>{count}</span>
      <span className="online-label" style={{ color: 'var(--t4)' }}>online</span>
      <style>{`
        @keyframes onlinePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        @media (max-width: 480px) {
          .online-label { display: none !important; }
        }
      `}</style>
    </div>
  )
}
