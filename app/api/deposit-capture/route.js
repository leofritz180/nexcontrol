import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────
// API da captura automatica de depositos.
//
// POST { action:'start', meta_id }            -> abre/retorna sessao ativa (painel)
// POST { action:'ingest', order_id, valor, casa } -> extensao envia 1 deposito
// POST { action:'finish', session_id }        -> encerra a sessao (painel)
// GET  ?action=status&session_id=<id>         -> total/count ao vivo (pop-up poll)
//
// Auth: Bearer token do usuario logado (mesmo do resto do app). A extensao usa
// o token da conta do operador. Dedup por (session_id, order_id).
// ─────────────────────────────────────────────────────────────────────────

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getUser(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false }, global: { headers: { Authorization: 'Bearer ' + token } } }
  )
  const { data } = await anon.auth.getUser()
  return data?.user || null
}

async function profileOf(sb, userId) {
  const { data } = await sb.from('profiles').select('id,tenant_id,role').eq('id', userId).maybeSingle()
  return data
}

// Recalcula total/count da sessao a partir das capturas (fonte da verdade) e
// atualiza o cache na sessao. Retorna { total, count }.
async function recompute(sb, sessionId) {
  const { data: rows } = await sb.from('deposit_captures').select('valor').eq('session_id', sessionId)
  const count = (rows || []).length
  const total = (rows || []).reduce((a, r) => a + Number(r.valor || 0), 0)
  await sb.from('deposit_capture_sessions').update({ total: Number(total.toFixed(2)), count }).eq('id', sessionId)
  return { total: Number(total.toFixed(2)), count }
}

export async function POST(req) {
  try {
    const user = await getUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const sb = svc()
    const prof = await profileOf(sb, user.id)
    if (!prof?.tenant_id) return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const action = body.action

    // ── START: abre (ou reaproveita) a sessao ativa do usuario ──
    if (action === 'start') {
      // encerra sessoes ativas antigas do mesmo usuario (uma por vez)
      const { data: existing } = await sb.from('deposit_capture_sessions')
        .select('id,meta_id').eq('operator_id', user.id).eq('status', 'active')
        .order('started_at', { ascending: false })
      const keep = (existing || [])[0]
      if (keep && (!body.meta_id || keep.meta_id === body.meta_id)) {
        const t = await recompute(sb, keep.id)
        return NextResponse.json({ ok: true, session_id: keep.id, ...t })
      }
      // fecha qualquer ativa remanescente antes de abrir nova
      for (const s of (existing || [])) {
        await sb.from('deposit_capture_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', s.id)
      }
      const { data: created, error } = await sb.from('deposit_capture_sessions').insert({
        tenant_id: prof.tenant_id, operator_id: user.id, meta_id: body.meta_id || null, status: 'active',
      }).select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, session_id: created.id, total: 0, count: 0 })
    }

    // ── INGEST: extensao envia 1 deposito -> vai pra sessao ativa do usuario ──
    if (action === 'ingest') {
      const orderId = String(body.order_id || '').trim()
      const valor = Number(body.valor)
      if (!orderId) return NextResponse.json({ error: 'order_id obrigatório' }, { status: 400 })
      if (!(valor > 0)) return NextResponse.json({ error: 'valor inválido' }, { status: 400 })

      const { data: sess } = await sb.from('deposit_capture_sessions')
        .select('id').eq('operator_id', user.id).eq('status', 'active')
        .order('started_at', { ascending: false }).limit(1).maybeSingle()
      if (!sess) return NextResponse.json({ ok: false, reason: 'no_active_session' })

      // dedup: mesmo pedido na mesma sessao = ignora (idempotente)
      const { error: insErr } = await sb.from('deposit_captures').insert({
        session_id: sess.id, tenant_id: prof.tenant_id, operator_id: user.id,
        order_id: orderId, valor: Number(valor.toFixed(2)), casa: body.casa ? String(body.casa).slice(0, 80) : null,
      })
      const duplicate = insErr && /duplicate|unique/i.test(insErr.message || '')
      if (insErr && !duplicate) return NextResponse.json({ error: insErr.message }, { status: 500 })
      const t = await recompute(sb, sess.id)
      return NextResponse.json({ ok: true, duplicate: !!duplicate, session_id: sess.id, ...t })
    }

    // ── FINISH: encerra a sessao (retorna total pra remessa) ──
    if (action === 'finish') {
      const sessionId = body.session_id
      if (!sessionId) return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })
      const { data: sess } = await sb.from('deposit_capture_sessions')
        .select('id,operator_id').eq('id', sessionId).maybeSingle()
      if (!sess || sess.operator_id !== user.id) return NextResponse.json({ error: 'Sessão inválida' }, { status: 403 })
      const t = await recompute(sb, sessionId)
      await sb.from('deposit_capture_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', sessionId)
      return NextResponse.json({ ok: true, session_id: sessionId, ...t })
    }

    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'erro' }, { status: 500 })
  }
}

// GET status (pop-up faz polling) — retorna total/count/ultimas capturas
export async function GET(req) {
  try {
    const user = await getUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const sb = svc()
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })

    const { data: sess } = await sb.from('deposit_capture_sessions')
      .select('id,operator_id,status,total,count').eq('id', sessionId).maybeSingle()
    if (!sess || sess.operator_id !== user.id) return NextResponse.json({ error: 'Sessão inválida' }, { status: 403 })

    const { data: last } = await sb.from('deposit_captures')
      .select('order_id,valor,casa,created_at').eq('session_id', sessionId)
      .order('created_at', { ascending: false }).limit(12)
    return NextResponse.json({ ok: true, status: sess.status, total: Number(sess.total || 0), count: sess.count || 0, last: last || [] })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'erro' }, { status: 500 })
  }
}
