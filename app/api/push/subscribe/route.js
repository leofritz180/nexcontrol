import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { endpoint, p256dh, auth, user_id, tenant_id } = await req.json()

    if (!endpoint || !p256dh || !auth || !user_id || !tenant_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Upsert — update if same endpoint exists
    const { error } = await supabase.from('push_subscriptions').upsert(
      { endpoint, p256dh, auth, user_id, tenant_id, updated_at: new Date().toISOString() },
      { onConflict: 'endpoint' }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
