import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/updates/mark-read { user_id, update_ids?: [] }
// Se update_ids vazio → marca TODOS como lidos pra esse user.
export async function POST(req) {
  try {
    const { user_id, update_ids } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'missing user_id' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    let toMark = update_ids
    if (!toMark || toMark.length === 0) {
      // Pega TODOS updates ainda nao lidos pelo user
      const { data: pub } = await sb.from('system_updates').select('id').eq('published', true)
      const allIds = (pub || []).map(p => p.id)
      const { data: alreadyRead } = await sb.from('user_updates_read')
        .select('update_id').eq('user_id', user_id)
      const readSet = new Set((alreadyRead || []).map(r => r.update_id))
      toMark = allIds.filter(id => !readSet.has(id))
    }

    if (toMark.length === 0) return NextResponse.json({ ok: true, marked: 0 })

    const rows = toMark.map(id => ({ user_id, update_id: id }))
    const { error } = await sb.from('user_updates_read').upsert(rows, { onConflict: 'user_id,update_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, marked: toMark.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
