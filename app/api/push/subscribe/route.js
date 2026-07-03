import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { endpoint, p256dh, auth, user_id, tenant_id, old_endpoint } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Caso ROTACAO (vindo do Service Worker): sem user_id, mas com old_endpoint.
    // Migra a inscricao antiga -> nova preservando o dono (user_id/tenant_id).
    if ((!user_id || !tenant_id) && old_endpoint) {
      const { data: existing } = await supabase
        .from('push_subscriptions').select('user_id, tenant_id').eq('endpoint', old_endpoint).maybeSingle()
      if (!existing?.user_id) {
        return NextResponse.json({ ok: true, migrated: false }) // sem match — cliente re-inscreve ao abrir
      }
      await supabase.from('push_subscriptions').upsert(
        { endpoint, p256dh, auth, user_id: existing.user_id, tenant_id: existing.tenant_id, updated_at: new Date().toISOString() },
        { onConflict: 'endpoint' }
      )
      if (old_endpoint !== endpoint) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', old_endpoint)
      }
      return NextResponse.json({ ok: true, migrated: true })
    }

    if (!user_id || !tenant_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Upsert normal (cliente) — update if same endpoint exists
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
