'use client'
// ─────────────────────────────────────────────────────────────────────────
// FILME — vídeo de apoio na landing.
//
// A MAIORIA DOS ACESSOS É PELO CELULAR, e os cinco filmes somam 17 MB.
// Servir isso num 4G fraco é perder a visita antes da primeira dobra. Por
// isso o componente tem quatro travas, nesta ordem:
//
// 1. PESO. Filme marcado `pesado` (as renderizações 3D de 5 MB) só toca no
//    desktop. No telefone fica o pôster — que é imagem, e conta a mesma
//    história parada.
// 2. CONEXÃO. Se o navegador informa economia de dados ou rede 2g/3g, o
//    vídeo não monta em lugar nenhum. Quem está no limite do plano não
//    paga por enfeite.
// 3. PROXIMIDADE. `preload="none"` e a fonte só entra no DOM quando o bloco
//    chega perto da dobra. Antes disso o custo é zero.
// 4. MOVIMENTO. Com `prefers-reduced-motion`, o vídeo nem é montado.
//
// Em todos os casos o pôster está lá embaixo segurando o layout: ninguém
// vê retângulo vazio, em nenhuma situação.
//
// E VALE REPETIR: filme aqui é AMBIENTAÇÃO, não prova. O texto miúdo
// dentro das renderizações não é a interface de verdade — quem prova o
// produto são as capturas reais, que continuam na página.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

export default function Filme({ src, poster, alt, className, style, proporcao, pesado = false }) {
  const parado = useReducedMotion()
  const ref = useRef(null)
  const perto = useInView(ref, { once: true, margin: '400px 0px' })
  const [podeTocar, setPodeTocar] = useState(false)

  useEffect(() => {
    if (!perto || parado) return
    let solto = false
    try {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (c?.saveData) return
      if (c?.effectiveType && /^(slow-)?2g$|^3g$/.test(c.effectiveType)) return
      // filme pesado não toca em tela de telefone
      if (pesado && window.matchMedia('(max-width: 900px)').matches) return
      solto = true
    } catch { solto = true }
    if (solto) setPodeTocar(true)
  }, [perto, parado, pesado])

  return (
    // sem `position` inline: estilo em linha vence classe, e a marca de
    // fundo precisa ser absolute pela classe. O padrão vem do CSS base.
    <div ref={ref} className={'nv2-filme ' + (className || '')}
      style={{ aspectRatio: proporcao, ...style }}>
      {/* o pôster fica SEMPRE por baixo: é ele que segura o layout enquanto
          o vídeo não carrega, e é ele que aparece quando o vídeo não vem */}
      <img src={poster} alt={alt} loading="lazy" decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {podeTocar && (
        <video
          src={src} poster={poster}
          autoPlay muted loop playsInline preload="none"
          aria-hidden tabIndex={-1}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  )
}
