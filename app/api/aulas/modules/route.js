import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { aulasEnabled } from 'lib/aulas-tenants'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getProfile(userId) {
  const { data } = await sb()
    .from('profiles')
    .select('id,tenant_id,role')
    .eq('id', userId)
    .maybeSingle()
  return data
}

// POST: create module (admin only)
export async function POST(req) {
  try {
    const body = await req.json()
    const { user_id, course_id, title, sort_order } = body

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

    const profile = await getProfile(user_id)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!aulasEnabled(profile.tenant_id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    // Verify course belongs to tenant
    const { data: course } = await sb()
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle()

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const payload = {
      course_id,
      title: title || '',
      sort_order: sort_order ?? 0,
    }

    const { data, error } = await sb()
      .from('course_modules')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, module: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
