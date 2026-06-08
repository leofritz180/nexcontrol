'use client'
import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ProductTour — spotlight tour com overlay escuro + tooltip flutuante.
 *
 * Props:
 *   steps:    [{ target, title, description, position }]
 *             target: seletor CSS do elemento alvo (ex: '[data-tour="kpi-lucro"]')
 *             position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
 *   tourId:   string unico — usado pra persistir conclusao em localStorage
 *   open:     boolean — controla visibilidade externamente
 *   onClose:  callback ao fechar (skip ou completar)
 */
export default function ProductTour({ steps = [], tourId, open, onClose }) {
  const [index, setIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'bottom' })
  const tooltipRef = useRef(null)

  const step = steps[index]

  useEffect(() => {
    if (!open) setIndex(0)
  }, [open])

  // Fecha com ESC (overlay nao bloqueia clicks mais)
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') skip()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, steps.length])

  // Recalcula posicao do target quando step muda ou janela redimensiona
  useLayoutEffect(() => {
    if (!open || !step) { setTargetRect(null); return }

    // Se step define clickBefore, dispara click no elemento (pra mudar tab/abrir menu/etc)
    // e espera o DOM montar antes de medir.
    if (step.clickBefore) {
      try {
        const btn = document.querySelector(step.clickBefore)
        if (btn) btn.click()
      } catch {}
    }

    function recompute() {
      let el = null
      if (step.target) el = document.querySelector(step.target)

      // Se elemento existe mas ainda sem dimensoes, retenta
      if (el) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) {
          el = null
        }
      }

      if (!el) {
        setTargetRect(null)
        setTooltipPos({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
          placement: 'center',
        })
        return
      }

      const vw = window.innerWidth
      const vh = window.innerHeight

      // Scroll pro alvo aparecer (top do alvo perto do top da viewport)
      try {
        const elRect = el.getBoundingClientRect()
        const targetScrollTop = window.scrollY + elRect.top - 100
        // So scrolla se necessario
        if (elRect.top < 0 || elRect.top > vh * 0.6) {
          window.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
        }
      } catch {}

      const r = el.getBoundingClientRect()
      const padding = 8

      // CLAMP: se o alvo for maior que 70% da viewport, mostra so a parte visivel.
      // Isso evita ring gigante que quebra layout do tooltip.
      const MAX_RING_H = vh * 0.7
      const MAX_RING_W = vw * 0.85

      const rawTop = r.top - padding
      const rawBottom = r.bottom + padding
      const rawLeft = r.left - padding
      const rawRight = r.right + padding

      // Limita ring ao que cabe na viewport
      const ringTop = Math.max(20, rawTop)
      const ringBottom = Math.min(vh - 20, rawBottom)
      const ringLeft = Math.max(8, rawLeft)
      const ringRight = Math.min(vw - 8, rawRight)

      // Aplica limite maximo de tamanho
      let finalTop = ringTop
      let finalBottom = ringBottom
      if (ringBottom - ringTop > MAX_RING_H) {
        finalBottom = ringTop + MAX_RING_H
      }
      let finalLeft = ringLeft
      let finalRight = ringRight
      if (ringRight - ringLeft > MAX_RING_W) {
        finalRight = ringLeft + MAX_RING_W
      }

      const rect = {
        top: finalTop,
        left: finalLeft,
        width: finalRight - finalLeft,
        height: finalBottom - finalTop,
        bottom: finalBottom,
        right: finalRight,
      }
      setTargetRect(rect)

      // Decide placement
      const tooltipW = 360
      const tooltipH = 220
      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top
      const spaceRight = vw - rect.right
      const spaceLeft = rect.left

      // Score de cada placement (espaco disponivel)
      const candidates = []
      if (spaceBelow >= tooltipH + 16) candidates.push({ p: 'bottom', score: spaceBelow })
      if (spaceAbove >= tooltipH + 16) candidates.push({ p: 'top', score: spaceAbove })
      if (spaceRight >= tooltipW + 16) candidates.push({ p: 'right', score: spaceRight })
      if (spaceLeft >= tooltipW + 16) candidates.push({ p: 'left', score: spaceLeft })

      let placement
      if (step.position && step.position !== 'auto') {
        // Tenta usar o desejado; se nao cabe, fallback
        const fits = candidates.find(c => c.p === step.position)
        placement = fits ? step.position : (candidates[0]?.p || step.position)
      } else {
        placement = candidates.sort((a, b) => b.score - a.score)[0]?.p || 'bottom'
      }

      // Calcula posicao
      let top = 0, left = 0
      const centerX = rect.left + rect.width / 2 - tooltipW / 2
      const centerY = rect.top + rect.height / 2 - tooltipH / 2

      if (placement === 'bottom') {
        top = rect.bottom + 14
        left = clamp(centerX, 16, vw - tooltipW - 16)
      } else if (placement === 'top') {
        top = rect.top - tooltipH - 14
        left = clamp(centerX, 16, vw - tooltipW - 16)
      } else if (placement === 'right') {
        top = clamp(centerY, 16, vh - tooltipH - 16)
        left = rect.right + 14
      } else if (placement === 'left') {
        top = clamp(centerY, 16, vh - tooltipH - 16)
        left = rect.left - tooltipW - 14
      }

      // Garante que o tooltip nao sai da viewport
      top = clamp(top, 16, vh - tooltipH - 16)
      left = clamp(left, 16, vw - tooltipW - 16)

      setTooltipPos({ top, left, placement })
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(v, max)) }

    // Recompute em multiplos delays — primeiro rapido, depois espera tab/animacao terminar
    const delays = step.clickBefore ? [200, 500, 900] : [80, 300, 700]
    const timers = delays.map(d => setTimeout(recompute, d))
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, { passive: true, capture: true })
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
  }, [open, step?.target, step?.clickBefore, index])

  function next() {
    if (index < steps.length - 1) setIndex(index + 1)
    else complete()
  }

  function prev() {
    if (index > 0) setIndex(index - 1)
  }

  function skip() {
    complete()
  }

  function complete() {
    if (tourId) {
      try { localStorage.setItem(`nx_tour_completed_${tourId}`, '1') } catch {}
    }
    onClose?.()
  }

  if (!open || !step) return null

  const total = steps.length
  const current = index + 1
  const isCenter = !targetRect

  return (
    <AnimatePresence>
      <motion.div
        key="tour-portal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}
      >
        {/* Overlay com 4 retangulos formando spotlight.
            IMPORTANTE: pointer-events: none — permite scroll/click no fundo.
            Fechar o tour eh apenas via botao X ou Esc. */}
        {!isCenter ? (
          <>
            {/* TOP */}
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw',
              height: Math.max(0, targetRect.top),
              background: 'rgba(0,0,0,0.68)',
              backdropFilter: 'blur(3px)',
              pointerEvents: 'none',
            }} />
            {/* LEFT */}
            <div style={{
              position: 'fixed', top: targetRect.top, left: 0,
              width: Math.max(0, targetRect.left),
              height: targetRect.height,
              background: 'rgba(0,0,0,0.68)',
              backdropFilter: 'blur(3px)',
              pointerEvents: 'none',
            }} />
            {/* RIGHT */}
            <div style={{
              position: 'fixed', top: targetRect.top, left: targetRect.right,
              width: Math.max(0, window.innerWidth - targetRect.right),
              height: targetRect.height,
              background: 'rgba(0,0,0,0.68)',
              backdropFilter: 'blur(3px)',
              pointerEvents: 'none',
            }} />
            {/* BOTTOM */}
            <div style={{
              position: 'fixed', top: targetRect.bottom, left: 0,
              width: '100vw',
              height: Math.max(0, window.innerHeight - targetRect.bottom),
              background: 'rgba(0,0,0,0.68)',
              backdropFilter: 'blur(3px)',
              pointerEvents: 'none',
            }} />

            {/* Ring de destaque no target */}
            <motion.div
              key={`ring-${index}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
              style={{
                position: 'fixed',
                top: targetRect.top, left: targetRect.left,
                width: targetRect.width, height: targetRect.height,
                borderRadius: 12,
                border: '2px solid rgba(229,57,53,0.6)',
                boxShadow: '0 0 0 4px rgba(229,57,53,0.12), 0 0 40px rgba(229,57,53,0.25)',
                pointerEvents: 'none',
              }}
            />
          </>
        ) : (
          // Center mode (sem target) — overlay full, mas tambem nao bloqueia scroll
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }} />
        )}

        {/* TOOLTIP */}
        <motion.div
          ref={tooltipRef}
          key={`tooltip-${index}`}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
          style={{
            position: 'fixed',
            top: isCenter ? '50%' : tooltipPos.top,
            left: isCenter ? '50%' : tooltipPos.left,
            transform: isCenter ? 'translate(-50%, -50%)' : 'none',
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            background: 'linear-gradient(180deg, var(--raised), #050505)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(229,57,53,0.04), 0 0 60px rgba(229,57,53,0.08)',
            pointerEvents: 'auto',
            zIndex: 9999,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header: progress + close */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{
              fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
              fontSize: 9.5,
              color: '#e53935',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 18, height: 1, background: '#e53935' }}/>
              Passo {current} de {total}
            </div>
            <button
              onClick={skip}
              aria-label="Pular tutorial"
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 2,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 1,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <motion.div
              initial={false}
              animate={{ width: `${(current / total) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #e53935, #ff5a55)',
                borderRadius: 1,
              }}
            />
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#fafafa',
            margin: '0 0 8px',
            letterSpacing: '-0.012em',
            lineHeight: 1.25,
          }}>{step.title}</h3>

          {/* Description */}
          <p style={{
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 18px',
            lineHeight: 1.55,
            fontWeight: 400,
          }}>{step.description}</p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {index > 0 ? (
              <button
                onClick={prev}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >‹ Voltar</button>
            ) : (
              <button
                onClick={skip}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(229,57,53,0.2)',
                  color: '#e53935',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >Sair</button>
            )}
            <div style={{ flex: 1 }}/>
            <button
              onClick={next}
              style={{
                padding: '9px 18px', borderRadius: 8,
                background: '#10B981',
                border: 'none',
                color: '#fff',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              }}
            >
              {current === total ? 'Concluir' : 'Próximo'}
              {current !== total && (
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────
   Helper: ja viu o tour?
   ───────────────────────────────────────── */
export function hasSeenTour(tourId) {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(`nx_tour_completed_${tourId}`) === '1' } catch { return false }
}

export function resetTour(tourId) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(`nx_tour_completed_${tourId}`) } catch {}
}
