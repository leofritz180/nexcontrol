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

// Verify module belongs to a course owned by the tenant
async function verifyModuleBelongsToTenant(moduleId, tenantId) {
  const { data: mod } = await sb()
    .from('course_modules')
    .select('id,course_id')
    .eq('id', moduleId)
    .maybeSingle()

  if (!mod) return false

  const { data: course } = await sb()
    .from('courses')
    .select('id')
    .eq('id', mod.course_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  return !!course
}

// POST: create lesson (admin only)
export async function POST(req) {
  try {
    const body = await req.json()
    const { user_id, module_id, title, description, video_url, thumb_url, materials, duration_min, sort_order, status } = body

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (!module_id) return NextResponse.json({ error: 'module_id required' }, { status: 400 })

    const profile = await getProfile(user_id)
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ownerTenantId = await getOwnerTenantId()
    if (!ownerTenantId) return NextResponse.json({ error: 'Owner not found' }, { status: 500 })
    if (profile.tenant_id !== ownerTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const belongs = await verifyModuleBelongsToTenant(module_id, ownerTenantId)
    if (!belongs) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

    const payload = {
      module_id,
      title: title || '',
      description: description || '',
      video_url: video_url || null,
      thumb_url: thumb_url || null,
      materials: materials || null,
      duration_min: duration_min ?? null,
      sort_order: sort_order ?? 0,
      status: status || 'draft',
    }

    const { data, error } = await sb()
      .from('course_lessons')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, lesson: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
