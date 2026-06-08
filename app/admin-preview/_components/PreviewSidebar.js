'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { C } from './mock'

// Mesmos itens da sidebar atual (NAO altera nada) — so o visual e novo.
const NAV = [
  { label: 'Admin',         icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { label: 'Operadores',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  { label: 'Redes',         icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { label: 'Faturamento',   icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { label: 'Custos',        icon: 'M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z' },
  { label: 'Chaves PIX',    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Afiliados',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 100-4 2 2 0 000 4zM9 13a4 4 0 00-4 4v2h8v-2a4 4 0 00-4-4z' },
  { label: 'Assinatura',    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Slots Premium', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', tag: 'PRO' },
  { label: 'Loja Proxy',    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { label: 'Tutorial',      icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default function PreviewSidebar() {
  const [active, setActive] = useState('Admin')
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 212, zIndex: 5,
      background: 'rgba(6,10,18,0.72)', backdropFilter: 'blur(12px)',
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', padding: '20px 12px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 10px 22px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,49,49,0.45)' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'var(--mono, monospace)' }}>N</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: C.text }}>Nex<span style={{ color: C.primary }}>Control</span></span>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const on = active === item.label
          return (
            <motion.button key={item.label} type="button" onClick={() => setActive(item.label)}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                padding: '9px 11px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                fontSize: 12.5, fontWeight: on ? 600 : 400,
                color: on ? C.text : C.sub,
                background: on ? 'rgba(255,49,49,0.10)' : 'transparent',
                border: `1px solid ${on ? 'rgba(255,49,49,0.30)' : 'transparent'}`,
                boxShadow: on ? '0 0 18px rgba(255,49,49,0.12), inset 0 0 0 1px rgba(255,49,49,0.04)' : 'none',
                transition: 'background 0.18s, color 0.18s, border-color 0.18s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = C.text } }}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.sub } }}
            >
              {on && <span style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: C.primary, boxShadow: '0 0 10px rgba(255,49,49,0.8)' }} />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: on ? 1 : 0.6 }}>
                <path d={item.icon} />
              </svg>
              {item.label}
              {item.tag && (
                <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: C.faint, letterSpacing: '0.06em' }}>{item.tag}</span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ marginTop: 12, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2333,#0b1019)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>B</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bruno Oliveira</p>
          <p style={{ fontSize: 9.5, color: C.faint, margin: '1px 0 0' }}>PRO · vitalício</p>
        </div>
      </div>
    </aside>
  )
}
