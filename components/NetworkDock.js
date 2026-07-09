'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { networkEnabled, OWNER_EMAIL } from '../lib/network-access'

// ─────────────────────────────────────────────────────────────────────────
// NETWORK DOCK — chat flutuante estilo Messenger antigo. Fica no canto de TODAS
// as telas (via AppLayout): a pessoa opera / com remessa aberta e abre o chat
// numa caixinha, sem sair da tela. Objetivo: aumentar o uso do Network.
//   • PRO / allowlist  -> dock completo (Geral em tempo real).
//   • admin sem PRO     -> bolha "travada" (borrada) que puxa pro PRO (upsell).
//   • mobile            -> só a bolha; ao tocar, vai pro /network (caixinha no
//                          celular fica apertada demais).
// Reaproveita as APIs /api/network/* (acesso é validado no servidor).
// ─────────────────────────────────────────────────────────────────────────

const RED = '#e53935'
const MINT = '#22C55E'
const BUBBLE = '#2563eb'      // cor da bolha flutuante (azul — teste de destaque)
const BUBBLE_DARK = '#1d4ed8'
const SEEN_KEY = 'nx_dock_seen_v1'
const OPEN_KEY = 'nx_dock_open_v1'
// Telas onde o dock NÃO aparece (imersivas / redundantes).
const HIDDEN_PATHS = new Set(['/network', '/proxy', '/login', '/signup', '/invite', '/'])

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, color, src, size = 30 }) {
  const initial = (name || '?')[0].toUpperCase()
  if (src) return <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${color || RED}, ${color || RED}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 800, color: '#fff' }}>{initial}</div>
  )
}

export default function NetworkDock({ userEmail, isAdmin, subscription, tenant }) {
  const pathname = usePathname()
  const router = useRouter()
  const email = String(userEmail || '').toLowerCase()

  const subActive = (subscription?.status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > new Date())) || tenant?.subscription_status === 'active'
  const canEnter = networkEnabled(email) || subActive
  const isOwner = email === OWNER_EMAIL

  const [mobile, setMobile] = useState(false)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState(null)   // null = ainda não carregou
  const [online, setOnline] = useState(0)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [meId, setMeId] = useState(null)
  const [unread, setUnread] = useState(false)

  const tokenRef = useRef(null)
  const scrollRef = useRef(null)
  const rtRef = useRef(null)
  const latestRef = useRef(null)

  useEffect(() => {
    const on = () => setMobile(window.innerWidth < 768)
    on(); window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // sessão (token pra chamar as APIs)
  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      tokenRef.current = data?.session?.access_token || null
      setMeId(data?.session?.user?.id || null)
    })
    return () => { alive = false }
  }, [])

  const api = useCallback(async (path, opts = {}) => {
    const token = tokenRef.current
    if (!token) return null
    try {
      return await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers || {}) }, cache: 'no-store' })
    } catch { return null }
  }, [])

  const active = isAdmin && canEnter && !mobile && !HIDDEN_PATHS.has(pathname)

  // carrega o Geral (só quando o painel abre)
  const loadFeed = useCallback(async () => {
    const res = await api('/api/network/feed?channel=geral')
    if (res && res.ok) {
      const d = await res.json()
      setMsgs((d.messages || []).filter(m => !m.author?.system))
      setOnline(d.onlineCount ?? (d.online || []).length)
      const last = d.messages?.length ? d.messages[d.messages.length - 1].created_at : null
      if (last) { latestRef.current = last; try { localStorage.setItem(SEEN_KEY, last) } catch {}; setUnread(false) }
    }
  }, [api])

  // badge de não-lidas (leve): só o status global, sem baixar mensagens
  const checkUnread = useCallback(async () => {
    const res = await api('/api/network/status')
    if (res && res.ok) {
      const s = await res.json()
      latestRef.current = s.latest || null
      let seen = null; try { seen = localStorage.getItem(SEEN_KEY) } catch {}
      if (s.latest && (!seen || s.latest > seen)) setUnread(true)
    }
  }, [api])

  // restaura estado aberto/fechado
  useEffect(() => {
    if (!active) return
    try { setOpen(localStorage.getItem(OPEN_KEY) === '1') } catch {}
  }, [active])

  // FECHADO: poll leve de não-lidas (90s — espaçado pra pegar leve no banco; ver
  // incidente 08/07). Sem realtime — pra não manter conexão aberta em toda tela.
  useEffect(() => {
    if (!active || !meId) return
    checkUnread()
    const id = setInterval(() => { if (document.visibilityState === 'visible') checkUnread() }, 90000)
    return () => clearInterval(id)
  }, [active, meId, checkUnread])

  // ABERTO: carrega o Geral + realtime (instantâneo) + poll fallback 15s.
  // A conexão realtime só existe enquanto o painel está aberto.
  useEffect(() => {
    if (!active || !open || !meId) return
    loadFeed()
    const ch = supabase.channel('network-room', { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'msg' }, () => loadFeed())
    ch.subscribe()
    rtRef.current = ch
    const id = setInterval(() => { if (document.visibilityState === 'visible') loadFeed() }, 15000)
    return () => { clearInterval(id); try { supabase.removeChannel(ch) } catch {}; rtRef.current = null }
  }, [active, open, meId, loadFeed])

  // desce pro fim quando chegam mensagens (painel aberto)
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, open])

  function toggle(next) {
    setOpen(next)
    try { localStorage.setItem(OPEN_KEY, next ? '1' : '0') } catch {}
    if (next) setUnread(false)
  }

  async function send() {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    const res = await api('/api/network/message', { method: 'POST', body: JSON.stringify({ action: 'send', channel: 'geral', text: t }) })
    if (res && res.ok) {
      setText('')
      try { rtRef.current?.send({ type: 'broadcast', event: 'msg', payload: { channel: 'geral' } }) } catch {}
      await loadFeed()
    } else if (res) {
      const e = await res.json().catch(() => ({})); alert(e.error || 'Falha ao enviar')
    }
    setSending(false)
  }

  // ── Não renderiza nada onde não deve ──
  if (!isAdmin || HIDDEN_PATHS.has(pathname)) return null

  // ── Mobile: só a bolha, leva pro /network ──
  if (mobile) {
    if (!canEnter) return null // no mobile o upsell já aparece no menu/teaser
    return (
      <div style={{ position: 'fixed', right: 16, bottom: 84, zIndex: 900 }}>
        <Bubble open={false} unread={unread} label="Abrir Network" onClick={() => router.push('/network')} />
      </div>
    )
  }

  // ── Desktop admin SEM PRO: bolha travada (isca de conversão) ──
  if (!canEnter) {
    return (
      <div style={{ position: 'fixed', right: 20, bottom: 84, zIndex: 900 }}>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
              style={{ ...panelStyle, position: 'absolute', right: 0, bottom: 72, overflow: 'hidden' }}>
              <div style={dockHeader}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>Network</span>
                <button onClick={() => toggle(false)} style={iconBtn}><CloseIcon /></button>
              </div>
              <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                {/* prévia borrada */}
                <div style={{ position: 'absolute', inset: 0, padding: 14, filter: 'blur(5px)', opacity: 0.5, pointerEvents: 'none' }}>
                  {['Rafael Torres', 'João PH', 'Marcos Lima', 'Bruno CPA'].map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                      <div style={{ flex: 1 }}><div style={{ height: 9, width: '40%', background: 'rgba(255,255,255,0.15)', borderRadius: 4, marginBottom: 6 }} /><div style={{ height: 9, width: '80%', background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} /></div>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, gap: 10 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(229,57,53,0.14)', border: '1px solid rgba(229,57,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LockIcon /></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Comunidade exclusiva do PRO</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Fale com admins que operam de verdade, em tempo real. Assine o PRO pra entrar.</div>
                  <button onClick={() => router.push('/billing-mp?renewal=1')} style={{ marginTop: 4, padding: '10px 18px', borderRadius: 11, border: 'none', background: RED, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Assinar PRO →</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Bubble open={open} unread={false} label="Network" onClick={() => toggle(!open)} />
      </div>
    )
  }

  // ── Desktop PRO: dock completo ──
  return (
    <div style={{ position: 'fixed', right: 20, bottom: 84, zIndex: 900 }}>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
            style={{ ...panelStyle, position: 'absolute', right: 0, bottom: 72 }}>
            {/* header */}
            <div style={dockHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(229,57,53,0.16)', border: '1px solid rgba(229,57,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChatIcon size={14} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Network</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: MINT, boxShadow: `0 0 6px ${MINT}` }} />{online} online</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => router.push('/network')} title="Abrir tela cheia" style={iconBtn}><ExpandIcon /></button>
                <button onClick={() => toggle(false)} title="Minimizar" style={iconBtn}><MinIcon /></button>
              </div>
            </div>
            {/* mensagens */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {msgs === null ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: RED, animation: 'spin 0.8s linear infinite' }} /></div>
              ) : msgs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12.5, paddingTop: 40 }}>Ninguém falou nada ainda.<br />Manda um oi 👋</div>
              ) : msgs.map(m => {
                const mine = m.author?.id === meId
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: mine ? 'row-reverse' : 'row' }}>
                    {!mine && <Avatar name={m.author?.name} color={m.author?.color} src={m.author?.avatar} size={28} />}
                    <div style={{ maxWidth: '74%' }}>
                      {!mine && <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 2, paddingLeft: 2 }}>{m.author?.name}</div>}
                      <div style={{ padding: '7px 11px', borderRadius: 13, fontSize: 12.5, lineHeight: 1.4, color: mine ? '#fff' : '#e8edf5', background: mine ? RED : 'rgba(255,255,255,0.07)', borderTopLeftRadius: mine ? 13 : 4, borderTopRightRadius: mine ? 4 : 13, wordBreak: 'break-word' }}>
                        {m.image && <img src={m.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: m.text ? 6 : 0, display: 'block' }} />}
                        {m.text}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: mine ? 'right' : 'left', paddingInline: 2 }}>{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* composer */}
            <div style={{ display: 'flex', gap: 7, padding: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                placeholder="Mensagem..." style={{ flex: 1, padding: '9px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12.5, outline: 'none' }} />
              <button onClick={send} disabled={!text.trim() || sending} style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: 'none', background: text.trim() && !sending ? RED : 'rgba(255,255,255,0.08)', cursor: text.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={text.trim() && !sending ? '#fff' : 'rgba(255,255,255,0.4)'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* bolha */}
      <Bubble open={open} unread={unread} label="Abrir chat do Network" onClick={() => toggle(!open)} />
    </div>
  )
}

// ── estilos/ícones ──
const bubbleStyle = { position: 'relative', width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${BUBBLE}, ${BUBBLE_DARK})`, boxShadow: '0 8px 26px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }
const panelStyle = { width: 340, height: 460, maxWidth: 'calc(100vw - 40px)', maxHeight: 'calc(100vh - 120px)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0f1626, #080b13)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 70px rgba(0,0,0,0.6)' }
const dockHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(229,57,53,0.06)', flexShrink: 0 }
const iconBtn = { width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
function Dot() { return <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: MINT, border: '2px solid #0b0e16', boxShadow: `0 0 8px ${MINT}`, zIndex: 2 }} /> }
function ChatIcon({ size = 24, color = '#fff' }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> }
function CloseIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> }
function MinIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg> }
function ExpandIcon() { return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg> }
function ChevronDown({ color = '#fff' }) { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg> }
function LockIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> }

// Bolha com pulso/anel pra chamar atenção (para de pulsar quando o painel está aberto).
function Bubble({ onClick, open, unread, label }) {
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      {!open && (
        <motion.span aria-hidden
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: BUBBLE, zIndex: 0 }}
          animate={{ scale: [1, 1.75], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
      )}
      <motion.button onClick={onClick} aria-label={label} style={{ ...bubbleStyle, position: 'relative', zIndex: 1 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        animate={open ? { scale: 1 } : { scale: [1, 1.07, 1] }}
        transition={open ? { duration: 0.2 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        {open ? <ChevronDown color="#fff" /> : <ChatIcon color="#fff" />}
        {!open && unread && <Dot />}
      </motion.button>
    </div>
  )
}
