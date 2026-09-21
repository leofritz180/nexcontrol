'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase/client'
import { isRedesign } from '../lib/redesign'
import { isNex2 } from '../lib/theme-v2'

// ── Interruptor do REDESIGN (gated por email — ver lib/redesign.js) ──
// Adiciona a classe `nx-redesign` no <html> SÓ pras contas liberadas. Todo o
// visual novo fica escopado nessa classe; nenhum outro usuário é afetado.

// Telas que são ESCURAS DE PROPÓSITO e valem para todo mundo: o bento claro
// nunca entra nelas, mesmo pra uma conta liberada no V2. Sem isso, o dono
// (que também usa /owner) veria esse painel meio claro meio escuro.
const SEM_BENTO = ['/', '/owner', '/design-v2', '/admin-preview']
function bentoNaRota(pathname) {
  if (!pathname) return true
  return !SEM_BENTO.some(p => (p === '/' ? pathname === '/' : (pathname === p || pathname.startsWith(p + '/'))))
}

export default function DesignMode() {
  const pathname = usePathname()
  const emailRef = useRef(undefined)   // undefined = ainda não sabemos
  const fontRef = useRef(null)

  useEffect(() => {
    let active = true

    function ensureFont() {
      if (fontRef.current) return
      try {
        const l = document.createElement('link')
        l.rel = 'stylesheet'
        l.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap'
        document.head.appendChild(l)
        fontRef.current = l
      } catch {}
    }

    function apply(email) {
      emailRef.current = email
      const on = isRedesign(email)
      const aqua = on // verde-água + acento vermelho acompanham o redesign (geral)
      try {
        document.documentElement.classList.toggle('nx-redesign', on)
        // Paleta de verde água (#7FFFD4) — só na conta de teste leofritz178
        document.documentElement.classList.toggle('nx-aqua', aqua)
        // VISUAL V2 (bento claro) — gated por conta em lib/theme-v2.js e por rota.
        const nex2 = isNex2(email) && bentoNaRota(pathname)
        document.documentElement.classList.toggle('nx-bento', nex2)
        // Modo claro: forçado no V2; senão respeita a escolha salva
        let light = nex2
        if (!nex2 && on) { try { light = localStorage.getItem('nx_theme') === 'light' } catch {} }
        document.documentElement.classList.toggle('nx-light', light)
      } catch {}
      if (on) ensureFont()
    }

    // Troca de rota: já sabemos o e-mail, reaplica na hora (sem ir na rede).
    if (emailRef.current !== undefined) apply(emailRef.current)

    // CUIDADO anti-deadlock: getSession só fora do callback; no onAuthStateChange
    // usa a session do evento.
    supabase.auth.getSession().then(({ data }) => { if (active) apply(data?.session?.user?.email) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (active) apply(session?.user?.email) })
    return () => { active = false; try { sub?.subscription?.unsubscribe?.() } catch {} }
  }, [pathname])

  return null
}
