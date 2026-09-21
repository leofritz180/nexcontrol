'use client'
// ─────────────────────────────────────────────────────────────────────────
// PÍLULA DESLIZANTE DO DOCK
//
// Cada módulo monta as próprias abas (admin, operadores, faturamento…), então
// não dá pra usar o layoutId do framer-motion sem editar todas as páginas —
// e foi justamente a medição do layoutId que fez o dock tremer antes.
//
// Aqui a pílula é um elemento só, inserido no dock e posicionado por
// transform. Transform não recalcula layout, então não há tremor. A posição
// vem do botão marcado com data-active="true"; qualquer módulo que use a
// classe .tabs-scroll ganha o efeito de graça.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'

const CLASSE = 'nx-dock-pilula'

export default function DockPilula({ ativo }) {
  useEffect(() => {
    if (!ativo) return
    let raf = 0
    const obs = []

    function posicionar(dock) {
      const pilula = dock.querySelector(':scope > .' + CLASSE)
      const alvo = dock.querySelector('[data-active="true"]')
      if (!pilula) return
      if (!alvo) { pilula.style.opacity = '0'; return }
      const rd = dock.getBoundingClientRect()
      const ra = alvo.getBoundingClientRect()
      // posição relativa ao dock, já compensando rolagem horizontal
      const x = ra.left - rd.left + dock.scrollLeft
      pilula.style.width = ra.width + 'px'
      pilula.style.height = ra.height + 'px'
      pilula.style.transform = 'translate3d(' + x + 'px, -50%, 0)'
      pilula.style.opacity = '1'
    }

    function preparar(dock) {
      if (dock.dataset.nxPilula === '1') return
      dock.dataset.nxPilula = '1'
      const el = document.createElement('span')
      el.className = CLASSE
      el.setAttribute('aria-hidden', 'true')
      dock.insertBefore(el, dock.firstChild)
      // primeira medida sem transição, pra não vir voando da esquerda
      el.style.transition = 'none'
      posicionar(dock)
      requestAnimationFrame(() => { el.style.transition = '' })
    }

    function varrer() {
      document.querySelectorAll('.nx-bento .tabs-scroll').forEach(dock => {
        preparar(dock)
        posicionar(dock)
      })
    }

    function agendar() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(varrer)
    }

    agendar()
    // o data-active muda quando o usuário troca de aba
    const mo = new MutationObserver(agendar)
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-active', 'class'] })
    obs.push(() => mo.disconnect())

    window.addEventListener('resize', agendar)
    obs.push(() => window.removeEventListener('resize', agendar))

    return () => { cancelAnimationFrame(raf); obs.forEach(f => f()) }
  }, [ativo])

  return null
}
