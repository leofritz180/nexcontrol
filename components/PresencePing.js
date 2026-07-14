'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase/client'

/**
 * Ping de presence a cada 30s.
 *
 * Quando o user esta autenticado, envia auth.user.id (UUID) — que dispara o
 * trigger trg_presence_last_seen e atualiza profiles.last_seen_at em tempo real.
 * Quando nao esta autenticado, gera um ID anonimo persistente em sessionStorage
 * (so pra contagem de visitantes online no /, /demo, etc).
 */
export default function PresencePing() {
  const pingRef = useRef(null)
  const sidRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function resolveSid() {
      // Tenta pegar user autenticado primeiro
      try {
        const { data } = await supabase.auth.getSession()
        const uid = data?.session?.user?.id
        if (uid) {
          sidRef.current = uid
          return
        }
      } catch {}
      // Fallback: anon
      let sid = null
      try { sid = sessionStorage.getItem('nxc_sid') } catch {}
      if (!sid) {
        sid = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
        try { sessionStorage.setItem('nxc_sid', sid) } catch {}
      }
      sidRef.current = sid
    }

    const ping = () => {
      if (!sidRef.current) return
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sidRef.current }),
      }).catch(() => {})
    }

    // Resolve sid primeiro, depois ping inicial + intervalo
    resolveSid().then(() => {
      if (cancelled) return
      ping()
      // So pinga em aba visivel (aba de fundo nao gera custo). 60s basta:
      // "online" = ping nos ultimos 5min. Volta a pingar no visibilitychange.
      pingRef.current = setInterval(() => { if (document.visibilityState === 'visible') ping() }, 60000)
    })

    // Re-resolve quando o auth muda (login/logout).
    // NAO chamar getSession() dentro do callback (trava o lock do auth). Usa a
    // session do evento; o fallback anon roda fora do lock via setTimeout(0).
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id
      if (uid) { sidRef.current = uid; if (!cancelled) ping(); return }
      setTimeout(() => { if (!cancelled) resolveSid().then(() => { if (!cancelled) ping() }) }, 0)
    })

    // Tambem pinga ao voltar pra tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(pingRef.current)
      document.removeEventListener('visibilitychange', onVisible)
      try { sub?.subscription?.unsubscribe?.() } catch {}
    }
  }, [])

  return null
}
