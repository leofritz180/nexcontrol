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

// GET: list courses
export async function GET(req) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenant_id')
    const userId = req.nextUrl.searchParams.get('user_id')

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })

    // Validate access
    if (tenantId && tenantId !== ownerTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let query = sb()
      .from('courses')
      .select('*')
      .eq('tenant_id', ownerTenantId)
      .order('sort_order', { ascending: true })

    const { data: courses, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If user_id provided, attach progress summary per course
    if (userId && courses?.length) {
      const courseIds = courses.map(c => c.id)

      // Get all lessons for these courses
      const { data: modules } = await sb()
        .from('course_modules')
        .select('id,course_id')
        .in('course_id', courseIds)

      if (modules?.length) {
        const moduleIds = modules.map(m => m.id)
        const { data: lessons } = await sb()
          .from('course_lessons')
          .select('id,module_id')
          .in('module_id', moduleIds)

        const { data: progress } = await sb()
          .from('lesson_progress')
          .select('lesson_id,completed')
          .eq('user_id', userId)
          .eq('completed', true)

        const completedSet = new Set((progress || []).map(p => p.lesson_id))

        // Map lesson -> course
        const moduleMap = {}
        for (const m of modules) moduleMap[m.id] = m.course_id

        const courseLessonCount = {}
        const courseCompleted = {}
        for (const l of (lessons || [])) {
          const cid = moduleMap[l.module_id]
          courseLessonCount[cid] = (courseLessonCount[cid] || 0) + 1
          if (completedSet.has(l.id)) {
            courseCompleted[cid] = (courseCompleted[cid] || 0) + 1
          }
        }

        for (const c of courses) {
          c.total_lessons = courseLessonCount[c.id] || 0
          c.completed_lessons = courseCompleted[c.id] || 0
        }
      }
    }

    return NextResponse.json({ courses: courses || [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: create course (admin only)
export async function POST(req) {
  try {
    const body = await req.json()
    const { user_id, title, description, thumb_url, category, tags, status, sort_order } = body

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const profile = await getProfile(user_id)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })
    if (profile.tenant_id !== ownerTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const payload = {
      tenant_id: ownerTenantId,
      title: title || '',
      description: description || '',
      thumb_url: thumb_url || null,
      category: category || null,
      tags: tags || [],
      status: status || 'draft',
      sort_order: sort_order ?? 0,
    }

    const { data, error } = await sb()
      .from('courses')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, course: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
