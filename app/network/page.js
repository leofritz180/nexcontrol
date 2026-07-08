'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { networkEnabled, NETWORK_CHANNELS, channelRule, VERIFIER_EMAILS, OWNER_EMAIL } from '../../lib/network-access'

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
function Avatar({ name, color, size = 38, online }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 800, color: '#fff',
        boxShadow: `0 2px 10px ${color}44`, border: '1px solid rgba(255,255,255,0.14)',
      }}>{initial}</div>
      {online && <span style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: MINT, border: '2px solid #0a0a0a' }} />}
    </div>
  )
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

export default function NetworkPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [access, setAccess] = useState('checking') // checking | ok | denied

  const [channel, setChannel] = useState('geral')
  const [data, setData] = useState({ channels: [], messages: [], pinned: null, online: [], top: [], me: null, isOwner: false })
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [img, setImg] = useState(null) // data URL da foto anexada
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(null) // {id, text}
  const [profileView, setProfileView] = useState(null) // {loading, data}
  const [mobilePanel, setMobilePanel] = useState(null) // 'channels' | 'side' | null

  const scrollRef = useRef(null)
  const tokenRef = useRef(null)
  const atBottomRef = useRef(true)

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
      const allowed = networkEnabled(u.email) && (p.role === 'admin' || u.email === 'leofritz180@gmail.com')
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

  // primeiro load + troca de canal
  useEffect(() => {
    if (access !== 'ok') return
    fetchFeed(channel, true)
  }, [access, channel, fetchFeed])

  // polling 5s (so quando aba visivel)
  useEffect(() => {
    if (access !== 'ok') return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchFeed(channel, false)
    }, 5000)
    return () => clearInterval(id)
  }, [access, channel, fetchFeed])

  // auto-scroll pro fim quando chegam msgs novas (se estava no fim)
  useEffect(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [data.messages])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
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
      if (rule?.requireImage && !img) { alert('Neste canal a mensagem precisa ter uma foto.'); return }
      if (!t && !img) return
      setSending(true)
      atBottomRef.current = true
      const res = await api('/api/network/message', { method: 'POST', body: JSON.stringify({ action: 'send', channel, text: t, image: img }) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || 'Falha ao enviar'); setSending(false); return }
    }
    setText(''); setImg(null)
    await fetchFeed(channel, false)
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
        <CenterMsg
          title="Network em breve"
          text="O Network está em rollout controlado e ainda não foi liberado para a sua conta."
          icon="lock"
        />
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

  return (
    <Shell profile={profile} user={user} tenant={tenant} sub={sub}>
      <div style={{
        display: 'flex', gap: 0,
        height: 'calc(100vh - 96px)', minHeight: 480,
        borderRadius: 18, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(180deg, rgba(12,18,32,0.5), rgba(4,7,14,0.6))',
        backdropFilter: 'blur(12px)',
      }}>
        {/* ── COL 1: canais (desktop) ── */}
        {!isMobile && (
          <ChannelList channels={channels} active={channel} onSelect={setChannel} online={data.online} />
        )}

        {/* ── COL 2: chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'rgba(4,7,14,0.35)' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setMobilePanel('channels')} style={iconBtn}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            )}
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{channelEmoji(channel)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>{activeChan?.name || 'Network'}</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: MINT, boxShadow: `0 0 8px ${MINT}` }} />
                {data.online.length} online agora
              </p>
            </div>
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
          <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: '14px 4px 8px' }}>
            {loading ? (
              <CenterMsg text="Carregando conversa..." spin />
            ) : data.messages.length === 0 ? (
              <EmptyChat name={activeChan?.name} />
            ) : (
              data.messages.map((m, i) => (
                <MessageRow key={m.id} m={m} prev={data.messages[i - 1]}
                  meId={user?.id} isOwner={data.isOwner}
                  onReact={react} onOpenProfile={openProfile}
                  onEdit={() => { setEditing({ id: m.id, text: m.text }); setText(m.text) }}
                  onDelete={() => del(m.id)} onPin={() => pin(m.id, true)} />
              ))
            )}
          </div>

          {/* composer */}
          <Composer
            text={text} setText={setText} onSend={send} sending={sending}
            img={img} setImg={setImg} rule={rule} canPost={canPostHere}
            editing={editing} cancelEdit={() => { setEditing(null); setText('') }}
          />
        </div>

        {/* ── COL 3: perfil/ranking (desktop) ── */}
        {!isMobile && (
          <RightPanel data={data} onOpenProfile={openProfile} meId={user?.id} />
        )}
      </div>

      {/* ── Mobile drawers ── */}
      <AnimatePresence>
        {isMobile && mobilePanel === 'channels' && (
          <MobileSheet onClose={() => setMobilePanel(null)} side="left" title="Canais">
            <ChannelList channels={channels} active={channel} online={data.online}
              onSelect={(k) => { setChannel(k); setMobilePanel(null) }} embedded />
          </MobileSheet>
        )}
        {isMobile && mobilePanel === 'side' && (
          <MobileSheet onClose={() => setMobilePanel(null)} side="right" title="Comunidade">
            <RightPanel data={data} onOpenProfile={openProfile} meId={user?.id} embedded />
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
    </Shell>
  )
}

// ═══════════════ Shell (AppLayout + título) ═══════════════
function Shell({ children, profile, user, tenant, sub }) {
  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'}
      tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
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
    </AppLayout>
  )
}

// ═══════════════ Lista de canais ═══════════════
function ChannelList({ channels, active, onSelect, online = [], embedded }) {
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
              <span style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? '#F1F5F9' : 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </button>
          )
        })}
      </div>
      {!embedded && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: MINT, boxShadow: `0 0 8px ${MINT}` }} />
          <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{online.length} online</span>
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
function MessageRow({ m, prev, meId, isOwner, onReact, onOpenProfile, onEdit, onDelete, onPin }) {
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

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPicker(false) }}
      style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 9, padding: grouped ? '1px 14px' : '5px 14px 2px', position: 'relative' }}>
      {/* avatar (só dos outros) */}
      {!mine && (
        <div style={{ width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          {!grouped && <button onClick={() => onOpenProfile(a.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><Avatar name={a.name} color={a.color} size={34} /></button>}
        </div>
      )}
      <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', minWidth: 0 }}>
        {/* header (nome/tag/verificado) — só dos outros e no início do grupo */}
        {!grouped && !mine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3, paddingLeft: 4 }}>
            <button onClick={() => onOpenProfile(a.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>{a.name}</button>
            {a.verified && <VerifiedBadge size={13} />}
            {a.tag && <TagPill tag={a.tag} />}
            {!a.tag && a.rank && <Badge label={a.rank} tone="red" small />}
          </div>
        )}
        {/* bolha */}
        <div style={{ background: bubbleBg, border: `1px solid ${bubbleBd}`, borderRadius: radius, padding: m.image ? 4 : '8px 12px', overflow: 'hidden' }}>
          {m.image && (
            <a href={m.image} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
              <img src={m.image} alt="" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 11, display: 'block', objectFit: 'cover' }} />
            </a>
          )}
          {m.text && (
            <div style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: m.image ? '7px 8px 3px' : 0 }}>
              {m.text}
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

      {/* toolbar hover */}
      {hover && (
        <div style={{ position: 'absolute', top: -4, [mine ? 'left' : 'right']: 46, display: 'flex', gap: 2, background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, boxShadow: '0 6px 18px rgba(0,0,0,0.5)', zIndex: 6 }}>
          <button onClick={() => setPicker(p => !p)} style={miniBtn} title="Reagir">😀</button>
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
function Composer({ text, setText, onSend, sending, img, setImg, rule, canPost, editing, cancelEdit }) {
  const fileRef = useRef(null)
  const [imgBusy, setImgBusy] = useState(false)
  function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }
  async function onFile(e) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { alert('Envie uma imagem JPG, PNG ou WEBP.'); return }
    setImgBusy(true)
    try { setImg(await compressImage(file)) } catch { alert('Não consegui processar a imagem.') }
    setImgBusy(false)
  }

  // Avisos (só owner): quem não pode postar vê aviso read-only
  if (!canPost) {
    return (
      <div style={{ padding: '16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--t3)', fontSize: 12.5 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        Somente o admin master pode enviar avisos.
      </div>
    )
  }

  const canSend = !sending && (rule?.requireImage ? !!img : (!!text.trim() || !!img))
  return (
    <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
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
      {rule?.requireImage && !img && (
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
          <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
            rows={1} placeholder={rule?.requireImage ? 'Legenda da foto (opcional)...' : 'Escreva uma mensagem para a comunidade...'}
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
function RightPanel({ data, onOpenProfile, meId, embedded }) {
  return (
    <div style={{ width: embedded ? '100%' : 280, flexShrink: 0, borderLeft: embedded ? 'none' : '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: embedded ? 'transparent' : 'rgba(4,7,14,0.4)', padding: '16px 14px' }}>
      {/* meu perfil */}
      {data.me && (
        <button onClick={() => onOpenProfile(meId)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', marginBottom: 16,
          borderRadius: 12, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.22)', cursor: 'pointer', textAlign: 'left',
        }}>
          <Avatar name={data.me.name} color={data.me.color} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 8.5, fontWeight: 800, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Meu perfil público</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.me.name}</p>
          </div>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}

      {/* online */}
      <SectionTitle icon="online" label={`Online agora · ${data.online.length}`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 }}>
        {data.online.length === 0 && <p style={{ fontSize: 11.5, color: 'var(--t4)', padding: '6px 4px' }}>Ninguém online agora.</p>}
        {data.online.map(o => (
          <button key={o.id} onClick={() => onOpenProfile(o.id)} style={rowBtn}>
            <Avatar name={o.name} color={o.color} size={28} online />
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
            <Avatar name={t.name} color={t.color} size={26} />
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{t.name}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#ff8a8a', fontFamily: 'var(--mono)' }}>{t.score}</span>
          </button>
        ))}
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
  const [saving, setSaving] = useState(false)
  const [modBusy, setModBusy] = useState(false)
  const [edit, setEdit] = useState(false)
  useEffect(() => { setBio(p?.bio || ''); setInsta(p?.instagram || ''); setTagInput(p?.tag || '') }, [p])

  async function save() {
    setSaving(true)
    await api('/api/network/profile', { method: 'POST', body: JSON.stringify({ bio, instagram: insta }) })
    setSaving(false); setEdit(false); onSaved && onSaved()
  }
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
            <Avatar name={p.name} color={p.color} size={78} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{p.name}</h2>
              {p.verified && <VerifiedBadge size={20} />}
            </div>
            {p.tag && <div style={{ marginTop: 7 }}><TagPill tag={p.tag} /></div>}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {p.badges.filter(b => b.key !== 'verificado').map(b => <Badge key={b.key} label={b.label} tone={b.tone} />)}
            </div>
            {p.instagram && <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer" style={{ marginTop: 10, fontSize: 12, color: '#ff8a8a', textDecoration: 'none', fontWeight: 600 }}>@{p.instagram}</a>}
            {p.bio && <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5, maxWidth: 300 }}>{p.bio}</p>}
          </div>

          {/* stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <Stat label="Rank" value={p.rank} accent />
            <Stat label="Operadores" value={fmtNum(p.operadores)} />
            <Stat label="Metas fechadas" value={fmtNum(p.metasFechadas)} />
            <Stat label="Depositantes" value={fmtNum(p.depositantes)} />
            <Stat label="Melhor rede" value={p.melhorRede || '—'} />
            <Stat label="Network score" value={fmtNum(p.networkScore)} accent />
          </div>
          {p.redes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionTitle label="Redes mais usadas" />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {p.redes.map(r => <span key={r} style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--t2)' }}>{r}</span>)}
              </div>
            </div>
          )}
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
            </div>
          )}

          {/* editar (so o proprio) */}
          {view.isMe && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {!edit ? (
                <button onClick={() => setEdit(true)} className="btn" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--t1)', fontWeight: 700, padding: '11px', borderRadius: 10, fontSize: 13 }}>Editar meu perfil</button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

// ═══════════════ estilos compartilhados ═══════════════
const iconBtn = { width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const miniBtn = { width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }
const rowBtn = { display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 9, background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }
const lbl = { display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', marginBottom: 4, letterSpacing: '0.04em' }
const inp = { width: '100%', padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--t1)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none' }
