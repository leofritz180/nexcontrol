import { NextResponse } from 'next/server'
import { authNetwork, buildAuthorMap, publicName } from '../../../../lib/network-server'
import { sendPushToUser } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

// Comentarios do feed social (canal Resultados). Gated ao BETA social — enquanto
// so a conta de teste e beta, so ela comenta/le comentarios. Nao afeta ninguem.

// GET /api/network/comments?message_id=<uuid>
// Retorna a arvore de comentarios (autor + curtidas + minhas curtidas) + total.
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  if (!a.socialBeta) return NextResponse.json({ error: 'Indisponível' }, { status: 403 })
  const { sb, user } = a
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('message_id')
  if (!messageId) return NextResponse.json({ error: 'message_id obrigatório' }, { status: 400 })

  const { data: rows } = await sb.from('network_comments')
    .select('id,author_id,parent_id,text,created_at,deleted_at')
    .eq('message_id', messageId).is('deleted_at', null)
    .order('created_at', { ascending: true }).limit(500)
  const comments = rows || []

  const authorMap = await buildAuthorMap(sb, comments.map(c => c.author_id))
  // curtidas por comentario (+ marca as minhas)
  const ids = comments.map(c => c.id)
  const likeByC = {}
  if (ids.length) {
    const { data: likes } = await sb.from('network_comment_likes').select('comment_id,user_id').in('comment_id', ids)
    for (const l of (likes || [])) {
      const e = (likeByC[l.comment_id] = likeByC[l.comment_id] || { count: 0, mine: false })
      e.count++; if (l.user_id === user.id) e.mine = true
    }
  }

  const shape = c => ({
    id: c.id,
    text: c.text,
    parent_id: c.parent_id || null,
    created_at: c.created_at,
    author: authorMap[c.author_id] || { id: c.author_id, name: 'admin', color: '#e53935' },
    mine: c.author_id === user.id,
    likes: likeByC[c.id]?.count || 0,
    liked: !!likeByC[c.id]?.mine,
  })

  return NextResponse.json({ comments: comments.map(shape), total: comments.length })
}

// POST /api/network/comments
// body: { action:'add', message_id, text, parent_id? } | { action:'delete', id } | { action:'like', id }
export async function POST(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  if (!a.socialBeta) return NextResponse.json({ error: 'Indisponível' }, { status: 403 })
  const { sb, user, isOwner } = a
  const body = await req.json().catch(() => ({}))
  const action = body.action || 'add'

  if (action === 'add') {
    const text = String(body.text || '').trim()
    const messageId = body.message_id
    if (!messageId || !text) return NextResponse.json({ error: 'Comentário vazio' }, { status: 400 })
    if (text.length > 600) return NextResponse.json({ error: 'Comentário muito longo (máx 600)' }, { status: 400 })
    // a publicacao precisa existir e nao estar apagada
    const { data: msg } = await sb.from('network_messages').select('id,author_id,deleted_at').eq('id', messageId).maybeSingle()
    if (!msg || msg.deleted_at) return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 })
    // parent_id opcional: precisa ser comentario da mesma publicacao
    let parentId = null
    if (body.parent_id) {
      const { data: par } = await sb.from('network_comments').select('id,message_id,deleted_at').eq('id', body.parent_id).maybeSingle()
      if (par && !par.deleted_at && par.message_id === messageId) parentId = par.id
    }
    const { data, error } = await sb.from('network_comments')
      .insert({ message_id: messageId, author_id: user.id, parent_id: parentId, text })
      .select('id,created_at').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // push pro autor da publicacao (se nao for eu mesmo)
    try {
      if (msg.author_id && msg.author_id !== user.id) {
        const preview = text.length > 80 ? text.slice(0, 80) + '…' : text
        await sendPushToUser(sb, msg.author_id, { title: `${publicName(a.profile)} comentou seu resultado`, body: preview, url: '/network?c=resultados', tag: 'network-comment' })
      }
    } catch {}
    return NextResponse.json({ ok: true, id: data?.id, created_at: data?.created_at })
  }

  if (action === 'delete') {
    const id = body.id
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const { data: c } = await sb.from('network_comments').select('author_id,deleted_at').eq('id', id).maybeSingle()
    if (!c || c.deleted_at) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })
    if (c.author_id !== user.id && !isOwner) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    const { error } = await sb.from('network_comments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'like') {
    const id = body.id
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const { data: c } = await sb.from('network_comments').select('id,deleted_at').eq('id', id).maybeSingle()
    if (!c || c.deleted_at) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })
    const { data: existing } = await sb.from('network_comment_likes').select('id').eq('comment_id', id).eq('user_id', user.id).maybeSingle()
    if (existing) {
      await sb.from('network_comment_likes').delete().eq('id', existing.id)
      return NextResponse.json({ ok: true, liked: false })
    }
    const { error } = await sb.from('network_comment_likes').insert({ comment_id: id, user_id: user.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, liked: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
