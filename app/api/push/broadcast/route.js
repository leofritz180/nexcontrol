import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToAll } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

// POST /api/push/broadcast  body: { title, body, tag }
// Auth: header x-internal-auth com uma service_role key VÁLIDA do projeto
// (ou ?secret=CRON_SECRET). O cliente Supabase é montado com a chave enviada —
// a tabela push_subscriptions tem RLS, então só service_role enxerga todas as
// inscrições; anon/inválida vê 0 e não dispara nada. Web-push usa a VAPID do
// ambiente do servidor.
export async function POST(req) {
  const { searchParams } = new URL(req.url)
  const provided = req.headers.get('x-internal-auth') || searchParams.get('key') || ''
  const secret = searchParams.get('secret')

  let sbKey = null
  if (secret && process.env.CRON_SECRET && secret === process.env.CRON_SECRET) {
    sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  } else if (provided && provided.length >= 40) {
    sbKey = provided // service key enviada (RLS protege)
  }
  if (!sbKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, tag } = await req.json().catch(() => ({}))
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, sbKey, {
    auth: { persistSession: false },
  })
  const result = await sendPushToAll(sb, { title, body, tag: tag || 'nexcontrol-broadcast' })
  return NextResponse.json({ ok: true, ...result })
}
