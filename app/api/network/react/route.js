import { NextResponse } from 'next/server'
import { authNetwork } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

const ALLOWED = new Set(['🔥', '✅', '👀', '🚀', '💰'])

// POST /api/network/react  body: { message_id, emoji }
// Toggle: se ja reagiu com aquele emoji, remove; senao adiciona (1 por emoji/user/msg).
export async function POST(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb, user } = a

  const body = await req.json().catch(() => ({}))
  const message_id = body.message_id
  const emoji = String(body.emoji || '')
  if (!message_id || !ALLOWED.has(emoji)) return NextResponse.json({ error: 'Reação inválida' }, { status: 400 })

  const { data: msg } = await sb.from('network_messages').select('id,deleted_at').eq('id', message_id).maybeSingle()
  if (!msg || msg.deleted_at) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })

  const { data: existing } = await sb.from('network_reactions')
    .select('id').eq('message_id', message_id).eq('user_id', user.id).eq('emoji', emoji).maybeSingle()

  if (existing) {
    await sb.from('network_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ ok: true, reacted: false })
  }
  const { error } = await sb.from('network_reactions').insert({ message_id, user_id: user.id, emoji })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, reacted: true })
}
