'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { getTrialStatus, formatPriceAnchor } from '../../lib/billing-variant'

const PixPayment = dynamic(() => import('../PixPayment'), { ssr: false })

/**
 * Barra fixa bottom — aparece pra usuarios em trial OU expirados.
 * CTA abre PIX direto (1 clique = ja em pagamento).
 *
 * Props: tenant, sub, user, profile
 */
export default function UpgradeStickyBar({ tenant, sub, user, profile }) {
  const [showPix, setShowPix] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Ressuscita dismiss da sessao atual (nao persiste entre navs longas)
    try { setDismissed(sessionStorage.getItem('nx_upgrade_bar_dismissed') === '1') } catch {}
  }, [])

  if (!mounted) return null

  const { isTrial, isExpired, daysLeft, urgency } = getTrialStatus(tenant, sub)
  if (!isTrial && !isExpired) return null
  if (dismissed && !isExpired) return null // expired sempre forca

  const { monthly, daily } = formatPriceAnchor(39.90)
  const urgencyColor = urgency === 'critical' || urgency === 'high' ? '#ff4444' : urgency === 'medium' ? '#ff8a47' : '#e53935'

  function handleDismiss() {
    setDismissed(true)
    try { sessionStorage.setItem('nx_upgrade_bar_dismissed', '1') } catch {}
  }

  return (
    <>
      <AnimatePresence>
        {!showPix && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 9990,
              padding: '12px 18px',
              background: 'linear-gradient(180deg, rgba(15,8,8,0.96) 0%, rgba(0,0,0,0.98) 100%)',
              backdropFilter: 'blur(16px) saturate(160%)',
              WebkitBackdropFilter: 'blur(16px) saturate(160%)',
              borderTop: `1px solid rgba(229,57,53,0.35)`,
              boxShadow: `0 -12px 40px rgba(0,0,0,0.55), 0 -1px 0 ${urgencyColor}, 0 -8px 32px rgba(229,57,53,0.18)`,
            }}
          >
            {/* Top glow line animada */}
            <motion.div
              aria-hidden
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent 0%, ${urgencyColor} 30%, #ff8a47 50%, ${urgencyColor} 70%, transparent 100%)`,
                backgroundSize: '200% 100%',
                pointerEvents: 'none',
              }}
            />

            <div style={{
              maxWidth: 1380, margin: '0 auto',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              {/* Status (esquerda) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
                <motion.div
                  animate={urgency === 'critical' || urgency === 'high'
                    ? { boxShadow: [`0 0 0 0 ${urgencyColor}90`, `0 0 0 7px ${urgencyColor}00`, `0 0 0 0 ${urgencyColor}00`] }
                    : { boxShadow: [`0 0 0 0 ${urgencyColor}60`, `0 0 0 5px ${urgencyColor}00`, `0 0 0 0 ${urgencyColor}00`] }
                  }
                  transition={{ duration: urgency === 'critical' ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: urgencyColor, flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 800, color: urgencyColor,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    fontFamily: 'var(--mono)', margin: 0, lineHeight: 1.2,
                  }}>
                    {isExpired ? 'Trial expirado' : daysLeft === 1 ? 'Ultimo dia de trial' : `${daysLeft} dias de trial`}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--t1)', margin: '3px 0 0', fontWeight: 600, lineHeight: 1.3 }}>
                    {isExpired
                      ? 'Acesso bloqueado — assine pra continuar operando'
                      : 'Garanta seu acesso antes de expirar e nao perca nenhuma operacao'}
                  </p>
                </div>
              </div>

              {/* Preco anchoring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, lineHeight: 1.1 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--t1)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>
                  {monthly}<span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginLeft: 4 }}>/mes</span>
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', fontFamily: 'var(--mono)', letterSpacing: '0.06em', marginTop: 2 }}>
                  ≈ {daily}/dia
                </span>
              </div>

              {/* CTA */}
              <motion.button
                type="button"
                onClick={() => setShowPix(true)}
                whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(229,57,53,0.6), 0 0 40px rgba(229,57,53,0.3)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  position: 'relative', overflow: 'hidden',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px',
                  fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                  letterSpacing: '0.06em',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
                  border: 'none', borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: '0 6px 22px rgba(229,57,53,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
                  flexShrink: 0,
                }}
              >
                {/* Shine pass perpetuo */}
                <motion.span
                  aria-hidden
                  animate={{ x: ['-150%', '150%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                Assinar agora
              </motion.button>

              {/* Dismiss (so pra trial nao expirado) */}
              {!isExpired && (
                <button type="button" onClick={handleDismiss} aria-label="Dispensar"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--t3)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--t1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--t3)' }}
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
