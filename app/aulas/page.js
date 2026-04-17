'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const OWNER_EMAIL = 'leofritz180@gmail.com'
const ease = [0.33, 1, 0.68, 1]
const RED = '#e53935'
const AMBER = '#F59E0B'

const THUMB_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'linear-gradient(135deg, #2d1b3d, #44194d, #1a1a2e)',
  'linear-gradient(135deg, #1a2a1a, #1b3d2d, #0f604d)',
  'linear-gradient(135deg, #3d2a1a, #4d3319, #2e1a0f)',
  'linear-gradient(135deg, #1a1a3d, #2d194d, #0f1a60)',
  'linear-gradient(135deg, #3d1a1a, #4d1919, #2e0f0f)',
]

/* ════════════════════════════════════════
   HERO BANNER — Full width, cinematic
   ════════════════════════════════════════ */
function HeroBanner({ course, onWatch, onDetails }) {
  if (!course) return null
  const hasBg = !!course.thumb_url
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'relative', width: '100%', minHeight: 420, overflow: 'hidden',
        marginBottom: 40, borderRadius: 0,
      }}
    >
      {/* Background image with slow zoom */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -20,
          background: hasBg ? `url(${course.thumb_url}) center/cover` : THUMB_GRADIENTS[0],
          filter: hasBg ? 'blur(1px)' : 'none',
        }}
      />
      {/* Dark overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, #04070e 0%, rgba(4,7,14,0.7) 50%, rgba(4,7,14,0.3) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,7,14,0.85) 0%, rgba(4,7,14,0.3) 50%, transparent 100%)' }} />
      {/* Red ambient glow */}
      <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.08), transparent 70%)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '80px 40px 48px', maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 5, background: `${RED}25`, color: RED, border: `1px solid ${RED}40`, letterSpacing: '0.1em' }}>DARKZIN VIP</span>
          {course.category && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{course.category}</span>}
          {course.lesson_count > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{course.lesson_count} aulas</span>}
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          {course.title}
        </h1>

        {course.description && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 460 }}>
            {course.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: `0 6px 24px ${RED}40` }}
            whileTap={{ scale: 0.97 }}
            onClick={e => { e.stopPropagation(); onWatch() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 8,
              background: RED, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff',
              boxShadow: `0 4px 20px ${RED}30`,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" /></svg>
            Assistir agora
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.97 }}
            onClick={e => { e.stopPropagation(); onDetails() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '12px 22px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            Mais detalhes
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════
   CATEGORY ROW — Horizontal carousel
   ════════════════════════════════════════ */
function CategoryRow({ title, courses, progress, delay = 0, icon }) {
  const ref = useRef(null)
  const scroll = dir => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease }} style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => scroll(-1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={() => scroll(1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
      <div ref={ref} className="aulas-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8 }}>
        <style>{`.aulas-row::-webkit-scrollbar{display:none} .aulas-row{scrollbar-width:none;}`}</style>
        {courses.map((c, i) => <CourseCard key={c.id} course={c} progress={progress[c.id]} index={i} />)}
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════
   COURSE CARD — Netflix style
   ════════════════════════════════════════ */
function CourseCard({ course, progress: prog, index = 0 }) {
  const router = useRouter()
  const [hov, setHov] = useState(false)
  const gradIdx = (course.id || index) % THUMB_GRADIENTS.length
  const hasProg = prog > 0

  return (
    <motion.div
      onClick={() => router.push(`/aulas/${course.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease }}
      style={{
        flexShrink: 0, width: 280, borderRadius: 10, overflow: 'hidden',
        cursor: 'pointer', scrollSnapAlign: 'start', position: 'relative',
        background: '#0c1220',
        border: `1px solid ${hov ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.04)'}`,
        boxShadow: hov ? '0 16px 48px rgba(229,57,53,0.08), 0 0 0 1px rgba(229,57,53,0.12)' : '0 4px 16px rgba(0,0,0,0.3)',
        transform: hov ? 'scale(1.04) translateY(-4px)' : 'scale(1)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        zIndex: hov ? 10 : 1,
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', height: 158, position: 'relative', background: course.thumb_url ? `url(${course.thumb_url}) center/cover` : THUMB_GRADIENTS[gradIdx] }}>
        {/* Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, zIndex: 3 }}>
          {course.category && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: RED, letterSpacing: '0.04em' }}>{course.category}</span>}
          {course.tags?.includes('novo') && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: RED, color: '#fff' }}>NOVO</span>}
          {course.tags?.includes('popular') && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#22C55E', color: '#fff' }}>POPULAR</span>}
        </div>
        {/* Duration */}
        {course.total_duration > 0 && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,0,0,0.75)', color: '#fff', zIndex: 3 }}>{course.total_duration}min</span>
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.4)', zIndex: 2 }}>
          <motion.div animate={hov ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${RED}50` }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" /></svg>
          </motion.div>
        </div>
        {/* Progress bar */}
        {hasProg && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.6)', zIndex: 3 }}>
            <div style={{ height: '100%', width: `${Math.min(prog, 100)}%`, background: RED, borderRadius: '0 2px 0 0' }} />
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title || 'Sem titulo'}</p>
        {course.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {course.lesson_count > 0 && <span style={{ fontSize: 10, color: 'var(--t4)' }}>{course.lesson_count} aula{course.lesson_count !== 1 ? 's' : ''}</span>}
          {hasProg && <span style={{ fontSize: 10, color: RED, fontWeight: 600 }}>{Math.round(prog)}%</span>}
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════ */
export default function AulasVipPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p) { router.push('/login'); return }
      setProfile(p)
      const { data: ownerProfile } = await supabase.from('profiles').select('tenant_id').eq('email', OWNER_EMAIL).maybeSingle()
      if (!ownerProfile || ownerProfile.tenant_id !== p.tenant_id) { router.push(p.role === 'admin' ? '/admin' : '/operator'); return }
      setAuthorized(true)
      const [{ data: t }, { data: s2 }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (t) setTenant(t); if (s2) setSub(s2)
      try {
        const [cr, pr] = await Promise.all([
          fetch(`/api/aulas/courses?tenant_id=${p.tenant_id}&user_id=${u.id}`),
          fetch(`/api/aulas/progress?user_id=${u.id}`),
        ])
        if (cr.ok) { const d = await cr.json(); setCourses(d.courses || d || []) }
        if (pr.ok) {
          const d = await pr.json(); const map = {}; const arr = d.progress || d || []
          if (Array.isArray(arr)) arr.forEach(x => { map[x.course_id] = x.percentage ?? x.progress ?? 0 })
          setProgress(map)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#04070e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </motion.div>
        <p style={{ color: 'var(--t4)', fontSize: 12, marginTop: 12 }}>Carregando...</p>
      </div>
    </div>
  )

  if (!authorized) return null

  // Operators: locked
  if (profile?.role === 'operator') return (
    <AppLayout userName={profile?.name} userEmail={user?.email} isAdmin={false} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `${RED}10`, border: `1px solid ${RED}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px' }}>AULAS VIP DARKZIN</h2>
          <p style={{ fontSize: 18, fontWeight: 700, color: RED, margin: '0 0 8px' }}>Em breve</p>
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, lineHeight: 1.6 }}>A area de aulas exclusivas esta sendo preparada.</p>
        </motion.div>
      </div>
    </AppLayout>
  )

  const isAdmin = profile?.role === 'admin'
  const filtered = courses.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase()) || c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
  const continueWatching = filtered.filter(c => { const p = progress[c.id]; return p && p > 0 && p < 100 })
  const featured = filtered[0] || null
  const cats = {}
  filtered.forEach(c => { const cat = c.category || 'Geral'; if (!cats[cat]) cats[cat] = []; cats[cat].push(c) })

  return (
    <AppLayout userName={profile?.name} userEmail={user?.email} isAdmin={isAdmin} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      {/* Red ambient glow */}
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.06), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ padding: '20px 28px 0', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>AULAS VIP DARKZIN</h1>
              <span style={{ fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 4, background: `${RED}20`, color: RED, border: `1px solid ${RED}30`, letterSpacing: '0.08em' }}>VIP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: 200, padding: '8px 12px 8px 32px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--t1)', fontSize: 12, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = `${RED}30`} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
              </div>
              {isAdmin && user?.email === OWNER_EMAIL && (
                <button onClick={() => router.push('/aulas/admin')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: `${RED}10`, border: `1px solid ${RED}20`, color: RED, cursor: 'pointer' }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                  Gerenciar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero */}
        {featured && !search && (
          <div style={{ padding: '0 28px', maxWidth: 1400, margin: '0 auto' }}>
            <HeroBanner course={featured} onWatch={() => router.push(`/aulas/${featured.id}`)} onDetails={() => router.push(`/aulas/${featured.id}`)} />
          </div>
        )}

        <div style={{ padding: '0 28px 60px', maxWidth: 1400, margin: '0 auto' }}>
          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ textAlign: 'center', padding: '120px 20px', borderRadius: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `${RED}08`, border: `1px solid ${RED}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.5" strokeLinecap="round"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', margin: '0 0 8px' }}>Nenhum curso disponivel</p>
              <p style={{ fontSize: 13, color: 'var(--t4)', margin: '0 0 24px' }}>Os cursos aparecerao aqui quando forem publicados.</p>
              {isAdmin && user?.email === OWNER_EMAIL && (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/aulas/admin')}
                  style={{ padding: '12px 28px', borderRadius: 8, background: RED, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', boxShadow: `0 4px 20px ${RED}30` }}>
                  Criar primeiro curso
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Continue watching */}
          {continueWatching.length > 0 && <CategoryRow title="Continuar assistindo" icon="▶️" courses={continueWatching} progress={progress} delay={0.1} />}

          {/* Categories */}
          {Object.entries(cats).map(([cat, list], i) => (
            <CategoryRow key={cat} title={cat} courses={list} progress={progress} delay={0.15 + i * 0.05} />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
