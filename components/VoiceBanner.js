'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Banner "Comando de Voz" — card de imagem, aparece 1x por usuário.
// FASE PREVIEW: só leofritz178 (pra você ver). Pra liberar geral depois:
// troque a checagem por () => true (ou ajuste BANNER_EMAILS).
const BANNER_EMAILS = new Set(['leofritz178@gmail.com'])
const SEEN_KEY = 'nx_voicebanner_v1'

export default function VoiceBanner({ userEmail }) {
  const [show, setShow] = useState(false)
  const email = String(userEmail || '').toLowerCase()

  useEffect(() => {
    if (!email) return
    if (!BANNER_EMAILS.has(email)) return // fase preview
    let seen = false
    try { seen = localStorage.getItem(SEEN_KEY) === '1' } catch {}
    if (seen) return
    const t = setTimeout(() => setShow(true), 700)
    return () => clearTimeout(t)
  }, [email])

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setShow(false)
  }
  function testar() {
    try { window.dispatchEvent(new Event('voice:start')) } catch {}
    dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={dismiss}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '94%', maxWidth: 900, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(209,0,0,0.12)' }}
          >
            <img src="/comando-voz-banner.png" alt="Comando de Voz — Novo recurso" style={{ width: '100%', display: 'block' }} />

            {/* Botão TESTAR AGORA — sobreposto exatamente no ponto do banner */}
            <button type="button" onClick={testar} title="Testar agora" aria-label="Testar comando de voz"
              style={{ position: 'absolute', left: '3.5%', top: '77%', width: '30%', height: '13%', background: 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.5), 0 0 22px rgba(209,0,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            />

            {/* Fechar */}
            <button type="button" onClick={dismiss} aria-label="Fechar"
              style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 9, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, backdropFilter: 'blur(4px)' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
