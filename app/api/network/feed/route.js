import { NextResponse } from 'next/server'
import { authNetwork, buildAuthorMap, touchPresence, publicName, colorFromId } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// GET /api/network/feed?channel=geral
// Retorna: canais, mensagens do canal (com autor + reacoes), fixada, online,
// top contribuidores e meu mini-perfil. E o endpoint do carregamento + polling.
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb, user } = a

  const { searchParams } = new URL(req.url)
  const channelKey = (searchParams.get('channel') || 'geral').toLowerCase()

  // marca presenca (nao bloqueia resposta se falhar)
  await touchPresence(sb, user.id)

  // canais
  const { data: channels } = await sb.from('network_channels').select('id,key,name,description,sort').order('sort', { ascending: true })
  const channel = (channels || []).find(c => c.key === channelKey) || (channels || [])[0]
  if (!channel) return NextResponse.json({ channels: channels || [], messages: [], pinned: null, online: [], top: [], me: null })

  // mensagens do canal (mais recentes primeiro no banco, invertidas na UI)
  const { data: rawMsgs } = await sb.from('network_messages')
    .select('id,author_id,text,image_url,pinned,edited_at,created_at')
    .eq('channel_id', channel.id).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(100)
  const msgs = (rawMsgs || []).slice().reverse()

  // fixada (busca dedicada — nao depende das ultimas 100 mensagens)
  const { data: pinnedRows } = await sb.from('network_messages')
    .select('id,author_id,text,image_url,pinned,edited_at,created_at')
    .eq('channel_id', channel.id).eq('pinned', true).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(1)
  const pinnedMsg = (pinnedRows || [])[0] || null

  // autores
  const authorMap = await buildAuthorMap(sb, msgs.map(m => m.author_id).concat(pinnedMsg ? [pinnedMsg.author_id] : []))

  // reacoes das mensagens exibidas
  const ids = msgs.map(m => m.id)
  let reactByMsg = {}
  if (ids.length) {
    const { data: reacts } = await sb.from('network_reactions').select('message_id,emoji,user_id').in('message_id', ids)
    for (const r of (reacts || [])) {
      const m = (reactByMsg[r.message_id] = reactByMsg[r.message_id] || {})
      const e = (m[r.emoji] = m[r.emoji] || { count: 0, mine: false })
      e.count++
      if (r.user_id === user.id) e.mine = true
    }
  }

  const shape = m => ({
    id: m.id,
    text: m.text,
    image: m.image_url || null,
    created_at: m.created_at,
    edited_at: m.edited_at || null,
    author: authorMap[m.author_id] || (m.author_id ? { id: m.author_id, name: 'admin', color: colorFromId(m.author_id) } : { id: null, name: 'NexControl', system: true, color: '#e53935' }),
    mine: m.author_id === user.id,
    reactions: Object.entries(reactByMsg[m.id] || {}).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
  })

  // ONLINE agora (presenca < 3 min) + nomes
  const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
  const { data: activeNps } = await sb.from('network_profiles').select('user_id,last_active,avatar_url').gte('last_active', cutoff)
  const onlineIds = (activeNps || []).map(n => n.user_id)
  const avatarById = {}; (activeNps || []).forEach(n => { avatarById[n.user_id] = n.avatar_url || null })
  let online = []
  if (onlineIds.length) {
    const { data: onlineProfs } = await sb.from('profiles').select('id,nome,email').in('id', onlineIds)
    online = (onlineProfs || []).map(p => ({ id: p.id, name: publicName(p), avatar: avatarById[p.id] || null, color: colorFromId(p.id), you: p.id === user.id }))
  }

  // TOP contribuidores (network_score = msgs enviadas + reacoes recebidas)
  const top = await topContributors(sb)

  const me = authorMap[user.id] || { id: user.id, name: publicName(a.profile), color: colorFromId(user.id) }

  return NextResponse.json({
    channels: channels || [],
    channel: { key: channel.key, name: channel.name, description: channel.description },
    messages: msgs.map(shape),
    pinned: pinnedMsg ? shape(pinnedMsg) : null,
    online,
    top,
    me,
    isOwner: a.isOwner,
  })
}

async function topContributors(sb) {
  // Bounded: ultimas 2000 mensagens nao deletadas.
  const { data: allMsgs } = await sb.from('network_messages')
    .select('id,author_id').is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(2000)
  const msgCount = {}, msgIds = []
  for (const m of (allMsgs || [])) {
    if (!m.author_id) continue
    msgCount[m.author_id] = (msgCount[m.author_id] || 0) + 1
    msgIds.push(m.id)
  }
  const reactCount = {}
  if (msgIds.length) {
    const { data: reacts } = await sb.from('network_reactions').select('message_id').in('message_id', msgIds)
    const msgToAuthor = {}
    for (const m of (allMsgs || [])) msgToAuthor[m.id] = m.author_id
    for (const r of (reacts || [])) {
      const author = msgToAuthor[r.message_id]
      if (author) reactCount[author] = (reactCount[author] || 0) + 1
    }
  }
  const authorIds = Object.keys(msgCount)
  if (!authorIds.length) return []
  const [{ data: profs }, { data: nps }] = await Promise.all([
    sb.from('profiles').select('id,nome,email').in('id', authorIds),
    sb.from('network_profiles').select('user_id,avatar_url').in('user_id', authorIds),
  ])
  const nameById = {}; (profs || []).forEach(p => { nameById[p.id] = publicName(p) })
  const avById = {}; (nps || []).forEach(n => { avById[n.user_id] = n.avatar_url || null })
  return authorIds
    .map(id => ({ id, name: nameById[id] || 'admin', avatar: avById[id] || null, color: colorFromId(id), score: (msgCount[id] || 0) + (reactCount[id] || 0), msgs: msgCount[id] || 0 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 10)
}
