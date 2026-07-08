import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { authNetwork, getMembers, publicName, buildAuthorMap } from '../../../../lib/network-server'
import { channelRule, canMentionAll } from '../../../../lib/network-access'
import { sendPushToUser } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

const RATE_MAX = 15        // mensagens
const RATE_WINDOW = 60000  // por minuto

// Extrai o path do storage a partir da URL publica (pra apagar a imagem).
function storagePathFromUrl(url) {
  const m = /\/storage\/v1\/object\/public\/network\/([^?]+)/.exec(url || '')
  return m ? decodeURIComponent(m[1]) : null
}

// Decodifica um data URL de imagem e sobe pro Storage; devolve a URL publica.
async function uploadImage(sb, channelKey, dataUrl) {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/i.exec(dataUrl || '')
  if (!m) return { error: 'Imagem inválida' }
  const contentType = m[1]
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2]
  const buf = Buffer.from(m[3], 'base64')
  if (buf.length > 6 * 1024 * 1024) return { error: 'Imagem muito grande (máx 6MB)' }
  const path = `${channelKey}/${crypto.randomUUID()}.${ext}`
  const { error } = await sb.storage.from('network').upload(path, buf, { contentType, upsert: false })
  if (error) return { error: 'Falha no upload da imagem' }
  const { data } = sb.storage.from('network').getPublicUrl(path)
  return { url: data?.publicUrl }
}

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
    const rule = channelRule(channelKey)
    // Avisos: so o OWNER envia
    if (rule?.ownerOnly && !isOwner) return NextResponse.json({ error: 'Somente o admin master envia avisos.' }, { status: 403 })
    if (text.length > 2000) return NextResponse.json({ error: 'Mensagem muito longa (máx 2000)' }, { status: 400 })

    // SILENCIADO? (castigo de fala) — owner isento
    if (!isOwner) {
      const { data: myNp } = await sb.from('network_profiles').select('muted_until,mute_reason').eq('user_id', user.id).maybeSingle()
      const until = myNp?.muted_until ? new Date(myNp.muted_until) : null
      if (until && until > new Date()) {
        const perm = until.getFullYear() >= 2099
        const quando = perm ? 'permanentemente' : `até ${until.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
        return NextResponse.json({ error: `Você está silenciado ${quando}.${myNp.mute_reason ? ' Motivo: ' + myNp.mute_reason : ''}`, muted: true }, { status: 403 })
      }
    }

    // RATE LIMIT anti-spam (owner isento)
    if (!isOwner) {
      const since = new Date(Date.now() - RATE_WINDOW).toISOString()
      const { count } = await sb.from('network_messages').select('id', { count: 'exact', head: true })
        .eq('author_id', user.id).gte('created_at', since)
      if ((count || 0) >= RATE_MAX) return NextResponse.json({ error: 'Você está enviando rápido demais. Espere um pouco.' }, { status: 429 })
    }

    const { data: ch } = await sb.from('network_channels').select('id,key').eq('key', channelKey).maybeSingle()
    if (!ch) return NextResponse.json({ error: 'Canal inválido' }, { status: 400 })

    // Foto (opcional em geral/avisos; OBRIGATORIA em resultados)
    let imageUrl = null
    if (body.image) {
      const up = await uploadImage(sb, channelKey, body.image)
      if (up.error) return NextResponse.json({ error: up.error }, { status: 400 })
      imageUrl = up.url
    }
    // Foto obrigatoria pra todos, MENOS o owner (pra postar/fixar regras em texto).
    if (rule?.requireImage && !imageUrl && !isOwner) return NextResponse.json({ error: 'Neste canal a mensagem precisa ter uma foto.' }, { status: 400 })
    if (!imageUrl && !text) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    // RESPOSTA/CITACAO: so aceita reply_to que aponte pra uma mensagem NAO deletada
    // do MESMO canal; se invalido, ignora (nao da erro).
    let replyTo = null
    if (body.reply_to) {
      const { data: rt } = await sb.from('network_messages').select('id,channel_id,deleted_at').eq('id', body.reply_to).maybeSingle()
      if (rt && !rt.deleted_at && rt.channel_id === ch.id) replyTo = rt.id
    }

    const { data, error } = await sb.from('network_messages')
      .insert({ channel_id: ch.id, author_id: user.id, text, image_url: imageUrl, reply_to: replyTo })
      .select('id,created_at').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ── BROADCAST server-side (realtime confiavel) — nunca falha o envio ──
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [{ topic: 'network-room', event: 'msg', payload: { channel: channelKey } }] }),
      })
    } catch (e) { console.error('[network] broadcast falhou', e?.message) }

    // ── Notificacoes (push) — await pra garantir envio no serverless ──
    await (async () => {
      try {
        const authorName = publicName(a.profile)
        const preview = text ? (text.length > 80 ? text.slice(0, 80) + '…' : text) : '📷 Foto'
        const notified = new Set([user.id])
        // @TODOS: marca todo mundo (só quem tem permissão — validado no servidor).
        if (body.mentionAll && canMentionAll(a.email)) {
          const members = await getMembers(sb)
          for (const m of members) {
            if (notified.has(m.id)) continue
            notified.add(m.id)
            await sendPushToUser(sb, m.id, { title: `${authorName} marcou todos no Network`, body: preview, url: `/network?c=${channelKey}`, tag: 'network-all' })
          }
        }
        // Mencoes individuais: avisa cada usuario marcado
        const mentions = Array.isArray(body.mentions) ? body.mentions.filter(id => id && id !== user.id) : []
        for (const mid of mentions) {
          if (notified.has(mid)) continue
          notified.add(mid)
          await sendPushToUser(sb, mid, { title: `${authorName} te mencionou no Network`, body: preview, url: `/network?c=${channelKey}`, tag: 'network-mention' })
        }
        // Avisos: comunicado oficial -> notifica todos os membros
        if (rule?.ownerOnly) {
          const members = await getMembers(sb)
          for (const m of members) {
            if (notified.has(m.id)) continue
            notified.add(m.id)
            await sendPushToUser(sb, m.id, { title: '📢 Novo aviso no Network', body: preview, url: '/network?c=avisos', tag: 'network-aviso' })
          }
        }
      } catch (e) { console.error('[network] push falhou', e?.message) }
    })()

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
    const { data: msg } = await sb.from('network_messages').select('author_id,image_url').eq('id', id).maybeSingle()
    if (!msg) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    if (msg.author_id !== user.id && !isOwner) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    const { error } = await sb.from('network_messages').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // registra no mod-log (moderacao) — nunca quebra o delete
    try {
      const nameMap = await buildAuthorMap(sb, [msg.author_id, user.id])
      await sb.from('network_mod_log').insert({
        action: 'delete_msg',
        target_id: msg.author_id,
        target_name: nameMap[msg.author_id]?.name || 'admin',
        actor_id: user.id,
        actor_name: nameMap[user.id]?.name || publicName(a.profile),
        reason: null,
      })
    } catch (e) { console.error('[network] mod-log falhou', e?.message) }
    // limpa a imagem do storage (evita orfaos)
    const spath = storagePathFromUrl(msg.image_url)
    if (spath) { try { await sb.storage.from('network').remove([spath]) } catch {} }
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
