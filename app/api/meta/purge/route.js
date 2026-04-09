import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { meta_id } = await req.json()
    if (!meta_id) return NextResponse.json({ error: 'Missing meta_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Permanent delete — remove remessas, logs, then meta
    await supabase.from('remessas').delete().eq('meta_id', meta_id)
    await supabase.from('activity_logs').delete().eq('meta_id', meta_id)
    await supabase.from('metas').delete().eq('id', meta_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
