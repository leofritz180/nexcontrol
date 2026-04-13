'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'nexcontrol_install_done'
const SIGNUP_KEY = 'nexcontrol_just_signed_up'
const ease = [0.33, 1, 0.68, 1]

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function getDevice() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/* ═══════════════════════════════════════════════════════
   PHONE MOCKUP — Realistic device with animated notification
═══════════════════════════════════════════════════════ */
function PhoneMockup() {
  const [phase, setPhase] = useState(0) // 0=hidden, 1=entering, 2=visible, 3=exiting

  useEffect(() => {
    let mounted = true
    function cycle() {
      if (!mounted) return
      setPhase(1)
      setTimeout(() => { if (mounted) setPhase(2) }, 600)
      setTimeout(() => { if (mounted) setPhase(3) }, 3800)
      setTimeout(() => { if (mounted) setPhase(0) }, 4300)
      setTimeout(() => { if (mounted) cycle() }, 5200)
    }
    const initial = setTimeout(cycle, 1200)
    return () => { mounted = false; clearTimeout(initial) }
  }, [])

  const notifVisible = phase === 1 || phase === 2

  return (
    <div style={{
      width: 220, maxWidth: '60vw', aspectRatio: '220/420', margin: '0 auto',
      background: '#08080c',
      borderRadius: 32, border: '2.5px solid rgba(255,255,255,0.07)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), 0 0 80px rgba(229,57,53,0.04)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Notch */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
        <div style={{ width: 70, height: 22, borderRadius: 12, background: '#000', border: '1px solid rgba(255,255,255,0.05)' }} />
      </div>

      {/* Status bar */}
      <div style={{ height: 24, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[3, 5, 7, 9].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: 'rgba(255,255,255,0.4)' }} />
          ))}
          <div style={{ width: 16, height: 8, borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)', marginLeft: 3, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 1.5, borderRadius: 0.5, background: '#22c55e' }} />
          </div>
        </div>
      </div>

      {/* Screen */}
      <div style={{ flex: 1, padding: '10px 14px', position: 'relative' }}>
        {/* App header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={10} height={10} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5} />
              <path d="M12 22L18 22L18 6L12 6Z" fill="white" />
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7} />
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>NexControl</span>
          <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          <div style={{ padding: '9px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lucro</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#22c55e', fontFamily: 'var(--mono, monospace)' }}>+R$ 1.840</div>
          </div>
          <div style={{ padding: '9px 8px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metas</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--mono, monospace)' }}>8</div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, marginBottom: 12 }}>
          {[30, 50, 40, 65, 55, 80, 70, 90, 75].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: 2.5,
              background: `rgba(34,197,94,${0.12 + i * 0.04})`,
            }} />
          ))}
        </div>

        {/* List */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 0',
            borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 5, width: `${55 + i * 12}%`, borderRadius: 2, background: 'rgba(255,255,255,0.05)', marginBottom: 3 }} />
              <div style={{ height: 4, width: `${35 + i * 8}%`, borderRadius: 2, background: 'rgba(255,255,255,0.025)' }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#22c55e', fontFamily: 'var(--mono, monospace)' }}>+R${i * 145 + 95}</span>
          </div>
        ))}

        {/* Notification overlay */}
        <AnimatePresence>
          {notifVisible && (
            <motion.div
              initial={{ y: -70, opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease, type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                position: 'absolute', top: 8, left: 8, right: 8, zIndex: 10,
                padding: '11px 12px', borderRadius: 16,
                background: 'rgba(14,18,28,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: '#e53935', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(229,57,53,0.25)',
              }}>
                <svg width={12} height={12} viewBox="0 0 28 28" fill="none">
                  <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5} />
                  <path d="M12 22L18 22L18 6L12 6Z" fill="white" />
                  <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 1 }}>+R$ 320 registrados</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>Meta quase concluida</div>
              </div>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>agora</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Home indicator */}
      <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   STEP — Tutorial step with visual number
═══════════════════════════════════════════════════════ */
function StepItem({ number, text, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: '#e53935',
      }}>{number}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        {icon && (
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d={icon} />
          </svg>
        )}
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{text}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN — InstallPrompt
═══════════════════════════════════════════════════════ */
export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [device, setDevice] = useState('desktop')
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    // Only show after signup — check flag set during signup flow
    const justSignedUp = sessionStorage.getItem(SIGNUP_KEY)
    // Also show for users who haven't seen it yet and are on dashboard pages
    const isDashboard = ['/admin', '/operator', '/faturamento', '/operadores', '/redes'].some(p => window.location.pathname.startsWith(p))

    if (!justSignedUp && !isDashboard) return

    setDevice(getDevice())

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    const timer = setTimeout(() => setShow(true), 3000)

    return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler) }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    sessionStorage.removeItem(SIGNUP_KEY)
    setShow(false)
  }, [])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    dismiss()
  }, [deferredPrompt, dismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={e => { if (e.target === e.currentTarget) dismiss() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(2,4,8,0.85)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.45, ease }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420,
              maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
              background: 'linear-gradient(170deg, #10141e 0%, #080b14 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 28,
              boxShadow: '0 50px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02), 0 0 100px rgba(229,57,53,0.03)',
              position: 'relative',
            }}
          >
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', marginLeft: -150,
              width: 300, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(229,57,53,0.06), transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ padding: '36px 28px 28px', position: 'relative', zIndex: 1 }}>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease }}
                style={{ textAlign: 'center', marginBottom: 28 }}
              >
                <h2 style={{
                  fontSize: 22, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 8,
                }}>
                  Transforme o NexControl<br />em um app no seu celular
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: 0 }}>
                  Receba alertas em tempo real. Controle total na palma da mao.
                </p>
              </motion.div>

              {/* Phone mockup */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease }}
                style={{ marginBottom: 28 }}
              >
                <PhoneMockup />
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease }}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                  marginBottom: 24,
                }}
              >
                {[
                  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notificacoes em tempo real' },
                  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Acesso instantaneo' },
                  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Controle continuo' },
                  { icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', label: 'Performance real' },
                ].map((b, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <path d={b.icon} />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{b.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* Tutorial — device specific */}
              {device !== 'desktop' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4, ease }}
                  style={{
                    padding: '16px 18px', borderRadius: 18, marginBottom: 24,
                    background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <p style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                  }}>
                    {device === 'ios' ? 'Como instalar no iPhone' : 'Como instalar no Android'}
                  </p>
                  {device === 'ios' ? (
                    <>
                      <StepItem number="1" text="Toque no botao compartilhar" icon="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                      <StepItem number="2" text='"Adicionar a Tela de Inicio"' icon="M12 5v14M5 12h14" />
                      <StepItem number="3" text="Confirme e pronto" icon="M20 6L9 17l-5-5" />
                    </>
                  ) : (
                    <>
                      <StepItem number="1" text="Toque no menu (3 pontos)" icon="M12 5v.01M12 12v.01M12 19v.01" />
                      <StepItem number="2" text='"Instalar aplicativo"' icon="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      <StepItem number="3" text="Confirme e pronto" icon="M20 6L9 17l-5-5" />
                    </>
                  )}
                </motion.div>
              )}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4, ease }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <motion.button
                  onClick={handleInstall}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '15px 20px', borderRadius: 14,
                    fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #e53935, #c62828)',
                    color: '#fff',
                    boxShadow: '0 6px 24px rgba(229,57,53,0.25), 0 0 0 1px rgba(229,57,53,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {deferredPrompt ? 'Instalar agora' : 'Entendi, vou instalar'}
                </motion.button>

                <button
                  onClick={dismiss}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'rgba(255,255,255,0.25)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                >
                  Agora nao
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Helper: call this after signup to trigger the prompt ── */
export function markJustSignedUp() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SIGNUP_KEY, '1')
  }
}
