'use client'
import { useEffect, useRef, useCallback } from 'react'

export default function DynamicBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -1, y: -1 })
  const raf = useRef(null)
  const particles = useRef([])

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)

    // Create particles (max 35)
    const count = Math.min(35, Math.floor((w * h) / 50000))
    const colors = [
      { r: 79, g: 110, b: 247 },  // brand blue
      { r: 5, g: 217, b: 140 },   // profit green
      { r: 124, g: 92, b: 252 },  // purple
      { r: 56, g: 182, b: 255 },  // info blue
    ]
    particles.current = Array.from({ length: count }, () => {
      const c = colors[Math.floor(Math.random() * colors.length)]
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.5 + 0.5,
        c,
        alpha: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.008 + 0.003,
      }
    })

    function draw() {
      ctx.clearRect(0, 0, w, h)
      const mx = mouse.current.x
      const my = mouse.current.y

      for (const p of particles.current) {
        p.pulse += p.pulseSpeed
        const breathe = Math.sin(p.pulse) * 0.15 + 0.85
        const a = p.alpha * breathe

        // Mouse influence (very subtle)
        if (mx >= 0 && my >= 0) {
          const dx = mx - p.x
          const dy = my - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            const force = (200 - dist) / 200 * 0.02
            p.vx += dx * force * 0.01
            p.vy += dy * force * 0.01
          }
        }

        // Dampen velocity
        p.vx *= 0.999
        p.vy *= 0.999

        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        // Draw glow
        const r = p.r * breathe
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.c.r},${p.c.g},${p.c.b},${a * 0.15})`
        ctx.fill()

        // Draw dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.c.r},${p.c.g},${p.c.b},${a})`
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(raf.current)
  }, [])

  useEffect(() => {
    const cleanup = init()

    function handleResize() {
      cancelAnimationFrame(raf.current)
      init()
    }

    function handleMouse(e) {
      mouse.current = { x: e.clientX, y: e.clientY }
    }

    function handleMouseLeave() {
      mouse.current = { x: -1, y: -1 }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouse, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      if (cleanup) cleanup()
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [init])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.7,
      }}
    />
  )
}
