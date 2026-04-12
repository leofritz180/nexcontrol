// Premium 3D SVG icons — sem emojis
export function IconMoney({ size=44, color='#00E5A0' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:`drop-shadow(0 4px 12px ${color}44)`}}>
      <defs>
        <linearGradient id={`m-${color}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.5"/>
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="40" rx="16" ry="4" fill={color} opacity="0.15"/>
      <rect x="6" y="12" width="36" height="24" rx="8" fill={`url(#m-${color})`} opacity="0.9"/>
      <rect x="6" y="12" width="36" height="9" rx="8" fill="white" opacity="0.12"/>
      <rect x="6" y="27" width="36" height="9" rx="0" fill="black" opacity="0.08"/>
      <circle cx="24" cy="24" r="6" fill="white" opacity="0.2"/>
      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="sans-serif">$</text>
      <rect x="14" y="17" width="8" height="2" rx="1" fill="white" opacity="0.3"/>
      <rect x="26" y="17" width="8" height="2" rx="1" fill="white" opacity="0.3"/>
    </svg>
  )
}

export function IconTarget({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 12px rgba(59,130,246,0.4))'}}>
      <ellipse cx="24" cy="42" rx="14" ry="4" fill="#3B82F6" opacity="0.2"/>
      <circle cx="24" cy="22" r="16" fill="url(#tg1)" opacity="0.9"/>
      <circle cx="24" cy="22" r="16" fill="rgba(255,255,255,0.08)"/>
      <circle cx="24" cy="22" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <circle cx="24" cy="22" r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <circle cx="24" cy="22" r="2.5" fill="white" opacity="0.9"/>
      <defs>
        <linearGradient id="tg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A98BFF"/>
          <stop offset="100%" stopColor="#5B3FD4"/>
        </linearGradient>
      </defs>
      <style>{`@keyframes spin-target{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <g style={{transformOrigin:'24px 22px',animation:'spin-target 12s linear infinite'}}>
        <circle cx="24" cy="8" r="2" fill="rgba(169,139,255,0.6)"/>
      </g>
    </svg>
  )
}

export function IconBox({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 12px rgba(0,212,255,0.35))'}}>
      <defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00D4FF"/><stop offset="100%" stopColor="#0066AA"/></linearGradient></defs>
      <ellipse cx="24" cy="42" rx="14" ry="3.5" fill="#00D4FF" opacity="0.15"/>
      <path d="M8 18 L24 10 L40 18 L40 34 L24 42 L8 34 Z" fill="url(#bg1)" opacity="0.85"/>
      <path d="M8 18 L24 26 L40 18" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      <path d="M24 26 L24 42" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <path d="M8 18 L24 10 L40 18" fill="rgba(255,255,255,0.15)"/>
      <path d="M16 14 L32 22" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <style>{`@keyframes float-box{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
      <g style={{animation:'float-box 3s ease-in-out infinite'}}>
        <path d="M20 7 L24 4 L28 7" stroke="rgba(0,212,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </g>
    </svg>
  )
}

export function IconUser({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 12px rgba(0,212,255,0.3))'}}>
      <defs><linearGradient id="ug1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00E5FF"/><stop offset="100%" stopColor="#0055CC"/></linearGradient></defs>
      <ellipse cx="24" cy="44" rx="16" ry="3" fill="#00D4FF" opacity="0.12"/>
      <circle cx="24" cy="16" r="10" fill="url(#ug1)" opacity="0.9"/>
      <circle cx="24" cy="16" r="10" fill="rgba(255,255,255,0.1)"/>
      <circle cx="24" cy="14" r="4" fill="rgba(255,255,255,0.4)"/>
      <path d="M10 38 C10 29 38 29 38 38" fill="url(#ug1)" opacity="0.75"/>
      <path d="M10 38 C10 29 38 29 38 38" fill="rgba(255,255,255,0.08)"/>
    </svg>
  )
}

export function IconChart({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 12px rgba(255,184,0,0.3))'}}>
      <defs><linearGradient id="cg1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#CC8800"/><stop offset="100%" stopColor="#FFD166"/></linearGradient></defs>
      <ellipse cx="24" cy="42" rx="14" ry="3" fill="#FFB800" opacity="0.15"/>
      <rect x="8" y="28" width="8" height="12" rx="3" fill="url(#cg1)" opacity="0.6"/>
      <rect x="20" y="18" width="8" height="22" rx="3" fill="url(#cg1)" opacity="0.8"/>
      <rect x="32" y="10" width="8" height="30" rx="3" fill="url(#cg1)"/>
      <rect x="8" y="28" width="8" height="5" rx="3" fill="rgba(255,255,255,0.2)"/>
      <rect x="20" y="18" width="8" height="5" rx="3" fill="rgba(255,255,255,0.2)"/>
      <rect x="32" y="10" width="8" height="5" rx="3" fill="rgba(255,255,255,0.2)"/>
      <path d="M12 28 L24 18 L36 10" stroke="rgba(255,209,102,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  )
}

export function IconTrophy({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 16px rgba(255,184,0,0.5))'}}>
      <defs><linearGradient id="trg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFE566"/><stop offset="100%" stopColor="#CC8800"/></linearGradient></defs>
      <ellipse cx="24" cy="44" rx="10" ry="3" fill="#FFB800" opacity="0.25"/>
      <rect x="18" y="36" width="12" height="5" rx="2" fill="url(#trg)"/>
      <rect x="14" y="41" width="20" height="3" rx="1.5" fill="url(#trg)"/>
      <path d="M12 8 h24 v14 a12 12 0 0 1-24 0 Z" fill="url(#trg)"/>
      <path d="M12 8 h24 v7 a12 12 0 0 1-24 0 Z" fill="rgba(255,255,255,0.18)"/>
      <path d="M7 8 h7 v10 a6 6 0 0 1-7 0 Z" fill="url(#trg)" opacity="0.75"/>
      <path d="M41 8 h-7 v10 a6 6 0 0 0 7 0 Z" fill="url(#trg)" opacity="0.75"/>
      <circle cx="24" cy="18" r="4" fill="rgba(255,255,255,0.3)"/>
      <path d="M24 15 L25 17 L27 17 L25.5 18.5 L26.2 20.5 L24 19 L21.8 20.5 L22.5 18.5 L21 17 L23 17 Z" fill="rgba(255,255,255,0.8)"/>
      <style>{`@keyframes glow-trophy{0%,100%{filter:drop-shadow(0 4px 16px rgba(255,184,0,0.5))}50%{filter:drop-shadow(0 4px 28px rgba(255,184,0,0.9))}}`}</style>
    </svg>
  )
}

export function IconLock({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 12px rgba(59,130,246,0.35))'}}>
      <defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A98BFF"/><stop offset="100%" stopColor="#4A2FCC"/></linearGradient></defs>
      <ellipse cx="24" cy="42" rx="13" ry="3.5" fill="#3B82F6" opacity="0.18"/>
      <rect x="10" y="20" width="28" height="22" rx="7" fill="url(#lg1)" opacity="0.9"/>
      <rect x="10" y="20" width="28" height="9" rx="7" fill="rgba(255,255,255,0.12)"/>
      <path d="M16 20 v-6 a8 8 0 0 1 16 0 v6" stroke="rgba(169,139,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="24" cy="30" r="3.5" fill="rgba(255,255,255,0.3)"/>
      <rect x="22.5" y="30" width="3" height="5" rx="1.5" fill="rgba(255,255,255,0.3)"/>
    </svg>
  )
}

export function IconClose({ size=44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{filter:'drop-shadow(0 4px 12px rgba(0,229,160,0.3))'}}>
      <defs><linearGradient id="clo1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00FFB2"/><stop offset="100%" stopColor="#007744"/></linearGradient></defs>
      <ellipse cx="24" cy="42" rx="13" ry="3.5" fill="#00E5A0" opacity="0.18"/>
      <rect x="8" y="10" width="32" height="30" rx="8" fill="url(#clo1)" opacity="0.85"/>
      <rect x="8" y="10" width="32" height="10" rx="8" fill="rgba(255,255,255,0.14)"/>
      <path d="M16 26 l6 6 12-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconArrow({ size=20, color='rgba(240,240,255,0.4)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M7 10h6M10 7l3 3-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconRefresh({ size=16, color='rgba(240,240,255,0.5)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 8a6 6 0 1 0 1-3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 4v4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconLogout({ size=16, color='#FF2D78' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 11l3-3-3-3M14 8H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconPlus({ size=16, color='white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function IconNexControl({ size=36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="nc-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#00D4FF"/>
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#nc-logo)"/>
      <path d="M9 26V10l10 16V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="28" cy="18" r="3" fill="white" opacity="0.9"/>
    </svg>
  )
}
