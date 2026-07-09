import { NextResponse } from 'next/server'
import { authNetwork, getMembers, buildAuthorMap } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// GET /api/network/metrics  (SÓ OWNER) — métricas de uso/acesso do Network.
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  if (!a.isOwner) return NextResponse.json({ error: 'Só o admin master vê isso.' }, { status: 403 })
  const { sb } = a

  const now = Date.now()
  const iso = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString()
  const d7 = iso(7), d1 = iso(1)

  const [members, npsRes, msgsRes, reactRes, commentsRes, readsRes] = await Promise.all([
    getMembers(sb),
    sb.from('network_profiles').select('user_id,last_active').not('last_active', 'is', null),
    sb.from('network_messages').select('author_id,created_at,fake_name').is('deleted_at', null).order('created_at', { ascending: false }).limit(4000),
    sb.from('network_reactions').select('id', { count: 'exact', head: true }),
    sb.from('network_comments').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    sb.from('network_channel_reads').select('user_id', { count: 'exact', head: true }),
  ])

  // Acesso (presença): last_active atualiza a cada abertura do feed
  const nps = npsRes.data || []
  const accessedEver = nps.length
  const accessed7d = nps.filter(n => n.last_active > d7).length
  const accessed24h = nps.filter(n => n.last_active > d1).length

  // Mensagens (exclui sementes fake e mensagens de sistema)
  const msgs = (msgsRes.data || []).filter(m => m.author_id && !m.fake_name)
  const messagesTotal = msgs.length
  const messages7d = msgs.filter(m => m.created_at > d7).length
  const messages24h = msgs.filter(m => m.created_at > d1).length
  const postedAdmins = new Set(msgs.map(m => m.author_id)).size

  // Série por dia (últimos 14 dias): mensagens/dia
  const days = []
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now - i * 86400000)
    const key = start.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    days.push({ date: key, messages: 0 })
  }
  const dayIdx = {}; days.forEach((d, i) => { dayIdx[d.date] = i })
  for (const m of msgs) {
    const key = new Date(m.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    if (key in dayIdx) days[dayIdx[key]].messages++
  }

  // Top contribuidores (por nº de mensagens)
  const byAuthor = {}
  for (const m of msgs) byAuthor[m.author_id] = (byAuthor[m.author_id] || 0) + 1
  const topIds = Object.keys(byAuthor).sort((x, y) => byAuthor[y] - byAuthor[x]).slice(0, 8)
  const authorMap = await buildAuthorMap(sb, topIds)
  const top = topIds.map(id => ({ id, name: authorMap[id]?.name || 'admin', avatar: authorMap[id]?.avatar || null, color: authorMap[id]?.color || '#e53935', msgs: byAuthor[id] }))

  return NextResponse.json({
    eligible: members.length,
    accessedEver, accessed7d, accessed24h,
    postedAdmins, messagesTotal, messages7d, messages24h,
    reactions: reactRes.count || 0,
    comments: commentsRes.count || 0,
    reads: readsRes.count || 0,
    perDay: days,
    top,
    generatedAt: new Date(now).toISOString(),
  })
}
