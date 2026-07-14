'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const ease = [0.33, 1, 0.68, 1]

const CATEGORY_STYLE = {
  feature: { label: 'Novidade', color: 'var(--profit)', bg: 'rgba(209,250,229,0.08)', border: 'rgba(209,250,229,0.22)' },
  fix: { label: 'Correção', color: '#FCD34D', bg: 'rgba(252,211,77,0.08)', border: 'rgba(252,211,77,0.22)' },
  improvement: { label: 'Melhoria', color: '#93C5FD', bg: 'rgba(147,197,253,0.08)', border: 'rgba(147,197,253,0.22)' },
  important: { label: 'Importante', color: '#fca5a5', bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.22)' },
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return Math.floor(diff / 60) + 'min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function UpdatesBell() {
  const [userId, setUserId] = useState(null)
  const [open, setOpen] = useState(false)
  const [updates, setUpdates] = useState([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const panelRef = useRef(null)

  async function fetchUpdates(uid) {
    if (!uid) return
    try {
      const res = await fetch('/api/updates/list?user_id=' + encodeURIComponent(uid))
      const data = await res.json()
      setUpdates(data.updates || [])
      setUnread(data.unreadCount || 0)
      setLoaded(true)
    } catch {}
  }

  useEffect(() => {
    let mounted = true
    let interval
    supabase.auth.getSession().then(({ data }) => {
      const uid = data?.session?.user?.id
      if (!uid || !mounted) return
      setUserId(uid)
      fetchUpdates(uid)
      interval = setInterval(() => { if (document.visibilityState === 'visible') fetchUpdates(uid) }, 60000) // 60s, so aba visivel
    })
    return () => { mounted = false; if (interval) clearInterval(interval) }
  }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markAllRead() {
    if (!userId) return
    await fetch('/api/updates/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    setUpdates(updates.map(u => ({ ...u, read: true })))
    setUnread(0)
  }

  function openPanel() {
    setOpen(true)
    // Marca como lido apos 2s de visualizacao
    if (unread > 0) setTimeout(() => { markAllRead() }, 2000)
  }

  if (!userId || !loaded) return null

  return (
    <>
      {/* Sino flutuante — posicao fixed bottom-right (acima do FAB do tour) */}
      <motion.button
        onClick={openPanel}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        aria-label="Atualizações do sistema"
        style={{
          position: 'fixed', bottom: 22, right: 76, zIndex: 200,
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(180deg, #0f0f0f, #050505)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: unread > 0 ? '#e53935' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: unread > 0
            ? '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(229,57,53,0.15), 0 0 28px rgba(229,57,53,0.18)'
            : '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 18, height: 18, padding: '0 5px',
              borderRadius: 9,
              background: 'linear-gradient(180deg, var(--loss), #c62828)',
              color: '#fff', fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #050505',
              boxShadow: '0 0 12px rgba(239,68,68,0.6)',
            }}>{unread > 9 ? '9+' : unread}</motion.span>
        )}
      </motion.button>

      {/* Painel lateral */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 201 }}
            />
            <motion.div
              ref={panelRef}
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.32, ease }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '100%', maxWidth: 440, zIndex: 202,
                background: 'linear-gradient(180deg, var(--raised), #050505)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column',
              }}>

              {/* Header */}
              <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 4px' }}>O que há de novo</p>
                    <h3 style={{ fontFamily: 'var(--font-serif, "Instrument Serif", serif)', fontSize: 26, fontWeight: 400, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Atualizações</h3>
                  </div>
                  <button onClick={() => setOpen(false)} type="button"
                    style={{
                      width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                      color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {unread > 0 && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '4px 0 0' }}>{unread} {unread === 1 ? 'novidade' : 'novidades'}</p>
                )}
              </div>

              {/* Lista */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 32px' }}>
                {updates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 12px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 13, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                    </div>
                    <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 18, color: '#fff', margin: '0 0 4px' }}>Tudo em dia</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Nenhuma novidade no momento</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {updates.map((u, i) => {
                      const cat = CATEGORY_STYLE[u.category] || CATEGORY_STYLE.feature
                      return (
                        <motion.div key={u.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04, ease }}
                          style={{
                            position: 'relative',
                            padding: '14px 16px', borderRadius: 12,
                            background: u.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid ' + (u.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'),
                          }}>
                          {!u.read && (
                            <span style={{
                              position: 'absolute', top: 14, left: 6,
                              width: 5, height: 5, borderRadius: '50%',
                              background: 'var(--loss)', boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                            }}/>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            {u.icon && <span style={{ fontSize: 14 }}>{u.icon}</span>}
                            <span style={{
                              fontFamily: 'var(--mono, monospace)', fontSize: 9, fontWeight: 800,
                              padding: '2px 7px', borderRadius: 4,
                              background: cat.bg, color: cat.color,
                              border: '1px solid ' + cat.border,
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                            }}>{cat.label}</span>
                            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{timeAgo(u.created_at)}</span>
                          </div>
                          <p style={{
                            fontSize: 13.5, fontWeight: 700, color: '#fff',
                            margin: '0 0 4px', letterSpacing: '-0.01em',
                          }}>{u.title}</p>
                          {u.body && (
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{u.body}</p>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
