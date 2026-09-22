'use client'
// ─────────────────────────────────────────────────────────────────────────
// PEÇAS DA LANDING 2.0 — só apresentação. Nenhuma busca dados.
//
// O movimento é sempre o mesmo par: opacity + translateY. Nada de rotação,
// partícula ou parallax pesado. A página tem que parecer cara por causa do
// espaço e da tipografia, não por causa de efeito.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useInView, animate } from 'framer-motion'

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
