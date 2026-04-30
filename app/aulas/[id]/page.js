'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabase/client'
import AppLayout from '../../../components/AppLayout'

const AMBER = 'rgba(255,255,255,0.78)'
const AMBER_DK = '#D97706'
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.05, ease } })

/* ── Spinner ── */
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, border: `3px solid rgba(255,255,255,0.2)`, borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Progress Bar ── */
function ProgressBar({ percent, height = 8 }) {
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1, ease }}
        style={{ height: '100%', borderRadius: height / 2, background: `linear-gradient(90deg, ${AMBER_DK}, ${AMBER})` }}
      />
    </div>
  )
}

/* ── Check icon ── */
function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#d1fae5" />
      <path d="M4.5 8.5L7 11L11.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ════════════════════════════════════════════
   COURSE DETAIL PAGE
════════════════════════════════════════════ */
export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState(new Set())
  const [expandedMod, setExpandedMod] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p) { router.push('/login'); return }
    setProfile(p)

    const { data: t } = await supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle()
    setTenant(t)
    const { data: su } = await supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    setSub(su)

    // Load course
    const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle()
    if (!c) { router.push('/admin'); return }
    setCourse(c)

    // Load modules + lessons
    const { data: mods } = await supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order', { ascending: true })
    setModules(mods || [])

    if (mods?.length) {
      const modIds = mods.map(m => m.id)
      const { data: lsns } = await supabase.from('course_lessons').select('*').in('module_id', modIds).order('sort_order', { ascending: true })
      setLessons(lsns || [])

      // Load progress
      const lessonIds = (lsns || []).map(l => l.id)
      if (lessonIds.length) {
        const { data: prog } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', u.id).eq('completed', true).in('lesson_id', lessonIds)
        setProgress(new Set((prog || []).map(pp => pp.lesson_id)))
      }
    }

    // Auto-expand first module
    if (mods?.length) setExpandedMod(mods[0].id)
    setLoading(false)
  }, [router, courseId])

  useEffect(() => { load() }, [load])

  const totalLessons = lessons.filter(l => l.status === 'published').length
  const completedLessons = lessons.filter(l => l.status === 'published' && progress.has(l.id)).length
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Find next incomplete lesson
  const allSorted = modules.flatMap(m => lessons.filter(l => l.module_id === m.id && l.status === 'published').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
  const nextLesson = allSorted.find(l => !progress.has(l.id))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'User'

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
        {/* ── Course Banner ── */}
        <motion.div {...fadeUp(0)} style={{
          padding: '32px 28px', borderRadius: 18, marginBottom: 24, position: 'relative', overflow: 'hidden',
          background: `linear-gradient(145deg, rgba(255,255,255,0.12), var(--surface) 60%)`,
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          {course?.thumb_url && (
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: `url(${course.thumb_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              {course?.category && (
                <span style={{ fontSize: 10, fontWeight: 700, color: AMBER, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.category}</span>
              )}
              <span style={{ fontSize: 10, color: 'var(--t3)' }}>{totalLessons} aulas</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 8 }}>{course?.title}</h1>
            {course?.description && <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 18, maxWidth: 600 }}>{course.description}</p>}

            {/* Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>Progresso do curso</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: AMBER, fontFamily: 'var(--mono, monospace)' }}>{percent}%</span>
              </div>
              <ProgressBar percent={percent} />
              <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>{completedLessons} de {totalLessons} aulas concluidas</p>
            </div>

            {/* CTA */}
            <button onClick={() => {
              if (nextLesson) router.push(`/aulas/${courseId}/${nextLesson.id}`)
              else if (allSorted.length) router.push(`/aulas/${courseId}/${allSorted[0].id}`)
            }} style={{
              padding: '12px 28px', fontSize: 14, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DK})`, color: '#000',
              boxShadow: '0 4px 20px rgba(255,255,255,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 28px rgba(255,255,255,0.4)' }}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px rgba(255,255,255,0.3)' }}>
              {percent > 0 && percent < 100 ? 'Continuar curso' : percent === 100 ? 'Rever curso' : 'Comecar agora'}
            </button>
          </div>
        </motion.div>

        {/* ── Modules List ── */}
        <motion.div {...fadeUp(1)}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>Conteudo do curso</h2>
        </motion.div>

        {modules.map((mod, mi) => {
          const modLessons = lessons.filter(l => l.module_id === mod.id && l.status === 'published').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          const modCompleted = modLessons.filter(l => progress.has(l.id)).length
          const isExpanded = expandedMod === mod.id

          return (
            <motion.div key={mod.id} {...fadeUp(mi + 2)} style={{
              marginBottom: 8, borderRadius: 12, overflow: 'hidden',
              background: 'var(--surface)', border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.18)' : 'var(--b1)'}`,
              transition: 'border 0.3s',
            }}>
              {/* Module Header */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 10 }}
                onClick={() => setExpandedMod(isExpanded ? null : mod.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                    background: modCompleted === modLessons.length && modLessons.length > 0 ? 'rgba(209,250,229,0.15)' : 'rgba(255,255,255,0.1)',
                    color: modCompleted === modLessons.length && modLessons.length > 0 ? '#d1fae5' : AMBER,
                  }}>{mi + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 1 }}>{modCompleted}/{modLessons.length} concluidas</p>
                  </div>
                </div>
                <span style={{ fontSize: 14, color: 'var(--t3)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>&#9660;</span>
              </div>

              {/* Lessons */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 18px 14px', borderTop: '1px solid var(--b1)' }}>
                      {modLessons.map((lesson, li) => {
                        const isCompleted = progress.has(lesson.id)
                        return (
                          <motion.div key={lesson.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: li * 0.04, duration: 0.3 }}
                            onClick={() => router.push(`/aulas/${courseId}/${lesson.id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginTop: li === 0 ? 10 : 4,
                              borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s',
                              background: 'transparent',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                              {isCompleted ? <CheckIcon size={18} /> : (
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--b2)' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, color: isCompleted ? 'var(--t2)' : 'var(--t1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.7 : 1 }}>
                                {lesson.title}
                              </p>
                            </div>
                            {lesson.duration_min > 0 && (
                              <span style={{ fontSize: 10, color: 'var(--t4)', background: 'var(--base)', padding: '2px 8px', borderRadius: 4, flexShrink: 0, fontFamily: 'var(--mono, monospace)' }}>
                                {lesson.duration_min}min
                              </span>
                            )}
                          </motion.div>
                        )
                      })}
                      {modLessons.length === 0 && <p style={{ fontSize: 11, color: 'var(--t4)', padding: '10px 0' }}>Nenhuma aula disponivel neste modulo.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {modules.length === 0 && (
          <motion.div {...fadeUp(2)} style={{ textAlign: 'center', padding: 40, color: 'var(--t3)', fontSize: 13 }}>
            Este curso ainda nao possui conteudo.
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
