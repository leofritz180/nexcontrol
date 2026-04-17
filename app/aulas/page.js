'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const OWNER_EMAIL = 'leofritz180@gmail.com'
const ease = [0.33, 1, 0.68, 1]
const AMBER = '#F59E0B'
const AMBER_DK = '#D97706'

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b3d 0%, #44194d 50%, #1a1a2e 100%)',
  'linear-gradient(135deg, #1a2a1a 0%, #1b3d2d 50%, #0f604d 100%)',
  'linear-gradient(135deg, #3d2a1a 0%, #4d3319 50%, #2e1a0f 100%)',
  'linear-gradient(135deg, #1a1a3d 0%, #2d194d 50%, #0f1a60 100%)',
  'linear-gradient(135deg, #3d1a2d 0%, #4d1944 50%, #2e0f1a 100%)',
]

/* ── Featured Banner ── */
function FeaturedBanner({ course, onWatch }) {
  if (!course) return null
  const bg = course.thumb_url ? `url(${course.thumb_url}) center/cover` : GRADIENTS[0]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      onClick={onWatch}
      style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        height: 320, marginBottom: 40, background: bg,
        border: '1px solid rgba(245,158,11,0.15)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.04)',
      }}
    >
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(4,7,14,0.95) 0%, rgba(4,7,14,0.4) 40%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,7,14,0.8) 0%, transparent 60%)' }} />
      {/* Content */}
      <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}30`, letterSpacing: '0.08em' }}>EM DESTAQUE</span>
          {course.category && <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--t3)' }}>{course.category}</span>}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>{course.title}</h2>
        {course.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.5, maxWidth: 500 }}>{course.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8,
            background: AMBER, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#000',
            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" /></svg>
            Assistir agora
          </button>
          {course.lesson_count > 0 && <span style={{ fontSize: 11, color: 'var(--t4)' }}>{course.lesson_count} aulas</span>}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Category Row (horizontal scroll) ── */
function CategoryRow({ title, courses, progress, delay = 0, icon }) {
  const scrollRef = useRef(null)
  const scroll = (dir) => { scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' }) }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }} style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{title}</h2>
          <span style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 500 }}>{courses.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => scroll(-1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={() => scroll(1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, scrollbarWidth: 'none' }}>
        <style>{`.aulas-scroll::-webkit-scrollbar{display:none}`}</style>
        {courses.map((c, i) => <VideoCard key={c.id} course={c} progress={progress[c.id]} index={i} />)}
      </div>
    </motion.div>
  )
}

/* ── Video Card (Netflix style) ── */
function VideoCard({ course, progress: prog, index = 0 }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const gradIdx = (course.id || index) % GRADIENTS.length
  const hasProg = prog > 0

  return (
    <motion.div
      onClick={() => router.push(`/aulas/${course.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      style={{
        flexShrink: 0, width: 260, borderRadius: 12, overflow: 'hidden',
        background: 'rgba(12,18,32,0.9)', cursor: 'pointer', scrollSnapAlign: 'start',
        border: `1px solid ${hovered ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: hovered ? '0 12px 40px rgba(245,158,11,0.1), 0 0 0 1px rgba(245,158,11,0.15)' : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', height: 146, position: 'relative', background: course.thumb_url ? `url(${course.thumb_url}) center/cover` : GRADIENTS[gradIdx] }}>
        {/* Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {course.category && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', color: AMBER, letterSpacing: '0.04em' }}>{course.category}</span>}
          {course.tags?.includes('novo') && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(229,57,53,0.8)', color: '#fff' }}>NOVO</span>}
          {course.tags?.includes('popular') && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.8)', color: '#fff' }}>POPULAR</span>}
        </div>
        {/* Duration */}
        {course.total_duration > 0 && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>{course.total_duration}min</span>
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.35)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,158,11,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" /></svg>
          </div>
        </div>
        {/* Progress bar at bottom of thumbnail */}
        {hasProg && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', width: `${Math.min(prog, 100)}%`, background: AMBER, borderRadius: '0 2px 0 0' }} />
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title || 'Sem titulo'}</p>
        {course.description && <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {course.lesson_count > 0 && <span style={{ fontSize: 9, color: 'var(--t4)' }}>{course.lesson_count} aula{course.lesson_count !== 1 ? 's' : ''}</span>}
          {hasProg && <span style={{ fontSize: 9, color: AMBER, fontWeight: 600 }}>{Math.round(prog)}% concluido</span>}
        </div>
      </div>
      {/* Hover overlay with description */}
      <AnimatePresence>
        {hovered && course.description && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px', background: 'linear-gradient(0deg, rgba(4,7,14,0.98) 0%, rgba(4,7,14,0.85) 70%, transparent 100%)', zIndex: 5 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', lineHeight: 1.5 }}>{course.description}</p>
            <span style={{ fontSize: 10, fontWeight: 700, color: AMBER }}>Assistir</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Main Page ── */
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
      if (!ownerProfile || ownerProfile.tenant_id !== p.tenant_id) {
        router.push(p.role === 'admin' ? '/admin' : '/operator')
        return
      }
      setAuthorized(true)
      const [{ data: t }, { data: s2 }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (t) setTenant(t)
      if (s2) setSub(s2)
      try {
        const [coursesRes, progressRes] = await Promise.all([
          fetch(`/api/aulas/courses?tenant_id=${p.tenant_id}&user_id=${u.id}`),
          fetch(`/api/aulas/progress?user_id=${u.id}`),
        ])
        if (coursesRes.ok) { const data = await coursesRes.json(); setCourses(data.courses || data || []) }
        if (progressRes.ok) {
          const data = await progressRes.json()
          const map = {}
          const arr = data.progress || data || []
          if (Array.isArray(arr)) arr.forEach(p => { map[p.course_id] = p.percentage ?? p.progress ?? 0 })
          setProgress(map)
        }
      } catch (e) { console.error('Failed to fetch:', e) }
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#04070e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <span style={{ color: AMBER, fontSize: 14, fontWeight: 600 }}>Carregando Aulas VIP...</span>
      </motion.div>
    </div>
  )

  if (!authorized) return null

  // Operators: locked screen
  if (profile?.role === 'operator') {
    return (
      <AppLayout userName={profile?.name} userEmail={user?.email} isAdmin={false} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(245,158,11,0.06)' }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px' }}>AULAS VIP DARKZIN</h2>
            <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 6, background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}30`, letterSpacing: '0.1em', marginBottom: 20 }}>VIP</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: AMBER, margin: '0 0 8px' }}>Em breve</p>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, lineHeight: 1.6 }}>A area de aulas exclusivas esta sendo preparada. Aguarde — em breve voce tera acesso ao conteudo VIP.</p>
          </motion.div>
        </div>
      </AppLayout>
    )
  }

  const isAdmin = profile?.role === 'admin'
  const filtered = courses.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase()) || c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
  const continueWatching = filtered.filter(c => { const p = progress[c.id]; return p && p > 0 && p < 100 })
  const featured = filtered[0] || null
  const categories = {}
  filtered.forEach(c => { const cat = c.category || 'Geral'; if (!categories[cat]) categories[cat] = []; categories[cat].push(c) })

  return (
    <AppLayout userName={profile?.name} userEmail={user?.email} isAdmin={isAdmin} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ padding: '24px 28px 60px', maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9', margin: 0, letterSpacing: '-0.02em' }}>AULAS VIP DARKZIN</h1>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5, background: `linear-gradient(135deg, ${AMBER}30, ${AMBER_DK}30)`, color: AMBER, border: `1px solid ${AMBER}40`, letterSpacing: '0.1em', boxShadow: `0 0 10px ${AMBER}10` }}>VIP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isAdmin && user?.email === OWNER_EMAIL && (
                <button onClick={() => router.push('/aulas/admin')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: `${AMBER}12`, border: `1px solid ${AMBER}25`, color: AMBER, cursor: 'pointer' }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                  Gerenciar
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: 28, maxWidth: 400 }}>
          <div style={{ position: 'relative' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Buscar por titulo, categoria ou tag..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--t1)', fontSize: 12, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = `${AMBER}40`} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
          </div>
        </motion.div>

        {/* Featured banner */}
        {featured && !search && <FeaturedBanner course={featured} onWatch={() => router.push(`/aulas/${featured.id}`)} />}

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ textAlign: 'center', padding: '100px 20px', background: 'linear-gradient(145deg, rgba(245,158,11,0.03), rgba(12,18,32,0.5))', borderRadius: 20, border: '1px solid rgba(245,158,11,0.08)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `${AMBER}08`, border: `1px solid ${AMBER}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', margin: '0 0 8px' }}>Nenhum curso disponivel ainda</p>
            <p style={{ fontSize: 13, color: 'var(--t4)', margin: '0 0 20px', lineHeight: 1.5 }}>Os cursos VIP aparecerao aqui quando forem adicionados.</p>
            {isAdmin && user?.email === OWNER_EMAIL && (
              <button onClick={() => router.push('/aulas/admin')} style={{ padding: '10px 24px', borderRadius: 8, background: AMBER, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#000', boxShadow: `0 4px 16px ${AMBER}30` }}>
                Criar primeiro curso
              </button>
            )}
          </motion.div>
        )}

        {/* Continue watching */}
        {continueWatching.length > 0 && <CategoryRow title="Continuar assistindo" icon="▶" courses={continueWatching} progress={progress} delay={0.15} />}

        {/* Category rows */}
        {Object.entries(categories).map(([cat, catCourses], idx) => (
          <CategoryRow key={cat} title={cat} courses={catCourses} progress={progress} delay={0.2 + idx * 0.06} />
        ))}
      </div>
    </AppLayout>
  )
}
