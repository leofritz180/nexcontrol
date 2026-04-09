'use client'
import { useEffect, useState, useRef } from 'react'

export default function GlobalLoadingScreen() {
  const [phase, setPhase] = useState('in') // in | visible | out | done
  const [failed, setFailed] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    // Check reduced motion preference
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setPhase('done')
      return
    }

    // Fade in
    const t1 = setTimeout(() => setPhase('visible'), 50)

    // Start fade out after 2s
    const t2 = setTimeout(() => setPhase('out'), 2200)

    // Remove after fade out
    const t3 = setTimeout(() => setPhase('done'), 2800)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setFailed(true))
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#0B0F1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'in' ? 0 : phase === 'out' ? 0 : 1,
      transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
      pointerEvents: phase === 'out' ? 'none' : 'auto',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,110,247,0.12), transparent 65%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Video or fallback */}
      {!failed ? (
        <video
          ref={videoRef}
          src="/branding/logo-intro.mp4"
          autoPlay
          muted
          playsInline
          onError={() => setFailed(true)}
          style={{
            width: 280, maxWidth: '70vw', height: 'auto',
            position: 'relative', zIndex: 1,
            borderRadius: 20,
            filter: 'drop-shadow(0 0 40px rgba(79,110,247,0.2))',
          }}
        />
      ) : (
        /* Fallback: static logo */
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: 'linear-gradient(135deg, #4f6ef7, #7c5cfc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(79,110,247,0.4)',
          position: 'relative', zIndex: 1,
        }}>
          <svg width={36} height={36} viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5} />
            <path d="M12 22L18 22L18 6L12 6Z" fill="white" />
            <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7} />
            <circle cx="21" cy="8" r="3" fill="#05d98c" />
          </svg>
        </div>
      )}
    </div>
  )
}
