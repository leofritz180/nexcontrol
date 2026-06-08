'use client'
import { useEffect, useState } from 'react'
import ProductTour, { hasSeenTour } from './ProductTour'
import { getTour } from '../lib/tour-config'

/**
 * TabAwareTour — dispara tour conforme a tab ativa muda.
 *
 * Cada tab tem seu proprio tour (e localStorage independente),
 * entao o user so ve as explicacoes daquela tab quando clica nela.
 *
 * Uso:
 *   <TabAwareTour
 *     activeTab={tab}
 *     tabMap={{
 *       overview: 'admin',           // tab 'overview' → tour 'admin'
 *       myops: 'admin-myops',
 *       operations: 'admin-operations',
 *       trash: 'admin-trash',
 *     }}
 *   />
 *
 * Props:
 *   activeTab:  string — chave da tab atual
 *   tabMap:     { [tabKey]: tourId } — mapeia tab pra tourId
 *   autoDelay:  ms ate disparar tour automatico (default 700)
 */
export default function TabAwareTour({ activeTab, tabMap, autoDelay = 700 }) {
  const [open, setOpen] = useState(false)
  const [tourId, setTourId] = useState(null)

  useEffect(() => {
    const newTourId = tabMap?.[activeTab]
    setTourId(newTourId || null)
    setOpen(false) // fecha tour anterior quando muda de tab

    if (!newTourId) return
    if (hasSeenTour(newTourId)) return

    let t
    const start = () => { t = setTimeout(() => setOpen(true), autoDelay) }
    // Sequenciador de onboarding: tutorial só começa DEPOIS do banner fechar.
    if (typeof window !== 'undefined' && window.__nxBannerOpen) {
      const onClosed = () => start()
      window.addEventListener('nx-banner-closed', onClosed, { once: true })
      return () => { window.removeEventListener('nx-banner-closed', onClosed); clearTimeout(t) }
    }
    start()
    return () => clearTimeout(t)
  }, [activeTab, tabMap])

  const steps = tourId ? getTour(tourId) : []
  if (!tourId || steps.length === 0) return null

  return (
    <>
      <ProductTour
        steps={steps}
        tourId={tourId}
        open={open}
        onClose={() => setOpen(false)}
      />

      {/* Botao flutuante "?" pra refazer tour da tab atual */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Refazer tour desta aba"
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
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(229,57,53,0.25)'
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
