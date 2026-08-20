'use client'
// ─────────────────────────────────────────────────────────────────────────
// SpotlightCard — card comercial com reflexo local sutil que segue o cursor
// DENTRO do card (via ::before + variaveis CSS --mx/--my). Sem setState por
// movimento (atualiza a CSS var direto). O ::before some no touch/reduced-motion
// (regra em globals.css). Nao muda posicao, nao bloqueia clique, conteudo
// sempre legivel. Usar so nos cards comerciais (features/planos/demo).
// ─────────────────────────────────────────────────────────────────────────
import { useRef } from 'react'

export default function SpotlightCard({ children, style, className = '', ...rest }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
    el.style.setProperty('--sc-op', '1')
  }
  const onLeave = () => { const el = ref.current; if (el) el.style.setProperty('--sc-op', '0') }

  return (
    <div
      ref={ref}
      className={`nx-spotcard ${className}`.trim()}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...rest}
    >
      {children}
    </div>
  )
}
