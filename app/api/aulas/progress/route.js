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

// GET: get user progress
export async function GET(req) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id')
    const courseId = req.nextUrl.searchParams.get('course_id')

    if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const profile = await getProfile(userId)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })
    if (profile.tenant_id !== ownerTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    // If course_id provided, get progress only for that course's lessons
    if (courseId) {
      const { data: modules } = await sb()
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId)

      const moduleIds = (modules || []).map(m => m.id)
      if (!moduleIds.length) return NextResponse.json({ progress: [] })

      const { data: lessons } = await sb()
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = (lessons || []).map(l => l.id)
      if (!lessonIds.length) return NextResponse.json({ progress: [] })

      const { data: progress, error } = await sb()
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ progress: progress || [] })
    }

    // Otherwise get all progress for this user
    const { data: progress, error } = await sb()
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ progress: progress || [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: mark lesson complete/incomplete
export async function POST(req) {
  try {
    const body = await req.json()
    const { user_id, lesson_id, completed } = body

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (!lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

    const profile = await getProfile(user_id)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })
    if (profile.tenant_id !== ownerTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    // Both admin and operator can update their own progress
    const isCompleted = completed !== false

    // Check if progress record exists
    const { data: existing } = await sb()
      .from('lesson_progress')
      .select('id')
      .eq('user_id', user_id)
      .eq('lesson_id', lesson_id)
      .maybeSingle()

    let data, error
    if (existing) {
      const res = await sb()
        .from('lesson_progress')
        .update({
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle()
      data = res.data
      error = res.error
    } else {
      const res = await sb()
        .from('lesson_progress')
        .insert({
          user_id,
          lesson_id,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .select()
        .maybeSingle()
      data = res.data
      error = res.error
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, progress: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
