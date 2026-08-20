'use client'
// ─────────────────────────────────────────────────────────────────────────
// CursorSpotlight — luz ambiental vermelha (LED difuso) que acompanha o cursor.
// SOMENTE nas paginas publicas/comerciais (landing, demo). Montado direto nessas
// paginas — NUNCA no layout raiz, entao nao existe no dashboard/operador.
//
// Regras: desktop-only (hover:hover + pointer:fine), respeita prefers-reduced-
// motion, 1 unico requestAnimationFrame que para quando assenta e quando a aba
// fica oculta, sem setState por movimento, so transform+opacity, pointer-events
// none, wrapper overflow:hidden (nao cria overflow/scroll). Fade in/out no
// enter/leave/blur. z-index baixo (fica atras do conteudo).
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react'

const SIZE = 720            // diametro do LED
const EASE = 0.14           // suavizacao (lerp)
const OPACITY = 0.8         // opacidade maxima

export default function CursorSpotlight({ zIndex = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    // Desktop com mouse de verdade + sem reducao de movimento
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let curX = targetX
    let curY = targetY
    let visible = false
    let raf = null

    const paint = () => { el.style.transform = `translate3d(${curX - SIZE / 2}px, ${curY - SIZE / 2}px, 0)` }
    paint()

    const stop = () => { if (raf != null) { cancelAnimationFrame(raf); raf = null } }
    const tick = () => {
      curX += (targetX - curX) * EASE
      curY += (targetY - curY) * EASE
      paint()
      // Assentou -> encerra o loop (nada de rAF girando parado)
      if (Math.abs(targetX - curX) < 0.4 && Math.abs(targetY - curY) < 0.4) { curX = targetX; curY = targetY; paint(); raf = null; return }
      raf = requestAnimationFrame(tick)
    }
    const start = () => { if (raf == null && document.visibilityState !== 'hidden') raf = requestAnimationFrame(tick) }

    const show = () => { if (!visible) { visible = true; el.style.opacity = String(OPACITY) } }
    const hide = () => { if (visible) { visible = false; el.style.opacity = '0' } }

    const onMove = (e) => { targetX = e.clientX; targetY = e.clientY; show(); start() }
    const onLeave = () => hide()
    const onBlur = () => hide()
    const onVis = () => { if (document.visibilityState === 'hidden') { stop() } else if (visible) start() }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)          // cursor sai da janela
    window.addEventListener('blur', onBlur)                  // janela perde foco
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Wrapper fixo com overflow:hidden -> o LED translada dentro dele sem gerar
  // scroll/overflow na pagina. pointer-events:none em tudo -> nao bloqueia clique.
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex,
    }}>
      <div ref={ref} style={{
        position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE,
        borderRadius: 9999, pointerEvents: 'none', opacity: 0,
        transition: 'opacity 320ms ease',
        willChange: 'transform, opacity',
        background: 'radial-gradient(circle, rgba(255,70,85,0.17) 0%, rgba(220,20,50,0.10) 24%, rgba(150,0,25,0.045) 44%, transparent 68%)',
      }} />
    </div>
  )
}
