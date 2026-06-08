'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { getTrialStatus, formatPriceAnchor } from '../../lib/billing-variant'

const PixPayment = dynamic(() => import('../PixPayment'), { ssr: false })

/**
 * Chip pequeno pra header — countdown do trial ao lado do nome do admin.
 * Cor muda conforme urgencia. Click abre PIX direto.
 */
export default function TrialChip({ tenant, sub, user, profile }) {
  const [showPix, setShowPix] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const { isTrial, isExpired, daysLeft, urgency } = getTrialStatus(tenant, sub)
  if (!isTrial && !isExpired) return null

  const colors = {
    low:      { fg: 'var(--profit)', bg: 'rgba(209,250,229,0.10)', border: 'rgba(209,250,229,0.35)' },
    medium:   { fg: '#ff8a47', bg: 'rgba(255,138,71,0.10)',   border: 'rgba(255,138,71,0.40)' },
    high:     { fg: '#ff6b6b', bg: 'rgba(255,107,107,0.12)',  border: 'rgba(255,107,107,0.45)' },
    critical: { fg: '#ff4444', bg: 'rgba(255,68,68,0.14)',    border: 'rgba(255,68,68,0.55)' },
  }
  const c = colors[urgency] || colors.medium
  const { monthly } = formatPriceAnchor(39.90)

  const label = isExpired ? 'EXPIRADO' : daysLeft === 1 ? '1 DIA' : `${daysLeft} DIAS`
  const showPulse = urgency === 'critical' || urgency === 'high'

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setShowPix(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        title={`Trial: ${label}. Clique pra assinar (${monthly}/mes)`}
        animate={showPulse
          ? { boxShadow: [`0 0 0 0 ${c.fg}30`, `0 0 14px ${c.fg}80`, `0 0 0 0 ${c.fg}30`] }
          : {}
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative', overflow: 'hidden',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 11px',
          fontSize: 11, fontWeight: 900, fontFamily: 'var(--mono)',
          letterSpacing: '0.14em',
          color: c.fg, background: c.bg,
          border: `1px solid ${c.border}`, borderRadius: 999,
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        TRIAL · {label}
      </motion.button>

      {showPix && (
        <PixPayment
          tenantId={profile?.tenant_id}
          userId={user?.id}
          userName={profile?.nome}
          userEmail={user?.email}
          amount={39.90}
          operatorCount={0}
          planName="Admin Solo"
          onSuccess={() => { setShowPix(false); window.location.reload() }}
          onClose={() => setShowPix(false)}
        />
      )}
    </>
  )
}
