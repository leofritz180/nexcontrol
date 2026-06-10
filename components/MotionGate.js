'use client'
import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'

/**
 * MotionGate — desliga as animacoes do Framer Motion SOMENTE no mobile/tablet.
 * Framer e' JS (o CSS de otimizacao mobile nao alcanca), entao em celular
 * fraco dezenas de animacoes de entrada/hover travam. Com reducedMotion="always"
 * o conteudo aparece instantaneo no mobile = muito mais fluido.
 *
 * Desktop: reducedMotion="user" (comportamento atual — respeita a preferencia
 * do SO), ou seja, NADA muda no desktop.
 */
export default function MotionGate({ children }) {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      try {
        setMobile(window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches)
      } catch {}
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return <MotionConfig reducedMotion={mobile ? 'always' : 'user'}>{children}</MotionConfig>
}
