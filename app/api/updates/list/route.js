import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/updates/list?user_id=XXX
// Retorna lista de updates publicados + quais o usuario ja leu.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: updates } = await sb.from('system_updates')
      .select('id, title, body, category, icon, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(30)

    let readIds = new Set()
    if (userId) {
      const { data: reads } = await sb.from('user_updates_read')
        .select('update_id')
        .eq('user_id', userId)
      readIds = new Set((reads || []).map(r => r.update_id))
    }

    const list = (updates || []).map(u => ({
      ...u,
      read: readIds.has(u.id),
    }))

    const unreadCount = list.filter(u => !u.read).length

    return NextResponse.json({ updates: list, unreadCount })
  } catch (e) {
    return NextResponse.json({ updates: [], unreadCount: 0, error: e.message }, { status: 500 })
  }
}
