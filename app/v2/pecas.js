'use client'
// ─────────────────────────────────────────────────────────────────────────
// PEÇAS DA LANDING 2.0 — só apresentação. Nenhuma busca dados.
//
// O movimento é quase sempre o mesmo par: opacity + translateY. Nada de
// rotação nem partícula. Existe uma deriva de profundidade (Deriva), mas
// com amplitude pequena de propósito: a página tem que parecer cara por
// causa do espaço e da tipografia, não por causa de efeito.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useInView, animate, useScroll, useTransform, useSpring } from 'framer-motion'

export const SUAVE = [0.22, 1, 0.36, 1]

// ── REVELAR ──────────────────────────────────────────────────────────────
// Entra uma vez quando chega perto da dobra. `atraso` escalona irmãos.
//
// DUAS REDES DE SEGURANÇA, e elas não são preciosismo: numa landing de
// VENDA, conteúdo que depende de observador pra existir é conteúdo que pode
// nunca aparecer. Já aconteceu neste projeto (ver a nota sobre clip-path e
// IntersectionObserver).
//   1. `margin: 240px` dispara bem ANTES do elemento chegar na dobra.
//   2. `amount: 0` basta um pixel visível — não espera o bloco inteiro.
//   3. o temporizador abaixo: passados 2,2s do carregamento, tudo aparece
//      de qualquer jeito. Se o observador falhar, a página continua
//      legível; o pior caso é um fade sem scroll, não uma página em branco.
export function Revelar({ children, atraso = 0, y = 18, className, style, as = 'div' }) {
  const parado = useReducedMotion()
  const [destravado, setDestravado] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDestravado(true), 2200)
    return () => clearTimeout(t)
  }, [])

  const Tag = motion[as] || motion.div
  if (parado) {
    const Plain = as
    return <Plain className={className} style={style}>{children}</Plain>
  }
  const visivel = { opacity: 1, y: 0 }
  return (
    <Tag
      className={className} style={style}
      initial={{ opacity: 0, y }}
      {...(destravado ? { animate: visivel } : { whileInView: visivel })}
      viewport={{ once: true, amount: 0, margin: '240px 0px 240px 0px' }}
      transition={{ duration: 0.62, delay: destravado ? 0 : atraso, ease: SUAVE }}
    >{children}</Tag>
  )
}

// ── OLHO (eyebrow) ───────────────────────────────────────────────────────
export function Olho({ children, ponto = true }) {
  return <span className="nv2-olho">{ponto && <i />}{children}</span>
}

// ── CABEÇA DE SEÇÃO ──────────────────────────────────────────────────────
export function Cabeca({ olho, titulo, lead, id, largura = 720 }) {
  return (
    <header style={{ maxWidth: largura }}>
      {olho && <Revelar><Olho>{olho}</Olho></Revelar>}
      <Revelar atraso={0.06}>
        <h2 className="nv2-h2" id={id} style={{ marginTop: olho ? 20 : 0 }}>{titulo}</h2>
      </Revelar>
      {lead && <Revelar atraso={0.12}><p className="nv2-lead" style={{ marginTop: 18 }}>{lead}</p></Revelar>}
    </header>
  )
}

// ── CONTADOR ─────────────────────────────────────────────────────────────
// Conta só a parte numérica. `antes`/`depois` ficam fixos, então "R$ 1M+"
// anima o 1 e mantém o resto — sem inventar precisão que o número não tem.
export function Contador({ valor, antes = '', depois = '', casas = 0 }) {
  const parado = useReducedMotion()
  const ref = useRef(null)
  const naTela = useInView(ref, { once: true, margin: '-15% 0px' })
  // Nasce com o VALOR FINAL, não com zero. Dois motivos:
  //  · o número certo já vai no HTML, então buscador e leitor de tela leem
  //    "400+", não "0+";
  //  · se o observador nunca disparar, a página mostra o dado real em vez
  //    de um zero que parece bug.
  // A contagem só começa quando o bloco entra em vista — e aí sim ela parte
  // do zero, porque é isso que dá a sensação de contador.
  const [n, setN] = useState(valor)

  useEffect(() => {
    if (parado || !naTela) return
    const controle = animate(0, valor, {
      duration: 1.1, ease: SUAVE,
      onUpdate: v => setN(v),
    })
    return () => controle.stop()
  }, [naTela, valor, parado])

  const txt = casas > 0
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
    : Math.round(n).toLocaleString('pt-BR')

  return <span ref={ref}>{antes}{txt}<em>{depois}</em></span>
}

// ── ÍCONE ────────────────────────────────────────────────────────────────
export function Ico({ d, s = 16, cor = 'currentColor', traco = 1.7 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cor}
      strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
  )
}

export const SETA = <path d="M5 12h14M13 6l6 6-6 6" />
export const MAIS = <path d="M12 5v14M5 12h14" />

// ── BOTÃO ────────────────────────────────────────────────────────────────
export function Botao({ href, children, tipo = 'lime', grande, seta, onClick, className = '' }) {
  const cls = `nv2-btn nv2-btn--${tipo}${grande ? ' nv2-btn--g' : ''} ${className}`.trim()
  const dentro = <>{children}{seta && <Ico d={SETA} s={16} traco={2} />}</>
  if (onClick) return <button type="button" className={cls} onClick={onClick}>{dentro}</button>
  return <a href={href} className={cls}>{dentro}</a>
}

// ── FAQ ──────────────────────────────────────────────────────────────────
export function Pergunta({ q, children, aberta, aoAbrir }) {
  const parado = useReducedMotion()
  return (
    <div className="nv2-faq-item">
      <button type="button" className="nv2-faq-b" aria-expanded={aberta} onClick={aoAbrir}>
        <span>{q}</span>
        <span className="nv2-faq-sinal"><Ico d={MAIS} s={17} traco={1.8} /></span>
      </button>
      <motion.div
        className="nv2-faq-r"
        initial={false}
        animate={{ height: aberta ? 'auto' : 0, opacity: aberta ? 1 : 0 }}
        transition={parado ? { duration: 0 } : { duration: 0.28, ease: SUAVE }}
      >
        <p className="nv2-corpo">{children}</p>
      </motion.div>
    </div>
  )
}

/* ── PROFUNDIDADE NO SCROLL ─────────────────────────────────────────────
   O que dá sensação de profundidade não é o elemento se mexer muito: é ele
   se mexer MENOS que a página. A `Deriva` desloca o conteúdo numa fração da
   rolagem, então quem passa por ele o percebe atrás do resto — como olhar
   pela janela de um carro e ver o morro andar devagar.

   A amplitude é deliberadamente pequena (36px de ponta a ponta). Parallaxe
   forte numa landing de produto vira enjoo e, pior, tira o texto do lugar
   onde o olho esperava encontrá-lo.

   `useScroll` com offset ['start end', 'end start'] mede o elemento da hora
   em que ele ENTRA por baixo até a hora em que SAI por cima — o trecho que
   o visitante realmente vê.

   Com movimento reduzido no sistema, não monta nada: devolve o filho puro.
   Isto é enfeite, e enfeite é a primeira coisa que se desliga. */
export function Deriva({ children, forca = 18, className, style }) {
  const parado = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [forca, -forca])
  const macio = useSpring(y, { stiffness: 80, damping: 26, mass: 0.4 })

  if (parado) return <div className={className} style={style}>{children}</div>
  return (
    <div ref={ref} className={className} style={style}>
      <motion.div style={{ y: macio, willChange: 'transform' }}>{children}</motion.div>
    </div>
  )
}

/* ── A LINHA DE PROGRESSO ───────────────────────────────────────────────
   Dois pixels de lime no topo, presos à rolagem da página. Numa landing
   longa ela responde a uma pergunta que o visitante faz sem falar — "quanto
   ainda falta?" — e é o tipo de detalhe que o olho registra sem nomear.

   `scaleX` com origem à esquerda: anima na GPU, sem recalcular layout a
   cada quadro. Fazer o mesmo com `width` custaria um reflow por pixel de
   rolagem, e numa página com cinco vídeos isso aparece como engasgo. */
export function LinhaDeProgresso() {
  const parado = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const largura = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  if (parado) return null
  return (
    <motion.div aria-hidden style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 90,
      background: 'linear-gradient(90deg, #C8F21D, #9ed40e)',
      transformOrigin: '0% 50%', scaleX: largura, pointerEvents: 'none',
    }} />
  )
}
