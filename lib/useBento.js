'use client'
// Diz se o visual bento claro está ativo. Vale pra componentes que pintam em
// canvas/SVG e por isso não conseguem resolver o tema só com CSS.
import { useEffect, useState } from 'react'

export function useBento() {
  const [bento, setBento] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const ler = () => setBento(el.classList.contains('nx-bento'))
    ler()
    const obs = new MutationObserver(ler)
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return bento
}
