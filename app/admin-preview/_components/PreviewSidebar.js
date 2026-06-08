'use client'
import { useState } from 'react'

const RED = '#FF3131'
const NAV = [
  { label: 'Dashboard',  icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { label: 'Operadores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  { label: 'Redes',      icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { label: 'Financeiro', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { label: 'Custos',     icon: 'M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z' },
  { label: 'PIX',        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Afiliados',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 100-4 2 2 0 000 4zM9 13a4 4 0 00-4 4v2h8v-2a4 4 0 00-4-4z' },
  { label: 'Assinatura', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Slots',      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { label: 'Tutorial',   icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default function PreviewSidebar() {
  const [exp, setExp] = useState(false)
  const [active, setActive] = useState('Dashboard')
  const W = exp ? 240 : 76

  return (
    <aside
      onMouseEnter={() => setExp(true)}
      onMouseLeave={() => setExp(false)}
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: W, zIndex: 60,
        background: 'rgba(8,9,12,0.96)', backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: exp ? '8px 0 40px rgba(0,0,0,0.5)' : 'none',
        display: 'flex', flexDirection: 'column', padding: '16px 14px',
        overflow: 'hidden', transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1), box-shadow 0.26s',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 22px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,49,49,0.35)' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 19, lineHeight: 1, fontFamily: 'var(--mono, monospace)' }}>N</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#F4F6FB', opacity: exp ? 1 : 0, transition: 'opacity 0.2s' }}>
          Nex<span style={{ color: RED }}>Control</span>
        </span>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => {
          const on = active === item.label
          return (
            <button key={item.label} type="button" onClick={() => setActive(item.label)}
              title={item.label}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                height: 44, padding: '0 12px', borderRadius: 11, cursor: 'pointer', border: 'none',
                background: on ? 'rgba(255,49,49,0.10)' : 'transparent',
                color: on ? '#F4F6FB' : '#8A94A6',
                transition: 'background 0.18s, color 0.18s',
              }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
            >
              {on && <span style={{ position: 'absolute', left: -14, top: 11, bottom: 11, width: 3, borderRadius: '0 3px 3px 0', background: RED }} />}
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={on ? RED : 'currentColor'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.icon} />
              </svg>
              <span style={{ fontSize: 13.5, fontWeight: on ? 600 : 450, opacity: exp ? 1 : 0, transition: 'opacity 0.2s' }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px 4px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#1a1d24,#0b0d11)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#8A94A6' }}>B</div>
        <div style={{ opacity: exp ? 1 : 0, transition: 'opacity 0.2s', minWidth: 0 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#F4F6FB', margin: 0 }}>Bruno Oliveira</p>
          <p style={{ fontSize: 9.5, color: '#525C6E', margin: '1px 0 0' }}>PRO · vitalício</p>
        </div>
      </div>
    </aside>
  )
}
