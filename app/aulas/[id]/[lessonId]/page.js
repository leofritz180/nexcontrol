'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../../lib/supabase/client'
import AppLayout from '../../../../components/AppLayout'

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
function ProgressBar({ percent, height = 6 }) {
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease }}
        style={{ height: '100%', borderRadius: height / 2, background: `linear-gradient(90deg, ${AMBER_DK}, ${AMBER})` }} />
    </div>
  )
}

/* ── Check icon ── */
function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#ecfdf5" />
      <path d="M4.5 8.5L7 11L11.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Video embed helper ── */
function getEmbedUrl(url) {
  if (!url) return null
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  // Already embed or direct
  if (url.includes('embed') || url.includes('player')) return url
  return url
}

function isDirectVideo(url) {
  if (!url) return false
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
}

/* ════════════════════════════════════════════
   LESSON PLAYER PAGE
════════════════════════════════════════════ */
export default function LessonPlayerPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id
  const lessonId = params.lessonId

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [progress, setProgress] = useState(new Set())
  const [completing, setCompleting] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
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

      const current = (lsns || []).find(l => l.id === lessonId)
      setCurrentLesson(current)

      // Load progress
      const lessonIds = (lsns || []).map(l => l.id)
      if (lessonIds.length) {
        const { data: prog } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', u.id).eq('completed', true).in('lesson_id', lessonIds)
        setProgress(new Set((prog || []).map(pp => pp.lesson_id)))
      }
    }

    setLoading(false)
  }, [router, courseId, lessonId])

  useEffect(() => { load() }, [load])

  // Sorted list of all published lessons across modules
  const allSorted = useMemo(() => {
    return modules.flatMap(m =>
      lessons.filter(l => l.module_id === m.id && l.status === 'published').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    )
  }, [modules, lessons])

  const currentIdx = allSorted.findIndex(l => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allSorted[currentIdx - 1] : null
  const nextLessonObj = currentIdx < allSorted.length - 1 ? allSorted[currentIdx + 1] : null

  const totalLessons = allSorted.length
  const completedLessons = allSorted.filter(l => progress.has(l.id)).length
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const isCompleted = progress.has(lessonId)

  async function toggleCompletion() {
    setCompleting(true)
    if (isCompleted) {
      // Mark incomplete
      await supabase.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', lessonId)
      setProgress(prev => { const s = new Set(prev); s.delete(lessonId); return s })
    } else {
      // Mark complete — upsert
      await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
      setProgress(prev => new Set([...prev, lessonId]))
    }
    setCompleting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  const embedUrl = getEmbedUrl(currentLesson?.video_url)
  const directVideo = isDirectVideo(currentLesson?.video_url)
  const getName = p => p?.nome || p?.email?.split('@')[0] || 'User'

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', flexDirection: 'row' }} className="lesson-layout">
        {/* ── Main Content ── */}
        <div style={{ flex: 1, minWidth: 0, padding: '24px 20px', overflowY: 'auto' }}>
          {/* Progress Bar */}
          <motion.div {...fadeUp(0)} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--t4)' }}>Progresso do curso</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: AMBER, fontFamily: 'var(--mono, monospace)' }}>{percent}%</span>
            </div>
            <ProgressBar percent={percent} />
          </motion.div>

          {/* Video Player */}
          <motion.div {...fadeUp(1)} style={{
            width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20,
            background: '#000', border: '1px solid var(--b1)',
            aspectRatio: '16/9', position: 'relative',
          }}>
            {directVideo ? (
              <video src={currentLesson?.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : embedUrl ? (
              <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t4)', fontSize: 13 }}>
                Video nao disponivel
              </div>
            )}
          </motion.div>

          {/* Title + Description */}
          <motion.div {...fadeUp(2)} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em', flex: 1, minWidth: 200 }}>
                {currentLesson?.title || 'Aula'}
              </h1>
              {currentLesson?.duration_min > 0 && (
                <span style={{ fontSize: 11, color: AMBER, background: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 6, fontWeight: 600, fontFamily: 'var(--mono, monospace)', flexShrink: 0 }}>
                  {currentLesson.duration_min}min
                </span>
              )}
            </div>
            {currentLesson?.description && (
              <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{currentLesson.description}</p>
            )}
          </motion.div>

          {/* Materials */}
          {currentLesson?.materials && (
            <motion.div {...fadeUp(3)} style={{
              padding: '16px 20px', borderRadius: 12, marginBottom: 20,
              background: 'var(--surface)', border: '1px solid var(--b1)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Materiais</p>
              <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{currentLesson.materials}</p>
            </motion.div>
          )}

          {/* Actions: Complete + Nav */}
          <motion.div {...fadeUp(4)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {/* Mark Complete */}
            <button onClick={toggleCompletion} disabled={completing}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 13, fontWeight: 700,
                borderRadius: 10, border: 'none', cursor: completing ? 'not-allowed' : 'pointer',
                background: isCompleted ? 'rgba(236,253,245,0.15)' : `linear-gradient(135deg, ${AMBER}, ${AMBER_DK})`,
                color: isCompleted ? '#ecfdf5' : '#000',
                transition: 'all 0.2s',
                boxShadow: isCompleted ? 'none' : '0 4px 16px rgba(255,255,255,0.25)',
              }}>
              {isCompleted && <CheckIcon size={16} />}
              {completing ? 'Salvando...' : isCompleted ? 'Concluida' : 'Marcar como concluida'}
            </button>

            {/* Prev / Next */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => prevLesson && router.push(`/aulas/${courseId}/${prevLesson.id}`)} disabled={!prevLesson}
                style={{
                  padding: '9px 18px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                  border: '1px solid var(--b2)', background: 'transparent', color: prevLesson ? 'var(--t2)' : 'var(--t4)',
                  cursor: prevLesson ? 'pointer' : 'not-allowed', opacity: prevLesson ? 1 : 0.4, transition: 'all 0.2s',
                }}>
                &#8592; Anterior
              </button>
              <button onClick={() => nextLessonObj && router.push(`/aulas/${courseId}/${nextLessonObj.id}`)} disabled={!nextLessonObj}
                style={{
                  padding: '9px 18px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none',
                  background: nextLessonObj ? AMBER : 'var(--surface)', color: nextLessonObj ? '#000' : 'var(--t4)',
                  cursor: nextLessonObj ? 'pointer' : 'not-allowed', opacity: nextLessonObj ? 1 : 0.4, transition: 'all 0.2s',
                }}>
                Proxima &#8594;
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Sidebar: Lesson List ── */}
        <div className="lesson-sidebar" style={{
          width: 300, flexShrink: 0, borderLeft: '1px solid var(--b1)', background: 'var(--surface)',
          overflowY: 'auto', padding: '16px 0',
        }}>
          <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--b1)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: AMBER, marginBottom: 4 }}>{course?.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ProgressBar percent={percent} height={4} />
              <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono, monospace)', flexShrink: 0 }}>{percent}%</span>
            </div>
          </div>

          {modules.map((mod, mi) => {
            const modLessons = lessons.filter(l => l.module_id === mod.id && l.status === 'published').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            if (modLessons.length === 0) return null

            return (
              <div key={mod.id} style={{ borderBottom: '1px solid var(--b1)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px 4px' }}>
                  {mod.title}
                </p>
                {modLessons.map((lesson) => {
                  const isCurrent = lesson.id === lessonId
                  const done = progress.has(lesson.id)
                  return (
                    <div key={lesson.id} onClick={() => router.push(`/aulas/${courseId}/${lesson.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', cursor: 'pointer',
                        background: isCurrent ? 'rgba(255,255,255,0.1)' : 'transparent',
                        borderLeft: isCurrent ? `3px solid ${AMBER}` : '3px solid transparent',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}>
                      <div style={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                        {done ? <CheckIcon size={14} /> : (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${isCurrent ? AMBER : 'var(--b2)'}` }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 12, fontWeight: isCurrent ? 600 : 400,
                          color: isCurrent ? AMBER : done ? 'var(--t3)' : 'var(--t2)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {lesson.title}
                        </p>
                      </div>
                      {lesson.duration_min > 0 && (
                        <span style={{ fontSize: 9, color: 'var(--t4)', flexShrink: 0, fontFamily: 'var(--mono, monospace)' }}>{lesson.duration_min}m</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── Responsive Styles ── */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @media (max-width: 768px) {
            .lesson-layout { flex-direction: column !important; }
            .lesson-sidebar { width: 100% !important; border-left: none !important; border-top: 1px solid var(--b1); max-height: 300px; }
          }
        `}</style>
      </div>
    </AppLayout>
  )
}
