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
async function verifyModuleOwnership(moduleId, tenantId) {
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

// PUT: update module (admin only)
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

    const owns = await verifyModuleOwnership(id, ownerTenantId)
    if (!owns) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

    const allowed = ['title', 'sort_order']
    const payload = {}
    for (const key of allowed) {
      if (key in fields) payload[key] = fields[key]
    }

    const { data, error } = await sb()
      .from('course_modules')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

    return NextResponse.json({ ok: true, module: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: delete module (admin only)
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

    const owns = await verifyModuleOwnership(id, ownerTenantId)
    if (!owns) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

    const { error } = await sb()
      .from('course_modules')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
