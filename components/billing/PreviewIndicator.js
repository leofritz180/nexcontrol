'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { isPreviewMode } from '../../lib/billing-variant'

/**
 * Indicador discreto no canto avisando "PREVIEW MODE — Variant B".
 * So renderiza quando ?preview=1 ou nx_preview no localStorage.
 *
 * Tem botoes pra:
 * - Disparar SmartUpgradeTrigger (via callback)
 * - Sair do preview mode
 */
export default function PreviewIndicator({ onTriggerSmart }) {
  const [active, setActive] = useState(false)

  useEffect(() => { setActive(isPreviewMode()) }, [])

  if (!active) return null

  function disablePreview() {
    try { localStorage.removeItem('nx_preview') } catch {}
    // Recarrega sem o param
    const url = new URL(window.location.href)
    url.searchParams.delete('preview')
    window.location.href = url.toString()
  }

  function clearTriggers() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('nx_smart_trigger_')).forEach(k => localStorage.removeItem(k))
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'fixed',
        top: 12, right: 12, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(229,57,53,0.18), rgba(0,0,0,0.85))',
        border: '1px solid rgba(229,57,53,0.5)',
        boxShadow: '0 8px 22px rgba(0,0,0,0.5), 0 0 18px rgba(229,57,53,0.25)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <motion.span
        animate={{ boxShadow: ['0 0 0 0 rgba(229,57,53,0.7)', '0 0 0 5px rgba(229,57,53,0)', '0 0 0 0 rgba(229,57,53,0)'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444' }}
      />
      <span style={{ fontSize: 10, fontWeight: 900, color: '#ff6b6b', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
        PREVIEW · VARIANT B
      </span>
      {onTriggerSmart && (
        <button type="button" onClick={() => { clearTriggers(); onTriggerSmart() }}
          style={{
            fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', color: 'var(--t1)',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
          }}>
          Smart trigger
        </button>
      )}
      <button type="button" onClick={disablePreview}
        style={{
          fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
          background: 'transparent', color: 'var(--t3)',
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
        }}>
        Sair preview
      </button>
    </motion.div>
  )
}
