import { NextResponse } from 'next/server'
import { authNetwork } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// GET /api/network/status
// Leve: ultima mensagem (geral e por canal) pra calcular "nao lidas" no client.
// Usado pelo dot do menu (Sidebar) e pelos dots dos canais.
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb } = a

  const { data: channels } = await sb.from('network_channels').select('id,key')
  const idToKey = {}; (channels || []).forEach(c => { idToKey[c.id] = c.key })

  const { data: recent } = await sb.from('network_messages')
    .select('channel_id,created_at').is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(300)

  const byChannel = {}
  let latest = null
  for (const m of (recent || [])) {
    const key = idToKey[m.channel_id]
    if (!key) continue
    if (!byChannel[key]) byChannel[key] = m.created_at // primeiro = mais recente (ordenado desc)
    if (!latest || m.created_at > latest) latest = m.created_at
  }
  return NextResponse.json({ latest, byChannel })
}
