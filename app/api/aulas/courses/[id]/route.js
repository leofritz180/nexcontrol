import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const OWNER_EMAIL = 'leofritz180@gmail.com'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getOwnerTenantId() {
  const { data } = await sb()
    .from('profiles')
    .select('tenant_id')
    .eq('email', OWNER_EMAIL)
    .maybeSingle()
  return data?.tenant_id || null
}

async function getProfile(userId) {
  const { data } = await sb()
    .from('profiles')
    .select('id,tenant_id,role')
    .eq('id', userId)
    .maybeSingle()
  return data
}

// GET: single course with modules + lessons + progress
export async function GET(req, { params }) {
  try {
    const { id } = await params
    const userId = req.nextUrl.searchParams.get('user_id')

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })

    // Fetch course
    const { data: course, error: cErr } = await sb()
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', ownerTenantId)
      .maybeSingle()

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Fetch modules ordered by sort_order
    const { data: modules, error: mErr } = await sb()
      .from('course_modules')
      .select('*')
      .eq('course_id', id)
      .order('sort_order', { ascending: true })

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    // Fetch lessons for all modules
    const moduleIds = (modules || []).map(m => m.id)
    let lessons = []
    if (moduleIds.length) {
      const { data: lData, error: lErr } = await sb()
        .from('course_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true })
      if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })
      lessons = lData || []
    }

    // Fetch progress if user_id provided
    let progressMap = {}
    if (userId && lessons.length) {
      const lessonIds = lessons.map(l => l.id)
      const { data: prog } = await sb()
        .from('lesson_progress')
        .select('lesson_id,completed,completed_at')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      for (const p of (prog || [])) {
        progressMap[p.lesson_id] = { completed: p.completed, completed_at: p.completed_at }
      }
    }

    // Build nested structure
    const lessonsByModule = {}
    for (const l of lessons) {
      if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
      const lessonObj = { ...l }
      if (userId) {
        lessonObj.progress = progressMap[l.id] || { completed: false, completed_at: null }
      }
      lessonsByModule[l.module_id].push(lessonObj)
    }

    const modulesWithLessons = (modules || []).map(m => ({
      ...m,
      lessons: lessonsByModule[m.id] || [],
    }))

    return NextResponse.json({
      course: {
        ...course,
        modules: modulesWithLessons,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT: update course (admin only)
export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { user_id, ...fields } = body

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const profile = await getProfile(user_id)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })
    if (profile.tenant_id !== ownerTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    // Only allow known fields
    const allowed = ['title', 'description', 'thumb_url', 'category', 'tags', 'status', 'sort_order']
    const payload = {}
    for (const key of allowed) {
      if (key in fields) payload[key] = fields[key]
    }

    const { data, error } = await sb()
      .from('courses')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', ownerTenantId)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    return NextResponse.json({ ok: true, course: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: delete course (admin only)
export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { user_id } = body

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const profile = await getProfile(user_id)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })
    if (profile.tenant_id !== ownerTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { error } = await sb()
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', ownerTenantId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
