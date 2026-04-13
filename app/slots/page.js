'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'
import AppLayout from '../../components/AppLayout'
import { PROVIDERS, SLOTS } from '../../lib/slots-data'

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: base + i * 0.04, ease },
})

/* ── Stars ── */
function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={12} height={12} viewBox="0 0 24 24" fill={i <= count ? '#F59E0B' : 'none'} stroke={i <= count ? '#F59E0B' : 'rgba(255,255,255,0.15)'} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

/* ── Slot Card ── */
function SlotCard({ slot, index, isPro }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [denied, setDenied] = useState(false)
  const locked = !isPro

  function copyName() {
    if (locked) { setDenied(true); setTimeout(() => setDenied(false), 2000); return }
    navigator.clipboard.writeText(slot.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isAlta = slot.performance === 'alta'

  return (
    <motion.div
      {...fadeUp(index, 0.1)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: `1px solid ${hovered ? (locked ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 18,
        overflow: 'hidden',
        transform: hovered && !locked ? 'translateY(-3px) scale(1.01)' : 'none',
        boxShadow: hovered ? (locked ? '0 0 20px rgba(229,57,53,0.06)' : '0 16px 50px rgba(0,0,0,0.4)') : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Image area */}
      <div style={{
        position: 'relative', aspectRatio: '16/10',
        background: `linear-gradient(135deg, ${isAlta ? 'rgba(229,57,53,0.08)' : 'rgba(245,158,11,0.08)'}, rgba(255,255,255,0.02))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        filter: locked ? 'blur(2px) brightness(0.55)' : 'none',
        transition: 'filter 0.3s',
      }}>
        {/* Performance badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          padding: '4px 10px', borderRadius: 7,
          background: isAlta ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
          border: `1px solid ${isAlta ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          color: isAlta ? '#22c55e' : '#f59e0b',
          textTransform: 'uppercase',
        }}>
          {isAlta ? 'Alta' : 'Media'}
        </div>

        {/* Provider badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          padding: '4px 10px', borderRadius: 7,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {slot.provider.toUpperCase()}
        </div>

        {/* Placeholder icon */}
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: `linear-gradient(135deg, ${isAlta ? 'rgba(229,57,53,0.15)' : 'rgba(245,158,11,0.15)'}, rgba(255,255,255,0.04))`,
          border: `1px solid ${isAlta ? 'rgba(229,57,53,0.2)' : 'rgba(245,158,11,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.3s',
          transform: hovered && !locked ? 'scale(1.1)' : 'scale(1)',
        }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={isAlta ? '#e53935' : '#f59e0b'} strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
      </div>

      {/* Lock overlay — only image area */}
      {locked && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          aspectRatio: '16/10',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3,
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '12px 18px', borderRadius: 12,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(229,57,53,0.8)" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>EXCLUSIVO PRO</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{
        padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10,
        opacity: locked ? 0.7 : 1, transition: 'opacity 0.3s',
      }}>
        {/* Name */}
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: '#fff', margin: 0,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {slot.name}
        </h3>

        {/* Stars */}
        <Stars count={slot.rating} />

        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {slot.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.45)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Button */}
        {locked ? (
          <Link href="/billing" style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            fontSize: 11, fontWeight: 700, textDecoration: 'none',
            background: 'rgba(229,57,53,0.1)', color: '#e53935',
            border: '1px solid rgba(229,57,53,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Seja PRO
          </Link>
        ) : (
          <motion.button
            onClick={copyName}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(229,57,53,0.08)',
              color: copied ? '#22c55e' : '#e53935',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(229,57,53,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {copied ? (
              <>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                Copiado!
              </>
            ) : (
              <>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                Copiar Nome
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

/* ── Main Page ── */
export default function SlotsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('catalogo')
  const [filter, setFilter] = useState('all')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    const [{ data: t }, { data: s2 }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (t) setTenant(t)
    if (s2) setSub(s2)
    setLoading(false)
  }

  const isPro = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  const filtered = useMemo(() => {
    if (filter === 'all') return SLOTS
    return SLOTS.filter(s => s.provider === filter)
  }, [filter])

  const counts = useMemo(() => {
    const c = { all: SLOTS.length }
    PROVIDERS.forEach(p => { if (p.id !== 'all') c[p.id] = SLOTS.filter(s => s.provider === p.id).length })
    return c
  }, [])

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0c1424, #080e1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Slots Premium</h1>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: 'rgba(229,57,53,0.1)', color: '#e53935',
              border: '1px solid rgba(229,57,53,0.2)', letterSpacing: '0.06em',
            }}>2025</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Catalogo de performance — {SLOTS.length} jogos mapeados
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div {...fadeUp(1)} style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4,
          border: '1px solid rgba(255,255,255,0.05)', maxWidth: 320,
        }}>
          {[
            { key: 'catalogo', label: 'Catalogo Oficial' },
            { key: 'meus', label: 'Meus Jogos' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, padding: '10px 16px', fontSize: 12, fontWeight: 600,
              borderRadius: 9, border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? 'rgba(229,57,53,0.12)' : 'transparent',
              color: activeTab === t.key ? '#e53935' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </motion.div>

        {activeTab === 'catalogo' ? (
          <>
            {/* Filters */}
            <motion.div {...fadeUp(2)} style={{
              display: 'flex', gap: 6, marginBottom: 32,
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              paddingBottom: 4,
            }}>
              {PROVIDERS.map(p => {
                const active = filter === p.id
                return (
                  <button key={p.id} onClick={() => setFilter(p.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 10,
                      fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                      flexShrink: 0,
                      background: active ? 'rgba(229,57,53,0.12)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#e53935' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${active ? 'rgba(229,57,53,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {p.label}
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: active ? 'rgba(229,57,53,0.6)' : 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--mono, monospace)',
                    }}>{counts[p.id] || 0}</span>
                  </button>
                )
              })}
            </motion.div>

            {/* Stats bar */}
            <motion.div {...fadeUp(3)} style={{
              display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap',
            }}>
              {[
                { label: 'Total', value: filtered.length, color: 'rgba(255,255,255,0.6)' },
                { label: 'Alta performance', value: filtered.filter(s => s.performance === 'alta').length, color: '#22c55e' },
                { label: 'Media', value: filtered.filter(s => s.performance === 'media').length, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '10px 18px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--mono, monospace)' }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                {filtered.map((slot, i) => (
                  <SlotCard key={slot.id} slot={slot} index={i} isPro={isPro} />
                ))}
              </motion.div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Nenhum slot encontrado para este provider.</p>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}>
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Meus Jogos</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Em breve voce podera salvar seus jogos favoritos aqui.</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
