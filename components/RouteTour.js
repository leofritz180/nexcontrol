'use client'
import { useEffect, useState } from 'react'
import ProductTour, { hasSeenTour } from './ProductTour'
import { getTour } from '../lib/tour-config'
import { afterVoiceBanner } from '../lib/onboardingSeq'

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

  if (!tourSteps || tourSteps.length === 0) return null

  return (
    <>
      <ProductTour
        steps={tourSteps}
        tourId={tourId}
        open={open}
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
            background: 'linear-gradient(180deg, #0f0f0f, #050505)',
            border: '1px solid rgba(229,57,53,0.25)',
            color: '#e53935',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(229,57,53,0.04), 0 0 24px rgba(229,57,53,0.12)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.borderColor = 'rgba(229,57,53,0.45)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,57,53,0.08), 0 0 36px rgba(229,57,53,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(229,57,53,0.25)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(229,57,53,0.04), 0 0 24px rgba(229,57,53,0.12)'
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
