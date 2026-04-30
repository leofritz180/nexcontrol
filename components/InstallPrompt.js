'use client'
import { useState, useEffect, useCallback } from 'react'
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

/* ═══════════════════════════════════════════
   PHONE MOCKUP with animated notification
═══════════════════════════════════════════ */
function PhoneMockup() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    let mounted = true
    function cycle() {
      if (!mounted) return
      setPhase(1)
      setTimeout(() => { if (mounted) setPhase(2) }, 600)
      setTimeout(() => { if (mounted) setPhase(0) }, 4000)
      setTimeout(() => { if (mounted) cycle() }, 5000)
    }
    const t = setTimeout(cycle, 1000)
    return () => { mounted = false; clearTimeout(t) }
  }, [])

  return (
    <div style={{
      width: 200, maxWidth: '55vw', aspectRatio: '200/390', margin: '0 auto',
      background: '#08080c', borderRadius: 28,
      border: '2.5px solid rgba(255,255,255,0.07)',
      boxShadow: '0 24px 70px rgba(0,0,0,0.7), 0 0 60px rgba(229,57,53,0.03)',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Notch */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
        <div style={{ width: 60, height: 20, borderRadius: 11, background: '#000', border: '1px solid rgba(255,255,255,0.04)' }} />
      </div>
      {/* Status */}
      <div style={{ height: 22, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>9:41</span>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {[3, 5, 7].map((h, i) => <div key={i} style={{ width: 2.5, height: h, borderRadius: 1, background: 'rgba(255,255,255,0.35)' }} />)}
        </div>
      </div>
      {/* Screen */}
      <div style={{ flex: 1, padding: '8px 12px', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <img src="/nexcontrol-icon.png" alt="NexControl" width={18} height={18} style={{ width: 18, height: 18, objectFit: 'contain', display: 'block', borderRadius: 5 }}/>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>NexControl</span>
        </div>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
          <div style={{ padding: '7px 6px', borderRadius: 8, background: 'rgba(209,250,229,0.06)', border: '1px solid rgba(209,250,229,0.1)' }}>
            <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>LUCRO</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#d1fae5', fontFamily: 'var(--mono, monospace)' }}>+R$ 1.840</div>
          </div>
          <div style={{ padding: '7px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>METAS</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--mono, monospace)' }}>8</div>
          </div>
        </div>
        {/* Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 30, marginBottom: 8 }}>
          {[30, 50, 40, 65, 55, 80, 70, 90].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: `rgba(209,250,229,${0.1 + i * 0.04})` }} />
          ))}
        </div>
        {/* List */}
        {[1, 2].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ flex: 1 }}><div style={{ height: 4, width: `${50 + i * 15}%`, borderRadius: 1.5, background: 'rgba(255,255,255,0.04)' }} /></div>
            <span style={{ fontSize: 7, fontWeight: 700, color: '#d1fae5' }}>+R${i * 120 + 90}</span>
          </div>
        ))}
        {/* Notification */}
        <AnimatePresence>
          {(phase === 1 || phase === 2) && (
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 280 }}
              style={{
                position: 'absolute', top: 6, left: 6, right: 6, zIndex: 10,
                padding: '9px 10px', borderRadius: 14,
                background: 'rgba(14,18,28,0.95)', border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <img src="/nexcontrol-icon.png" alt="NexControl" width={26} height={26} style={{ width: 26, height: 26, objectFit: 'contain', display: 'block', borderRadius: 7, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#fff', marginBottom: 1 }}>+R$ 320 registrados</div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>Meta quase concluida</div>
              </div>
              <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.2)' }}>agora</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Home */}
      <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 70, height: 3.5, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   TUTORIAL STEP
═══════════════════════════════════════════ */
function TutorialStep({ number, title, desc, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease }}
      style={{
        display: 'flex', gap: 14, padding: '16px 18px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: '#e53935',
      }}>{number}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {icon && (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d={icon} />
            </svg>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT — 2 SCREENS
═══════════════════════════════════════════ */
export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [screen, setScreen] = useState(1) // 1 = hero, 2 = tutorial
  const [device, setDevice] = useState('desktop')
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    const justSignedUp = sessionStorage.getItem(SIGNUP_KEY)
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

  const goToTutorial = useCallback(async () => {
    // If Android native prompt available, fire it
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      dismiss()
      return
    }
    // Otherwise go to step-by-step tutorial
    setScreen(2)
  }, [deferredPrompt, dismiss])

  const isIos = device === 'ios'
  const isAndroid = device === 'android'

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
            background: 'rgba(2,4,8,0.85)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <AnimatePresence mode="wait">
            {/* ═══ SCREEN 1: HERO ═══ */}
            {screen === 1 && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -40 }}
                transition={{ duration: 0.4, ease }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 420,
                  maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
                  background: 'linear-gradient(170deg, #000000, #000000)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 28,
                  boxShadow: '0 50px 120px rgba(0,0,0,0.8), 0 0 80px rgba(229,57,53,0.03)',
                  position: 'relative',
                }}
              >
                {/* Ambient */}
                <div style={{ position: 'absolute', top: -50, left: '50%', marginLeft: -140, width: 280, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.05), transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ padding: '36px 28px 28px', position: 'relative', zIndex: 1 }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: 8 }}>
                      Transforme o NexControl<br />em um app no seu celular
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: 0 }}>
                      Receba alertas em tempo real. Controle total na palma da mao.
                    </p>
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: 24 }}><PhoneMockup /></div>

                  {/* Benefits */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                    {[
                      { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notificacoes em tempo real' },
                      { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Acesso instantaneo' },
                      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Controle continuo' },
                      { icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', label: 'Performance real' },
                    ].map((b, i) => (
                      <div key={i} style={{ padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 9 }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#d1fae5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}><path d={b.icon} /></svg>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{b.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <motion.button onClick={goToTutorial} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '15px 20px', borderRadius: 14,
                      fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #e53935, #c62828)', color: '#fff',
                      boxShadow: '0 6px 24px rgba(229,57,53,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      marginBottom: 8,
                    }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Instalar agora
                  </motion.button>
                  <button onClick={dismiss} style={{
                    width: '100%', padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.25)',
                  }}>Agora nao</button>
                </div>
              </motion.div>
            )}

            {/* ═══ SCREEN 2: TUTORIAL ═══ */}
            {screen === 2 && (
              <motion.div
                key="tutorial"
                initial={{ opacity: 0, scale: 0.95, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 440,
                  maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
                  background: 'linear-gradient(170deg, #000000, #000000)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 28,
                  boxShadow: '0 50px 120px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ padding: '32px 26px 28px' }}>
                  {/* Back + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button onClick={() => setScreen(1)} style={{
                      width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'rgba(255,255,255,0.5)', flexShrink: 0,
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 2px' }}>
                        {isIos ? 'Instalar no iPhone' : isAndroid ? 'Instalar no Android' : 'Como instalar o app'}
                      </h2>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Siga o passo a passo abaixo</p>
                    </div>
                  </div>

                  {/* Device badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 99, marginBottom: 20,
                    background: isIos ? 'rgba(255,255,255,0.04)' : 'rgba(209,250,229,0.06)',
                    border: `1px solid ${isIos ? 'rgba(255,255,255,0.08)' : 'rgba(209,250,229,0.12)'}`,
                  }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isIos ? 'rgba(255,255,255,0.5)' : '#d1fae5'} strokeWidth="1.8" strokeLinecap="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12" y2="18.01" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isIos ? 'rgba(255,255,255,0.5)' : '#d1fae5' }}>
                      {isIos ? 'Safari — iPhone' : isAndroid ? 'Chrome — Android' : 'Navegador'}
                    </span>
                  </div>

                  {/* Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {isIos ? (
                      <>
                        <TutorialStep number="1" delay={0.1}
                          title="Abra o Safari"
                          desc="Certifique-se de que esta acessando o NexControl pelo Safari. Outros navegadores nao suportam instalacao no iPhone."
                          icon="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <TutorialStep number="2" delay={0.2}
                          title="Toque no botao de compartilhar"
                          desc="Na barra inferior do Safari, toque no icone de compartilhar (quadrado com seta para cima)."
                          icon="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                        />
                        <TutorialStep number="3" delay={0.3}
                          title='"Adicionar a Tela de Inicio"'
                          desc='Role as opcoes ate encontrar "Adicionar a Tela de Inicio" e toque nessa opcao.'
                          icon="M12 5v14M5 12h14"
                        />
                        <TutorialStep number="4" delay={0.4}
                          title="Confirme a instalacao"
                          desc='Toque em "Adicionar" no canto superior direito. O NexControl vai aparecer como app na sua tela inicial.'
                          icon="M20 6L9 17l-5-5"
                        />
                      </>
                    ) : isAndroid ? (
                      <>
                        <TutorialStep number="1" delay={0.1}
                          title="Abra o Chrome"
                          desc="Acesse o NexControl pelo Google Chrome no seu Android."
                          icon="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <TutorialStep number="2" delay={0.2}
                          title="Toque no menu (3 pontos)"
                          desc="No canto superior direito do Chrome, toque nos tres pontos do menu."
                          icon="M12 5v.01M12 12v.01M12 19v.01"
                        />
                        <TutorialStep number="3" delay={0.3}
                          title='"Instalar aplicativo"'
                          desc='No menu, selecione "Instalar aplicativo" ou "Adicionar a tela inicial".'
                          icon="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                        />
                        <TutorialStep number="4" delay={0.4}
                          title="Pronto"
                          desc="Confirme e o NexControl sera instalado como app. Abra direto da tela inicial."
                          icon="M20 6L9 17l-5-5"
                        />
                      </>
                    ) : (
                      <>
                        <TutorialStep number="1" delay={0.1}
                          title="Abra no navegador"
                          desc="Acesse o NexControl pelo navegador do celular (Safari no iPhone, Chrome no Android)."
                          icon="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <TutorialStep number="2" delay={0.2}
                          title="Adicione a tela inicial"
                          desc='Use o menu do navegador para adicionar o site como app na sua tela inicial.'
                          icon="M12 5v14M5 12h14"
                        />
                        <TutorialStep number="3" delay={0.3}
                          title="Acesse como app"
                          desc="Abra o NexControl direto da tela inicial, como qualquer app nativo."
                          icon="M20 6L9 17l-5-5"
                        />
                      </>
                    )}
                  </div>

                  {/* Tip */}
                  <div style={{
                    padding: '14px 16px', borderRadius: 14, marginBottom: 24,
                    background: 'rgba(209,250,229,0.04)', border: '1px solid rgba(209,250,229,0.1)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#d1fae5" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" /><line x1="9" y1="21" x2="15" y2="21" />
                    </svg>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#d1fae5', margin: '0 0 3px' }}>Dica</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
                        Apos instalar, ative as notificacoes para receber alertas de metas, remessas e lucro em tempo real.
                      </p>
                    </div>
                  </div>

                  {/* Done */}
                  <motion.button onClick={dismiss} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '15px 20px', borderRadius: 14,
                      fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #d1fae5, #00a06d)', color: '#fff',
                      boxShadow: '0 6px 24px rgba(209,250,229,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Entendi, vou instalar
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function markJustSignedUp() {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SIGNUP_KEY, '1')
}
