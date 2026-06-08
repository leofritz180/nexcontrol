'use client'
import { useEffect, useState } from 'react'

// Alterna modo claro/escuro (gated — só aparece no RedesignHeader).
// Persiste em localStorage 'nx_theme' e adiciona/remove .nx-light no <html>.
export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    try { setLight(document.documentElement.classList.contains('nx-light')) } catch {}
  }, [])

  function toggle() {
    try {
      const next = !document.documentElement.classList.contains('nx-light')
      document.documentElement.classList.toggle('nx-light', next)
      localStorage.setItem('nx_theme', next ? 'light' : 'dark')
      setLight(next)
    } catch {}
  }

  return (
    <button type="button" onClick={toggle} title={light ? 'Modo escuro' : 'Modo claro'} aria-label="Alternar tema"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
        borderRadius: 9, cursor: 'pointer',
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.22)', color: 'var(--on-brand)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.32)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.2)' }}
    >
      {light ? (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  )
}
