'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VOICE_BANNER_SEEN_KEY as SEEN_KEY, VOICE_BANNER_UNTIL as BANNER_UNTIL } from '../lib/onboardingSeq'

// Banner do NOVO INSTAGRAM (@nexcontrol_ofc). Substitui o banner de voz.
// Perdemos o Instagram antigo — este banner avisa todos e pede pra seguir +
// marcar o novo. Aparece 1x por sessão, por 7 dias (ate 18/06). Mantem o
// mesmo gancho do sequenciador (dismiss -> nx-banner-closed -> tutorial).

const IG_URL = 'https://instagram.com/nexcontrol_ofc'

export default function VoiceBanner({ userEmail }) {
  const [show, setShow] = useState(false)
  const email = String(userEmail || '').toLowerCase()

  useEffect(() => {
    if (!email) return
    if (new Date() > BANNER_UNTIL) return // janela de 7 dias encerrada
    let seen = false
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1' } catch {}
    if (seen) return
    // Sinaliza pro sequenciador: banner é o 1º passo — segura tutorial/checklist
    try { window.__nxBannerOpen = true } catch {}
    const t = setTimeout(() => setShow(true), 700)
    return () => clearTimeout(t)
  }, [email])

  function dismiss() {
    try { sessionStorage.setItem(SEEN_KEY, '1') } catch {}
    try { window.__nxBannerOpen = false; window.dispatchEvent(new Event('nx-banner-closed')) } catch {}
    setShow(false)
  }
  function seguir() {
    try { window.open(IG_URL, '_blank', 'noopener') } catch {}
    dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={dismiss}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '96%', maxWidth: 780, borderRadius: 18, overflow: 'hidden', background: '#0a0a0a', boxShadow: '0 30px 80px rgba(0,0,0,0.75), 0 0 50px rgba(225,0,0,0.12)' }}
          >
            {/* Imagem do banner — clicável (abre o Instagram) */}
            <img
              src="/banner-instagram.png" alt="Novo Instagram @nexcontrol_ofc"
              onClick={seguir}
              style={{ width: '100%', display: 'block', cursor: 'pointer' }}
            />

            {/* CTA — seguir o novo Instagram */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, background: 'linear-gradient(180deg, #0d0d0d, #050505)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" onClick={seguir}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(95deg, #feda75, #d62976 45%, #962fbf 75%, #4f5bd5)', boxShadow: '0 8px 26px rgba(214,41,118,0.4)' }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                Seguir @nexcontrol_ofc
              </button>
              <button type="button" onClick={dismiss}
                style={{ width: '100%', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}
              >Agora não</button>
            </div>

            {/* Fechar */}
            <button type="button" onClick={dismiss} aria-label="Fechar"
              style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 9, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, backdropFilter: 'blur(4px)' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
