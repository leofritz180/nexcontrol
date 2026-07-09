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

let holder = null // { id, prio, yieldable }

function emit(type, detail) {
  if (typeof window === 'undefined') return
  try { window.dispatchEvent(new CustomEvent(type, { detail })) } catch {}
}

export function overlayAcquire(id, prio, { yieldable = false } = {}) {
  if (typeof window === 'undefined') return false
  if (!holder || holder.id === id) { holder = { id, prio, yieldable }; return true }
  // só preempta se o novo é mais prioritário E o atual pode ceder (cartão)
  if (prio < holder.prio && holder.yieldable) {
    const yielded = holder.id
    holder = { id, prio, yieldable }
    emit('nx-overlay-yield', { id: yielded })
    return true
  }
  return false
}

export function overlayRelease(id) {
  if (holder && holder.id === id) {
    holder = null
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
      if (grantedRef.current) return
      if (overlayAcquire(id, prio, { yieldable })) setGranted(true)
    }
    attempt()
    const offFree = onFree(attempt)                 // algo fechou → tenta de novo
    const offYield = onYield(id, () => setGranted(false)) // fui preemptado → escondo
    return () => { offFree(); offYield(); overlayRelease(id) }
  }, [want, id, prio, yieldable])

  return granted
}
