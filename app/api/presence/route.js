import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST = ping (update presence) + return count
// GET = just return count
export async function POST(req) {
  try {
    const { user_id } = await req.json()
    if (user_id) {
      await sb.from('presence').upsert(
        { user_id, last_seen: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }
    const cutoff = new Date(Date.now() - 300000).toISOString() // 5min ago
    const { count } = await sb.from('presence').select('*', { count: 'exact', head: true }).gte('last_seen', cutoff)
    return NextResponse.json({ online: count || 0 })
  } catch (err) {
    return NextResponse.json({ online: 0 })
  }
}

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - 300000).toISOString() // 5min ago
    const { count } = await sb.from('presence').select('*', { count: 'exact', head: true }).gte('last_seen', cutoff)
    return NextResponse.json({ online: count || 0 })
  } catch {
    return NextResponse.json({ online: 0 })
  }
}
