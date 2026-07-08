'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { networkEnabled, NETWORK_GA } from '../lib/network-access'
import { anyBannerPending } from '../lib/onboardingSeq'

// Pop-up de LANCAMENTO do Network (1x por conta). So pra ADMIN. Se ja e PRO/allowlist
// -> "Entrar na comunidade". Se nao -> "Assinar PRO e entrar" (upsell). Coordena com
// os outros banners via __nxBannerOpen (nao sobrepoe tutorial/Bettify).
const SEEN_KEY = 'nx_network_launch_seen_v1'

export default function NetworkLaunchBanner({ userEmail, isAdmin, subscription, tenant }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const email = String(userEmail || '').toLowerCase()

  const subActive = (subscription?.status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > new Date())) || tenant?.subscription_status === 'active'
  const canEnter = networkEnabled(email) || subActive

  useEffect(() => {
    // SO pra quem PODE entrar (PRO/allowlist). Trial/novo NAO ve o pop-up — eles
    // estao no onboarding (tutorial/checklist); o Network aparece pra eles no menu.
    if (!NETWORK_GA || !isAdmin || !email || !canEnter) return
    let seen = false
    try { seen = localStorage.getItem(SEEN_KEY) === '1' } catch {}
    if (seen) return
    const t = setTimeout(() => {
      // nao sobrepor outro banner/onboarding — tenta de novo na proxima carga
      if (anyBannerPending()) return
      try { window.__nxBannerOpen = true } catch {}
      setShow(true)
    }, 1600)
    return () => clearTimeout(t)
  }, [email, isAdmin, canEnter])

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    try { window.__nxBannerOpen = false; window.dispatchEvent(new Event('nx-banner-closed')) } catch {}
    setShow(false)
  }
  function go() { dismiss(); router.push(canEnter ? '/network' : '/billing-mp?renewal=1') }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={dismiss}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.33, 1, 0.68, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 440, borderRadius: 22, overflow: 'hidden',
              background: 'linear-gradient(180deg, #12080a, #060406)',
              border: '1px solid rgba(229,57,53,0.25)',
              boxShadow: '0 30px 90px rgba(0,0,0,0.8), 0 0 70px rgba(229,57,53,0.14)',
              padding: '34px 28px 28px', textAlign: 'center',
            }}
          >
            {/* glow topo */}
            <div style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(229,57,53,0.6), transparent)' }} />
            {/* fechar */}
            <button type="button" onClick={dismiss} aria-label="Fechar" style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'var(--t3, #94A3B8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.28em', color: '#ff7a7a', textTransform: 'uppercase', marginBottom: 18 }}>Novidade</div>

            <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(229,57,53,0.25), rgba(229,57,53,0.05))', border: '1px solid rgba(229,57,53,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 34px rgba(229,57,53,0.25)' }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#ff5b56" strokeWidth={2} strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>O Network chegou 🎉</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'rgba(255,255,255,0.66)', lineHeight: 1.55 }}>
              A comunidade fechada dos <strong style={{ color: '#fff' }}>admins da NexControl</strong>. Troque experiência, dúvidas e oportunidades com quem também opera de verdade.
            </p>

            {/* hook veterano */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(245,180,60,0.1)', border: '1px solid rgba(245,180,60,0.3)', marginBottom: 22 }}>
              <span style={{ fontSize: 15 }}>👑</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f6c968' }}>Os primeiros 100 a entrar ganham o selo <strong style={{ color: '#fff' }}>Veterano</strong></span>
            </div>

            <button type="button" onClick={go} style={{
              width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(180deg, #e53935, #c62828)', color: '#fff', fontSize: 14.5, fontWeight: 800,
              boxShadow: '0 8px 26px rgba(229,57,53,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
              {canEnter ? 'Entrar na comunidade →' : 'Assinar PRO e entrar →'}
            </button>
            <button type="button" onClick={dismiss} style={{ display: 'block', width: '100%', marginTop: 12, padding: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer' }}>agora não</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
