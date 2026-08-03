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
  const { data } = await sb.from('profiles').select('id,tenant_id,role,capture_key').eq('id', userId).maybeSingle()
  return data
}

// Resolve o operador de um INGEST: por chave de captura (extensao, header
// x-capture-key) OU por Bearer token (fallback). A chave evita login por perfil.
async function resolveIngestOperator(req, sb) {
  const key = req.headers.get('x-capture-key')
  if (key) {
    const { data } = await sb.from('profiles').select('id,tenant_id').eq('capture_key', key).maybeSingle()
    if (data?.id) return { user_id: data.id, tenant_id: data.tenant_id }
    return null
  }
  const user = await getUser(req)
  if (!user?.id) return null
  const prof = await profileOf(sb, user.id)
  return prof?.tenant_id ? { user_id: user.id, tenant_id: prof.tenant_id } : null
}

// Gera uma chave de captura aleatoria (url-safe).
function newCaptureKey() {
  const b = crypto.getRandomValues(new Uint8Array(24))
  return 'cap_' + Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
}

// Recalcula total/count de DEPOSITOS (fonte da verdade p/ o campo da remessa) e
// atualiza o cache na sessao. Retorna { total, count }.
async function recompute(sb, sessionId) {
  const { data: rows } = await sb.from('deposit_captures').select('valor,tipo').eq('session_id', sessionId)
  const deps = (rows || []).filter(r => r.tipo !== 'saque')
  const count = deps.length
  const total = deps.reduce((a, r) => a + Number(r.valor || 0), 0)
  await sb.from('deposit_capture_sessions').update({ total: Number(total.toFixed(2)), count }).eq('id', sessionId)
  return { total: Number(total.toFixed(2)), count }
}

export async function POST(req) {
  try {
    const sb = svc()
    const body = await req.json().catch(() => ({}))
    const action = body.action

    // ── INGEST: extensao (chave) ou dashboard (token). Nao exige login por perfil ──
    if (action === 'ingest') {
      const op = await resolveIngestOperator(req, sb)
      if (!op) return NextResponse.json({ error: 'Chave/sessão inválida' }, { status: 401 })
      const orderId = String(body.order_id || '').trim()
      const valor = Number(body.valor)
      if (!orderId) return NextResponse.json({ error: 'order_id obrigatório' }, { status: 400 })
      if (!(valor > 0)) return NextResponse.json({ error: 'valor inválido' }, { status: 400 })

      const { data: sess } = await sb.from('deposit_capture_sessions')
        .select('id').eq('operator_id', op.user_id).eq('status', 'active')
        .order('started_at', { ascending: false }).limit(1).maybeSingle()
      if (!sess) return NextResponse.json({ ok: false, reason: 'no_active_session' })

      const tipo = body.tipo === 'saque' ? 'saque' : 'deposito'
      const { error: insErr } = await sb.from('deposit_captures').insert({
        session_id: sess.id, tenant_id: op.tenant_id, operator_id: op.user_id, tipo,
        order_id: orderId, valor: Number(valor.toFixed(2)), casa: body.casa ? String(body.casa).slice(0, 80) : null,
      })
      const duplicate = insErr && /duplicate|unique/i.test(insErr.message || '')
      if (insErr && !duplicate) return NextResponse.json({ error: insErr.message }, { status: 500 })
      const t = await recompute(sb, sess.id)
      return NextResponse.json({ ok: true, duplicate: !!duplicate, session_id: sess.id, ...t })
    }

    // ── Demais acoes exigem login (dashboard) ──
    const user = await getUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const prof = await profileOf(sb, user.id)
    if (!prof?.tenant_id) return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 })

    // ── GET-KEY: retorna (gera se preciso) a chave de captura do operador ──
    if (action === 'get-key') {
      let key = prof.capture_key
      if (!key) {
        key = newCaptureKey()
        const { error } = await sb.from('profiles').update({ capture_key: key }).eq('id', user.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, capture_key: key })
    }

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

    // Todas as capturas da sessao -> separa deposito x saque
    const { data: all } = await sb.from('deposit_captures')
      .select('order_id,valor,casa,created_at,tipo').eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    const rows = all || []
    const deps = rows.filter(r => r.tipo !== 'saque')
    const saques = rows.filter(r => r.tipo === 'saque')
    const sum = (arr) => Number(arr.reduce((a, r) => a + Number(r.valor || 0), 0).toFixed(2))
    const maxOf = (arr) => Number(arr.reduce((m, r) => Math.max(m, Number(r.valor || 0)), 0).toFixed(2))
    const casasOf = (arr) => new Set(arr.map(r => r.casa).filter(Boolean)).size
    return NextResponse.json({
      ok: true, status: sess.status,
      // depositos (compat com o campo da remessa)
      total: sum(deps), count: deps.length, max: maxOf(deps), casas: casasOf(deps), last: deps.slice(0, 12),
      // saques (card pronto — enche quando a extensao mandar tipo=saque)
      saqueTotal: sum(saques), saqueCount: saques.length, saqueMax: maxOf(saques), saqueLast: saques.slice(0, 12),
    })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'erro' }, { status: 500 })
  }
}
