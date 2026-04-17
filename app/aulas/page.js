'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const OWNER_EMAIL = 'leofritz180@gmail.com'
const ease = [0.33, 1, 0.68, 1]

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

      // Check authorization: user must belong to owner's tenant
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

      // Fetch courses and progress
      try {
        const [coursesRes, progressRes] = await Promise.all([
          fetch(`/api/aulas/courses?tenant_id=${p.tenant_id}&user_id=${u.id}`),
          fetch(`/api/aulas/progress?user_id=${u.id}`),
        ])
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.courses || data || [])
        }
        if (progressRes.ok) {
          const data = await progressRes.json()
          // Normalize to { courseId: percentage }
          const map = {}
          const arr = data.progress || data || []
          if (Array.isArray(arr)) {
            arr.forEach(p => { map[p.course_id] = p.percentage ?? p.progress ?? 0 })
          }
          setProgress(map)
        }
      } catch (e) {
        console.error('Failed to fetch aulas data:', e)
      }

      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span style={{ color: '#F59E0B', fontSize: 14, fontWeight: 600 }}>Carregando Aulas VIP...</span>
        </motion.div>
      </div>
    )
  }

  if (!authorized) return null

  // Filter courses by search
  const filtered = courses.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  )

  // Separate "continue watching" (progress > 0 and < 100)
  const continueWatching = filtered.filter(c => {
    const p = progress[c.id]
    return p && p > 0 && p < 100
  })

  // Group remaining by category
  const categories = {}
  filtered.forEach(c => {
    const cat = c.category || 'Geral'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(c)
  })

  const isAdmin = profile?.role === 'admin'

  return (
    <AppLayout
      userName={profile?.name}
      userEmail={user?.email}
      isAdmin={isAdmin}
      tenant={tenant}
      subscription={sub}
      userId={user?.id}
      tenantId={profile?.tenant_id}
    >
      <div style={{ padding: '32px 28px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>
              AULAS VIP DARKZIN
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
              letterSpacing: '0.1em',
              boxShadow: '0 0 12px rgba(245,158,11,0.15)',
            }}>
              VIP
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
            Biblioteca exclusiva de cursos e aulas premium
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
          style={{ marginBottom: 36 }}
        >
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2} strokeLinecap="round"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar aula..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--t1)', fontSize: 13, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={1.5} strokeLinecap="round" style={{ marginBottom: 16, opacity: 0.4 }}>
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--t2)', margin: '0 0 6px' }}>
              Nenhum curso disponivel ainda
            </p>
            <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>
              Os cursos VIP aparecerao aqui quando forem adicionados
            </p>
          </motion.div>
        )}

        {/* Continue watching row */}
        {continueWatching.length > 0 && (
          <CourseRow
            title="Continuar assistindo"
            courses={continueWatching}
            progress={progress}
            delay={0.15}
          />
        )}

        {/* Category rows */}
        {Object.entries(categories).map(([cat, catCourses], idx) => (
          <CourseRow
            key={cat}
            title={cat}
            courses={catCourses}
            progress={progress}
            delay={0.2 + idx * 0.08}
          />
        ))}
      </div>
    </AppLayout>
  )
}

/* ── Horizontal carousel row ── */
function CourseRow({ title, courses, progress, delay = 0 }) {
  const scrollRef = useRef(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      style={{ marginBottom: 36 }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory',
          paddingBottom: 8, scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {courses.map(course => (
          <CourseCard key={course.id} course={course} progress={progress[course.id]} />
        ))}
      </div>
    </motion.div>
  )
}

/* ── Individual course card ── */
function CourseCard({ course, progress: prog }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  const gradients = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 50%, #44194d 100%)',
    'linear-gradient(135deg, #1a2a1a 0%, #1b3d2d 50%, #0f604d 100%)',
    'linear-gradient(135deg, #2a1a1a 0%, #3d1b1b 50%, #60300f 100%)',
  ]
  const gradientIdx = (course.id?.charCodeAt?.(0) || 0) % gradients.length

  return (
    <motion.div
      onClick={() => router.push(`/aulas/${course.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        scale: hovered ? 1.04 : 1,
        boxShadow: hovered
          ? '0 8px 32px rgba(245,158,11,0.12), 0 0 0 1px rgba(245,158,11,0.2)'
          : '0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
      transition={{ duration: 0.2 }}
      style={{
        flexShrink: 0, width: 240, borderRadius: 12, overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
        scrollSnapAlign: 'start',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 240, height: 135, position: 'relative',
        background: course.thumbnail ? `url(${course.thumbnail}) center/cover` : gradients[gradientIdx],
      }}>
        {/* Category badge on thumbnail */}
        {course.category && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
            background: 'rgba(0,0,0,0.6)', color: '#F59E0B',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.04em',
          }}>
            {course.category}
          </span>
        )}
        {/* Play icon overlay */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
            <path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
          </svg>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: '0 0 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {course.title || 'Sem titulo'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: prog > 0 ? 10 : 0 }}>
          {course.lesson_count != null && (
            <span style={{ fontSize: 10, color: 'var(--t4)' }}>
              {course.lesson_count} aula{course.lesson_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {prog > 0 && (
          <div style={{
            width: '100%', height: 3, borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(prog, 100)}%` }}
              transition={{ duration: 0.6, ease }}
              style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #F59E0B, #D97706)',
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
