'use client'
// ─────────────────────────────────────────────────────────────────────────
// SELO DESLIZANTE DO RAIL
//
// O recorte branco do item ativo hoje TROCA de lugar: some de um <a> e
// aparece em outro. Aqui ele vira um elemento só que desliza, com os dois
// cantos côncavos acompanhando.
//
// Por que por cima, e não reescrevendo o CSS: o recorte atual está espalhado
// em três blocos de media query e já quebrou duas vezes. Este componente
// marca a nav com data-selo="1" e só então o CSS apaga o fundo do <a>. Se o
// JS não rodar, o atributo não aparece e o visual antigo continua valendo
// inteiro — falha pro lado seguro.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'

const CLASSE = 'nx-rail-selo'

export default function RailSelo({ ativo }) {
  useEffect(() => {
    if (!ativo) return
    let raf = 0

    function posicionar(nav) {
      const selo = nav.querySelector(':scope > .' + CLASSE)
      // o item ativo é marcado pelo próprio Sidebar com background var(--raised)
      const alvo = nav.querySelector('a[style*="var(--raised)"]')
      if (!selo) return
      if (!alvo) { selo.style.opacity = '0'; nav.removeAttribute('data-selo'); return }
      const rn = nav.getBoundingClientRect()
      const ra = alvo.getBoundingClientRect()
      const y = ra.top - rn.top + nav.scrollTop
      selo.style.height = ra.height + 'px'
      selo.style.transform = 'translate3d(0, ' + y + 'px, 0)'
      selo.style.opacity = '1'
      nav.setAttribute('data-selo', '1')
    }

    function preparar(nav) {
      if (nav.dataset.nxSelo === '1') return
      nav.dataset.nxSelo = '1'
      // a nav precisa ser o pai posicionado pro translate bater
      if (getComputedStyle(nav).position === 'static') nav.style.position = 'relative'
      const el = document.createElement('span')
      el.className = CLASSE
      el.setAttribute('aria-hidden', 'true')
      nav.insertBefore(el, nav.firstChild)
      // primeira medida sem transição, pra não vir deslizando do topo
      el.style.transition = 'none'
      posicionar(nav)
      requestAnimationFrame(() => { el.style.transition = '' })
    }

    function varrer() {
      document.querySelectorAll('.nx-bento .sb-rd nav').forEach(nav => {
        preparar(nav)
        posicionar(nav)
      })
    }
    function agendar() { cancelAnimationFrame(raf); raf = requestAnimationFrame(varrer) }

    agendar()
    // o style inline do <a> muda quando o usuário troca de módulo
    const mo = new MutationObserver(agendar)
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] })
    window.addEventListener('resize', agendar)
    return () => { cancelAnimationFrame(raf); mo.disconnect(); window.removeEventListener('resize', agendar) }
  }, [ativo])

  return null
}
