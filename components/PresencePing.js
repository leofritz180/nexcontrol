'use client'
import { useEffect, useRef } from 'react'

export default function PresencePing() {
  const pingRef = useRef(null)

  useEffect(() => {
    // Generate or retrieve anonymous session ID
    let sid = sessionStorage.getItem('nxc_sid')
    if (!sid) {
      sid = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('nxc_sid', sid)
    }

    const ping = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sid }),
      }).catch(() => {})
    }

    ping()
    pingRef.current = setInterval(ping, 30000)

    // Also ping on visibility change (when user returns to tab)
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(pingRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
