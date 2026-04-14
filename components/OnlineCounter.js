'use client'
import { useEffect, useState, useRef } from 'react'

export default function OnlineCounter({ userId }) {
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

    // Initial ping
    ping()
    // Ping every 30s
    intervalRef.current = setInterval(ping, 30000)

    return () => clearInterval(intervalRef.current)
  }, [userId])

  if (count <= 0) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600, color: 'var(--t3)',
      padding: '4px 10px', borderRadius: 8,
      background: 'rgba(34,197,94,0.04)',
      border: '1px solid rgba(34,197,94,0.1)',
      cursor: 'default',
    }}
      title="Usuarios ativos na plataforma neste momento"
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#22C55E',
        boxShadow: '0 0 6px rgba(34,197,94,0.5)',
        animation: 'onlinePulse 2s ease-in-out infinite',
      }} />
      <span style={{ fontFamily: 'var(--mono, monospace)', fontWeight: 700, color: '#22C55E' }}>{count}</span>
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
