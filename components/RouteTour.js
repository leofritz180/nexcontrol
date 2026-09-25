'use client'
import { useEffect, useState } from 'react'
import ProductTour, { hasSeenTour } from './ProductTour'
import { getTour } from '../lib/tour-config'
import { afterVoiceBanner } from '../lib/onboardingSeq'
import { useOverlaySlot } from '../lib/overlayCoordinator'

/**
 * RouteTour — wrapper de tour por rota.
 *
 * Coloca em qualquer page e o tour da rota e gerenciado automaticamente:
 *   - trigger automatico na PRIMEIRA visita
 *   - botao flutuante '?' (canto inferior direito) pra refazer
 *   - persistencia em localStorage (chave: nx_tour_completed_<tourId>)
 *
 * Uso:
 *   <RouteTour tourId="redes" />
 *
 * Props:
 *   tourId:      string — slug do tour (ex: 'redes', 'operadores')
 *   steps:       array opcional — sobrescreve o tour do config
 *   autoDelay:   ms ate disparar tour automatico (default 900)
 *   disableAuto: desativa o trigger automatico
 */
export default function RouteTour({ tourId, steps, autoDelay = 900, disableAuto = false }) {
  const [open, setOpen] = useState(false)
  const tourSteps = steps || getTour(tourId)

  useEffect(() => {
    if (disableAuto || !tourSteps || tourSteps.length === 0) return
    if (hasSeenTour(tourId)) return
    let t
    // Sequenciador: tutorial só começa DEPOIS do banner de voz fechar.
    const off = afterVoiceBanner(() => { t = setTimeout(() => setOpen(true), autoDelay) })
    return () => { off(); clearTimeout(t) }
  }, [tourId, autoDelay, disableAuto, tourSteps?.length])

  // Coordenador: o tutorial disputa a tela com anúncio, aviso e pop-up de
  // instalação. Prioridade 1 é a mesma do TabAwareTour — tutorial primeiro.
  const liberado = useOverlaySlot('tour', 1, open)

  if (!tourSteps || tourSteps.length === 0) return null

  return (
    <>
      <ProductTour
        steps={tourSteps}
        tourId={tourId}
        open={open && liberado}
        onClose={() => setOpen(false)}
      />

      {/* Botao flutuante "?" pra refazer tour */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Refazer tour desta tela"
          title="Refazer tour"
          style={{
            position: 'fixed',
            bottom: 22, right: 22,
            zIndex: 200,
            width: 42, height: 42,
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid color-mix(in srgb, var(--k-laranja) 25%, transparent)',
            color: 'var(--k-laranja)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--k-laranja) 4%, transparent), 0 0 24px color-mix(in srgb, var(--k-laranja) 12%, transparent)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--k-laranja) 45%, transparent)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px color-mix(in srgb, var(--k-laranja) 8%, transparent), 0 0 36px color-mix(in srgb, var(--k-laranja) 20%, transparent)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--k-laranja) 25%, transparent)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--k-laranja) 4%, transparent), 0 0 24px color-mix(in srgb, var(--k-laranja) 12%, transparent)'
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      )}
    </>
  )
}
