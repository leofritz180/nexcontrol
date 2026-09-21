'use client'
// ─────────────────────────────────────────────────────────────────────────
// AVISOS (toasts) — sistema unificado do NexControl 2.0.
//
// Por que existe: hoje cada tela resolve "deu certo / deu errado" do seu
// jeito (alert nativo, <p> vermelho, nada). Isto centraliza num só lugar,
// na linguagem do kit bento: superfície branca, canto 24, sombra suave,
// entrada com mola.
//
// Decisões que valem explicar:
// • NÃO participa do lib/overlayCoordinator. O coordenador serve pra garantir
//   que só UM overlay MODAL (tour, banner de lançamento, checklist) apareça
//   por vez, porque eles competem pela atenção e bloqueiam a tela. Aviso é o
//   oposto: é efêmero, não bloqueia nada (pointer-events: none no contêiner)
//   e PRECISA aparecer justamente enquanto um modal está aberto — se um
//   salvamento falhar dentro do tour, o usuário tem que ver. Pedir slot faria
//   o aviso ser engolido (ou faria o tour sumir). Então ele vive por cima de
//   tudo, sem disputar.
// • O contêiner é um portal no <body>: assim nenhum ancestral com transform
//   (comum em página animada) quebra o position: fixed.
// ─────────────────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SOMBRA, Ico } from '../ui/bento'

const MAX_VISIVEIS = 3   // além disso, o mais antigo sai pra não virar parede
const Z = 10100          // acima de modal, dock e sidebar

// ── vocabulário visual por tipo ──────────────────────────────────────────
const TIPOS = {
  sucesso: {
    cor: 'var(--profit)',
    papel: 'status',
    icone: <><path d="M20 6 9 17l-5-5" /></>,
  },
  erro: {
    cor: 'var(--loss)',
    papel: 'alert',
    icone: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
  },
  info: {
    cor: 'var(--t2)',
    papel: 'status',
    icone: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  },
}

// Duração padrão: erro e "desfazer" pedem mais tempo de leitura/reação.
function duracaoPadrao(tipo, temDesfazer) {
  if (temDesfazer) return 8000
  if (tipo === 'erro') return 7000
  return 5000
}

// Contexto com no-op: se algum ponto da árvore renderizar fora do provedor,
// a página NÃO quebra — o aviso só não aparece. Produção não cai por toast.
const semProvedor = { sucesso: () => null, erro: () => null, info: () => null, fechar: () => {}, limpar: () => {} }
const CtxAvisos = createContext(semProvedor)

export function useAviso() {
  return useContext(CtxAvisos)
}

// ─────────────────────────────────────────────────────────────────────────
// CARTÃO
// ─────────────────────────────────────────────────────────────────────────
function Cartao({ aviso, aoFechar }) {
  const semMovimento = useReducedMotion()
  const t = TIPOS[aviso.tipo] || TIPOS.info

  const barraRef = useRef(null)
  const pausadoRef = useRef(false)
  // callback de fechar guardado num ref: assim o relógio não reinicia quando
  // o provedor re-renderiza e entrega uma função nova.
  const fecharRef = useRef(aoFechar)
  useEffect(() => { fecharRef.current = aoFechar }, [aoFechar])

  // Relógio da barra. Escrevo direto no style do elemento (scaleX) em vez de
  // usar estado: 60 re-renders por segundo por cartão seria desperdício puro.
  useEffect(() => {
    const total = aviso.duracao
    if (!total) return undefined            // duracao: 0 = fica até fecharem
    let raf = 0
    let restante = total
    let ultimo = (typeof performance !== 'undefined' ? performance.now() : Date.now())

    const passo = (agora) => {
      const dt = agora - ultimo
      ultimo = agora
      if (!pausadoRef.current) restante -= dt   // mouse em cima = tempo congela
      const f = Math.max(0, restante / total)
      if (barraRef.current) barraRef.current.style.transform = 'scaleX(' + f + ')'
      if (restante <= 0) { fecharRef.current(); return }
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [aviso.duracao])

  const pausar = useCallback(() => { pausadoRef.current = true }, [])
  const retomar = useCallback(() => { pausadoRef.current = false }, [])

  const clicarDesfazer = useCallback(() => {
    try { if (aviso.desfazer) aviso.desfazer() } catch (e) { console.error('[avisos] desfazer falhou', e) }
    aoFechar()
  }, [aviso, aoFechar])

  // Mola na entrada; com prefers-reduced-motion vira um fade curto.
  const entrada = semMovimento
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
      initial: { opacity: 0, x: 60, scale: 0.94 },
      animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 } },
      exit: { opacity: 0, scale: 0.9, y: 6, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
    }

  return (
    <motion.div
      layout={!semMovimento}
      role={t.papel}
      aria-live={aviso.tipo === 'erro' ? 'assertive' : 'polite'}
      onMouseEnter={pausar}
      onMouseLeave={retomar}
      onFocus={pausar}
      onBlur={retomar}
      {...entrada}
      style={{
        pointerEvents: 'auto',          // o contêiner é 'none'; só o cartão clica
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--b1)',
        borderRadius: 24,
        boxShadow: SOMBRA.flutuante,
        padding: '15px 16px 17px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>

      {/* ícone em moldura — mesma gramática do estado vazio do kit */}
      <span style={{
        width: 34, height: 34, borderRadius: 12, flexShrink: 0, marginTop: 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--fill-1)', border: '1px solid var(--b1)', color: t.cor,
      }}>
        <Ico d={t.icone} s={17} c={t.cor} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.35 }}>
          {aviso.texto}
        </p>
        {aviso.descricao && (
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0', lineHeight: 1.5 }}>{aviso.descricao}</p>
        )}
        {aviso.desfazer && (
          <button type="button" onClick={clicarDesfazer}
            style={{
              marginTop: 10, padding: '7px 14px', borderRadius: 30, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em',
              color: 'var(--t1)', background: 'var(--fill-1)', border: '1px solid var(--b1)',
            }}>
            Desfazer
          </button>
        )}
      </div>

      <button type="button" onClick={aoFechar} aria-label="Fechar aviso"
        style={{
          width: 26, height: 26, borderRadius: 9, flexShrink: 0, marginTop: 3,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t4)',
        }}>
        <Ico d={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} s={15} />
      </button>

      {/* barra de tempo — fina, na cor do tipo, encolhendo pra esquerda */}
      {aviso.duracao > 0 && (
        <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'var(--fill-1)' }}>
          <span ref={barraRef} style={{ display: 'block', height: '100%', background: t.cor, transformOrigin: 'left center', transform: 'scaleX(1)' }} />
        </span>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// PROVEDOR
// ─────────────────────────────────────────────────────────────────────────
export function ProvedorDeAvisos({ children }) {
  const [avisos, setAvisos] = useState([])
  const [montado, setMontado] = useState(false)   // portal só depois de hidratar
  const seq = useRef(0)

  useEffect(() => { setMontado(true) }, [])

  const fechar = useCallback((id) => {
    setAvisos(a => a.filter(x => x.id !== id))
  }, [])

  const limpar = useCallback(() => setAvisos([]), [])

  const criar = useCallback((tipo, texto, opts) => {
    const o = opts || {}
    seq.current += 1
    const id = 'av' + seq.current
    const temDesfazer = typeof o.desfazer === 'function'
    const item = {
      id,
      tipo,
      texto: String(texto == null ? '' : texto),
      descricao: o.descricao || '',
      desfazer: temDesfazer ? o.desfazer : null,
      // duracao: 0 (ou null) = persistente, fecha só no X
      duracao: o.duracao === 0 ? 0 : (Number(o.duracao) || duracaoPadrao(tipo, temDesfazer)),
    }
    // empilha e corta os mais antigos — no máximo 3 na tela
    setAvisos(a => [...a, item].slice(-MAX_VISIVEIS))
    return id
  }, [])

  const api = useMemo(() => ({
    sucesso: (texto, opts) => criar('sucesso', texto, opts),
    erro: (texto, opts) => criar('erro', texto, opts),
    info: (texto, opts) => criar('info', texto, opts),
    fechar,
    limpar,
  }), [criar, fechar, limpar])

  const pilha = (
    <div
      className="nx-avisos"
      style={{
        position: 'fixed',
        right: 'max(16px, env(safe-area-inset-right))',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        zIndex: Z,
        pointerEvents: 'none',            // nunca rouba clique da tela
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 'min(380px, calc(100vw - 32px))',
      }}>
      <AnimatePresence initial={false} mode="popLayout">
        {avisos.map(a => <Cartao key={a.id} aviso={a} aoFechar={() => fechar(a.id)} />)}
      </AnimatePresence>
    </div>
  )

  return (
    <CtxAvisos.Provider value={api}>
      {children}
      {montado && typeof document !== 'undefined' ? createPortal(pilha, document.body) : null}
    </CtxAvisos.Provider>
  )
}

export default ProvedorDeAvisos
