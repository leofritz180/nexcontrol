'use client'
// ─────────────────────────────────────────────────────────────────────────
// FOLHA, PASSOS e CONFETE — peças de "momento" do NexControl 2.0.
//
// Folha: a base de todo modal do V2 (véu com desfoque + folha branca com
// canto 26 e sombra flutuante). Todos os modais novos usam a mesma, então o
// usuário sente que é um sistema só, não cinco caixas diferentes.
//
// Passos: a régua de etapas (1 · 2 · 3) do fluxo de criar meta.
//
// Confete: comemoração CONTIDA dentro do card — partículas em CSS/framer,
// sem canvas, sem biblioteca, e que respeitam prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SOMBRA, Ico, RED, RED2, LIME } from './bento'

export function Folha({ aberto, aoFechar, largura = 560, children, semFechar = false, z = 9000, alinhar = 'center' }) {
  const semMovimento = useReducedMotion()
  // trava a rolagem da página enquanto a folha está aberta
  useEffect(() => {
    if (!aberto) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [aberto])

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: semMovimento ? 0 : 0.22 }}
          onClick={e => { if (e.target === e.currentTarget && !semFechar) aoFechar?.() }}
          style={{
            position: 'fixed', inset: 0, zIndex: z,
            background: 'rgba(17,19,24,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: alinhar, justifyContent: 'center', padding: 20,
          }}>
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: semMovimento ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative', width: '100%', maxWidth: largura, maxHeight: 'calc(100dvh - 40px)', overflowY: 'auto',
              background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 26,
              boxShadow: SOMBRA.flutuante,
            }}>
            {!semFechar && (
              <button type="button" onClick={aoFechar} aria-label="Fechar"
                style={{
                  position: 'absolute', top: 16, right: 16, zIndex: 3, width: 34, height: 34, borderRadius: 12,
                  background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={15} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Passos({ itens = [], atual = 0, aoIr }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {itens.map((t, i) => {
        const feito = i < atual, ativo = i === atual
        return (
          <div key={t} style={{ display: 'flex', alignItems: 'center', flex: i < itens.length - 1 ? 1 : 'none' }}>
            <button type="button" onClick={() => feito && aoIr?.(i)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', padding: 0, cursor: feito ? 'pointer' : 'default', fontFamily: 'inherit' }}>
              <motion.span
                animate={{ scale: ativo ? 1.06 : 1 }}
                style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono, monospace)', fontSize: 12, fontWeight: 900,
                  background: feito || ativo ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--fill-2)',
                  color: feito || ativo ? '#fff' : 'var(--t4)',
                  boxShadow: ativo ? '0 8px 20px rgba(229,57,31,0.32)' : 'none',
                  transition: 'background .25s ease, box-shadow .25s ease',
                }}>
                {feito ? <Ico d={<path d="M20 6L9 17l-5-5" />} s={13} c="#fff" /> : i + 1}
              </motion.span>
              <span style={{ fontSize: 12.5, fontWeight: ativo ? 800 : 600, color: ativo ? 'var(--t1)' : feito ? 'var(--t2)' : 'var(--t4)', whiteSpace: 'nowrap' }}>{t}</span>
            </button>
            {i < itens.length - 1 && (
              <span style={{ flex: 1, height: 2, margin: '0 12px', borderRadius: 2, background: 'var(--fill-2)', position: 'relative', overflow: 'hidden' }}>
                <motion.span initial={false} animate={{ width: feito ? '100%' : '0%' }} transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: `linear-gradient(90deg, ${RED2}, ${RED})` }} />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

const CORES = [RED, RED2, LIME, '#15151a', '#ffb08a', '#7fc24a']

export function Confete({ disparar = false, quantidade = 42, duracao = 1.6 }) {
  const semMovimento = useReducedMotion()
  const [rodada, setRodada] = useState(0)
  useEffect(() => { if (disparar) setRodada(r => r + 1) }, [disparar])

  // posições sorteadas uma vez por rodada — fora do render pra não mudar a cada quadro
  const pecas = useMemo(() => Array.from({ length: quantidade }, (_, i) => ({
    id: rodada + '-' + i,
    x: (Math.random() - 0.5) * 380,
    y: -(140 + Math.random() * 220),
    rot: (Math.random() - 0.5) * 720,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 10,
    cor: CORES[i % CORES.length],
    atraso: Math.random() * 0.18,
    redondo: i % 4 === 0,
  })), [rodada, quantidade])

  if (semMovimento || !rodada) return null
  return (
    <div aria-hidden style={{ position: 'absolute', left: '50%', top: '45%', width: 0, height: 0, pointerEvents: 'none', zIndex: 5 }}>
      {pecas.map(p => (
        <motion.span key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 260], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
          transition={{ duration: duracao, delay: p.atraso, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] }}
          style={{
            position: 'absolute', width: p.w, height: p.redondo ? p.w : p.h,
            borderRadius: p.redondo ? '50%' : 2, background: p.cor,
          }} />
      ))}
    </div>
  )
}
