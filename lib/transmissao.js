// ─────────────────────────────────────────────────────────────────────────
// TRANSMISSÃO DE TELA — o operador mostra a tela dele pro admin, ao vivo.
//
// Sem servidor de vídeo e sem custo: WebRTC ponto a ponto. O vídeo vai do
// navegador do operador direto pro navegador de quem assiste. As duas
// pontas só precisam se ACHAR, e isso é a sinalização — que passa pelo
// Supabase Realtime (broadcast + presence), o mesmo que o Network já usa.
//
//   canal por tenant:  'tela:<tenantId>'
//   presence           quem está transmitindo (papel 'transmissor') e quem
//                      está assistindo ('espectador'); é o "AO VIVO" das telas
//   broadcast          pedido → oferta → resposta → ice… (um par por espectador)
//
// STUN público do Google descobre o endereço de cada lado. Sem TURN (que
// custaria), ~15% das redes muito fechadas não conectam: nesse caso a tela
// diz "não deu por essa rede" em vez de girar pra sempre. Se um dia entrar
// um TURN, é só somar em ICE.
//
// Limite do navegador, não nosso: iPhone e Android NÃO capturam a tela
// (getDisplayMedia não existe lá). O operador transmite do PC; assistir
// funciona em qualquer aparelho.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { supabase } from './supabase/client'

export const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] }

/** O aparelho consegue capturar a tela? (só desktop) */
export function podeTransmitir() {
  if (typeof navigator === 'undefined') return false
  if (!navigator.mediaDevices?.getDisplayMedia) return false
  return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

const nomeCanal = tenantId => 'tela:' + tenantId
function canal(tenantId, key) {
  return supabase.channel(nomeCanal(tenantId), { config: { broadcast: { self: false }, presence: { key } } })
}
function assinar(ch) {
  return new Promise((res, rej) => {
    ch.subscribe(st => {
      if (st === 'SUBSCRIBED') res()
      else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') rej(new Error('Realtime: ' + st))
    })
  })
}

/** Lê a presença: quem transmite e quantos assistem cada um. */
export function listarAoVivo(ch) {
  const st = ch.presenceState() || {}
  const todos = Object.values(st).flat()
  const espectadores = todos.filter(p => p.papel === 'espectador')
  return todos
    .filter(p => p.papel === 'transmissor')
    .map(p => ({ userId: p.userId, nome: p.nome, metaId: p.metaId || null, desde: p.desde, espectadores: espectadores.filter(e => (e.assistindo || []).includes(p.userId)).length }))
    .sort((a, b) => (a.desde || 0) - (b.desde || 0))
}

/** Hook só de leitura: a lista de quem está ao vivo no tenant. */
export function useAoVivo(tenantId, ativo = true) {
  const [lista, setLista] = useState([])
  useEffect(() => {
    if (!tenantId || !ativo) return
    const ch = canal(tenantId, 'olho-' + Math.random().toString(36).slice(2, 8))
    ch.on('presence', { event: 'sync' }, () => setLista(listarAoVivo(ch)))
    ch.subscribe()
    return () => { try { supabase.removeChannel(ch) } catch {} }
  }, [tenantId, ativo])
  return lista
}

const enviar = (ch, event, payload) => { try { ch.send({ type: 'broadcast', event, payload }) } catch {} }

/**
 * O lado de quem TRANSMITE. Um RTCPeerConnection por espectador; a mesma
 * captura vai pra todos.
 */
export function criarTransmissor({ tenantId, userId, nome, metaId, onEstado }) {
  let ch = null, stream = null, fechado = false
  const pcs = new Map()

  function fecharPc(id) { const pc = pcs.get(id); if (pc) { try { pc.close() } catch {} ; pcs.delete(id) } }

  async function atender(viewerId) {
    if (!stream || fechado) return
    fecharPc(viewerId)
    const pc = new RTCPeerConnection(ICE)
    pcs.set(viewerId, pc)
    stream.getTracks().forEach(t => pc.addTrack(t, stream))
    pc.onicecandidate = e => { if (e.candidate) enviar(ch, 'ice', { para: viewerId, de: userId, candidate: e.candidate.toJSON() }) }
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') fecharPc(viewerId) }
    const oferta = await pc.createOffer()
    await pc.setLocalDescription(oferta)
    enviar(ch, 'oferta', { para: viewerId, de: userId, sdp: pc.localDescription.toJSON() })
  }

  async function iniciar() {
    // a permissão do navegador vem primeiro: se a pessoa cancelar, nada
    // mais acontece (nem canal, nem presença)
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 10, max: 15 } },   // tela de operação: 10 fps basta e pesa pouco
      audio: false,
    })
    // "Parar compartilhamento" na barrinha do Chrome também encerra
    stream.getVideoTracks()[0]?.addEventListener('ended', () => parar())

    ch = canal(tenantId, userId)
    ch.on('broadcast', { event: 'pedido' }, ({ payload }) => { if (payload?.para === userId) atender(payload.de).catch(() => {}) })
    ch.on('broadcast', { event: 'resposta' }, ({ payload }) => {
      if (payload?.para !== userId) return
      const pc = pcs.get(payload.de)
      if (pc) pc.setRemoteDescription(payload.sdp).catch(() => {})
    })
    ch.on('broadcast', { event: 'ice' }, ({ payload }) => {
      if (payload?.para !== userId) return
      pcs.get(payload.de)?.addIceCandidate(payload.candidate).catch(() => {})
    })
    ch.on('broadcast', { event: 'sair' }, ({ payload }) => { if (payload?.para === userId) fecharPc(payload.de) })
    ch.on('presence', { event: 'sync' }, () => {
      const eu = listarAoVivo(ch).find(t => t.userId === userId)
      onEstado?.({ espectadores: eu ? eu.espectadores : 0 })
    })
    await assinar(ch)
    await ch.track({ papel: 'transmissor', userId, nome, metaId: metaId || null, desde: Date.now() })
    onEstado?.({ aoVivo: true, desde: Date.now(), espectadores: 0 })
  }

  function parar() {
    if (fechado) return
    fechado = true
    for (const id of [...pcs.keys()]) fecharPc(id)
    try { stream?.getTracks().forEach(t => t.stop()) } catch {}
    if (ch) {
      enviar(ch, 'fim', { de: userId })
      // dá tempo do 'fim' sair antes de derrubar o canal
      setTimeout(() => { try { ch.untrack() } catch {} ; try { supabase.removeChannel(ch) } catch {} }, 300)
    }
    onEstado?.({ aoVivo: false, parado: true })
  }

  return { iniciar, parar }
}

/**
 * O lado de quem ASSISTE. Pede a tela de um transmissor; recebe a oferta,
 * responde, e entrega o MediaStream pra um <video>.
 */
export function criarEspectador({ tenantId, userId, nome, onLista, onStream, onEstado }) {
  let ch = null
  const pcs = new Map()
  const pendentes = new Map()   // ice que chegou antes da oferta
  const timers = new Map()
  const assistindo = new Set()

  function fechar(opId) {
    const pc = pcs.get(opId); if (pc) { try { pc.close() } catch {} ; pcs.delete(opId) }
    clearTimeout(timers.get(opId)); timers.delete(opId); pendentes.delete(opId)
  }
  const marcarPresenca = () => { try { ch?.track({ papel: 'espectador', userId, nome, assistindo: [...assistindo] }) } catch {} }

  async function receber({ de, sdp }) {
    fechar(de)
    const pc = new RTCPeerConnection(ICE)
    pcs.set(de, pc)
    pc.ontrack = e => { if (e.streams?.[0]) onStream?.(de, e.streams[0]) }
    pc.onicecandidate = e => { if (e.candidate) enviar(ch, 'ice', { para: de, de: userId, candidate: e.candidate.toJSON() }) }
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      if (s === 'connected') { clearTimeout(timers.get(de)); onEstado?.(de, 'ao-vivo') }
      else if (s === 'failed') onEstado?.(de, 'falhou')
      else if (s === 'disconnected') onEstado?.(de, 'instavel')
    }
    await pc.setRemoteDescription(sdp)
    for (const c of pendentes.get(de) || []) await pc.addIceCandidate(c).catch(() => {})
    pendentes.delete(de)
    const resposta = await pc.createAnswer()
    await pc.setLocalDescription(resposta)
    enviar(ch, 'resposta', { para: de, de: userId, sdp: pc.localDescription.toJSON() })
  }

  async function conectar() {
    ch = canal(tenantId, userId)
    ch.on('presence', { event: 'sync' }, () => onLista?.(listarAoVivo(ch)))
    ch.on('broadcast', { event: 'oferta' }, ({ payload }) => { if (payload?.para === userId) receber(payload).catch(() => onEstado?.(payload.de, 'falhou')) })
    ch.on('broadcast', { event: 'ice' }, ({ payload }) => {
      if (payload?.para !== userId) return
      const pc = pcs.get(payload.de)
      if (pc?.remoteDescription) pc.addIceCandidate(payload.candidate).catch(() => {})
      else { if (!pendentes.has(payload.de)) pendentes.set(payload.de, []); pendentes.get(payload.de).push(payload.candidate) }
    })
    ch.on('broadcast', { event: 'fim' }, ({ payload }) => { if (payload?.de) { fechar(payload.de); assistindo.delete(payload.de); marcarPresenca(); onEstado?.(payload.de, 'fim') } })
    await assinar(ch)
    marcarPresenca()
    onLista?.(listarAoVivo(ch))
  }

  function assistir(opId) {
    if (!ch) return
    fechar(opId)
    assistindo.add(opId); marcarPresenca()
    onEstado?.(opId, 'conectando')
    enviar(ch, 'pedido', { para: opId, de: userId })
    // sem TURN, rede muito fechada não conecta: 15s e a gente avisa
    timers.set(opId, setTimeout(() => { if (pcs.get(opId)?.connectionState !== 'connected') onEstado?.(opId, 'falhou') }, 15000))
  }

  function parar(opId) {
    fechar(opId); assistindo.delete(opId); marcarPresenca()
    enviar(ch, 'sair', { para: opId, de: userId })
    onEstado?.(opId, 'parado')
  }

  function fecharTudo() {
    for (const id of [...pcs.keys()]) { enviar(ch, 'sair', { para: id, de: userId }); fechar(id) }
    try { ch?.untrack() } catch {}
    try { if (ch) supabase.removeChannel(ch) } catch {}
    ch = null
  }

  return { conectar, assistir, parar, fecharTudo }
}
