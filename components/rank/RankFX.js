'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'

/* Estrelas estáticas tipo nebula, distribuídas determinísticas */
function ApexStarField() {
  const stars = useMemo(() => {
    const arr = []
    for (let i = 0; i < 18; i++) {
      const seed = (i * 9301 + 49297) % 233280
      arr.push({
        x: ((seed * 7) % 100),
        y: ((seed * 13) % 100),
        size: 0.8 + ((seed * 17) % 100) / 80,
        delay: (seed % 30) / 10,
        dur: 1.5 + ((seed * 3) % 100) / 50,
        gold: i % 3 === 0,
      })
    }
    return arr
  }, [])
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: s.gold ? '#FFD700' : '#FFFFFF',
            boxShadow: `0 0 ${s.size * 4}px ${s.gold ? '#FFD700' : 'rgba(180,120,255,0.6)'}`,
          }}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────
   Aura ambiente: glow de fundo refinado por rank
   ─────────────────────────────────────────── */
export function RankAura({ rank, intensity = 1, className }) {
  if (!rank) return null
  const isApex = rank.tier === 15
  const isSupremo = rank.tier === 14
  const isPrismatic = rank.primary === 'prismatic'

  if (isApex) {
    return (
      <div aria-hidden className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', overflow: 'hidden' }}>
        {/* deep void com gradient roxo profundo */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(180,120,255,0.22) 0%, rgba(60,30,120,0.10) 30%, #000 70%)' }} />
        {/* nebula púrpura respirando */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '20%', left: '10%', width: '50%', height: '60%',
            background: 'radial-gradient(circle, rgba(180,120,255,0.20) 0%, transparent 65%)',
            filter: 'blur(35px)',
          }}
        />
        {/* holographic shimmer rotativo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', inset: '-10%',
            background: 'conic-gradient(from 0deg, rgba(180,120,255,0.10) 0deg, rgba(80,160,255,0.10) 60deg, rgba(255,215,0,0.08) 120deg, rgba(255,80,200,0.10) 200deg, rgba(180,120,255,0.10) 360deg)',
            mixBlendMode: 'screen',
            filter: 'blur(8px)',
          }}
        />
        {/* gold breath */}
        <motion.div
          animate={{ opacity: [0.5, 0.95, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-20%', right: '-15%', width: '60%', height: '80%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.22) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Tiny stars cintilando estática */}
        <ApexStarField />
      </div>
    )
  }

  if (isSupremo || isPrismatic) {
    return (
      <div aria-hidden className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', overflow: 'hidden' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', inset: '-50%',
            background: 'conic-gradient(from 0deg, rgba(255,107,157,0.15), rgba(199,125,255,0.15), rgba(79,195,247,0.15), rgba(102,187,106,0.10), rgba(255,238,88,0.12), rgba(255,167,38,0.12), rgba(255,107,157,0.15))',
            opacity: intensity * 0.55,
            filter: 'blur(20px)',
          }}
        />
      </div>
    )
  }

  // Padrão: glow radial + breath sutil
  const rgb = rank.rgb || '255,255,255'
  return (
    <div aria-hidden className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', overflow: 'hidden' }}>
      <motion.div
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 5 + (rank.tier % 3), repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-30%', right: '-20%', width: '70%', height: '120%',
          background: `radial-gradient(circle, rgba(${rgb},${0.18 * intensity}) 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 0% 100%, rgba(${rgb},${0.06 * intensity}) 0%, transparent 50%)`,
      }} />
    </div>
  )
}

/* ───────────────────────────────────────────
   Partículas orbitais: usadas em ranks elite
   ─────────────────────────────────────────── */
export function OrbitalParticles({ rank, count = 4, radius = 80, size = 3, speed = 14 }) {
  if (!rank) return null
  const isApex = rank.tier === 15
  const isPrismatic = rank.primary === 'prismatic'
  const baseColor = isApex ? '#FFD700' : isPrismatic ? '#FFFFFF' : (rank.particle || rank.primary)

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360
        const dur = speed + (i % 3) * 2
        const reverse = i % 2 === 1
        const colorMix = isApex && i % 2 === 0 ? '#B478FF' : baseColor
        return (
          <motion.div
            key={i}
            animate={{ rotate: reverse ? [angle, angle - 360] : [angle, angle + 360] }}
            transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: radius * 2, height: radius * 2,
              transformOrigin: 'center',
            }}
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2 + (i % 3) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              style={{
                position: 'absolute',
                top: 0, left: '50%',
                transform: `translateX(-50%)`,
                width: size, height: size,
                borderRadius: '50%',
                background: colorMix,
                boxShadow: `0 0 ${size * 3}px ${colorMix}, 0 0 ${size * 6}px ${colorMix}77`,
              }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}

/* ───────────────────────────────────────────
   Border glow animado (gradient correndo)
   ─────────────────────────────────────────── */
export function GlowBorder({ rank, thickness = 1, intensity = 1, animate: animateBorder = true }) {
  if (!rank) return null
  const rgb = rank.rgb || '255,255,255'
  const isApex = rank.tier === 15
  const isPrismatic = rank.primary === 'prismatic'

  if (isApex || isPrismatic) {
    return (
      <motion.span
        aria-hidden
        animate={animateBorder ? { rotate: 360 } : {}}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: -thickness, borderRadius: 'inherit',
          padding: thickness, pointerEvents: 'none',
          background: isApex
            ? 'conic-gradient(from 0deg, #B478FF, #4FC3F7, #FFD700, #FF6B9D, #B478FF)'
            : 'conic-gradient(from 0deg, #FF6B9D, #C77DFF, #4FC3F7, #66BB6A, #FFEE58, #FFA726, #FF6B9D)',
          opacity: 0.7 * intensity,
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />
    )
  }

  return (
    <span
      aria-hidden
      style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: `inset 0 0 0 1px rgba(${rgb},${0.35 * intensity}), 0 0 ${24 * intensity}px rgba(${rgb},${0.18 * intensity})`,
      }}
    />
  )
}

/* ───────────────────────────────────────────
   Shine pass: brilho diagonal que passa periodicamente
   ─────────────────────────────────────────── */
export function ShinePass({ delay = 0, duration = 3, interval = 6, color = 'rgba(255,255,255,0.15)' }) {
  return (
    <motion.span
      aria-hidden
      initial={{ x: '-150%' }}
      animate={{ x: ['-150%', '150%'] }}
      transition={{ duration, repeat: Infinity, repeatDelay: interval - duration, ease: 'easeOut', delay }}
      style={{
        position: 'absolute', top: 0, left: 0, width: '60%', height: '100%',
        background: `linear-gradient(105deg, transparent 30%, ${color} 50%, transparent 70%)`,
        pointerEvents: 'none', borderRadius: 'inherit',
      }}
    />
  )
}

/* ───────────────────────────────────────────
   Texturas overlay por signature
   ─────────────────────────────────────────── */
export function SignatureOverlay({ rank }) {
  if (!rank) return null
  const sig = rank.signature

  // Metal frio (Ferro): nuance fosca + rajadas verticais sutis
  if (sig === 'metal-cold' || sig === 'metal-warm' || sig === 'metal-shine') {
    return (
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
        background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.0) 0px, rgba(255,255,255,0.025) 1px, transparent 2px, transparent 4px)',
        opacity: 0.6, mixBlendMode: 'overlay',
      }}/>
    )
  }

  // Ouro: gradient deslizante dourado
  if (sig === 'gold-luxury') {
    return (
      <motion.div
        aria-hidden
        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          background: 'linear-gradient(110deg, transparent 30%, rgba(255,215,0,0.18) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          mixBlendMode: 'screen',
        }}
      />
    )
  }

  // Cristal/diamante: facetas
  if (sig === 'crystalline' || sig === 'diamond') {
    return (
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%), linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)',
        mixBlendMode: 'overlay',
      }}/>
    )
  }

  // Tech neon (Elite): scanline horizontal
  if (sig === 'tech-neon') {
    return (
      <motion.div
        aria-hidden
        animate={{ y: ['-100%', '120%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', left: 0, right: 0, height: '40%',
          background: 'linear-gradient(180deg, transparent, rgba(34,211,238,0.18), transparent)',
          pointerEvents: 'none', mixBlendMode: 'screen',
        }}
      />
    )
  }

  // Fogo (Lendário): chama subindo
  if (sig === 'fire') {
    return (
      <motion.div
        aria-hidden
        animate={{ y: [0, -8, 0], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(0deg, rgba(255,138,71,0.20) 0%, rgba(255,80,30,0.10) 40%, transparent 100%)',
          pointerEvents: 'none', borderRadius: 'inherit', mixBlendMode: 'screen',
        }}
      />
    )
  }

  // Aura void (Imortal): pulse roxo profundo
  if (sig === 'void-aura') {
    return (
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          background: 'radial-gradient(circle at 50% 50%, rgba(196,144,240,0.18) 0%, transparent 50%)',
        }}
      />
    )
  }

  return null
}
