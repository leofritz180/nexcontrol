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

  // Recalcula posicao do target quando step muda ou janela redimensiona
  useLayoutEffect(() => {
    if (!open || !step) { setTargetRect(null); return }

    function recompute() {
      let el = null
      if (step.target) el = document.querySelector(step.target)

      if (!el) {
        // Sem target: tooltip centralizado
        setTargetRect(null)
        setTooltipPos({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
          placement: 'center',
        })
        return
      }

      // Scroll suave pro elemento ficar visivel
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch {}

      const r = el.getBoundingClientRect()
      const padding = 8
      const rect = {
        top: r.top - padding,
        left: r.left - padding,
        width: r.width + padding * 2,
        height: r.height + padding * 2,
        bottom: r.bottom + padding,
        right: r.right + padding,
      }
      setTargetRect(rect)

      // Decide placement automatico
      const tooltipW = 360
      const tooltipH = 200
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const spaceRight = window.innerWidth - rect.right
      const spaceLeft = rect.left

      let placement = step.position || 'auto'
      if (placement === 'auto') {
        if (spaceBelow >= tooltipH + 16) placement = 'bottom'
        else if (spaceAbove >= tooltipH + 16) placement = 'top'
        else if (spaceRight >= tooltipW + 16) placement = 'right'
        else placement = 'left'
      }

      // Calcula posicao do tooltip baseado no placement
      let top = 0, left = 0
      if (placement === 'bottom') {
        top = rect.bottom + 14
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16))
      } else if (placement === 'top') {
        top = rect.top - tooltipH - 14
        left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16))
      } else if (placement === 'right') {
        top = Math.max(16, Math.min(rect.top + rect.height / 2 - tooltipH / 2, window.innerHeight - tooltipH - 16))
        left = rect.right + 14
      } else if (placement === 'left') {
        top = Math.max(16, Math.min(rect.top + rect.height / 2 - tooltipH / 2, window.innerHeight - tooltipH - 16))
        left = rect.left - tooltipW - 14
      }

      setTooltipPos({ top, left, placement })
    }

    // Recompute apos pequeno delay (esperar scroll)
    const t = setTimeout(recompute, 350)
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
  }, [open, step?.target, index])

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
        {/* Overlay com 4 retangulos formando spotlight */}
        {!isCenter ? (
          <>
            {/* TOP */}
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw',
              height: Math.max(0, targetRect.top),
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }} onClick={skip} />
            {/* LEFT */}
            <div style={{
              position: 'fixed', top: targetRect.top, left: 0,
              width: Math.max(0, targetRect.left),
              height: targetRect.height,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }} onClick={skip} />
            {/* RIGHT */}
            <div style={{
              position: 'fixed', top: targetRect.top, left: targetRect.right,
              width: Math.max(0, window.innerWidth - targetRect.right),
              height: targetRect.height,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }} onClick={skip} />
            {/* BOTTOM */}
            <div style={{
              position: 'fixed', top: targetRect.bottom, left: 0,
              width: '100vw',
              height: Math.max(0, window.innerHeight - targetRect.bottom),
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }} onClick={skip} />

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
          // Center mode (sem target)
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
          }} onClick={skip} />
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
            background: 'linear-gradient(180deg, #0a0a0a, #050505)',
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
