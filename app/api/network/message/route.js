import { NextResponse } from 'next/server'
import { authNetwork } from '../../../../lib/network-server'

export const dynamic = 'force-dynamic'

// POST /api/network/message
// body: { action: 'send'|'edit'|'delete'|'pin', ... }
export async function POST(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb, user, isOwner } = a

  const body = await req.json().catch(() => ({}))
  const action = body.action || 'send'

  // ── ENVIAR ──
  if (action === 'send') {
    const text = String(body.text || '').trim()
    const channelKey = String(body.channel || 'geral').toLowerCase()
    if (!text) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    if (text.length > 2000) return NextResponse.json({ error: 'Mensagem muito longa (máx 2000)' }, { status: 400 })
    const { data: ch } = await sb.from('network_channels').select('id,key').eq('key', channelKey).maybeSingle()
    if (!ch) return NextResponse.json({ error: 'Canal inválido' }, { status: 400 })
    const { data, error } = await sb.from('network_messages')
      .insert({ channel_id: ch.id, author_id: user.id, text })
      .select('id,created_at').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id, created_at: data?.created_at })
  }

  // ── EDITAR (so o proprio autor) ──
  if (action === 'edit') {
    const id = body.id; const text = String(body.text || '').trim()
    if (!id || !text) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    if (text.length > 2000) return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 })
    const { data: msg } = await sb.from('network_messages').select('author_id,deleted_at').eq('id', id).maybeSingle()
    if (!msg || msg.deleted_at) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    if (msg.author_id !== user.id) return NextResponse.json({ error: 'Só o autor pode editar' }, { status: 403 })
    const { error } = await sb.from('network_messages').update({ text, edited_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── APAGAR (autor OU owner) ──
  if (action === 'delete') {
    const id = body.id
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const { data: msg } = await sb.from('network_messages').select('author_id').eq('id', id).maybeSingle()
    if (!msg) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    if (msg.author_id !== user.id && !isOwner) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    const { error } = await sb.from('network_messages').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── FIXAR / DESAFIXAR (so owner) ──
  if (action === 'pin') {
    if (!isOwner) return NextResponse.json({ error: 'Só o owner pode fixar' }, { status: 403 })
    const id = body.id; const pinned = !!body.pinned
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    const { data: msg } = await sb.from('network_messages').select('channel_id').eq('id', id).maybeSingle()
    if (!msg) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    if (pinned) {
      // só uma fixada por canal
      await sb.from('network_messages').update({ pinned: false }).eq('channel_id', msg.channel_id).eq('pinned', true)
    }
    const { error } = await sb.from('network_messages').update({ pinned }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
