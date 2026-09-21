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
//
// 21/09/2026 — dois bugs que o dono viu no menu ("alguns ficam apagados e
// bugam às vezes"):
//
//  1. O alvo era `a[style*="var(--raised)"]`. Só que o onMouseEnter do
//     Sidebar escreve ESSE MESMO valor em item não-ativo. Passar o mouse
//     fazia o selo pular pro item de baixo e o item ficava com cor de ativo
//     (#15151a) sobre o rail escuro — ou seja, sumia. Agora o item ativo se
//     declara com data-ativo="1" e hover nenhum mexe nisso.
//  2. O MutationObserver escutava `style` no document.body inteiro, e o
//     próprio callback escreve `style` no selo e `data-selo` na nav: cada
//     ajuste reagendava outro, num rAF por frame pra sempre.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'

const CLASSE = 'nx-rail-selo'

export default function RailSelo({ ativo }) {
  useEffect(() => {
    if (!ativo) return
    let raf = 0
    let proprio = false   // guarda: o que EU escrevo não pode me acordar

    function posicionar(nav) {
      const selo = nav.querySelector(':scope > .' + CLASSE)
      if (!selo) return
      const alvo = nav.querySelector('a[data-ativo="1"]')
      proprio = true
      if (!alvo) {
        selo.style.opacity = '0'
        nav.removeAttribute('data-selo')
      } else {
        const rn = nav.getBoundingClientRect()
        const ra = alvo.getBoundingClientRect()
        const y = ra.top - rn.top + nav.scrollTop
        selo.style.height = ra.height + 'px'
        selo.style.transform = 'translate3d(0, ' + y + 'px, 0)'
        selo.style.opacity = '1'
        nav.setAttribute('data-selo', '1')
      }
      proprio = false
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
    function agendar() {
      if (proprio) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(varrer)
    }

    agendar()
    // só o que de fato muda o alvo: troca de rota (data-ativo) e troca de
    // itens do menu. Nada de escutar `style` do documento inteiro.
    const mo = new MutationObserver(agendar)
    mo.observe(document.body, {
      subtree: true, childList: true,
      attributes: true, attributeFilter: ['data-ativo'],
    })
    window.addEventListener('resize', agendar)
    // o rail expande no hover e os itens mudam de altura/posição
    const aos = document.querySelectorAll('.nx-bento .sb-rd')
    aos.forEach(el => { el.addEventListener('transitionend', agendar) })
    return () => {
      cancelAnimationFrame(raf); mo.disconnect()
      window.removeEventListener('resize', agendar)
      aos.forEach(el => { el.removeEventListener('transitionend', agendar) })
    }
  }, [ativo])

  return null
}
