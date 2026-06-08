'use client'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'
import { isRedesign } from '../lib/redesign'

// ── Interruptor do REDESIGN (gated por email — ver lib/redesign.js) ──
// Adiciona a classe `nx-redesign` no <html> SÓ pras contas liberadas. Todo o
// visual novo fica escopado nessa classe; nenhum outro usuário é afetado.

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
      const aqua = on // verde-água + acento vermelho acompanham o redesign (geral)
      try {
        document.documentElement.classList.toggle('nx-redesign', on)
        // Paleta de verde água (#7FFFD4) — só na conta de teste leofritz178
        document.documentElement.classList.toggle('nx-aqua', aqua)
        // Modo claro só pra quem tem redesign; persiste a escolha (localStorage)
        let light = false
        if (on) { try { light = localStorage.getItem('nx_theme') === 'light' } catch {} }
        document.documentElement.classList.toggle('nx-light', light)
      } catch {}
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
