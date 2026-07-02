'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// Pop-up de divulgacao da Loja Bettify integrada. Mostra a arte (1536x1024) com
// areas clicaveis invisiveis EXATAMENTE sobre os botoes "ACESSAR BETTIFY PROXY" e
// "VER PRECOS" + um X de fechar. Aparece 1x por dia por dispositivo, dentro da
// janela de campanha. Nao reaparece em toda navegacao (localStorage por data).
const SEEN_KEY = 'nx_bettify_banner_seen'
const UNTIL = new Date('2026-07-20T23:59:59') // fim da campanha
const today = () => new Date().toISOString().slice(0, 10)

export default function BettifyStoreBanner({ userEmail }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const email = String(userEmail || '').toLowerCase()

  useEffect(() => {
    if (!email) return
    if (new Date() > UNTIL) return
    let seen = false
    try { seen = localStorage.getItem(SEEN_KEY) === today() } catch {}
    if (seen) return
    const t = setTimeout(() => setShow(true), 800)
    return () => clearTimeout(t)
  }, [email])

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, today()) } catch {}
    setShow(false)
  }
  function goStore() { dismiss(); router.push('/proxy') }

  // Areas clicaveis (em % da arte 1536x1024) sobre cada botao
  const hit = { position: 'absolute', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={dismiss}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '96%', maxWidth: 920, borderRadius: 18, overflow: 'hidden', background: '#050505', boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(255,107,0,0.14)', lineHeight: 0 }}
          >
            <img src="/banner-bettify.png" alt="Bettify Proxy integrado na NexControl" style={{ width: '100%', display: 'block' }} />

            {/* Botao ACESSAR BETTIFY PROXY */}
            <button type="button" onClick={goStore} aria-label="Acessar Bettify Proxy"
              title="Acessar Bettify Proxy"
              style={{ ...hit, left: '4.5%', top: '71.3%', width: '31%', height: '7.8%' }} />

            {/* Botao VER PRECOS */}
            <button type="button" onClick={goStore} aria-label="Ver preços"
              title="Ver preços"
              style={{ ...hit, left: '36.3%', top: '71.3%', width: '16%', height: '7.8%' }} />

            {/* Fechar */}
            <button type="button" onClick={dismiss} aria-label="Fechar"
              style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, backdropFilter: 'blur(4px)' }}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
