'use client'
// ─────────────────────────────────────────────────────────────────────────
// FILME — vídeo de apoio na landing, com três regras não-negociáveis.
//
// 1. NÃO PESA NO CARREGAMENTO. `preload="none"` e a fonte só entra no DOM
//    quando o bloco chega perto da dobra. Antes disso o que existe é o
//    pôster, que é uma imagem. Uma landing que demora a abrir não converte,
//    por mais bonito que seja o movimento.
//
// 2. SEM MOVIMENTO, MOSTRA O PÔSTER. Com `prefers-reduced-motion` o vídeo
//    nem é montado — fica a imagem parada. Ninguém vê um quadrado vazio.
//
// 3. É DECORAÇÃO, NÃO PROVA. O produto é provado pelas capturas reais da
//    interface. Estes filmes são renderizações: o texto miúdo dentro deles
//    não é a interface de verdade. Por isso entram pequenos, em movimento,
//    e nunca no lugar de uma captura.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

export default function Filme({ src, poster, alt, className, style, proporcao }) {
  const parado = useReducedMotion()
  const ref = useRef(null)
  const perto = useInView(ref, { once: true, margin: '400px 0px' })
  const [podeTocar, setPodeTocar] = useState(false)

  // a fonte só entra no DOM quando o bloco se aproxima da dobra
  useEffect(() => { if (perto && !parado) setPodeTocar(true) }, [perto, parado])

  return (
    // sem `position` inline: estilo em linha vence classe, e a marca de
    // fundo precisa ser absolute pela classe. O padrao vem do CSS base.
    <div ref={ref} className={"nv2-filme " + (className || "")}
      style={{ aspectRatio: proporcao, ...style }}>
      {/* o pôster fica SEMPRE por baixo: é ele que segura o layout enquanto
          o vídeo não carrega, e é ele que aparece sem movimento */}
      <img src={poster} alt={alt}
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
