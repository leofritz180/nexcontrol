import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'
import { WINBACK_SEGMENTS, pickSegment, shouldSend, fillTemplate } from '../../../../lib/winback-segments'
import { renderWinbackEmail, sendEmailViaResend } from '../../../../lib/email-templates'

// Cron diario que detecta usuarios inativos e envia push + email de win-back.
// Vercel cron (vercel.json): "schedule": "0 14 * * *" (14:00 UTC = 11h Brasilia)
//
// Auth: header Authorization Bearer ${CRON_SECRET} ou querystring ?secret=
// Tambem aceita user_id e segment via query/body pra testes manuais.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET
  if (!expected) return true // sem secret configurado, libera (modo dev)
  const auth = req.headers.get('authorization') || ''
  if (auth === `Bearer ${expected}`) return true
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('secret') === expected) return true
  } catch {}
  return false
}

async function processOne(sb, profile, opts = {}) {
  const now = Date.now()
  const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : null
  const created = profile.created_at ? new Date(profile.created_at).getTime() : now
  // Sem last_seen → considera tempo desde signup
  const refTime = lastSeen || created
  const daysInactive = Math.floor((now - refTime) / 86400000)

  // Override pra teste: forca segmento
  const segment = opts.forceSegment
    ? WINBACK_SEGMENTS.find(s => s.id === opts.forceSegment)
    : pickSegment(daysInactive)

  if (!segment) return { skipped: true, reason: 'no_matching_segment', daysInactive }

  // Anti-spam: pega logs recentes do user
  const { data: recentLogs } = await sb.from('winback_log')
    .select('segment, channel, sent_at')
    .eq('user_id', profile.id)
    .gte('sent_at', new Date(now - 30 * 86400000).toISOString())

  const vars = { nome: (profile.nome || '').split(' ')[0] || 'Operador' }
  const url = `${APP_URL}/admin?utm_source=winback&utm_medium=email&utm_campaign=${segment.id}`
  const results = { user_id: profile.id, segment: segment.id, daysInactive, push: null, email: null }

  // PUSH
  if (shouldSend({ segment, channel: 'push', recentLogs: recentLogs || [] })) {
    const pushPayload = {
      title: fillTemplate(segment.push.title, vars),
      body: fillTemplate(segment.push.body, vars),
      url, tag: `winback_${segment.id}`,
    }
    try {
      const pushRes = await sendPushToUser(sb, profile.id, pushPayload)
      const ok = pushRes && pushRes.sent > 0
      await sb.from('winback_log').insert({
        user_id: profile.id,
        tenant_id: profile.tenant_id || null,
        segment: segment.id, channel: 'push',
        status: ok ? 'sent' : 'failed',
        payload: { ...pushPayload, raw: pushRes },
      })
      results.push = { ok, raw: pushRes }
    } catch (e) {
      results.push = { ok: false, error: e?.message }
    }
  } else {
    results.push = { skipped: true }
  }

  // EMAIL
  if (profile.email && shouldSend({ segment, channel: 'email', recentLogs: recentLogs || [] })) {
    const { subject, html } = renderWinbackEmail({ segment, vars: { ...vars, url } })
    const emailRes = await sendEmailViaResend({ to: profile.email, subject, html })
    if (!emailRes.skipped) {
      await sb.from('winback_log').insert({
        user_id: profile.id,
        tenant_id: profile.tenant_id || null,
        segment: segment.id, channel: 'email',
        status: emailRes.ok ? 'sent' : 'failed',
        payload: { subject, raw: emailRes },
      })
    }
    results.email = emailRes
  } else {
    results.email = { skipped: true }
  }

  return results
}

export async function POST(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Modo manual: user_id especifico
    if (body.user_id) {
      const { data: p } = await sb.from('profiles').select('id,nome,email,tenant_id,last_seen_at,created_at').eq('id', body.user_id).maybeSingle()
      if (!p) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const result = await processOne(sb, p, { forceSegment: body.segment })
      return NextResponse.json({ ok: true, manual: true, result })
    }

    // Modo cron: pega todos admins inativos ha >= 3 dias
    const cutoff = new Date(Date.now() - 3 * 86400000).toISOString()
    const { data: profiles } = await sb.from('profiles')
      .select('id,nome,email,tenant_id,last_seen_at,created_at,role')
      .eq('role', 'admin')
      .or(`last_seen_at.lt.${cutoff},last_seen_at.is.null`)
      .limit(500)

    const results = []
    for (const p of (profiles || [])) {
      try { results.push(await processOne(sb, p)) } catch (e) { results.push({ user_id: p.id, error: e?.message }) }
    }

    const sent = results.filter(r => r.push?.ok || r.email?.ok).length
    const skipped = results.filter(r => r.skipped || (r.push?.skipped && r.email?.skipped)).length

    return NextResponse.json({ ok: true, total: results.length, sent, skipped, results: results.slice(0, 50) })
  } catch (err) {
    console.error('[cron/winback] error', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET tambem aceito (Vercel cron usa GET por padrao)
export async function GET(req) { return POST(req) }
