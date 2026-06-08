'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { getTrialStatus, formatPriceAnchor, isPreviewMode } from '../../lib/billing-variant'

const PixPayment = dynamic(() => import('../PixPayment'), { ssr: false })

/**
 * Trigger inteligente — popup grande que aparece quando o admin atinge
 * um marco emocional (ex: criou 1a meta real). Maxima conversao porque
 * o usuario acabou de gerar valor.
 *
 * Props:
 *  - userId, tenant, sub, user, profile
 *  - trigger: 'first_meta' | 'first_remessa' | 'first_invite_accepted'
 *  - active: bool — quando o evento acabou de acontecer
 */
export default function SmartUpgradeTrigger({ trigger = 'first_meta', active, tenant, sub, user, profile }) {
  const [show, setShow] = useState(false)
  const [showPix, setShowPix] = useState(false)

  useEffect(() => {
    if (!active || !user?.id) return
    const { isTrial, isExpired } = getTrialStatus(tenant, sub)
    if (!isTrial && !isExpired) return // ja eh PRO

    const key = `nx_smart_trigger_${trigger}_${user.id}`
    let fired = false
    try { fired = localStorage.getItem(key) === '1' } catch {}
    // Em preview mode, ignora o flag pra deixar o user testar quantas vezes quiser
    if (fired && !isPreviewMode()) return

    // Aguarda 1.2s pra criar momento emocional (user ve a meta criada antes do popup)
    const t = setTimeout(() => {
      setShow(true)
      try { localStorage.setItem(key, '1') } catch {}
    }, 1200)
    return () => clearTimeout(t)
  }, [active, user?.id, trigger, tenant, sub])

  function close() { setShow(false) }

  const messages = {
    first_meta: {
      title: 'Voce acabou de criar sua primeira meta',
      subtitle: 'Esse e o sistema que vai te mostrar onde voce ganha e onde perde dinheiro. Garanta seu acesso completo.',
      cta: 'Continuar com acesso total',
    },
    first_remessa: {
      title: 'Primeira remessa registrada',
      subtitle: 'Voce ja viu o sistema funcionando. Imagine isso por mais 30 dias.',
      cta: 'Manter o acesso completo',
    },
    first_invite_accepted: {
      title: 'Seu primeiro operador entrou',
      subtitle: 'Operacao em time exige controle. Garanta o acesso completo antes do trial expirar.',
      cta: 'Garantir acesso',
    },
  }
  const msg = messages[trigger] || messages.first_meta
  const { monthly, daily } = formatPriceAnchor(39.90)

  return (
    <>
      <AnimatePresence>
        {show && !showPix && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 9991,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative', overflow: 'hidden',
                maxWidth: 460, width: '100%',
                borderRadius: 20, padding: 1,
                background: 'linear-gradient(135deg, rgba(229,57,53,0.6), rgba(255,140,140,0.4), rgba(229,57,53,0.6))',
                boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(229,57,53,0.3)',
              }}
            >
              {/* Border gradient animada */}
              <motion.div
                aria-hidden
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 20, padding: 1,
                  background: 'linear-gradient(110deg, rgba(229,57,53,0.7) 0%, rgba(255,140,140,0.5) 50%, rgba(229,57,53,0.7) 100%)',
                  backgroundSize: '200% 100%',
                  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  maskComposite: 'exclude', WebkitMaskComposite: 'xor',
                  pointerEvents: 'none',
                }}
              />

              <div style={{
                position: 'relative',
                background: 'linear-gradient(145deg, var(--raised) 0%, #050505 100%)',
                borderRadius: 19, padding: '32px 28px',
                overflow: 'hidden',
              }}>
                {/* Glow orb */}
                <motion.div aria-hidden
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(229,57,53,0.22) 0%, transparent 60%)',
                    filter: 'blur(30px)',
                  }}
                />

                {/* Close */}
                <button type="button" onClick={close} aria-label="Fechar"
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--t3)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                {/* Checkmark celebrativo */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.15 }}
                  style={{
                    position: 'relative',
                    width: 64, height: 64, borderRadius: 18,
                    margin: '0 auto 18px',
                    background: 'linear-gradient(145deg, #00a06d, #007a52)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 32px rgba(0,160,109,0.5), inset 0 2px 0 rgba(255,255,255,0.25)',
                  }}>
                  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </motion.div>

                {/* Title serif */}
                <h2 style={{
                  position: 'relative',
                  fontFamily: 'var(--font-display, serif)', fontSize: 24, fontWeight: 400,
                  color: 'var(--t1)', margin: '0 0 10px', letterSpacing: '-0.02em',
                  textAlign: 'center', lineHeight: 1.2,
                }}>
                  {msg.title}
                </h2>
                <p style={{
                  position: 'relative',
                  fontSize: 13, color: 'var(--t2)', textAlign: 'center', margin: '0 0 24px',
                  lineHeight: 1.55,
                }}>
                  {msg.subtitle}
                </p>

                {/* Price block */}
                <div style={{
                  position: 'relative',
                  padding: '16px 18px', borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(229,57,53,0.08), rgba(0,0,0,0.4))',
                  border: '1px solid rgba(229,57,53,0.22)',
                  marginBottom: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
                      Plano Admin Solo
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)', fontFamily: 'var(--mono)', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
                      {monthly}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginLeft: 4 }}>/mes</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
                      Equivale a
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--profit)', fontFamily: 'var(--mono)', margin: '4px 0 0' }}>
                      {daily}<span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginLeft: 3 }}>/dia</span>
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  type="button" onClick={() => setShowPix(true)}
                  whileHover={{ scale: 1.02, boxShadow: '0 14px 36px rgba(229,57,53,0.55), 0 0 50px rgba(229,57,53,0.28)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '15px 22px',
                    fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                    letterSpacing: '0.06em',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
                    border: 'none', borderRadius: 11,
                    cursor: 'pointer',
                    boxShadow: '0 8px 26px rgba(229,57,53,0.5), inset 0 1px 0 rgba(255,255,255,0.22)',
                  }}>
                  <motion.span aria-hidden
                    animate={{ x: ['-150%', '150%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                      background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.3), transparent)',
                    }}
                  />
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {msg.cta}
                </motion.button>

                <button type="button" onClick={close}
                  style={{
                    width: '100%', marginTop: 10, padding: 8,
                    background: 'transparent', border: 'none',
                    fontSize: 11, fontWeight: 600, color: 'var(--t4)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  Decido depois
                </button>
              </div>
            </motion.div>
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
