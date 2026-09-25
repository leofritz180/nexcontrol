'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const ease = [0.33, 1, 0.68, 1]

// Os tons saem dos tokens do tema: assim valem no claro e no Noir sem
// duas tabelas. O azul de "Melhoria" saiu pela regra da paleta enxuta.
const CATEGORY_STYLE = {
  feature:     { label: 'Novidade',   color: 'var(--profit)', bg: 'var(--profit-dim)', border: 'var(--profit-border)' },
  fix:         { label: 'Correção',   color: 'var(--warn)',   bg: 'var(--warn-dim)',   border: 'var(--warn-border)' },
  improvement: { label: 'Melhoria',   color: 'var(--t2)',     bg: 'var(--fill-2)',     border: 'var(--b1)' },
  important:   { label: 'Importante', color: 'var(--loss)',   bg: 'var(--loss-dim)',   border: 'var(--loss-border)' },
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
  // filtro da central: 'todas' | 'novas' | uma categoria
  const [filtro, setFiltro] = useState('todas')
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
    // Antes isto marcava tudo como lido 2s depois de abrir, e a novidade
    // sumia antes de o usuario ler. Agora quem marca e o botao.
  }

  if (!userId || !loaded) return null

  return (
    <>
      {/* Sino flutuante — posicao fixed bottom-right (acima do FAB do tour) */}
      <motion.button
 className="nx-dock-item"        onClick={openPanel}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        aria-label="Atualizações do sistema"
        style={{
          position: 'fixed', bottom: 'calc(22px + var(--rodape-livre))', right: 76, zIndex: 200,
          width: 42, height: 42, borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid var(--b1)',
          color: unread > 0 ? 'var(--k-laranja)' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: unread > 0
            ? '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--k-laranja) 15%, transparent), 0 0 28px color-mix(in srgb, var(--k-laranja) 18%, transparent)'
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
              background: 'linear-gradient(180deg, var(--loss), #b32c16)',
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
                background: 'var(--surface)',
                borderLeft: '1px solid var(--b1)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column',
              }}>

              {/* Header */}
              <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid var(--b1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 4px' }}>O que há de novo</p>
                    <h3 style={{ fontFamily: 'var(--font-serif, "Instrument Serif", serif)', fontSize: 26, fontWeight: 400, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Atualizações</h3>
                  </div>
                  <button onClick={() => setOpen(false)} type="button"
                    style={{
                      width: 32, height: 32, borderRadius: 9, border: '1px solid var(--b1)', background: 'transparent',
                      color: 'var(--t2)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {/* filtro + marcar todas: antes o painel so listava e marcava
                    tudo sozinho depois de 2s. */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[['todas', 'Todas'], ['novas', 'Não lidas'], ['feature', 'Novidade'], ['fix', 'Correção'], ['important', 'Importante']].map(([k, l]) => {
                      const on = filtro === k
                      return (
                        <button key={k} type="button" onClick={() => setFiltro(k)}
                          style={{ padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10.5, fontWeight: 800,
                            border: on ? 'none' : '1px solid var(--b1)', background: on ? '#15151a' : 'transparent',
                            color: on ? '#fff' : 'var(--t3)', transition: 'background .15s ease' }}>
                          {l}{k === 'novas' && unread > 0 ? ` ${unread}` : ''}
                        </button>
                      )
                    })}
                  </div>
                  {unread > 0 && (
                    <button type="button" onClick={markAllRead}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: 'var(--t3)', padding: 4, whiteSpace: 'nowrap' }}>
                      Marcar todas
                    </button>
                  )}
                </div>
              </div>

              {/* Lista */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 32px' }}>
                {updates.filter(u => filtro === 'todas' ? true : filtro === 'novas' ? !u.read : u.category === filtro).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 12px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 13, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                    </div>
                    <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 18, color: 'var(--t1)', margin: '0 0 4px' }}>Tudo em dia</p>
                    <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Nenhuma novidade no momento</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {updates
                      .filter(u => filtro === 'todas' ? true : filtro === 'novas' ? !u.read : u.category === filtro)
                      .map((u, i) => {
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
                            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: 'var(--t3)', marginLeft: 'auto' }}>{timeAgo(u.created_at)}</span>
                          </div>
                          <p style={{
                            fontSize: 13.5, fontWeight: 700, color: 'var(--t1)',
                            margin: '0 0 4px', letterSpacing: '-0.01em',
                          }}>{u.title}</p>
                          {u.body && (
                            <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{u.body}</p>
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
