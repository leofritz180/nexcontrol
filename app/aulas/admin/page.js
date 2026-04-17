'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabase/client'
import AppLayout from '../../../components/AppLayout'

const ADMIN_EMAIL = 'leofritz180@gmail.com'
const AMBER = '#F59E0B'
const AMBER_DK = '#D97706'
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.05, ease } })

/* ── Spinner ── */
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, border: `3px solid rgba(245,158,11,0.2)`, borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Inline Editable Field ── */
function Field({ label, value, onChange, type = 'text', placeholder = '', multiline = false }) {
  const base = {
    width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
    background: 'var(--surface)', border: '1px solid var(--b2)', borderRadius: 8,
    color: 'var(--t1)', outline: 'none', transition: 'border 0.2s',
  }
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = AMBER} onBlur={e => e.target.style.borderColor = 'var(--b2)'} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={e => e.target.style.borderColor = AMBER} onBlur={e => e.target.style.borderColor = 'var(--b2)'} />
      )}
    </div>
  )
}

/* ── Button ── */
function Btn({ children, onClick, color = AMBER, small = false, outline = false, disabled = false, style: extra = {} }) {
  const [h, setH] = useState(false)
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: small ? '5px 12px' : '8px 18px', fontSize: small ? 11 : 13, fontWeight: 600,
        borderRadius: 8, border: outline ? `1px solid ${color}` : 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: outline ? 'transparent' : (h ? AMBER_DK : color), color: outline ? color : '#000',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.2s', ...extra,
      }}>
      {children}
    </button>
  )
}

/* ── Toggle Switch ── */
function Toggle({ on, onToggle, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={onToggle}>
      <div style={{
        width: 36, height: 20, borderRadius: 10, position: 'relative', transition: 'background 0.2s',
        background: on ? AMBER : 'var(--b2)',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
          left: on ? 18 : 2, transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 11, color: on ? AMBER : 'var(--t3)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

/* ── Arrow Buttons for reorder ── */
function ArrowBtns({ onUp, onDown, disableUp, disableDown }) {
  const arrowStyle = (disabled) => ({
    background: 'transparent', border: '1px solid var(--b2)', borderRadius: 6, width: 24, height: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? 'var(--t4)' : 'var(--t2)', fontSize: 12, opacity: disabled ? 0.4 : 1,
  })
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      <button style={arrowStyle(disableUp)} onClick={onUp} disabled={disableUp}>&#9650;</button>
      <button style={arrowStyle(disableDown)} onClick={onDown} disabled={disableDown}>&#9660;</button>
    </div>
  )
}

/* ── Lesson Row ── */
function LessonRow({ lesson, idx, total, onSave, onDelete, onMove }) {
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({ title: lesson.title || '', description: lesson.description || '', video_url: lesson.video_url || '', thumb_url: lesson.thumb_url || '', materials: lesson.materials || '', duration_min: lesson.duration_min || 0, status: lesson.status || 'draft' })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <motion.div {...fadeUp(idx)} style={{ padding: '10px 14px', background: 'var(--base)', borderRadius: 8, border: '1px solid var(--b1)', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <ArrowBtns onUp={() => onMove('up')} onDown={() => onMove('down')} disableUp={idx === 0} disableDown={idx === total - 1} />
          <span style={{ fontSize: 12, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title || 'Sem titulo'}</span>
          <span style={{ fontSize: 10, color: 'var(--t4)', flexShrink: 0 }}>{lesson.duration_min || 0}min</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: lesson.status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: lesson.status === 'published' ? '#22c55e' : AMBER, fontWeight: 600, flexShrink: 0 }}>{lesson.status}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Btn small outline onClick={() => setEditing(!editing)}>{editing ? 'Fechar' : 'Editar'}</Btn>
          <Btn small outline color="#ef4444" onClick={onDelete}>X</Btn>
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden', marginTop: 10 }}>
            <Field label="Titulo" value={f.title} onChange={v => set('title', v)} />
            <Field label="Descricao" value={f.description} onChange={v => set('description', v)} multiline />
            <Field label="Video URL" value={f.video_url} onChange={v => set('video_url', v)} placeholder="YouTube/Vimeo URL" />
            <Field label="Thumbnail URL" value={f.thumb_url} onChange={v => set('thumb_url', v)} />
            <Field label="Materiais" value={f.materials} onChange={v => set('materials', v)} multiline />
            <Field label="Duracao (min)" value={f.duration_min} onChange={v => set('duration_min', v)} type="number" />
            <Toggle on={f.status === 'published'} onToggle={() => set('status', f.status === 'published' ? 'draft' : 'published')} label={f.status === 'published' ? 'Publicado' : 'Rascunho'} />
            <div style={{ marginTop: 8 }}>
              <Btn small onClick={() => { onSave({ ...lesson, ...f, duration_min: Number(f.duration_min) || 0 }); setEditing(false) }}>Salvar</Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Module Section ── */
function ModuleSection({ mod, idx, total, lessons, onSaveMod, onDeleteMod, onMoveMod, onSaveLesson, onDeleteLesson, onMoveLesson, onAddLesson }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(mod.title || '')
  const modLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return (
    <motion.div {...fadeUp(idx)} style={{ marginBottom: 10, background: 'var(--raised)', borderRadius: 12, border: '1px solid var(--b1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', gap: 8 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <ArrowBtns onUp={() => onMoveMod('up')} onDown={() => onMoveMod('down')} disableUp={idx === 0} disableDown={idx === total - 1} />
          <span style={{ color: AMBER, fontSize: 11, fontWeight: 700 }}>M{idx + 1}</span>
          <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title || 'Modulo sem titulo'}</span>
          <span style={{ fontSize: 10, color: 'var(--t4)' }}>({modLessons.length} aulas)</span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <Btn small outline onClick={() => setEditing(!editing)}>{editing ? 'Fechar' : 'Editar'}</Btn>
          <Btn small outline color="#ef4444" onClick={() => onDeleteMod()}>X</Btn>
          <span style={{ fontSize: 16, color: 'var(--t3)', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', cursor: 'pointer', userSelect: 'none' }} onClick={() => setExpanded(!expanded)}>&#9660;</span>
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden', padding: '0 16px 12px' }}>
            <Field label="Titulo do Modulo" value={title} onChange={setTitle} />
            <Btn small onClick={() => { onSaveMod({ ...mod, title }); setEditing(false) }}>Salvar</Btn>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', padding: '0 16px 14px' }}>
            {modLessons.map((l, li) => (
              <LessonRow key={l.id} lesson={l} idx={li} total={modLessons.length}
                onSave={onSaveLesson} onDelete={() => onDeleteLesson(l.id)}
                onMove={(dir) => onMoveLesson(l.id, dir, modLessons)} />
            ))}
            <Btn small outline onClick={() => onAddLesson(mod.id)} style={{ marginTop: 6 }}>+ Aula</Btn>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Course Form ── */
function CourseForm({ initial, onSave, onCancel, saving }) {
  const [f, setF] = useState({
    title: initial?.title || '', description: initial?.description || '', category: initial?.category || '',
    thumb_url: initial?.thumb_url || '', tags: (initial?.tags || []).join(', '), status: initial?.status || 'draft',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
      style={{ padding: 20, background: 'var(--raised)', borderRadius: 14, border: `1px solid rgba(245,158,11,0.2)`, marginBottom: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: AMBER, marginBottom: 14 }}>{initial ? 'Editar Curso' : 'Criar Curso'}</p>
      <Field label="Titulo" value={f.title} onChange={v => set('title', v)} />
      <Field label="Descricao" value={f.description} onChange={v => set('description', v)} multiline />
      <Field label="Categoria" value={f.category} onChange={v => set('category', v)} />
      <Field label="Thumbnail URL" value={f.thumb_url} onChange={v => set('thumb_url', v)} />
      <Field label="Tags (separadas por virgula)" value={f.tags} onChange={v => set('tags', v)} />
      <Toggle on={f.status === 'published'} onToggle={() => set('status', f.status === 'published' ? 'draft' : 'published')} label={f.status === 'published' ? 'Publicado' : 'Rascunho'} />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Btn onClick={() => onSave({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) })} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
        <Btn outline onClick={onCancel}>Cancelar</Btn>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function AulasAdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)

  /* ── Auth + Load ── */
  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    if (u.email !== ADMIN_EMAIL) { router.push('/admin'); return }
    setUser(u)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p) { router.push('/login'); return }
    setProfile(p)

    const { data: t } = await supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle()
    setTenant(t)
    const { data: su } = await supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    setSub(su)

    // Load courses
    const res = await fetch(`/api/aulas/courses?tenant_id=${p.tenant_id}`)
    const json = await res.json()
    setCourses(json.courses || [])

    // Load all modules and lessons
    const { data: mods } = await supabase.from('course_modules').select('*').order('sort_order', { ascending: true })
    setModules(mods || [])
    const { data: lsns } = await supabase.from('course_lessons').select('*').order('sort_order', { ascending: true })
    setLessons(lsns || [])

    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  /* ── Course CRUD ── */
  async function saveCourse(fields) {
    setSaving(true)
    if (editCourse) {
      const { error } = await supabase.from('courses').update(fields).eq('id', editCourse.id)
      if (!error) setCourses(prev => prev.map(c => c.id === editCourse.id ? { ...c, ...fields } : c))
    } else {
      const res = await fetch('/api/aulas/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...fields }),
      })
      const json = await res.json()
      if (json.course) setCourses(prev => [...prev, json.course])
    }
    setSaving(false); setShowForm(false); setEditCourse(null)
  }

  async function deleteCourse(id) {
    if (!confirm('Deletar este curso e todos os modulos/aulas?')) return
    // Delete lessons, modules, then course
    const mods = modules.filter(m => m.course_id === id)
    for (const m of mods) {
      await supabase.from('course_lessons').delete().eq('module_id', m.id)
    }
    await supabase.from('course_modules').delete().eq('course_id', id)
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    setModules(prev => prev.filter(m => m.course_id !== id))
    setLessons(prev => prev.filter(l => !mods.some(m => m.id === l.module_id)))
  }

  async function toggleCourseStatus(course) {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    await supabase.from('courses').update({ status: newStatus }).eq('id', course.id)
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: newStatus } : c))
  }

  /* ── Module CRUD ── */
  async function addModule(courseId) {
    const maxOrder = modules.filter(m => m.course_id === courseId).reduce((mx, m) => Math.max(mx, m.sort_order || 0), 0)
    const { data, error } = await supabase.from('course_modules').insert({ course_id: courseId, title: 'Novo Modulo', sort_order: maxOrder + 1 }).select().maybeSingle()
    if (data) setModules(prev => [...prev, data])
  }

  async function saveModule(mod) {
    const { error } = await supabase.from('course_modules').update({ title: mod.title }).eq('id', mod.id)
    if (!error) setModules(prev => prev.map(m => m.id === mod.id ? { ...m, title: mod.title } : m))
  }

  async function deleteModule(id) {
    if (!confirm('Deletar este modulo e suas aulas?')) return
    await supabase.from('course_lessons').delete().eq('module_id', id)
    await supabase.from('course_modules').delete().eq('id', id)
    setModules(prev => prev.filter(m => m.id !== id))
    setLessons(prev => prev.filter(l => l.module_id !== id))
  }

  async function moveModule(modId, dir, courseId) {
    const courseMods = modules.filter(m => m.course_id === courseId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const idx = courseMods.findIndex(m => m.id === modId)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === courseMods.length - 1)) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = courseMods[idx], b = courseMods[swapIdx]
    const aOrder = a.sort_order, bOrder = b.sort_order
    await supabase.from('course_modules').update({ sort_order: bOrder }).eq('id', a.id)
    await supabase.from('course_modules').update({ sort_order: aOrder }).eq('id', b.id)
    setModules(prev => prev.map(m => {
      if (m.id === a.id) return { ...m, sort_order: bOrder }
      if (m.id === b.id) return { ...m, sort_order: aOrder }
      return m
    }))
  }

  /* ── Lesson CRUD ── */
  async function addLesson(moduleId) {
    const maxOrder = lessons.filter(l => l.module_id === moduleId).reduce((mx, l) => Math.max(mx, l.sort_order || 0), 0)
    const { data } = await supabase.from('course_lessons').insert({ module_id: moduleId, title: 'Nova Aula', sort_order: maxOrder + 1, status: 'draft', duration_min: 0 }).select().maybeSingle()
    if (data) setLessons(prev => [...prev, data])
  }

  async function saveLesson(lesson) {
    const { id, module_id, ...fields } = lesson
    const { error } = await supabase.from('course_lessons').update(fields).eq('id', id)
    if (!error) setLessons(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l))
  }

  async function deleteLesson(id) {
    if (!confirm('Deletar esta aula?')) return
    await supabase.from('course_lessons').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  async function moveLesson(lessonId, dir, modLessons) {
    const sorted = [...modLessons].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const idx = sorted.findIndex(l => l.id === lessonId)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === sorted.length - 1)) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = sorted[idx], b = sorted[swapIdx]
    const aOrder = a.sort_order, bOrder = b.sort_order
    await supabase.from('course_lessons').update({ sort_order: bOrder }).eq('id', a.id)
    await supabase.from('course_lessons').update({ sort_order: aOrder }).eq('id', b.id)
    setLessons(prev => prev.map(l => {
      if (l.id === a.id) return { ...l, sort_order: bOrder }
      if (l.id === b.id) return { ...l, sort_order: aOrder }
      return l
    }))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
              Aulas VIP <span style={{ color: AMBER }}>DARKZIN</span> - Admin
            </h1>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{courses.length} cursos cadastrados</p>
          </div>
          <Btn onClick={() => { setEditCourse(null); setShowForm(true) }}>+ Criar Curso</Btn>
        </motion.div>

        {/* Course Form */}
        <AnimatePresence>
          {showForm && (
            <CourseForm initial={editCourse} onSave={saveCourse} onCancel={() => { setShowForm(false); setEditCourse(null) }} saving={saving} />
          )}
        </AnimatePresence>

        {/* Courses List */}
        {courses.length === 0 && !loading && (
          <motion.div {...fadeUp(1)} style={{ textAlign: 'center', padding: 60, color: 'var(--t3)', fontSize: 14 }}>
            Nenhum curso criado ainda. Clique em "Criar Curso" para comecar.
          </motion.div>
        )}

        {courses.map((course, ci) => {
          const courseMods = modules.filter(m => m.course_id === course.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          const isExpanded = expandedCourse === course.id

          return (
            <motion.div key={course.id} {...fadeUp(ci + 1)}
              style={{
                marginBottom: 14, borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(145deg, var(--surface), var(--raised))',
                border: `1px solid ${isExpanded ? 'rgba(245,158,11,0.25)' : 'var(--b1)'}`,
                transition: 'border 0.3s',
              }}>
              {/* Course Header */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
                onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{course.title || 'Sem titulo'}</span>
                    <span style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase',
                      background: course.status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                      color: course.status === 'published' ? '#22c55e' : AMBER,
                    }}>{course.status}</span>
                    {course.category && <span style={{ fontSize: 10, color: 'var(--t3)', background: 'var(--base)', padding: '2px 8px', borderRadius: 4 }}>{course.category}</span>}
                  </div>
                  {course.description && <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <Toggle on={course.status === 'published'} onToggle={() => toggleCourseStatus(course)} label="" />
                  <Btn small outline onClick={() => { setEditCourse(course); setShowForm(true) }}>Editar</Btn>
                  <Btn small outline color="#ef4444" onClick={() => deleteCourse(course.id)}>Deletar</Btn>
                  <span style={{ fontSize: 18, color: 'var(--t3)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', cursor: 'pointer' }}
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>&#9660;</span>
                </div>
              </div>

              {/* Expanded: Modules */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden', padding: '0 20px 16px', borderTop: '1px solid var(--b1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 10px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>Modulos ({courseMods.length})</span>
                      <Btn small outline onClick={() => addModule(course.id)}>+ Modulo</Btn>
                    </div>
                    {courseMods.map((mod, mi) => (
                      <ModuleSection key={mod.id} mod={mod} idx={mi} total={courseMods.length} lessons={lessons}
                        onSaveMod={saveModule} onDeleteMod={() => deleteModule(mod.id)}
                        onMoveMod={(dir) => moveModule(mod.id, dir, course.id)}
                        onSaveLesson={saveLesson} onDeleteLesson={deleteLesson}
                        onMoveLesson={moveLesson} onAddLesson={addLesson} />
                    ))}
                    {courseMods.length === 0 && <p style={{ fontSize: 11, color: 'var(--t4)', padding: '8px 0' }}>Nenhum modulo ainda.</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </AppLayout>
  )
}
