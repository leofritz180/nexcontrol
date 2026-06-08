'use client'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

// ── Interruptor do REDESIGN (gated por email) ──
// Adiciona a classe `nx-redesign` no <html> SÓ pra estes emails. Todo o visual
// novo fica escopado nessa classe (globals.css + componentes), então nenhum
// outro usuário é afetado. Pra liberar geral: trocar pra () => true.
const REDESIGN_EMAILS = new Set(['leofritz180@gmail.com', 'leofritz178@gmail.com'])
const isRedesign = (email) => !!email && REDESIGN_EMAILS.has(String(email).toLowerCase())

export default function DesignMode() {
  useEffect(() => {
    let active = true
    let fontLink = null
    function ensureFont() {
      if (fontLink) return
      try {
        fontLink = document.createElement('link')
        fontLink.rel = 'stylesheet'
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap'
        document.head.appendChild(fontLink)
      } catch {}
    }
    function apply(email) {
      const on = isRedesign(email)
      try { document.documentElement.classList.toggle('nx-redesign', on) } catch {}
      if (on) ensureFont()
    }
    // CUIDADO anti-deadlock: getSession só fora do callback; no onAuthStateChange
    // usa a session do evento.
    supabase.auth.getSession().then(({ data }) => { if (active) apply(data?.session?.user?.email) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (active) apply(session?.user?.email) })
    return () => { active = false; try { sub?.subscription?.unsubscribe?.() } catch {} }
  }, [])
  return null
}
