import { NextResponse } from 'next/server'
import { authNetwork, buildAuthorMap, touchPresence, publicName, displayName, colorFromId, getMembers, muteInfo, maybeGrantFounder } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// "Online agora" com piso alto por faixa horaria (BRT) — prova social do lancamento.
// Varia suave (drift + ruido leve), estavel entre polls. O real por cima disso.
function fakeOnlineFloor() {
  const now = Date.now()
  const brtHour = ((new Date(now).getUTCHours() - 3) + 24) % 24
  let lo, hi
  if (brtHour >= 2 && brtHour < 6) { lo = 40; hi = 80 }         // madrugada
  else if (brtHour >= 20 || brtHour < 2) { lo = 80; hi = 150 }  // 20h–02h
  else { lo = 70; hi = 150 }                                    // dia
  const t = now / 60000, mid = (lo + hi) / 2, amp = (hi - lo) / 2
  const drift = Math.sin((t / 43) * Math.PI * 2) * amp * 0.72
  const bucket = Math.floor(t / 3)
  const noise = ((Math.abs(Math.sin(bucket * 12.9898) * 43758.5453) % 1) - 0.5) * amp * 0.5
  return Math.round(Math.max(lo, Math.min(hi, mid + drift + noise)))
}

// GET /api/network/feed?channel=geral
// Retorna: canais, mensagens do canal (com autor + reacoes), fixada, online,
// top contribuidores e meu mini-perfil. E o endpoint do carregamento + polling.
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb, user } = a

  const { searchParams } = new URL(req.url)
  const channelKey = (searchParams.get('channel') || 'geral').toLowerCase()
  const before = searchParams.get('before')  // ISO timestamp -> paginacao "carregar mais antigas"

  // marca presenca (nao bloqueia resposta se falhar)
  await touchPresence(sb, user.id)

  // canais
  const { data: channels } = await sb.from('network_channels').select('id,key,name,description,sort').order('sort', { ascending: true })
  const channel = (channels || []).find(c => c.key === channelKey) || (channels || [])[0]
  if (!channel) return NextResponse.json({ channels: channels || [], messages: [], pinned: null, online: [], top: [], me: null, hasMore: false })

  // ── CARREGAR MAIS ANTIGAS (paginacao) ──
  // So mensagens + hasMore. Pula online/top/members/pinned (nao muda ao paginar).
  if (before) {
    const { data: rawOlder } = await sb.from('network_messages')
      .select('id,author_id,text,image_url,pinned,edited_at,created_at,reply_to,fake_name')
      .eq('channel_id', channel.id).is('deleted_at', null).lt('created_at', before)
      .order('created_at', { ascending: false }).limit(40)
    const older = (rawOlder || []).slice().reverse()
    const authorMap = await buildAuthorMap(sb, older.map(m => m.author_id))
    const reactByMsg = await loadReactions(sb, older.map(m => m.id), user.id)
    const replyMap = await buildReplyMap(sb, older)
    const commentCounts = a.socialBeta ? await loadCommentCounts(sb, older.map(m => m.id)) : {}
    const shape = makeShape({ authorMap, reactByMsg, replyMap, userId: user.id, commentCounts })
    let hasMore = false
    if (older.length) {
      const { count } = await sb.from('network_messages').select('id', { count: 'exact', head: true })
        .eq('channel_id', channel.id).is('deleted_at', null).lt('created_at', older[0].created_at)
      hasMore = (count || 0) > 0
    }
    return NextResponse.json({ messages: older.map(shape), hasMore })
  }

  // mensagens do canal (mais recentes primeiro no banco, invertidas na UI)
  const { data: rawMsgs } = await sb.from('network_messages')
    .select('id,author_id,text,image_url,pinned,edited_at,created_at,reply_to,fake_name')
    .eq('channel_id', channel.id).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(100)
  const msgs = (rawMsgs || []).slice().reverse()

  // fixada (busca dedicada — nao depende das ultimas 100 mensagens)
  const { data: pinnedRows } = await sb.from('network_messages')
    .select('id,author_id,text,image_url,pinned,edited_at,created_at,reply_to,fake_name')
    .eq('channel_id', channel.id).eq('pinned', true).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(1)
  const pinnedMsg = (pinnedRows || [])[0] || null

  // autores
  const authorMap = await buildAuthorMap(sb, msgs.map(m => m.author_id).concat(pinnedMsg ? [pinnedMsg.author_id] : []))

  // reacoes das mensagens exibidas
  const ids = msgs.map(m => m.id)
  const reactByMsg = await loadReactions(sb, ids, user.id)

  // citacoes (reply): resolve as mensagens citadas (msgs + fixada) numa unica busca
  const replyMap = await buildReplyMap(sb, pinnedMsg ? msgs.concat([pinnedMsg]) : msgs)

  // contagem de comentarios (so no modo social) pros posts exibidos
  const commentCounts = a.socialBeta ? await loadCommentCounts(sb, ids) : {}

  const shape = makeShape({ authorMap, reactByMsg, replyMap, userId: user.id, commentCounts })

  // ha mensagens mais antigas que a mais velha exibida? (pro botao "carregar mais")
  let hasMore = false
  if (msgs.length) {
    const { count } = await sb.from('network_messages').select('id', { count: 'exact', head: true })
      .eq('channel_id', channel.id).is('deleted_at', null).lt('created_at', msgs[0].created_at)
    hasMore = (count || 0) > 0
  }

  // ONLINE agora (presenca < 3 min) + nomes
  const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
  const { data: activeNps } = await sb.from('network_profiles').select('user_id,last_active,avatar_url,instagram').gte('last_active', cutoff)
  const onlineIds = (activeNps || []).map(n => n.user_id)
  const npOnlineById = {}; (activeNps || []).forEach(n => { npOnlineById[n.user_id] = n })
  let online = []
  if (onlineIds.length) {
    const { data: onlineProfs } = await sb.from('profiles').select('id,nome,email').in('id', onlineIds)
    online = (onlineProfs || []).map(p => ({ id: p.id, name: displayName(p, npOnlineById[p.id]), avatar: npOnlineById[p.id]?.avatar_url || null, color: colorFromId(p.id), you: p.id === user.id }))
  }

  // TOP contribuidores (network_score = msgs enviadas + reacoes recebidas)
  const top = await topContributors(sb)

  // membros mencionaveis
  const members = await getMembers(sb)

  const me = authorMap[user.id] || { id: user.id, name: publicName(a.profile), color: colorFromId(user.id) }
  // status de silenciamento do proprio usuario (pro banner no composer)
  const { data: myNp } = await sb.from('network_profiles').select('muted_until,mute_reason,founder,founder_revoked').eq('user_id', user.id).maybeSingle()
  me.mute = muteInfo(myNp)
  // Selo VETERANO pros primeiros a entrar (nao bloqueia a resposta se falhar).
  // Nao reconceder se o owner removeu manualmente (founder_revoked).
  await maybeGrantFounder(sb, user.id, !!myNp?.founder || a.isOwner || !!myNp?.founder_revoked)

  return NextResponse.json({
    channels: channels || [],
    channel: { key: channel.key, name: channel.name, description: channel.description },
    messages: msgs.map(shape),
    pinned: pinnedMsg ? shape(pinnedMsg) : null,
    online,
    onlineCount: Math.max((online || []).length, fakeOnlineFloor()),
    top,
    members,
    me,
    hasMore,
    isOwner: a.isOwner,
    socialBeta: !!a.socialBeta,
    canMentionAll: !!a.canMentionAll,
  })
}

// Carrega reacoes das mensagens dadas, agregadas por mensagem/emoji (+ marca as minhas).
async function loadReactions(sb, ids, userId) {
  const reactByMsg = {}
  if (ids.length) {
    const { data: reacts } = await sb.from('network_reactions').select('message_id,emoji,user_id').in('message_id', ids)
    for (const r of (reacts || [])) {
      const m = (reactByMsg[r.message_id] = reactByMsg[r.message_id] || {})
      const e = (m[r.emoji] = m[r.emoji] || { count: 0, mine: false })
      e.count++
      if (r.user_id === userId) e.mine = true
    }
  }
  return reactByMsg
}

// Resolve as mensagens citadas (reply_to) numa unica busca -> { [id]: {id,name,text,hasImage} }.
async function buildReplyMap(sb, msgs) {
  const replyIds = [...new Set((msgs || []).map(m => m.reply_to).filter(Boolean))]
  if (!replyIds.length) return {}
  const { data: quoted } = await sb.from('network_messages')
    .select('id,author_id,text,image_url,deleted_at').in('id', replyIds)
  const qAuthorMap = await buildAuthorMap(sb, (quoted || []).map(q => q.author_id))
  const map = {}
  for (const q of (quoted || [])) {
    if (q.deleted_at) {
      map[q.id] = { id: q.id, name: '—', text: 'mensagem removida', hasImage: false }
    } else {
      map[q.id] = {
        id: q.id,
        name: qAuthorMap[q.author_id]?.name || 'admin',
        text: q.text ? (q.text.length > 80 ? q.text.slice(0, 80) : q.text) : '',
        hasImage: !!q.image_url,
      }
    }
  }
  return map
}

// Conta comentarios (nao deletados) por mensagem -> { [message_id]: count }.
async function loadCommentCounts(sb, ids) {
  const out = {}
  if (!ids.length) return out
  const { data: rows } = await sb.from('network_comments').select('message_id').in('message_id', ids).is('deleted_at', null)
  for (const r of (rows || [])) out[r.message_id] = (out[r.message_id] || 0) + 1
  return out
}

// Fabrica o shaper de mensagem (autor + reacoes + citacao) reutilizado no feed e na paginacao.
function makeShape({ authorMap, reactByMsg, replyMap, userId, commentCounts = {} }) {
  return m => ({
    id: m.id,
    text: m.text,
    image: m.image_url || null,
    created_at: m.created_at,
    edited_at: m.edited_at || null,
    reply_to: m.reply_to || null,
    reply: m.reply_to ? (replyMap[m.reply_to] || null) : null,
    commentCount: commentCounts[m.id] || 0,
    // fake_name = mensagem "semente" (owner simula um admin comentando)
    author: m.fake_name
      ? { id: 'fake:' + m.fake_name, name: m.fake_name, color: colorFromId('fake:' + m.fake_name), avatar: null }
      : (authorMap[m.author_id] || (m.author_id ? { id: m.author_id, name: 'admin', color: colorFromId(m.author_id) } : { id: null, name: 'NexControl', system: true, color: '#e53935' })),
    mine: m.author_id === userId,
    reactions: Object.entries(reactByMsg[m.id] || {}).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
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
    sb.from('network_profiles').select('user_id,avatar_url,instagram').in('user_id', authorIds),
  ])
  const npById = {}; (nps || []).forEach(n => { npById[n.user_id] = n })
  const profById = {}; (profs || []).forEach(p => { profById[p.id] = p })
  return authorIds
    .map(id => ({ id, name: displayName(profById[id], npById[id]) || 'admin', avatar: npById[id]?.avatar_url || null, color: colorFromId(id), score: (msgCount[id] || 0) + (reactCount[id] || 0), msgs: msgCount[id] || 0 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 10)
}
