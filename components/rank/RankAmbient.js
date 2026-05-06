'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Ambientação cinematográfica de fundo: poeira flutuante, nebulosas, linhas
 * sci-fi, gradient ambiente baseado no rank.
 *
 * Renderiza ATRÁS do conteúdo principal (use position relative no parent).
 * Performance: usa apenas CSS animations + framer minimalista, sem canvas.
 *
 * Props:
 *  - rank: rank atual (pra cor do glow ambiente)
 *  - density: 'low' | 'normal' | 'high' — nº de partículas
 */
export default function RankAmbient({ rank, density = 'normal', className }) {
  const counts = { low: 14, normal: 24, high: 36 }
  const particleCount = counts[density] || counts.normal

  // Gera positions/delays/durations 1x (memoized)
  const dust = useMemo(() => Array.from({ length: particleCount }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    size: 1 + Math.random() * 2.2,
    drift: 30 + Math.random() * 60,
    dur: 18 + Math.random() * 24,
    delay: -Math.random() * 30,
    opacity: 0.18 + Math.random() * 0.4,
  })), [particleCount])

  const lines = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    top: 8 + i * 19 + Math.random() * 6,
    delay: i * 1.5,
    dur: 14 + Math.random() * 6,
  })), [])

  const isApex = rank?.tier === 15
  const isPrismatic = rank?.primary === 'prismatic'
  const rgb = rank?.rgb || '255,255,255'
  const ambient = isApex
    ? 'rgba(180,120,255,0.10)'
    : isPrismatic
      ? 'rgba(199,125,255,0.08)'
      : `rgba(${rgb},0.07)`

  return (
    <div aria-hidden className={className} style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      borderRadius: 'inherit', overflow: 'hidden',
    }}>
      {/* Camada 1: Nebulosas blurred — duas grandes manchas que respiram */}
      <motion.div
        animate={{ x: [0, 28, -14, 0], y: [0, -18, 12, 0], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '70%',
          background: `radial-gradient(circle, ${ambient} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        animate={{ x: [0, -26, 14, 0], y: [0, 16, -10, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '-25%', right: '-12%', width: '55%', height: '70%',
          background: `radial-gradient(circle, ${isApex ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.04)'} 0%, transparent 65%)`,
          filter: 'blur(70px)',
        }}
      />

      {/* Camada 2: Linhas sci-fi horizontais que cruzam lentamente */}
      {lines.map((l, i) => (
        <motion.div
          key={i}
          animate={{ x: ['-30%', '110%'] }}
          transition={{ duration: l.dur, repeat: Infinity, ease: 'linear', delay: l.delay }}
          style={{
            position: 'absolute',
            top: `${l.top}%`, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent 0%, ${ambient} 50%, transparent 100%)`,
            transform: 'translateX(-30%)',
          }}
        />
      ))}

      {/* Camada 3: Poeira espacial flutuando */}
      {dust.map((p, i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -p.drift, 0, p.drift * 0.5, 0],
            x: [0, p.drift * 0.3, 0, -p.drift * 0.4, 0],
            opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.6, p.opacity * 0.9, p.opacity * 0.4],
          }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: isApex && i % 4 === 0
              ? '#FFD700'
              : isApex && i % 4 === 1
                ? '#B478FF'
                : isPrismatic && i % 3 === 0
                  ? '#C77DFF'
                  : `rgba(${rgb},0.7)`,
            boxShadow: `0 0 ${p.size * 3}px ${isApex && i % 2 === 0 ? 'rgba(180,120,255,0.5)' : `rgba(${rgb},0.4)`}`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Camada 4: Gradient ambient final — vinheta sutil */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
        pointerEvents: 'none',
      }}/>

      {/* Apex extra: holographic flicker */}
      {isApex && (
        <motion.div
          animate={{ opacity: [0, 0.18, 0, 0.08, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0,
            background: 'conic-gradient(from 90deg at 50% 50%, transparent 0deg, rgba(180,120,255,0.12) 90deg, transparent 180deg, rgba(255,215,0,0.08) 270deg, transparent 360deg)',
            mixBlendMode: 'screen', filter: 'blur(2px)',
          }}
        />
      )}
    </div>
  )
}
