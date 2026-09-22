'use client'
// ─────────────────────────────────────────────────────────────────────────
// BARRA DE ABAS DO CELULAR — a navegação de aplicativo do NexControl 2.0.
//
// No desktop a navegação é o rail à esquerda. No telefone o rail vira gaveta
// e o que sobra é o padrão que toda pessoa já tem no polegar: uma barra fixa
// embaixo com quatro destinos e um botão de ação no centro, elevado.
//
// O botão do centro é CONTEXTUAL: se a tela tem uma ação principal (Nova
// meta, Novo custo, Convidar — todas marcadas com .nx-acao), ele dispara essa
// ação. Se não tem, cria uma meta: no /admin direto, em qualquer outra tela
// levando pro /admin com a instrução de abrir o formulário ao chegar.
//
// Só aparece até 768px (CSS). O componente monta sempre, então nada de
// divergência de hidratação — quem esconde é a media query.
//
// TODAS as cores ficam em classe, não em style inline: o tradutor de tema
// claro do globals.css troca "color: #fff" inline por texto escuro, e
// apagaria os rótulos em cima da barra preta.
// ─────────────────────────────────────────────────────────────────────────
import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export const CHAVE_ABRIR_NOVA_META = 'nx_abrir_nova_meta'
export const EVENTO_MENU = 'nx:menu'

const I = {
  painel: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  equipe: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  caixa: <><path d="M3 3v18h18" /><path d="M7 15l3-4 4 4 5-7" /></>,
  desempenho: <><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></>,
  slots: <><rect x="2" y="6" width="20" height="12" rx="3" /><path d="M7 12h.01M12 12h.01M17 12h.01" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
}

function Ico({ d }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
  )
}

export default function BarraApp({ ativo, isAdmin, aoNovaMeta }) {
  if (!ativo) return null
  return <Barra isAdmin={isAdmin} aoNovaMeta={aoNovaMeta} />
}

function Barra({ isAdmin, aoNovaMeta }) {
  const pathname = usePathname() || ''
  const router = useRouter()

  const itens = isAdmin
    ? [
        { href: '/admin', l: 'Painel', ico: I.painel },
        { href: '/operadores', l: 'Operadores', ico: I.equipe },
        null, // centro
        { href: '/faturamento', l: 'Faturamento', ico: I.caixa },
        { menu: true, l: 'Menu', ico: I.menu },
      ]
    : [
        { href: '/operator', l: 'Painel', ico: I.painel },
        { href: '/performance', l: 'Desempenho', ico: I.desempenho },
        null,
        { href: '/slots', l: 'Slots', ico: I.slots },
        { menu: true, l: 'Menu', ico: I.menu },
      ]

  const acaoPrincipal = useCallback(() => {
    // 1) a tela tem a própria ação principal? (Nova meta, Novo custo, Convidar…)
    const botao = document.querySelector('.nx-acao')
    if (botao) { botao.click(); return }
    // 2) a tela já sabe criar meta (só o /admin publica isto)
    if (aoNovaMeta) { aoNovaMeta(); return }
    // 3) leva pro painel com a instrução de abrir o formulário ao chegar
    try { sessionStorage.setItem(CHAVE_ABRIR_NOVA_META, '1') } catch {}
    router.push(isAdmin ? '/admin' : '/operator')
  }, [aoNovaMeta, isAdmin, router])

  const abrirMenu = () => { try { window.dispatchEvent(new CustomEvent(EVENTO_MENU)) } catch {} }

  const ativoEm = (href) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="nx-barra-app" aria-label="Navegação principal">
      <style>{`
        .nx-barra-app {
          display: none;
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 230;
          background: #15151a;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-radius: 26px 26px 0 0;
          box-shadow: 0 -12px 36px rgba(0,0,0,0.28);
          padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
          grid-template-columns: 1fr 1fr 84px 1fr 1fr;
          align-items: end;
        }
        @media (max-width: 768px) { .nx-barra-app { display: grid; } }
        .nx-barra-app .nxb-item {
          appearance: none; border: none; background: transparent; cursor: pointer;
          font-family: inherit; text-decoration: none;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
          min-height: 52px; padding: 6px 2px; border-radius: 14px;
          color: rgba(255,255,255,0.52);
          -webkit-tap-highlight-color: transparent;
          transition: color .16s ease, transform .16s ease;
        }
        .nx-barra-app .nxb-item:active { transform: scale(0.94); }
        .nx-barra-app .nxb-item[aria-current="page"] { color: #ffffff; }
        .nx-barra-app .nxb-item .nxb-rotulo {
          font-size: 10px; font-weight: 700; letter-spacing: -0.01em; line-height: 1;
          white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis;
        }
        .nx-barra-app .nxb-item[aria-current="page"] .nxb-ico { position: relative; }
        .nx-barra-app .nxb-item[aria-current="page"] .nxb-ico::after {
          content: ''; position: absolute; left: 50%; bottom: -8px; width: 4px; height: 4px;
          border-radius: 50%; background: #ff7a4d; transform: translateX(-50%);
        }
        /* o botão do centro: elevado, redondo, na cor da marca */
        .nx-barra-app .nxb-centro {
          appearance: none; border: none; cursor: pointer; font-family: inherit;
          width: 62px; height: 62px; border-radius: 50%;
          margin: -30px auto 0;
          background: linear-gradient(135deg, #ff7a4d, #e5391f);
          color: #ffffff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 6px #15151a, 0 12px 30px rgba(229,57,31,0.45);
          -webkit-tap-highlight-color: transparent;
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .nx-barra-app .nxb-centro:active { transform: scale(0.93); }
        .nx-barra-app .nxb-centro svg { width: 28px; height: 28px; stroke-width: 2.6; }
        .nx-bento.nx-noir .nx-barra-app { background: #0e0e11; }
        .nx-bento.nx-noir .nx-barra-app .nxb-centro { box-shadow: 0 0 0 6px #0e0e11, 0 12px 30px rgba(229,57,31,0.45); }
        @media (prefers-reduced-motion: reduce) {
          .nx-barra-app .nxb-item, .nx-barra-app .nxb-centro { transition: none; }
        }
      `}</style>

      {itens.map((it, i) => {
        if (it === null) {
          return (
            <button key="centro" type="button" className="nxb-centro" onClick={acaoPrincipal} aria-label="Ação principal desta tela">
              <Ico d={I.mais} />
            </button>
          )
        }
        if (it.menu) {
          return (
            <button key="menu" type="button" className="nxb-item" onClick={abrirMenu}>
              <span className="nxb-ico"><Ico d={it.ico} /></span>
              <span className="nxb-rotulo">{it.l}</span>
            </button>
          )
        }
        const atual = ativoEm(it.href)
        return (
          <a key={it.href} href={it.href} className="nxb-item" aria-current={atual ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); if (!atual) router.push(it.href) }}>
            <span className="nxb-ico"><Ico d={it.ico} /></span>
            <span className="nxb-rotulo">{it.l}</span>
          </a>
        )
      })}
    </nav>
  )
}
