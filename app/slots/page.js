'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'
import { PROVIDERS, SLOTS } from '../../lib/slots-data'

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: base + i * 0.03, ease },
})

const LEVEL_CFG = {
  alta:  { label: 'ALTA',  bg: 'rgba(229,57,53,0.15)', border: 'rgba(229,57,53,0.3)', color: '#ff4444' },
  media: { label: 'MÉDIA', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
  baixa: { label: 'BAIXA', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', color: '#22c55e' },
}

/* ── Stars ── */
function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={11} height={11} viewBox="0 0 24 24"
          fill={i <= count ? '#F59E0B' : 'none'}
          stroke={i <= count ? '#F59E0B' : 'rgba(255,255,255,0.12)'}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

/* ── Slot Card ── */
function SlotCard({ slot, index }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const lv = LEVEL_CFG[slot.level] || LEVEL_CFG.media

  function copyName() {
    navigator.clipboard.writeText(slot.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      {...fadeUp(index, 0.05)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(160deg, #0e1322, #0a0e18)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px) scale(1.015)' : 'none',
        boxShadow: hovered
          ? '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(229,57,53,0.04)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Visual area (top) ── */}
      <div style={{
        position: 'relative',
        aspectRatio: '4/3',
        background: 'linear-gradient(145deg, #0c1220 0%, #080c16 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Provider badge — top left */}
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 3,
          padding: '4px 10px', borderRadius: 6,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
          fontSize: 9, fontWeight: 800, color: '#60a5fa',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {slot.provider.toUpperCase()}
        </div>

        {/* Level badge — top right */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 3,
          padding: '4px 10px', borderRadius: 6,
          background: lv.bg, border: `1px solid ${lv.border}`,
          fontSize: 9, fontWeight: 800, color: lv.color,
          letterSpacing: '0.06em',
        }}>
          {lv.label}
        </div>

        {/* Decorative diamond icon */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          opacity: 0.06, pointerEvents: 'none',
        }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="12 2 22 8.5 12 22 2 8.5" />
          </svg>
        </div>

        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 60%, ${lv.color}08, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Game name — visual display */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 16px' }}>
          <p style={{
            fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.02em', lineHeight: 1.3, margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
          }}>
            {slot.name}
          </p>
        </div>

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'linear-gradient(transparent, #0e1322)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Info area (bottom) ── */}
      <div style={{ padding: '14px 14px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Name */}
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#fff', margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {slot.name}
        </h3>

        {/* Stars + tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stars count={slot.stars} />
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)',
          }}>
            {slot.tag}
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Copy button */}
        <button
          onClick={copyName}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 9,
            fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
            color: copied ? '#22c55e' : 'rgba(255,255,255,0.45)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}
        >
          {copied ? (
            <>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              Copiado!
            </>
          ) : (
            <>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              Copiar Nome
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ */
/* ── Main Page ── */
/* ═══════════════════════════════════════════════ */
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
        </motion.div>
      </div>
    )
  }

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
              Slots Premium
            </h1>
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

        {/* ── Tabs: Catalogo / Meus Jogos ── */}
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

        {/* ── Provider filters ── */}
        <motion.div {...fadeUp(2)} style={{
          display: 'flex', gap: 6, marginBottom: 28,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', paddingBottom: 4,
        }}>
          <style jsx>{`.filters-row::-webkit-scrollbar{display:none}`}</style>
          {PROVIDERS.map(p => {
            const active = filter === p.id
            return (
              <button key={p.id} onClick={() => setFilter(p.id)} style={{
                padding: '8px 16px', borderRadius: 10, flexShrink: 0,
                fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(229,57,53,0.12)' : 'rgba(255,255,255,0.03)',
                color: active ? '#e53935' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${active ? 'rgba(229,57,53,0.2)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {p.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                  color: active ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.2)',
                }}>{counts[p.id] || 0}</span>
              </button>
            )
          })}
        </motion.div>

        {/* ── Content ── */}
        {activeTab === 'catalogo' ? (
          <>
            {/* Stats */}
            <motion.div {...fadeUp(3)} style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: filtered.length, color: 'rgba(255,255,255,0.6)' },
                { label: 'Alta', value: filtered.filter(s => s.level === 'alta').length, color: '#ff4444' },
                { label: 'Media', value: filtered.filter(s => s.level === 'media').length, color: '#f59e0b' },
                { label: 'Baixa', value: filtered.filter(s => s.level === 'baixa').length, color: '#22c55e' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'var(--mono, monospace)' }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 14,
                }}
              >
                {filtered.map((slot, i) => (
                  <SlotCard key={slot.id} slot={slot} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Nenhum slot encontrado.</p>
              </div>
            )}
          </>
        ) : (
          /* Meus Jogos — placeholder */
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
