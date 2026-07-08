import { NextResponse } from 'next/server'
import { authNetwork } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// GET /api/network/mod-log  -> ultimas 100 acoes de moderacao (SOMENTE owner)
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  if (!a.isOwner) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { sb } = a
  const { data } = await sb.from('network_mod_log')
    .select('action,target_name,actor_name,reason,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return NextResponse.json({ log: data || [] })
}
