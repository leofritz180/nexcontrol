'use client'
// ─────────────────────────────────────────────────────────────────────────
// Coordenador de OVERLAYS de onboarding/anúncio — garante que só UM apareça
// por vez (fim da bagunça de pop-up em cima de pop-up no login).
//
// Prioridade (menor = mais importante, aparece primeiro):
//   1 tour (tutorial)  2 network (lançamento)  3 checklist  4 push
//
// Modais (tour/network) NÃO cedem (yieldable:false) — o segundo espera o
// primeiro fechar. Cartões (checklist/push) cedem (yieldable:true) — um modal
// os esconde temporariamente e eles voltam quando o modal fecha.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'

// A VAGA MORA NO window, nao numa variavel de modulo.
//
// O empacotador pode colocar este arquivo em MAIS DE UM pedaço: quem é
// importado direto pela página entra num, quem é carregado sob demanda
// (dynamic import, como o BettifyPromo) entra noutro. Cada pedaço carrega a
// PRÓPRIA cópia do módulo — e com ela a própria variável.
//
// O resultado era um mutex que não trancava nada entre grupos diferentes: o
// tour pegava a vaga numa cópia, o anúncio pegava "a vaga" na outra, e os
// dois abriam na mesma tela, um por cima do outro. O window é o único lugar
// que todas as cópias enxergam igual.
const CHAVE = '__nxOverlayHolder'
function pegaHolder() {
  if (typeof window === 'undefined') return null
  return window[CHAVE] || null
}
function poeHolder(v) {
  if (typeof window === 'undefined') return
  window[CHAVE] = v
}

function emit(type, detail) {
  if (typeof window === 'undefined') return
  try { window.dispatchEvent(new CustomEvent(type, { detail })) } catch {}
}

export function overlayAcquire(id, prio, { yieldable = false } = {}) {
  if (typeof window === 'undefined') return false
  const holder = pegaHolder()
  if (!holder || holder.id === id) { poeHolder({ id, prio, yieldable }); return true }
  // só preempta se o novo é mais prioritário E o atual pode ceder (cartão)
  if (prio < holder.prio && holder.yieldable) {
    const yielded = holder.id
    poeHolder({ id, prio, yieldable })
    emit('nx-overlay-yield', { id: yielded })
    return true
  }
  return false
}

export function overlayRelease(id) {
  const holder = pegaHolder()
  if (holder && holder.id === id) {
    poeHolder(null)
    emit('nx-overlay-free', {})
  }
}

function onFree(cb) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('nx-overlay-free', cb)
  return () => window.removeEventListener('nx-overlay-free', cb)
}
function onYield(id, cb) {
  if (typeof window === 'undefined') return () => {}
  const h = (e) => { if (e.detail?.id === id) cb() }
  window.addEventListener('nx-overlay-yield', h)
  return () => window.removeEventListener('nx-overlay-yield', h)
}

// Hook: passa se o overlay QUER aparecer; devolve se PODE aparecer agora.
// Cuida de adquirir/soltar/ceder/re-tentar sozinho.
export function useOverlaySlot(id, prio, want, { yieldable = false } = {}) {
  const [granted, setGranted] = useState(false)
  const grantedRef = useRef(false)
  useEffect(() => { grantedRef.current = granted }, [granted])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!want) { if (grantedRef.current) overlayRelease(id); setGranted(false); return }
    const attempt = () => {
      // toda tentativa decide: pegou, mostra; não pegou, esconde. Sair cedo
      // quando já tem a vaga deixava o granted preso em true depois de uma
      // liberação — e dois overlays apareciam na mesma tela.
      if (overlayAcquire(id, prio, { yieldable })) setGranted(true)
      else if (grantedRef.current) setGranted(false)
    }
    attempt()
    const offFree = onFree(attempt)                 // algo fechou → tenta de novo
    const offYield = onYield(id, () => setGranted(false)) // fui preemptado → escondo
    return () => { offFree(); offYield(); overlayRelease(id) }
  }, [want, id, prio, yieldable])

  return granted
}
