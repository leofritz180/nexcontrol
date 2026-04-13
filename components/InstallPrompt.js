'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'nexcontrol_install_prompted'
const ease = [0.33, 1, 0.68, 1]

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function getDevice() {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/* ── Phone mockup with animated notification ── */
function PhoneMockup() {
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowNotif(true), 800)
    const loop = setInterval(() => {
      setShowNotif(false)
      setTimeout(() => setShowNotif(true), 400)
    }, 5000)
    return () => { clearTimeout(t1); clearInterval(loop) }
  }, [])

  return (
    <div style={{
      width: 200, height: 380, margin: '0 auto',
      background: '#0a0a0f',
      borderRadius: 28, border: '3px solid rgba(255,255,255,0.08)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 32, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ width: 12, height: 7, borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 1, borderRadius: 1, background: '#22c55e' }} />
          </div>
        </div>
      </div>

      {/* Screen content — fake dashboard */}
      <div style={{ flex: 1, padding: '12px 14px', position: 'relative' }}>
        {/* Fake header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#fff' }}>N</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>NexControl</span>
        </div>

        {/* Fake KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          <div style={{ padding: '8px 7px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>LUCRO</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', fontFamily: 'var(--mono, monospace)' }}>+R$ 1.240</div>
          </div>
          <div style={{ padding: '8px 7px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>METAS</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--mono, monospace)' }}>12</div>
          </div>
        </div>

        {/* Fake chart bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, padding: '0 4px', marginBottom: 10 }}>
          {[35, 55, 45, 70, 60, 80, 65].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: `rgba(34,197,94,${0.15 + i * 0.06})` }} />
          ))}
        </div>

        {/* Fake list items */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 5, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 5, width: `${60 + i * 10}%`, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 3 }} />
              <div style={{ height: 4, width: `${40 + i * 5}%`, borderRadius: 2, background: 'rgba(255,255,255,0.03)' }} />
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#22c55e', fontFamily: 'var(--mono, monospace)' }}>+R${i * 120 + 80}</div>
          </div>
        ))}

        {/* Animated notification dropping in */}
        <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease }}
              style={{
                position: 'absolute', top: 38, left: 10, right: 10,
                padding: '10px 12px', borderRadius: 14,
                background: 'rgba(18,22,32,0.97)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: '#e53935', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>N</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', marginBottom: 2 }}>+R$ 320 registrados</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>Meta quase concluida</div>
              </div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>agora</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Home indicator */}
      <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
      </div>
    </div>
  )
}

/* ── Step indicator ── */
function Step({ number, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: '#e53935',
      }}>{number}</div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{text}</span>
    </div>
  )
}

/* ── Main component ── */
export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [device, setDevice] = useState('unknown')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const prompted = useRef(false)

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return
    // Don't show if already prompted
    if (localStorage.getItem(STORAGE_KEY)) return
    // Detect device
    setDevice(getDevice())

    // Listen for beforeinstallprompt (Chrome/Android)
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    // Show after short delay
    const timer = setTimeout(() => {
      if (!prompted.current) {
        prompted.current = true
        setShow(true)
      }
    }, 3000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setShow(false)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') dismiss()
      setDeferredPrompt(null)
    } else {
      dismiss()
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={e => { if (e.target === e.currentTarget) dismiss() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease }}
            style={{
              width: '100%', maxWidth: 440,
              maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
              background: 'linear-gradient(160deg, #0e1320, #080c16)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 24,
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
              padding: '36px 30px 28px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, margin: '0 auto 16px',
                background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(229,57,53,0.2)',
              }}>
                <svg width={18} height={18} viewBox="0 0 28 28" fill="none">
                  <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5} />
                  <path d="M12 22L18 22L18 6L12 6Z" fill="white" />
                  <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7} />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Instale o NexControl
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: 0 }}>
                Acesse como app real + receba notificacoes em tempo real
              </p>
            </div>

            {/* Phone mockup */}
            <div style={{ marginBottom: 28 }}>
              <PhoneMockup />
            </div>

            {/* Benefits */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              marginBottom: 24,
            }}>
              {[
                { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', text: 'Notificacoes em tempo real' },
                { icon: 'M13 10V3L4 14h7v7l9-11h-7z', text: 'Acesso instantaneo' },
                { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', text: 'Experiencia nativa' },
                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Controle total' },
              ].map((b, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                    <path d={b.icon} />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* Tutorial — device-specific */}
            {(device === 'ios' || device === 'android') && (
              <div style={{
                padding: '18px 18px 14px', borderRadius: 16, marginBottom: 24,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  {device === 'ios' ? 'Como instalar (iPhone)' : 'Como instalar (Android)'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {device === 'ios' ? (
                    <>
                      <Step number="1" text='Toque no botao de compartilhar (quadrado com seta)' />
                      <Step number="2" text='"Adicionar a Tela de Inicio"' />
                      <Step number="3" text='Confirme e pronto' />
                    </>
                  ) : (
                    <>
                      <Step number="1" text="Toque no menu do navegador (3 pontos)" />
                      <Step number="2" text='"Instalar aplicativo"' />
                      <Step number="3" text="Confirme e pronto" />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <motion.button
                onClick={handleInstall}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: 14,
                  fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #e53935, #c62828)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(229,57,53,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
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
                  width: '100%', padding: '11px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'rgba(255,255,255,0.3)',
                }}
              >
                Continuar sem instalar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
