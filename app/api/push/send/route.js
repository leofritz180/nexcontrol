import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser, sendPushToTenant } from '../../../../lib/push'

export async function POST(req) {
  try {
    const { user_id, tenant_id, title, body, url, tag } = await req.json()

    if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })
    if (!user_id && !tenant_id) return NextResponse.json({ error: 'Need user_id or tenant_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const payload = { title, body: body || '', url: url || '/', tag }

    let result
    if (user_id) {
      result = await sendPushToUser(supabase, user_id, payload)
    } else {
      result = await sendPushToTenant(supabase, tenant_id, payload)
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
