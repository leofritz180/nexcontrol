import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToAll } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

// POST /api/push/broadcast?secret=CRON_SECRET  body: { title, body, tag }
// Envia push para TODAS as inscrições. Auth: ?secret=CRON_SECRET OU
// header x-internal-auth: SUPABASE_SERVICE_ROLE_KEY. Acao manual/owner.
export async function POST(req) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const internal = req.headers.get('x-internal-auth')
  const ok =
    (secret && secret === process.env.CRON_SECRET) ||
    (internal && internal === process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, tag } = await req.json().catch(() => ({}))
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const result = await sendPushToAll(sb, { title, body, tag: tag || 'nexcontrol-broadcast' })
  return NextResponse.json({ ok: true, ...result })
}
