'use client'
import { useEffect, useRef, useState, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { networkEnabled, NETWORK_CHANNELS, channelRule, VERIFIER_EMAILS, OWNER_EMAIL, NETWORK_GA } from '../../lib/network-access'

const CHANNEL_KEYS = new Set(NETWORK_CHANNELS.map(c => c.key))

// Comprime a imagem no cliente (max 1280px, jpeg) -> data URL pequeno.
function compressImage(file, max = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > max || height > max) {
        if (width >= height) { height = Math.round(height * max / width); width = max }
        else { width = Math.round(width * max / height); height = max }
      }
      const c = document.createElement('canvas')
      c.width = width; c.height = height
      c.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')) }
    img.src = url
  })
}

// Selo verificado estilo Instagram (rosácea azul + check).
function VerifiedBadge({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-label="Verificado">
      <path fill="#3897F0" d="M12 1l2.4 2.2 3.2-.5 1 3.1 2.9 1.5-1 3.1 1 3.1-2.9 1.5-1 3.1-3.2-.5L12 23l-2.4-2.2-3.2.5-1-3.1L2.5 15l1-3.1-1-3.1 2.9-1.5 1-3.1 3.2.5z" />
      <path fill="#fff" d="M10.4 15.2l-2.9-2.9 1.3-1.3 1.6 1.6 4-4 1.3 1.3z" />
    </svg>
  )
}

const ease = [0.33, 1, 0.68, 1]
const RED = '#e53935'
const MINT = '#22C55E'
const REACTIONS = ['🔥', '✅', '👀', '🚀', '💰']
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'
const channelEmoji = key => (NETWORK_CHANNELS.find(c => c.key === key)?.emoji || '#')

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso), now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function fmtSince(iso) {
  if (!iso) return '—'
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const d = new Date(iso)
  return `${meses[d.getMonth()]}/${d.getFullYear()}`
}
function fmtNum(n) { return Number(n || 0).toLocaleString('pt-BR') }
function fmtRel(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60); if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60); if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24); if (d < 30) return `há ${d}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Selo (mapeado pra paleta NexControl: vermelho/verde/branco/muted) ──
function badgeStyle(tone) {
  const map = {
    red:   { bg: 'rgba(229,57,53,0.14)', bd: 'rgba(229,57,53,0.4)',  fg: '#ff6b6b' },
    green: { bg: 'rgba(34,197,94,0.12)',  bd: 'rgba(34,197,94,0.38)', fg: '#4ade80' },
    gold:  { bg: 'rgba(255,255,255,0.1)', bd: 'rgba(255,255,255,0.28)', fg: '#f5f5f5' },
    blue:  { bg: 'rgba(229,57,53,0.12)',  bd: 'rgba(229,57,53,0.36)', fg: '#ff7a7a' },
    purple:{ bg: 'rgba(255,255,255,0.06)', bd: 'rgba(255,255,255,0.18)', fg: '#cbd5e1' },
  }
  return map[tone] || map.purple
}
function Badge({ label, tone, small }) {
  const s = badgeStyle(tone)
  return (
    <span style={{
      fontSize: small ? 8.5 : 9.5, fontWeight: 800, letterSpacing: '0.04em',
      padding: small ? '1px 5px' : '2px 7px', borderRadius: 5,
      background: s.bg, border: `1px solid ${s.bd}`, color: s.fg,
      whiteSpace: 'nowrap', lineHeight: 1.4,
    }}>{label}</span>
  )
}
function Avatar({ name, color, size = 38, online, src }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {src ? (
        <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.42, fontWeight: 800, color: '#fff',
          boxShadow: `0 2px 10px ${color}44`, border: '1px solid rgba(255,255,255,0.14)',
        }}>{initial}</div>
      )}
      {online && <span style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: MINT, border: '2px solid #0a0a0a' }} />}
    </div>
  )
}
// Selo Veterano (primeiros a entrar na comunidade) — coroa + destaque premium.
function VeteranoBadge({ small }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: small ? 8.5 : 9.5, fontWeight: 800, letterSpacing: '0.04em',
      padding: small ? '1px 6px' : '2px 8px', borderRadius: 5,
      background: 'linear-gradient(135deg, rgba(245,180,60,0.2), rgba(245,180,60,0.05))',
      border: '1px solid rgba(245,180,60,0.45)', color: '#f6c968', whiteSpace: 'nowrap', lineHeight: 1.4,
    }}>👑 Veterano</span>
  )
}

// Destaca @mencoes no texto (cosmetico).
function renderMentions(text) {
  return String(text || '').split(/(@[\p{L}\p{N}_]+)/u).map((p, i) =>
    (p.startsWith('@') && p.length > 1)
      ? <strong key={i} style={{ color: '#ff8a8a', fontWeight: 700 }}>{p}</strong>
      : p)
}
function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const on = () => setM(window.innerWidth < 900)
    on(); window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return m
}
// Altura util REAL (acompanha o teclado no mobile via visualViewport).
// Sem isso, o composer some atras do teclado. Retorna px (ou null antes de medir).
function useViewportH() {
  const [h, setH] = useState(null)
  useEffect(() => {
    const vv = window.visualViewport
    const upd = () => setH(Math.round(vv ? vv.height : window.innerHeight))
    upd()
    if (vv) { vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd) }
    window.addEventListener('resize', upd)
    return () => { if (vv) { vv.removeEventListener('resize', upd); vv.removeEventListener('scroll', upd) } window.removeEventListener('resize', upd) }
  }, [])
  return h
}

export default function NetworkPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const vpH = useViewportH()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [access, setAccess] = useState('checking') // checking | ok | denied

  const [channel, setChannel] = useState(() => {
    if (typeof window === 'undefined') return 'geral'
    const c = new URLSearchParams(window.location.search).get('c')
    return CHANNEL_KEYS.has(c) ? c : 'geral'
  })
  const [data, setData] = useState({ channels: [], messages: [], pinned: null, online: [], top: [], me: null, isOwner: false })
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [img, setImg] = useState(null) // data URL da foto anexada
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(null) // {id, text}
  const [profileView, setProfileView] = useState(null) // {loading, data}
  const [mobilePanel, setMobilePanel] = useState(null) // 'channels' | 'side' | null
  const [mentions, setMentions] = useState([]) // ids mencionados na msg em digitacao
  const [status, setStatus] = useState({ latest: null, byChannel: {} }) // p/ nao-lidas
  const [reads, setReads] = useState({}) // {channelKey: ISO lido} (localStorage)
  const [replyTo, setReplyTo] = useState(null)       // {id, name, text} — resposta em preparo
  const [typing, setTyping] = useState({})           // {name: expiryTs} — quem digita no canal ativo
  const [showJump, setShowJump] = useState(false)    // botão flutuante "descer"
  const [unseenCount, setUnseenCount] = useState(0)  // msgs novas enquanto scrollado p/ cima
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [unreadBoundaryId, setUnreadBoundaryId] = useState(null) // divisor "mensagens novas"
  const [showMembers, setShowMembers] = useState(false)
  const [showModLog, setShowModLog] = useState(false)

  const scrollRef = useRef(null)
  const tokenRef = useRef(null)
  const atBottomRef = useRef(true)
  const rtRef = useRef(null)          // canal realtime (broadcast)
  const activeChanRef = useRef(channel)
  const loadingOlderRef = useRef(false)   // guarda contra loads concorrentes de histórico
  const olderLoadedRef = useRef(false)    // já paginou histórico neste canal?
  const lastMsgIdRef = useRef(null)       // último id no fim (p/ contar não-vistas)
  const typingSentRef = useRef(0)         // throttle do broadcast de "digitando"
  const boundaryComputedRef = useRef(null)// canal p/ o qual o divisor já foi calculado
  const meNameRef = useRef(null)          // meu nome (pro callback do realtime não ver a si mesmo)

  const api = useCallback(async (path, opts = {}) => {
    const token = tokenRef.current
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers || {}) },
      cache: 'no-store',
    })
    return res
  }, [])

  // ── Boot: sessao + perfil + acesso ──
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      tokenRef.current = s.session.access_token
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p) { router.push('/login'); return }
      setProfile(p)
      const [{ data: t }, { data: sb2 }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (t) setTenant(t); if (sb2) setSub(sb2)
      const isAdmin = p.role === 'admin' || (u.email || '').toLowerCase() === OWNER_EMAIL
      const subActive = (sb2 && sb2.status === 'active' && (!sb2.expires_at || new Date(sb2.expires_at) > new Date())) || t?.subscription_status === 'active'
      // Acesso: allowlist OU (GA e PRO ativo). Sempre admin.
      const allowed = isAdmin && (networkEnabled(u.email) || (NETWORK_GA && subActive))
      setAccess(allowed ? 'ok' : 'denied')
    })()
  }, [])

  // ── Fetch feed ──
  const fetchFeed = useCallback(async (chan, showLoading) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api(`/api/network/feed?channel=${encodeURIComponent(chan)}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch {}
    if (showLoading) setLoading(false)
  }, [api])

  const fetchStatus = useCallback(async () => {
    try { const r = await api('/api/network/status'); if (r.ok) setStatus(await r.json()) } catch {}
  }, [api])

  // primeiro load + troca de canal
  useEffect(() => {
    if (access !== 'ok') return
    fetchFeed(channel, true)
  }, [access, channel, fetchFeed])

  // canal ativo num ref (pro realtime nao re-subscrever a cada troca)
  useEffect(() => { activeChanRef.current = channel }, [channel])

  // meu nome num ref (pro callback do realtime nunca me exibir digitando)
  useEffect(() => { meNameRef.current = data.me?.name || null }, [data.me])

  // reset de estado por-canal ao trocar de canal
  useEffect(() => {
    atBottomRef.current = true
    olderLoadedRef.current = false
    loadingOlderRef.current = false
    lastMsgIdRef.current = null
    boundaryComputedRef.current = null
    setShowJump(false); setUnseenCount(0); setLoadingOlder(false)
    setUnreadBoundaryId(null); setReplyTo(null); setTyping({})
  }, [channel])

  // divisor "mensagens novas": calcula UMA vez por canal usando o marcador de leitura
  // capturado na entrada (roda antes do read-marking abaixo atualizar reads p/ o topo)
  useEffect(() => {
    if (access !== 'ok' || loading) return
    if (boundaryComputedRef.current === channel) return
    boundaryComputedRef.current = channel
    const msgs = data.messages
    const mark = reads[channel]
    if (!mark || !msgs.length) return
    const idx = msgs.findIndex(m => !m.author?.system && m.created_at > mark)
    if (idx > 0) setUnreadBoundaryId(msgs[idx].id)
  }, [access, channel, loading, data.messages, reads])

  // expira quem parou de digitar (~4s)
  useEffect(() => {
    const id = setInterval(() => {
      setTyping(prev => {
        const now = Date.now(); let changed = false; const next = {}
        for (const k in prev) { if (prev[k] > now) next[k] = prev[k]; else changed = true }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // carrega marcadores de leitura
  useEffect(() => { try { setReads(JSON.parse(localStorage.getItem('nx_net_reads') || '{}')) } catch {} }, [])

  // TEMPO REAL: broadcast (nao depende de RLS). Ao receber msg nova, refetch.
  useEffect(() => {
    if (access !== 'ok') return
    const ch = supabase.channel('network-room', { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'msg' }, (msg) => {
      const chan = msg?.payload?.channel
      // não recarrega (perderia a posição) se o admin subiu no histórico paginado
      if (chan && chan === activeChanRef.current && (atBottomRef.current || !olderLoadedRef.current)) fetchFeed(activeChanRef.current, false)
      fetchStatus()
    })
    ch.on('broadcast', { event: 'typing' }, (msg) => {
      const { name, channel: chan } = msg?.payload || {}
      if (!name || chan !== activeChanRef.current || name === meNameRef.current) return
      setTyping(prev => ({ ...prev, [name]: Date.now() + 4000 }))
    })
    ch.subscribe()
    rtRef.current = ch
    return () => { try { supabase.removeChannel(ch) } catch {}; rtRef.current = null }
  }, [access, fetchFeed, fetchStatus])

  // status (nao-lidas) — inicial + fallback 20s
  useEffect(() => {
    if (access !== 'ok') return
    fetchStatus()
    const id = setInterval(() => { if (document.visibilityState === 'visible') fetchStatus() }, 20000)
    return () => clearInterval(id)
  }, [access, fetchStatus])

  // polling FALLBACK de mensagens (15s — o realtime cobre o instantaneo)
  useEffect(() => {
    if (access !== 'ok') return
    const id = setInterval(() => { if (document.visibilityState === 'visible' && (atBottomRef.current || !olderLoadedRef.current)) fetchFeed(channel, false) }, 15000)
    return () => clearInterval(id)
  }, [access, channel, fetchFeed])

  // marca o canal ATIVO como lido + "visto geral" (dot do menu)
  useEffect(() => {
    if (access !== 'ok') return
    const latest = data.messages.length ? data.messages[data.messages.length - 1].created_at : status.byChannel[channel]
    setReads(prev => {
      if (!latest || (prev[channel] && prev[channel] >= latest)) return prev
      const next = { ...prev, [channel]: latest }
      try { localStorage.setItem('nx_net_reads', JSON.stringify(next)) } catch {}
      return next
    })
    try { if (status.latest) localStorage.setItem('nx_net_seen', status.latest) } catch {}
  }, [access, channel, data.messages, status])

  // mobile: trava o scroll do body — o chat ocupa a tela toda (sem bounce)
  useEffect(() => {
    if (!isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isMobile])

  // auto-scroll pro fim quando chegam msgs novas (se estava no fim)
  useEffect(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [data.messages])

  // conta msgs novas que chegam enquanto o admin está scrollado p/ cima
  useEffect(() => {
    const msgs = data.messages
    const lastId = msgs.length ? msgs[msgs.length - 1].id : null
    if (atBottomRef.current) setUnseenCount(0)
    else if (lastId && lastMsgIdRef.current && lastId !== lastMsgIdRef.current) setUnseenCount(c => c + 1)
    lastMsgIdRef.current = lastId
  }, [data.messages])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    atBottomRef.current = atBottom
    setShowJump(!atBottom)
    if (atBottom) setUnseenCount(0)
    // carrega histórico ao chegar perto do topo
    if (el.scrollTop < 80 && data.hasMore && !loadingOlderRef.current) loadOlder()
  }

  // carrega mensagens mais antigas (scroll infinito p/ cima) preservando a posição
  async function loadOlder() {
    if (loadingOlderRef.current || !data.hasMore) return
    const msgs = data.messages
    if (!msgs.length) return
    loadingOlderRef.current = true
    setLoadingOlder(true)
    const before = msgs[0].created_at
    const el = scrollRef.current
    const oldHeight = el ? el.scrollHeight : 0
    try {
      const res = await api(`/api/network/feed?channel=${encodeURIComponent(channel)}&before=${encodeURIComponent(before)}`)
      if (res.ok) {
        const d = await res.json()
        const older = d.messages || []
        if (older.length) {
          olderLoadedRef.current = true
          setData(prev => {
            const seen = new Set(prev.messages.map(m => m.id))
            const merged = older.filter(m => !seen.has(m.id)).concat(prev.messages)
            return { ...prev, messages: merged, hasMore: d.hasMore }
          })
          requestAnimationFrame(() => { const e2 = scrollRef.current; if (e2) e2.scrollTop = e2.scrollHeight - oldHeight })
        } else {
          setData(prev => ({ ...prev, hasMore: d.hasMore }))
        }
      }
    } catch {}
    loadingOlderRef.current = false
    setLoadingOlder(false)
  }

  function jumpToBottom() {
    const el = scrollRef.current
    atBottomRef.current = true
    setShowJump(false); setUnseenCount(0)
    if (el) el.scrollTop = el.scrollHeight
    // se paginou histórico, recarrega o rodapé mais recente
    if (olderLoadedRef.current) { olderLoadedRef.current = false; fetchFeed(channel, false) }
  }

  // avisa (throttled) que estou digitando
  function broadcastTyping() {
    const now = Date.now()
    if (now - typingSentRef.current < 2000) return
    typingSentRef.current = now
    try { rtRef.current?.send({ type: 'broadcast', event: 'typing', payload: { name: data.me?.name, channel } }) } catch {}
  }

  async function send() {
    const t = text.trim()
    const rule = channelRule(channel)
    if (sending) return
    if (editing) {
      if (!t) return
      setSending(true)
      await api('/api/network/message', { method: 'POST', body: JSON.stringify({ action: 'edit', id: editing.id, text: t }) })
      setEditing(null)
    } else {
      const needsImg = rule?.requireImage && !isOwnerUser
      if (needsImg && !img) { alert('Neste canal a mensagem precisa ter uma foto.'); return }
      if (!t && !img) return
      setSending(true)
      atBottomRef.current = true
      // so envia as mencoes cujo @nome ainda esta no texto
      const activeMentions = mentions.filter(id => { const mem = (data.members || []).find(m => m.id === id); if (!mem) return false; const token = mem.name.startsWith('@') ? mem.name : '@' + mem.name; return t.includes(token) })
      const res = await api('/api/network/message', { method: 'POST', body: JSON.stringify({ action: 'send', channel, text: t, image: img, mentions: activeMentions, reply_to: replyTo?.id }) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || 'Falha ao enviar'); setSending(false); return }
      // avisa os outros em tempo real
      try { rtRef.current?.send({ type: 'broadcast', event: 'msg', payload: { channel } }) } catch {}
    }
    setText(''); setImg(null); setMentions([]); setReplyTo(null)
    await fetchFeed(channel, false)
    fetchStatus()
    setSending(false)
  }

  async function react(messageId, emoji) {
    // otimista
    setData(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id !== messageId) return m
        const rs = [...m.reactions]
        const idx = rs.findIndex(r => r.emoji === emoji)
        if (idx >= 0) {
          const r = rs[idx]
          const nc = r.count + (r.mine ? -1 : 1)
          if (nc <= 0) rs.splice(idx, 1); else rs[idx] = { ...r, count: nc, mine: !r.mine }
        } else rs.push({ emoji, count: 1, mine: true })
        return { ...m, reactions: rs }
      }),
    }))
    await api('/api/network/react', { method: 'POST', body: JSON.stringify({ message_id: messageId, emoji }) })
    fetchFeed(channel, false)
  }

  async function del(id) {
    if (!confirm('Apagar esta mensagem?')) return
    await api('/api/network/message', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) })
    fetchFeed(channel, false)
  }
  async function pin(id, pinned) {
    await api('/api/network/message', { method: 'POST', body: JSON.stringify({ action: 'pin', id, pinned }) })
    fetchFeed(channel, false)
  }

  async function openProfile(userId) {
    setProfileView({ loading: true, data: null })
    setMobilePanel(null)
    try {
      const res = await api(`/api/network/profile?user_id=${encodeURIComponent(userId)}`)
      const d = await res.json()
      setProfileView({ loading: false, data: d.profile, isMe: d.isMe })
    } catch { setProfileView({ loading: false, data: null }) }
  }

  // ── Guard states ──
  if (access === 'checking') {
    return <Shell profile={profile} user={user} tenant={tenant} sub={sub}><CenterMsg text="Carregando Network..." spin /></Shell>
  }
  if (access === 'denied') {
    return (
      <Shell profile={profile} user={user} tenant={tenant} sub={sub}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, textAlign: 'center', padding: 30 }}>
          <div style={{ width: 60, height: 60, borderRadius: 17, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 900, color: '#F1F5F9' }}>O Network é exclusivo do PRO</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--t3)', maxWidth: 340, lineHeight: 1.5 }}>A comunidade dos admins da NexControl — troque experiência, dúvidas e oportunidades com quem também opera. Assine o PRO pra entrar.</p>
          <button onClick={() => router.push('/billing-mp?renewal=1')} className="btn btn-brand btn-lg" style={{ padding: '13px 28px', fontWeight: 800 }}>Assinar PRO e entrar</button>
        </div>
      </Shell>
    )
  }

  // So os canais conhecidos (defende contra canais antigos ainda no banco)
  const channels = (data.channels?.length ? data.channels.filter(c => CHANNEL_KEYS.has(c.key)) : NETWORK_CHANNELS.map((c, i) => ({ key: c.key, name: c.name, sort: i })))
  const activeChan = channels.find(c => c.key === channel) || channels[0]
  const rule = channelRule(channel)
  const isOwnerUser = !!data.isOwner || (user && (user.email || '').toLowerCase() === OWNER_EMAIL)
  const canVerify = user && VERIFIER_EMAILS.has((user.email || '').toLowerCase())
  const canPostHere = !(rule?.ownerOnly && !isOwnerUser)
  // canais com mensagem nova nao lida (exceto o ativo, que estou lendo)
  const unread = {}
  channels.forEach(c => { const lat = status.byChannel[c.key]; if (lat && c.key !== channel && (!reads[c.key] || reads[c.key] < lat)) unread[c.key] = true })

  return (
    <Shell profile={profile} user={user} tenant={tenant} sub={sub} bare={isMobile}>
      <div style={isMobile ? {
        display: 'flex', width: '100%', overflow: 'hidden',
        height: vpH ? vpH + 'px' : '100dvh',
        background: 'rgba(4,7,14,0.96)',
      } : {
        display: 'flex', gap: 0,
        height: 'calc(100vh - 96px)', minHeight: 480,
        borderRadius: 18, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(180deg, rgba(12,18,32,0.5), rgba(4,7,14,0.6))',
        backdropFilter: 'blur(12px)',
      }}>
        {/* ── COL 1: canais (desktop) ── */}
        {!isMobile && (
          <ChannelList channels={channels} active={channel} onSelect={setChannel} online={data.online} onlineCount={data.onlineCount} unread={unread} />
        )}

        {/* ── COL 2: chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'rgba(4,7,14,0.35)' }}>
          {/* header (mobile: left padding p/ nao colar no hamburguer do app; nome troca canal) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '11px 12px 11px 56px' : '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: isMobile ? 'rgba(8,12,22,0.6)' : 'transparent' }}>
            <button type="button" onClick={() => { if (isMobile) setMobilePanel('channels') }} disabled={!isMobile}
              style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, cursor: isMobile ? 'pointer' : 'default', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{channelEmoji(channel)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeChan?.name || 'Network'}
                  {isMobile && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2.4} strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: MINT, boxShadow: `0 0 8px ${MINT}` }} />
                  {data.onlineCount ?? data.online.length} online agora
                </p>
              </div>
            </button>
            {isMobile && (
              <button onClick={() => setMobilePanel('side')} style={iconBtn}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </button>
            )}
          </div>

          {/* pinned */}
          {data.pinned && (
            <PinnedBar msg={data.pinned} isOwner={data.isOwner} onUnpin={() => pin(data.pinned.id, false)} />
          )}

          {/* mensagens */}
          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: isMobile ? '10px 2px 6px' : '14px 4px 8px' }}>
              {loadingOlder && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--t3)' }}>
                    <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: RED, animation: 'spin 0.8s linear infinite' }} />
                    carregando…
                  </span>
                </div>
              )}
              {loading ? (
                <CenterMsg text="Carregando conversa..." spin />
              ) : data.messages.length === 0 ? (
                <EmptyChat name={activeChan?.name} />
              ) : (
                data.messages.map((m, i) => (
                  <Fragment key={m.id}>
                    {unreadBoundaryId === m.id && <UnreadDivider />}
                    <MessageRow m={m} prev={data.messages[i - 1]}
                      meId={user?.id} isOwner={data.isOwner}
                      onReact={react} onOpenProfile={openProfile}
                      onReply={() => setReplyTo({ id: m.id, name: (m.author || {}).name, text: m.text ? m.text : (m.image ? '📷 Foto' : '') })}
                      onEdit={() => { setEditing({ id: m.id, text: m.text }); setText(m.text) }}
                      onDelete={() => del(m.id)} onPin={() => pin(m.id, true)} />
                  </Fragment>
                ))
              )}
            </div>
            {showJump && (
              <button onClick={jumpToBottom} title="Ir para o fim" style={{
                position: 'absolute', bottom: 14, right: 16, width: 42, height: 42, borderRadius: '50%',
                background: '#0d1220', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.55)', zIndex: 5,
              }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth={2} strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                {unseenCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: RED, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0d1220' }}>{unseenCount > 9 ? '9+' : unseenCount}</span>
                )}
              </button>
            )}
          </div>

          {/* linha de "digitando" */}
          {Object.keys(typing).length > 0 && (
            <div style={{ padding: '4px 16px 2px', fontSize: 11.5, color: 'var(--t3)', fontStyle: 'italic', flexShrink: 0 }}>
              {Object.keys(typing).length === 1 ? `${Object.keys(typing)[0]} está digitando…` : 'Várias pessoas estão digitando…'}
            </div>
          )}
          {/* barra de resposta */}
          {replyTo && canPostHere && !data.me?.mute?.muted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 8px 14px', margin: '0 12px', borderLeft: `3px solid ${RED}`, background: 'rgba(229,57,53,0.06)', borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#ff8a8a' }}>Respondendo a {replyTo.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.text}</div>
              </div>
              <button onClick={() => setReplyTo(null)} title="Cancelar resposta" style={{ ...iconBtn, width: 26, height: 26 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          )}

          {/* composer */}
          <Composer
            text={text} setText={setText} onSend={send} sending={sending}
            img={img} setImg={setImg} rule={rule} canPost={canPostHere} isOwner={isOwnerUser}
            members={data.members || []} mentions={mentions} setMentions={setMentions} muted={data.me?.mute}
            editing={editing} cancelEdit={() => { setEditing(null); setText('') }}
            onTyping={broadcastTyping}
          />
        </div>

        {/* ── COL 3: perfil/ranking (desktop) ── */}
        {!isMobile && (
          <RightPanel data={data} onOpenProfile={openProfile} meId={user?.id}
            onShowMembers={() => setShowMembers(true)} onShowModLog={() => setShowModLog(true)} />
        )}
      </div>

      {/* ── Mobile drawers ── */}
      <AnimatePresence>
        {isMobile && mobilePanel === 'channels' && (
          <MobileSheet onClose={() => setMobilePanel(null)} side="left" title="Canais">
            <ChannelList channels={channels} active={channel} online={data.online} onlineCount={data.onlineCount} unread={unread}
              onSelect={(k) => { setChannel(k); setMobilePanel(null) }} embedded />
          </MobileSheet>
        )}
        {isMobile && mobilePanel === 'side' && (
          <MobileSheet onClose={() => setMobilePanel(null)} side="right" title="Comunidade">
            <RightPanel data={data} onOpenProfile={openProfile} meId={user?.id} embedded
              onShowMembers={() => { setMobilePanel(null); setShowMembers(true) }}
              onShowModLog={() => { setMobilePanel(null); setShowModLog(true) }} />
          </MobileSheet>
        )}
      </AnimatePresence>

      {/* ── Perfil (drawer/bottom-sheet) ── */}
      <AnimatePresence>
        {profileView && (
          <ProfileDrawer view={profileView} isMobile={isMobile} onClose={() => setProfileView(null)}
            onSaved={() => openProfile(profileView.data?.id)} api={api}
            isOwnerUser={isOwnerUser} canVerify={canVerify}
            onModerated={() => { openProfile(profileView.data?.id); fetchFeed(channel, false) }} />
        )}
      </AnimatePresence>

      {/* ── Diretório de membros ── */}
      <AnimatePresence>
        {showMembers && (
          <Modal title={`Membros · ${(data.members || []).length}`} isMobile={isMobile} onClose={() => setShowMembers(false)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(data.members || []).length === 0 && <p style={{ fontSize: 12, color: 'var(--t4)', padding: '10px 4px' }}>Nenhum membro ainda.</p>}
              {(data.members || []).map(mm => (
                <button key={mm.id} onClick={() => { setShowMembers(false); openProfile(mm.id) }} style={rowBtn}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Avatar name={mm.name} color={mm.color} src={mm.avatar} size={30} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mm.name}</span>
                </button>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Log de moderação (owner) ── */}
      <AnimatePresence>
        {showModLog && (
          <ModLogModal isMobile={isMobile} api={api} onClose={() => setShowModLog(false)} />
        )}
      </AnimatePresence>
    </Shell>
  )
}

// ═══════════════ Shell (AppLayout + título) ═══════════════
// bare=true (mobile): sem título/padding — o chat ocupa a tela toda (estilo WhatsApp).
function Shell({ children, profile, user, tenant, sub, bare }) {
  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'}
      tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      {bare ? children : (
        <div style={{ padding: '18px 20px 20px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(229,57,53,0.2), rgba(229,57,53,0.05))', border: '1px solid rgba(229,57,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.03em' }}>Network</h1>
              <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--t3)' }}>Comunidade dos admins da NexControl</p>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#ff7a7a', padding: '3px 8px', borderRadius: 5, background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.3)' }}>BETA</span>
          </div>
          {children}
        </div>
      )}
    </AppLayout>
  )
}

// ═══════════════ Lista de canais ═══════════════
function ChannelList({ channels, active, onSelect, online = [], onlineCount, embedded, unread = {} }) {
  return (
    <div style={{ width: embedded ? '100%' : 216, flexShrink: 0, borderRight: embedded ? 'none' : '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: embedded ? 'transparent' : 'rgba(4,7,14,0.4)' }}>
      {!embedded && <div style={{ padding: '15px 16px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--t4)', textTransform: 'uppercase' }}>Canais</div>}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {channels.map(c => {
          const on = c.key === active
          return (
            <button key={c.key} onClick={() => onSelect(c.key)} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9,
              background: on ? 'rgba(229,57,53,0.12)' : 'transparent',
              border: on ? '1px solid rgba(229,57,53,0.28)' : '1px solid transparent',
              cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.14s',
            }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{channelEmoji(c.key)}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: (on || unread[c.key]) ? 700 : 500, color: (on || unread[c.key]) ? '#F1F5F9' : 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              {unread[c.key] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED, flexShrink: 0, boxShadow: `0 0 8px ${RED}` }} />}
            </button>
          )
        })}
      </div>
      {!embedded && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: MINT, boxShadow: `0 0 8px ${MINT}` }} />
          <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{onlineCount ?? online.length} online</span>
        </div>
      )}
    </div>
  )
}

// ═══════════════ Barra fixada ═══════════════
function PinnedBar({ msg, isOwner, onUnpin }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', background: 'rgba(229,57,53,0.06)', borderBottom: '1px solid rgba(229,57,53,0.18)', flexShrink: 0 }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" /></svg>
      <p style={{ margin: 0, flex: 1, fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <strong style={{ color: '#ff8a8a', fontWeight: 700 }}>Fixado:</strong> {msg.text}
      </p>
      {isOwner && <button onClick={onUnpin} style={{ ...iconBtn, width: 24, height: 24 }} title="Desafixar">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>}
    </div>
  )
}

// ═══════════════ Mensagem (bolha estilo WhatsApp) ═══════════════
function TagPill({ tag }) {
  const owner = tag === 'OWNER'
  return <Badge label={tag} tone={owner ? 'red' : 'gold'} small />
}
function MessageRow({ m, prev, meId, isOwner, onReact, onOpenProfile, onReply, onEdit, onDelete, onPin }) {
  const [hover, setHover] = useState(false)
  const [picker, setPicker] = useState(false)
  const a = m.author || {}
  const mine = m.mine
  const system = a.system
  const grouped = prev && prev.author?.id === a.id && !prev.author?.system && prev.mine === mine && (new Date(m.created_at) - new Date(prev.created_at) < 5 * 60000)

  if (system) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 16px', margin: '4px 0' }}>
        <span style={{ fontSize: 11.5, color: 'var(--t3)', fontStyle: 'italic', background: 'rgba(255,255,255,0.04)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>{m.text}</span>
      </div>
    )
  }

  const bubbleBg = mine ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.05)'
  const bubbleBd = mine ? 'rgba(229,57,53,0.3)' : 'rgba(255,255,255,0.08)'
  const radius = mine ? '15px 15px 5px 15px' : '15px 15px 15px 5px'
  const INDENT = 38 // avatar(30) + gap(8): alinha a bolha sob o nome

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPicker(false) }}
      style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', padding: grouped ? '1px 14px' : '6px 14px 2px', position: 'relative' }}>
      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', minWidth: 0 }}>
        {/* header (avatar + nome + selos) — só dos outros e no início do grupo */}
        {!grouped && !mine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <button onClick={() => onOpenProfile(a.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}><Avatar name={a.name} color={a.color} src={a.avatar} size={30} /></button>
            <button onClick={() => onOpenProfile(a.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>{a.name}</button>
            {a.verified && <VerifiedBadge size={13} />}
            {a.founder && <VeteranoBadge small />}
            {a.tag && <TagPill tag={a.tag} />}
            {!a.tag && a.rank && <Badge label={a.rank} tone="red" small />}
          </div>
        )}
        {/* bolha (indentada sob o nome nos outros) */}
        <div style={{ paddingLeft: mine ? 0 : INDENT, width: '100%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
        <div style={{ background: bubbleBg, border: `1px solid ${bubbleBd}`, borderRadius: radius, padding: m.image ? 4 : '8px 12px', overflow: 'hidden', maxWidth: '100%' }}>
          {m.reply && (
            <div style={{ borderLeft: '3px solid #ff8a8a', background: 'rgba(255,255,255,0.05)', borderRadius: '0 7px 7px 0', padding: '4px 8px', margin: m.image ? '4px 4px 2px' : '0 0 6px', maxWidth: '100%' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#ff8a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reply.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                {m.reply.hasImage && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M21 15l-5-5L5 21" /><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>}
                {m.reply.text || (m.reply.hasImage ? 'Foto' : '')}
              </div>
            </div>
          )}
          {m.image && (
            <a href={m.image} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
              <img src={m.image} alt="" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 11, display: 'block', objectFit: 'cover' }} />
            </a>
          )}
          {m.text && (
            <div style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: m.image ? '7px 8px 3px' : 0 }}>
              {renderMentions(m.text)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 3, padding: m.image ? '0 8px 4px' : 0 }}>
            {m.edited_at && <span style={{ fontSize: 9.5, color: 'var(--t4)' }}>editado</span>}
            <span style={{ fontSize: 9.5, color: mine ? 'rgba(255,255,255,0.5)' : 'var(--t4)', fontFamily: 'var(--mono)' }}>{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        {/* reações */}
        {m.reactions.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            {m.reactions.map(r => (
              <button key={r.emoji} onClick={() => onReact(m.id, r.emoji)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                background: r.mine ? 'rgba(229,57,53,0.16)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${r.mine ? 'rgba(229,57,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: r.mine ? '#ff8a8a' : 'var(--t2)', fontWeight: 700,
              }}>{r.emoji} {r.count}</button>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* toolbar hover */}
      {hover && (
        <div style={{ position: 'absolute', top: -4, [mine ? 'left' : 'right']: 46, display: 'flex', gap: 2, background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, boxShadow: '0 6px 18px rgba(0,0,0,0.5)', zIndex: 6 }}>
          <button onClick={() => setPicker(p => !p)} style={miniBtn} title="Reagir">😀</button>
          <button onClick={onReply} style={miniBtn} title="Responder">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
          </button>
          {m.mine && m.text && <button onClick={onEdit} style={miniBtn} title="Editar">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>}
          {isOwner && <button onClick={onPin} style={miniBtn} title="Fixar">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" /></svg>
          </button>}
          {(m.mine || isOwner) && <button onClick={onDelete} style={{ ...miniBtn, color: '#ff6b6b' }} title="Apagar">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>}
        </div>
      )}
      {picker && (
        <div style={{ position: 'absolute', top: 26, [mine ? 'left' : 'right']: 46, display: 'flex', gap: 3, background: '#0d1220', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 5, boxShadow: '0 8px 22px rgba(0,0,0,0.55)', zIndex: 7 }}>
          {REACTIONS.map(e => <button key={e} onClick={() => { onReact(m.id, e); setPicker(false) }} style={{ ...miniBtn, fontSize: 17 }}>{e}</button>)}
        </div>
      )}
    </div>
  )
}

// ═══════════════ Composer ═══════════════
function Composer({ text, setText, onSend, sending, img, setImg, rule, canPost, isOwner, members = [], mentions, setMentions, muted, editing, cancelEdit, onTyping }) {
  const requireImg = rule?.requireImage && !isOwner
  const fileRef = useRef(null)
  const taRef = useRef(null)
  const [imgBusy, setImgBusy] = useState(false)
  const [mq, setMq] = useState(null) // query da @mencao (ou null)
  const MENTION_RE = /(^|\s)@([\p{L}\p{N}_]{0,24})$/u
  const mentionList = mq === null ? [] : members.filter(m => m.name.toLowerCase().replace(/\s/g, '').includes(mq)).slice(0, 6)
  function onKey(e) {
    if (mq !== null && mentionList.length) { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickMention(mentionList[0]); return } if (e.key === 'Escape') { setMq(null); return } }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }
  function onChange(e) {
    const val = e.target.value; setText(val)
    if (val.trim()) onTyping?.()
    const pos = e.target.selectionStart || val.length
    const mm = MENTION_RE.exec(val.slice(0, pos))
    setMq(mm ? mm[2].toLowerCase() : null)
  }
  function pickMention(mem) {
    const ta = taRef.current
    const pos = ta ? ta.selectionStart : text.length
    const before = text.slice(0, pos), after = text.slice(pos)
    const token = mem.name.startsWith('@') ? mem.name : '@' + mem.name
    const nb = before.replace(MENTION_RE, (m, p1) => `${p1}${token} `)
    setText(nb + after); setMq(null)
    setMentions(ids => ids.includes(mem.id) ? ids : [...ids, mem.id])
    setTimeout(() => taRef.current?.focus(), 0)
  }
  async function onFile(e) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { alert('Envie uma imagem JPG, PNG ou WEBP.'); return }
    setImgBusy(true)
    try { setImg(await compressImage(file)) } catch { alert('Não consegui processar a imagem.') }
    setImgBusy(false)
  }

  // Silenciado (castigo de fala): read-only com motivo/prazo
  if (muted?.muted) {
    const untilStr = muted.permanent ? 'permanentemente' : ('até ' + new Date(muted.until).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))
    return (
      <div style={{ padding: '14px 16px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(229,57,53,0.25)', flexShrink: 0, background: 'rgba(229,57,53,0.07)', display: 'flex', alignItems: 'center', gap: 10, color: '#ff9a9a', fontSize: 12.5, lineHeight: 1.4 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M18.36 6.64A9 9 0 0 1 20.77 15" /><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
        <div>Você está silenciado {untilStr}.{muted.reason ? <><br /><span style={{ color: 'var(--t3)' }}>Motivo: {muted.reason}</span></> : null}</div>
      </div>
    )
  }

  // Avisos (só owner): quem não pode postar vê aviso read-only
  if (!canPost) {
    return (
      <div style={{ padding: '16px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--t3)', fontSize: 12.5 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        Somente o admin master pode enviar avisos.
      </div>
    )
  }

  const canSend = !sending && (requireImg ? !!img : (!!text.trim() || !!img))
  return (
    <div style={{ padding: '12px 14px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      {editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 11, color: 'var(--t3)' }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          Editando mensagem
          <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>cancelar</button>
        </div>
      )}
      {/* preview da foto */}
      {img && (
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: 8 }}>
          <img src={img} alt="" style={{ height: 76, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', display: 'block' }} />
          <button onClick={() => setImg(null)} style={{ position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: '#0d1220', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}
      {requireImg && !img && (
        <div style={{ fontSize: 11, color: '#ff9e6b', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15l-5-5L5 21" /><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>
          Neste canal a foto é obrigatória — anexe uma imagem.
        </div>
      )}
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
        {/* anexar foto */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current?.click()} disabled={imgBusy} title="Anexar foto" style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
          background: img ? 'rgba(229,57,53,0.14)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${img ? 'rgba(229,57,53,0.3)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {imgBusy
            ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: RED, animation: 'nx-spin 0.8s linear infinite' }} />
            : <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={img ? '#ff8a8a' : 'var(--t3)'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15l-5-5L5 21" /><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>}
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          {/* dropdown de @mencao */}
          {mentionList.length > 0 && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, background: '#0d1220', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.55)', zIndex: 8, maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--t4)', textTransform: 'uppercase', padding: '4px 8px 6px' }}>Mencionar</div>
              {mentionList.map(m => (
                <button key={m.id} onMouseDown={e => { e.preventDefault(); pickMention(m) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Avatar name={m.name} color={m.color} src={m.avatar} size={26} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{m.name}</span>
                </button>
              ))}
            </div>
          )}
          <textarea ref={taRef} value={text} onChange={onChange} onKeyDown={onKey}
            rows={1} placeholder={requireImg ? 'Legenda da foto (opcional)...' : 'Escreva uma mensagem... use @ para mencionar'}
            style={{
              width: '100%', resize: 'none', maxHeight: 120, minHeight: 44, padding: '12px 14px',
              borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--t1)', fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.5, outline: 'none',
            }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
          />
        </div>
        <button onClick={onSend} disabled={!canSend} style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0, border: 'none',
          background: canSend ? RED : 'rgba(255,255,255,0.08)',
          cursor: canSend ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
          boxShadow: canSend ? '0 4px 16px rgba(229,57,53,0.4)' : 'none',
        }}>
          <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={canSend ? '#fff' : 'var(--t4)'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  )
}

// ═══════════════ Painel direito ═══════════════
function RightPanel({ data, onOpenProfile, meId, embedded, onShowMembers, onShowModLog }) {
  return (
    <div style={{ width: embedded ? '100%' : 280, flexShrink: 0, borderLeft: embedded ? 'none' : '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: embedded ? 'transparent' : 'rgba(4,7,14,0.4)', padding: '16px 14px' }}>
      {/* meu perfil */}
      {data.me && (
        <button onClick={() => onOpenProfile(meId)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', marginBottom: 16,
          borderRadius: 12, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.22)', cursor: 'pointer', textAlign: 'left',
        }}>
          <Avatar name={data.me.name} color={data.me.color} src={data.me.avatar} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 8.5, fontWeight: 800, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Meu perfil público</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.me.name}</p>
          </div>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}

      {/* online */}
      <SectionTitle icon="online" label={`Online agora · ${data.onlineCount ?? data.online.length}`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 }}>
        {data.online.length === 0 && <p style={{ fontSize: 11.5, color: 'var(--t4)', padding: '6px 4px' }}>Ninguém online agora.</p>}
        {data.online.map(o => (
          <button key={o.id} onClick={() => onOpenProfile(o.id)} style={rowBtn}>
            <Avatar name={o.name} color={o.color} src={o.avatar} size={28} online />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}{o.you ? ' (você)' : ''}</span>
          </button>
        ))}
      </div>

      {/* ranking */}
      <SectionTitle icon="trophy" label="Top 10 Network" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.top.length === 0 && <p style={{ fontSize: 11.5, color: 'var(--t4)', padding: '6px 4px' }}>Sem atividade ainda.</p>}
        {data.top.map((t, i) => (
          <button key={t.id} onClick={() => onOpenProfile(t.id)} style={rowBtn}>
            <span style={{ width: 20, textAlign: 'center', fontSize: 11, fontWeight: 800, fontFamily: 'var(--mono)', color: i === 0 ? '#ffd24a' : i === 1 ? '#cbd5e1' : i === 2 ? '#e08a5b' : 'var(--t4)' }}>{i + 1}</span>
            <Avatar name={t.name} color={t.color} src={t.avatar} size={26} />
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{t.name}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ff8a8a', fontFamily: 'var(--mono)' }}>{t.score}</span>
          </button>
        ))}
      </div>

      {/* ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onShowMembers} style={panelBtn}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          Ver todos os membros
        </button>
        {data.isOwner && (
          <button onClick={onShowModLog} style={panelBtn}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Log de moderação
          </button>
        )}
      </div>
    </div>
  )
}
function SectionTitle({ label }) {
  return <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>{label}</div>
}

// ═══════════════ Perfil (drawer) ═══════════════
function ProfileDrawer({ view, isMobile, onClose, onSaved, api, isOwnerUser, canVerify, onModerated }) {
  const p = view.data
  const [bio, setBio] = useState(p?.bio || '')
  const [insta, setInsta] = useState(p?.instagram || '')
  const [tagInput, setTagInput] = useState(p?.tag || '')
  const [muteReason, setMuteReason] = useState('')
  const [avatarData, setAvatarData] = useState(undefined) // undefined=inalterado | null=remover | dataURL=nova
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modBusy, setModBusy] = useState(false)
  const [edit, setEdit] = useState(false)
  const avatarRef = useRef(null)
  useEffect(() => { setBio(p?.bio || ''); setInsta(p?.instagram || ''); setTagInput(p?.tag || ''); setAvatarData(undefined) }, [p])

  async function onAvatarFile(e) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { alert('Envie uma imagem JPG, PNG ou WEBP.'); return }
    setAvatarBusy(true)
    try { setAvatarData(await compressImage(file, 512, 0.85)) } catch { alert('Não consegui processar a imagem.') }
    setAvatarBusy(false)
  }
  async function save() {
    setSaving(true)
    const payload = { bio, instagram: insta }
    if (avatarData !== undefined) payload.avatar = avatarData // dataURL ou null
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify(payload) })
    setSaving(false); setEdit(false); setAvatarData(undefined); onSaved && onSaved()
  }
  // foto mostrada no editor: nova > atual > (removida->inicial)
  const editAvatar = avatarData === null ? null : (avatarData || p?.avatar || null)
  const isOwnerTarget = (p?.tag === 'OWNER')
  async function setVerified(v) {
    setModBusy(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ action: 'set-verified', target_user_id: p.id, verified: v }) })
    setModBusy(false); onModerated && onModerated()
  }
  async function saveTag() {
    setModBusy(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ action: 'set-tag', target_user_id: p.id, tag: tagInput.trim() }) })
    setModBusy(false); onModerated && onModerated()
  }
  async function doMute(opts) {
    setModBusy(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ action: 'mute', target_user_id: p.id, reason: muteReason.trim() || undefined, ...opts }) })
    setModBusy(false); setMuteReason(''); onModerated && onModerated()
  }
  async function doUnmute() {
    setModBusy(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ action: 'unmute', target_user_id: p.id }) })
    setModBusy(false); onModerated && onModerated()
  }
  async function doBan() {
    if (!confirm('Remover este usuário do Network? Ele perde o acesso à comunidade.')) return
    setModBusy(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ action: 'ban', target_user_id: p.id }) })
    setModBusy(false); onModerated && onModerated()
  }
  async function doUnban() {
    setModBusy(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ action: 'unban', target_user_id: p.id }) })
    setModBusy(false); onModerated && onModerated()
  }

  const panel = (
    <motion.div
      initial={isMobile ? { y: '100%' } : { x: '100%' }} animate={isMobile ? { y: 0 } : { x: 0 }} exit={isMobile ? { y: '100%' } : { x: '100%' }}
      transition={{ duration: 0.3, ease }}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', zIndex: 10001,
        ...(isMobile
          ? { left: 0, right: 0, bottom: 0, maxHeight: '86vh', borderRadius: '20px 20px 0 0' }
          : { top: 0, bottom: 0, right: 0, width: 380 }),
        background: 'linear-gradient(180deg, #0d1424, #060a12)',
        borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)', overflowY: 'auto',
      }}>
      {view.loading || !p ? (
        <div style={{ padding: 40 }}><CenterMsg text={view.loading ? 'Carregando perfil...' : 'Perfil indisponível.'} spin={view.loading} /></div>
      ) : (
        <div style={{ padding: '22px 22px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <button onClick={onClose} style={iconBtn}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 18 }}>
            <Avatar name={p.name} color={p.color} src={p.avatar} size={78} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{p.name}</h2>
              {p.verified && <VerifiedBadge size={20} />}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 7 }}>
              {p.founder && <VeteranoBadge />}
              {p.tag && <TagPill tag={p.tag} />}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {p.badges.filter(b => b.key !== 'verificado' && b.key !== 'pioneiro').map(b => <Badge key={b.key} label={b.label} tone={b.tone} />)}
            </div>
            {p.instagram && <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer" style={{ marginTop: 10, fontSize: 12, color: '#ff8a8a', textDecoration: 'none', fontWeight: 600 }}>@{p.instagram}</a>}
            {p.bio && <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5, maxWidth: 300 }}>{p.bio}</p>}
          </div>

          {/* stats grid (sem metas fechadas / redes — dados operacionais nao expostos) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <Stat label="Rank" value={p.rank} accent />
            <Stat label="Operadores" value={fmtNum(p.operadores)} />
            <Stat label="Depositantes" value={fmtNum(p.depositantes)} />
            <Stat label="Network score" value={fmtNum(p.networkScore)} accent />
          </div>
          <p style={{ fontSize: 11, color: 'var(--t4)', textAlign: 'center', marginTop: 4 }}>Na NexControl desde <strong style={{ color: 'var(--t2)' }}>{fmtSince(p.since)}</strong></p>

          {/* moderação (owner define tag; owner/darkzin dão verificado) — nunca no owner */}
          {!view.isMe && !isOwnerTarget && (canVerify || isOwnerUser) && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--t4)', textTransform: 'uppercase' }}>Moderação</div>
              {canVerify && (
                <button onClick={() => setVerified(!p.verified)} disabled={modBusy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: `1px solid ${p.verified ? 'rgba(255,107,107,0.35)' : 'rgba(56,151,240,0.4)'}`, background: p.verified ? 'rgba(255,107,107,0.1)' : 'rgba(56,151,240,0.12)', color: p.verified ? '#ff8a8a' : '#5aa9f5' }}>
                  {!p.verified && <VerifiedBadge size={15} />}
                  {p.verified ? 'Remover verificado' : 'Dar verificado'}
                </button>
              )}
              {isOwnerUser && (
                <div>
                  <label style={lbl}>Tag do usuário (aparece no chat)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={tagInput} onChange={e => setTagInput(e.target.value.slice(0, 24))} placeholder="ex: MENTOR, VIP, PARCEIRO" style={inp} />
                    <button onClick={saveTag} disabled={modBusy} style={{ padding: '0 16px', borderRadius: 9, border: 'none', background: RED, color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', flexShrink: 0 }}>Salvar</button>
                  </div>
                  {p.tag && <button onClick={() => { setTagInput(''); saveTag() }} disabled={modBusy} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 11, cursor: 'pointer' }}>remover tag</button>}
                </div>
              )}
              {isOwnerUser && (
                <div>
                  <label style={lbl}>Silenciar (castigo de fala)</label>
                  {p.mute?.muted ? (
                    <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.25)' }}>
                      <div style={{ fontSize: 12, color: '#ff9a9a', fontWeight: 700 }}>
                        Silenciado {p.mute.permanent ? 'permanentemente' : ('até ' + new Date(p.mute.until).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))}
                      </div>
                      {p.mute.reason && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Motivo: {p.mute.reason}</div>}
                      <button onClick={doUnmute} disabled={modBusy} style={{ marginTop: 8, padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'var(--t1)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Remover silêncio</button>
                    </div>
                  ) : (
                    <>
                      <input value={muteReason} onChange={e => setMuteReason(e.target.value.slice(0, 120))} placeholder="Motivo (spam, divulgação, regras...)" style={{ ...inp, marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {[{ l: '1h', m: 60 }, { l: '6h', m: 360 }, { l: '24h', m: 1440 }, { l: '7 dias', m: 10080 }].map(d => (
                          <button key={d.l} onClick={() => doMute({ minutes: d.m })} disabled={modBusy} style={muteBtn}>{d.l}</button>
                        ))}
                        <button onClick={() => doMute({ permanent: true })} disabled={modBusy} style={{ ...muteBtn, borderColor: 'rgba(229,57,53,0.4)', color: '#ff8a8a' }}>Permanente</button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {isOwnerUser && (
                <div>
                  <label style={lbl}>Acesso ao Network</label>
                  {p.banned && <div style={{ fontSize: 12, color: '#ff9a9a', fontWeight: 700, marginBottom: 8 }}>Este usuário está banido do Network.</div>}
                  <button onClick={p.banned ? doUnban : doBan} disabled={modBusy} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    border: p.banned ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(229,57,53,0.4)',
                    background: p.banned ? 'rgba(34,197,94,0.1)' : 'rgba(229,57,53,0.1)',
                    color: p.banned ? '#4ade80' : '#ff6b6b',
                  }}>
                    {p.banned ? (
                      <>
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                        Readmitir no Network
                      </>
                    ) : (
                      <>
                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                        Remover do Network
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* editar (so o proprio) */}
          {view.isMe && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {!edit ? (
                <button onClick={() => setEdit(true)} className="btn" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--t1)', fontWeight: 700, padding: '11px', borderRadius: 10, fontSize: 13 }}>Editar meu perfil</button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Foto de perfil */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={p.name} color={p.color} src={editAvatar} size={56} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatarFile} style={{ display: 'none' }} />
                      <button onClick={() => avatarRef.current?.click()} disabled={avatarBusy} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: 'var(--t1)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>{avatarBusy ? 'Processando...' : (editAvatar ? 'Trocar foto' : 'Adicionar foto')}</button>
                      {editAvatar && <button onClick={() => setAvatarData(null)} style={{ padding: '8px 12px', borderRadius: 9, border: 'none', background: 'none', color: '#ff8a8a', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Remover</button>}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 240))} rows={2} placeholder="Uma linha sobre você e sua operação" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Instagram</label>
                    <input value={insta} onChange={e => setInsta(e.target.value.replace(/^@/, ''))} placeholder="seu_usuario" style={inp} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: RED, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
                    <button onClick={() => setEdit(false)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--t3)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} />
      {panel}
    </>
  )
}
function Stat({ label, value, accent }) {
  return (
    <div style={{ padding: '11px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: accent ? '#ff8a8a' : '#F1F5F9', fontFamily: 'var(--mono)', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  )
}

// ═══════════════ Mobile sheet ═══════════════
function MobileSheet({ children, onClose, side, title }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)' }} />
      <motion.div initial={{ x: side === 'left' ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: side === 'left' ? '-100%' : '100%' }}
        transition={{ duration: 0.26, ease }}
        style={{ position: 'fixed', top: 0, bottom: 0, [side]: 0, width: 280, maxWidth: '85vw', zIndex: 9999, background: 'linear-gradient(180deg, #0b1120, #060a12)', borderRight: side === 'left' ? '1px solid rgba(255,255,255,0.1)' : 'none', borderLeft: side === 'right' ? '1px solid rgba(255,255,255,0.1)' : 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9' }}>{title}</span>
          <button onClick={onClose} style={iconBtn}><svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </motion.div>
    </>
  )
}

// ═══════════════ Helpers de estado ═══════════════
function CenterMsg({ title, text, spin, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 240, textAlign: 'center', padding: 30, color: 'var(--t3)' }}>
      {spin ? (
        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.1)', borderTopColor: RED, animation: 'nx-spin 0.8s linear infinite', marginBottom: 14 }} />
      ) : icon === 'lock' ? (
        <div style={{ width: 54, height: 54, borderRadius: 15, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
      ) : null}
      {title && <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#F1F5F9' }}>{title}</p>}
      <p style={{ margin: 0, fontSize: 13, maxWidth: 300, lineHeight: 1.5 }}>{text}</p>
      <style jsx global>{`@keyframes nx-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
function EmptyChat({ name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 240, textAlign: 'center', padding: 30 }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={1.8} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </div>
      <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>Comece a conversa</p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.5 }}>Seja o primeiro a mandar uma mensagem em <strong>{name}</strong>. Troque experiências com outros admins.</p>
    </div>
  )
}

// ═══════════════ Divisor "mensagens novas" ═══════════════
function UnreadDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 18px', margin: '2px 0' }}>
      <span style={{ flex: 1, height: 1, background: 'rgba(229,57,53,0.35)' }} />
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', color: '#ff8a8a', textTransform: 'uppercase' }}>Mensagens novas</span>
      <span style={{ flex: 1, height: 1, background: 'rgba(229,57,53,0.35)' }} />
    </div>
  )
}

// ═══════════════ Modal genérico (centro no desktop / bottom-sheet no mobile) ═══════════════
function Modal({ title, onClose, isMobile, children }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} />
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96 }} animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }} exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.26, ease }} onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', zIndex: 10001, display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #0d1424, #060a12)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          ...(isMobile
            ? { left: 0, right: 0, bottom: 0, maxHeight: '80vh', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.1)' }
            : { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 420, maxWidth: '92vw', maxHeight: '80vh', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }),
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>{title}</span>
          <button onClick={onClose} style={iconBtn}><svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 18px' }}>{children}</div>
      </motion.div>
    </>
  )
}

// ═══════════════ Log de moderação (owner) ═══════════════
function ModLogModal({ isMobile, api, onClose }) {
  const [state, setState] = useState({ loading: true, log: [] })
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api('/api/network/mod-log')
        if (!alive) return
        if (res.ok) { const d = await res.json(); setState({ loading: false, log: d.log || [] }) }
        else setState({ loading: false, log: [] })
      } catch { if (alive) setState({ loading: false, log: [] }) }
    })()
    return () => { alive = false }
  }, [api])
  const actionLabel = a => ({ mute: 'Silenciou', unmute: 'Removeu silêncio', ban: 'Baniu', unban: 'Readmitiu', 'set-tag': 'Definiu tag', 'set-verified': 'Alterou verificado' }[a] || a)
  return (
    <Modal title="Log de moderação" isMobile={isMobile} onClose={onClose}>
      {state.loading ? (
        <CenterMsg text="Carregando log..." spin />
      ) : state.log.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--t4)', textAlign: 'center', padding: '20px 4px' }}>Nenhuma ação de moderação registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.log.map((r, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#F1F5F9' }}>
                  <span style={{ color: '#ff8a8a' }}>{actionLabel(r.action)}</span> {r.target_name || '—'}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--t4)', flexShrink: 0 }}>{fmtRel(r.created_at)}</span>
              </div>
              {r.reason && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 3 }}>Motivo: {r.reason}</div>}
              <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 3 }}>por {r.actor_name || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ═══════════════ estilos compartilhados ═══════════════
const iconBtn = { width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const miniBtn = { width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }
const rowBtn = { display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }
const panelBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--t2)', cursor: 'pointer', width: '100%', fontSize: 12.5, fontWeight: 700 }
const lbl = { display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', marginBottom: 4, letterSpacing: '0.04em' }
const muteBtn = { padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'var(--t1)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }
const inp = { width: '100%', padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--t1)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none' }
