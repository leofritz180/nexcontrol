'use client'
import { useEffect, useState } from 'react'

export default function GlobalLoadingScreen() {
  const [phase, setPhase] = useState('in') // in | visible | out | done

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setPhase('done'); return
    }
    const t1 = setTimeout(() => setPhase('visible'), 50)
    const t2 = setTimeout(() => setPhase('out'), 1800)
    const t3 = setTimeout(() => setPhase('done'), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      background:'#0B0F1A',
      display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
      opacity: phase==='in'?0:phase==='out'?0:1,
      transition:'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
      pointerEvents: phase==='out'?'none':'auto',
    }}>
      {/* Ambient orbs */}
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle, rgba(79,110,247,0.08), transparent 65%)',filter:'blur(80px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:250,height:250,borderRadius:'50%',background:'radial-gradient(circle, rgba(5,217,140,0.05), transparent 65%)',filter:'blur(60px)',pointerEvents:'none',top:'60%',left:'30%'}}/>

      {/* Logo */}
      <div style={{
        position:'relative', zIndex:1,
        width:72, height:72, borderRadius:20,
        background:'linear-gradient(135deg, #4f6ef7, #7c5cfc)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 60px rgba(79,110,247,0.4), 0 0 120px rgba(79,110,247,0.12)',
        animation: phase==='visible'?'loading-breathe 2s ease-in-out infinite':'none',
        transform: phase==='in'?'scale(0.8)':'scale(1)',
        transition:'transform 0.6s cubic-bezier(0.33,1,0.68,1)',
      }}>
        <svg width={32} height={32} viewBox="0 0 28 28" fill="none">
          <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
          <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
          <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
          <circle cx="21" cy="8" r="3" fill="#05d98c"/>
        </svg>
      </div>

      {/* Text */}
      <p style={{
        position:'relative', zIndex:1,
        fontFamily:'Inter, sans-serif', fontWeight:800, fontSize:18, letterSpacing:'-0.03em',
        color:'#eef2ff', marginTop:20,
        opacity: phase==='visible'?1:0,
        transform: phase==='visible'?'translateY(0)':'translateY(8px)',
        transition:'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
      }}>
        Nex<span style={{color:'#6b84ff'}}>Control</span>
      </p>

      <style>{`
        @keyframes loading-breathe {
          0%, 100% { box-shadow: 0 0 60px rgba(79,110,247,0.4), 0 0 120px rgba(79,110,247,0.12); }
          50% { box-shadow: 0 0 80px rgba(79,110,247,0.55), 0 0 160px rgba(79,110,247,0.18); }
        }
      `}</style>
    </div>
  )
}
