'use client'
// ─────────────────────────────────────────────────────────────────────────
// FILME — vídeo de apoio na landing.
//
// A MAIORIA DOS ACESSOS É PELO CELULAR. Os cinco filmes somavam 17 MB em
// corpo de desktop, e a primeira resposta a isso foi não tocar os pesados
// no telefone — o que deixava o herói do celular como foto parada. Errado:
// quem chega pelo telefone é justamente quem mais precisa ver o produto se
// mexer.
//
// A resposta certa é servir o MESMO movimento em corpo menor. Os arquivos
// `-mob.mp4` (scripts/filmes-mobile.mjs) têm 720px ou 540px de largura e
// somam 0,84 MB nos cinco — 95% mais leves. Numa tela de telefone eles são
// indistinguíveis do original.
//
// Sobraram três travas, e elas continuam valendo:
//
// 1. CONEXÃO. Se o navegador informa economia de dados ou rede 2g/3g, o
//    vídeo não monta em lugar nenhum. Quem está no limite do plano não
//    paga por enfeite.
// 2. PROXIMIDADE. `preload="none"` e a fonte só entra no DOM quando o
//    bloco chega perto da dobra. Antes disso o custo é zero.
// 3. MOVIMENTO. Com `prefers-reduced-motion`, o vídeo nem é montado.
//
// Em todos os casos o pôster está lá embaixo segurando o layout: ninguém
// vê retângulo vazio, em nenhuma situação.
//
// A PROPORÇÃO SAI EM DUAS VARIÁVEIS CSS, nunca em `aspect-ratio` inline.
// Estilo em linha vence classe, então se o componente escrevesse o
// aspect-ratio direto, nenhuma media query conseguiria reenquadrar — e o
// herói PRECISA de um enquadramento mais fechado no telefone, porque o
// render 3D tem muito preto morto em volta do painel. Com `--prop` e
// `--prop-fone` em linha e o `aspect-ratio` só no CSS, a media query
// escolhe qual variável ler, sem disputa de especificidade.
//
// A TAMPA (.nv2-filme-tampa) existe por um motivo só: o navegador desenha
// uma barra flutuante sobre todo vídeo em que o cursor passa — "abrir em
// janela", "pular faixa". Num player isso é recurso; aqui é defeito, porque
// não há o que pular num filme mudo de ambientação.
//
// pointer-events:none no vídeo não resolve sozinho: ele impede o vídeo de
// RECEBER o mouse, mas o navegador escolhe o que mostrar pelo que está
// embaixo do cursor no teste de acerto dele, e elemento inerte é
// atravessado nesse teste — o vídeo continuava sendo o achado. A tampa é um
// elemento real ocupando a área do filme: o cursor acerta ela, nunca o
// vídeo, e não há barra para desenhar.
//
// E VALE REPETIR: filme aqui é AMBIENTAÇÃO, não prova. O texto miúdo
// dentro das renderizações não é a interface de verdade — quem prova o
// produto são as capturas reais, que continuam na página.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

export default function Filme({ src, srcMob, poster, alt, className, style, proporcao, proporcaoMob }) {
  const parado = useReducedMotion()
  const ref = useRef(null)
  const perto = useInView(ref, { once: true, margin: '400px 0px' })
  const [fonte, setFonte] = useState(null)

  // O botão "pular" que o Chrome desenha sobre o vídeo não vem do vídeo:
  // vem da SESSÃO DE MÍDIA. Quando o navegador decide que a aba está
  // tocando algo, ela entra no controle de mídia do sistema e ganha os
  // botões de faixa — inclusive numa página que só tem filme mudo de
  // ambientação, onde "pular faixa" não quer dizer nada.
  //
  // Zerar os metadados e declarar playbackState 'none' tira a aba dessa
  // lista. É idempotente e não faz nada onde a API não existe.
  useEffect(() => {
    try {
      const ms = navigator.mediaSession
      if (!ms) return
      ms.metadata = null
      ms.playbackState = 'none'
      for (const acao of ['play', 'pause', 'nexttrack', 'previoustrack', 'seekbackward', 'seekforward', 'stop']) {
        try { ms.setActionHandler(acao, null) } catch {}
      }
    } catch {}
  }, [fonte])

  useEffect(() => {
    if (!perto || parado) return
    try {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (c?.saveData) return
      if (c?.effectiveType && /^(slow-)?2g$|^3g$/.test(c.effectiveType)) return
    } catch { /* sem a API, seguimos: o pôster já cobre o pior caso */ }
    const noFone = typeof window !== 'undefined'
      && window.matchMedia('(max-width: 900px)').matches
    setFonte(noFone && srcMob ? srcMob : src)
  }, [perto, parado, src, srcMob])

  return (
    // sem `position` nem `aspect-ratio` inline: estilo em linha vence
    // classe, e tanto o posicionamento quanto o enquadramento precisam ser
    // sobrescritos por media query. Os dois vêm do CSS base.
    <div ref={ref} className={'nv2-filme ' + (className || '')}
      style={{ '--prop': proporcao, '--prop-fone': proporcaoMob || proporcao, ...style }}>
      {/* o pôster fica SEMPRE por baixo: é ele que segura o layout enquanto
          o vídeo não carrega, e é ele que aparece quando o vídeo não vem */}
      <img src={poster} alt={alt} loading="lazy" decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
      {fonte && (
        <video
          src={fonte} poster={poster}
          autoPlay muted loop playsInline preload="none"
          aria-hidden tabIndex={-1}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
        />
      )}
      {/* ver o comentário no topo: é isto que impede a barra flutuante do
          navegador de aparecer sobre o filme */}
      <span aria-hidden className="nv2-filme-tampa" />
    </div>
  )
}
