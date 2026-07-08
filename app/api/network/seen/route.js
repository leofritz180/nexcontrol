import { NextResponse } from 'next/server'
import { authNetwork, getMembers } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// GET /api/network/seen?message_id=<uuid>  (SÓ OWNER)
// "Quem visualizou" = membros cujo marcador de leitura do canal (last_read_at)
// é >= created_at da mensagem. Aproximação estilo WhatsApp (passou por ela).
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  if (!a.isOwner) return NextResponse.json({ error: 'Só o admin master vê isso.' }, { status: 403 })
  const { sb } = a
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('message_id')
  if (!messageId) return NextResponse.json({ error: 'message_id obrigatório' }, { status: 400 })

  const { data: msg } = await sb.from('network_messages').select('id,channel_id,author_id,created_at').eq('id', messageId).maybeSingle()
  if (!msg) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })

  // quem leu o canal em algum momento >= a hora da mensagem
  const { data: reads } = await sb.from('network_channel_reads')
    .select('user_id,last_read_at').eq('channel_id', msg.channel_id).gte('last_read_at', msg.created_at)
  const readAt = {}; (reads || []).forEach(r => { readAt[r.user_id] = r.last_read_at })

  // cruza com os membros (nome/avatar) — exclui o autor
  const members = await getMembers(sb)
  const seen = members
    .filter(m => readAt[m.id] && m.id !== msg.author_id)
    .map(m => ({ id: m.id, name: m.name, avatar: m.avatar, color: m.color, at: readAt[m.id] }))
    .sort((x, y) => new Date(y.at) - new Date(x.at))

  return NextResponse.json({ count: seen.length, seen })
}
