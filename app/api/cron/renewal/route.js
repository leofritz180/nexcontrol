import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'
import { renderWinbackEmail, sendEmailViaResend } from '../../../../lib/email-templates'
import { RENEWAL_SEGMENTS, expiringSegmentId, expiredSegmentId } from '../../../../lib/renewal-segments'

// Cron diario. Para cada tenant decide a mensagem certa:
//  ANTES de vencer:  3d / 2d / 1d   (assinatura ativa)
//  DEPOIS de vencer: 1d / 2d / 3d / 7d  + revive (qualquer vencido antigo nunca avisado)
//  TRIAL que nao assinou (inclusive antigos): trial_lapsed
// Manda push + email (Resend). Marca tenant.subscription_status='expired'.
//
// Vercel cron: "schedule": "30 12 * * *" (12:30 UTC = 9:30 Brasilia)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'

// Teto de e-mails por execucao — protege o limite do plano free do Resend
// (100/dia, compartilhado com os crons de trial e winback). Prioriza os
// avisos no tempo certo; o backlog (revive/trial) preenche o que sobrar e
// continua nos proximos dias.
const EMAIL_BUDGET = 70

// Quantos dias o mesmo segmento fica "travado" depois de enviado (anti-spam).
// Buckets no tempo: 14d (re-elegivel no proximo ciclo mensal). Backlog: ~10 anos (1x).
const SEG_WINDOW = {
  expiring_3: 14, expiring_2: 14, expiring_1: 14,
  expired_1: 14, expired_2: 14, expired_3: 14, expired_7: 14,
  expired_revive: 3650, trial_lapsed: 3650,
}
const PRIORITY = {
  expiring_1: 1, expiring_2: 2, expiring_3: 3,
  expired_1: 4, expired_2: 5, expired_3: 6, expired_7: 7,
  expired_revive: 8, trial_lapsed: 9,
}

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  if (auth === `Bearer ${expected}`) return true
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('secret') === expected) return true
  } catch {}
  return false
}

export async function POST(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()
    const nowMs = now.getTime()
    const DAY = 86400000
    const oneDayAgo = new Date(nowMs - DAY)

    // ── 1) Assinaturas: validade por tenant ──
    const { data: allSubs } = await sb.from('subscriptions').select('tenant_id,expires_at,status')
    const paidTenants = new Set((allSubs || []).map(s => s.tenant_id))
    const tenantValidity = {}
    for (const s of (allSubs || [])) {
      const exp = s.expires_at ? new Date(s.expires_at) : null
      if (s.status !== 'active') continue
      if (!tenantValidity[s.tenant_id]) tenantValidity[s.tenant_id] = { hasValid: false, nearestExpiry: null, lastExpiredAt: null }
      const v = tenantValidity[s.tenant_id]
      if (!exp || exp > now) {
        v.hasValid = true
        if (exp && (!v.nearestExpiry || exp < v.nearestExpiry)) v.nearestExpiry = exp
      } else if (exp && (!v.lastExpiredAt || exp > v.lastExpiredAt)) {
        v.lastExpiredAt = exp
      }
    }

    // ── 2) Monta a fila de trabalho (tenant -> segmento) ──
    const work = [] // { tid, segId }
    const toMarkExpired = []
    for (const [tid, v] of Object.entries(tenantValidity)) {
      if (v.hasValid && v.nearestExpiry) {
        const daysLeft = Math.ceil((v.nearestExpiry.getTime() - nowMs) / DAY)
        const seg = expiringSegmentId(daysLeft)
        if (seg) work.push({ tid, segId: seg })
      } else if (!v.hasValid && v.lastExpiredAt && v.lastExpiredAt <= oneDayAgo) {
        const daysSince = Math.floor((nowMs - v.lastExpiredAt.getTime()) / DAY)
        const seg = expiredSegmentId(daysSince)
        if (seg) work.push({ tid, segId: seg })
        toMarkExpired.push(tid)
      }
    }

    // ── 3) TRIAL que nunca assinou (inclusive antigos) ──
    const { data: trialTenants } = await sb.from('tenants')
      .select('id,trial_end').eq('subscription_status', 'trial').limit(1000)
    for (const t of (trialTenants || [])) {
      if (paidTenants.has(t.id)) continue // ja teve alguma assinatura
      const end = t.trial_end ? new Date(t.trial_end).getTime() : null
      if (!end || end >= nowMs) continue // trial ainda em andamento (cobre o cron de trial)
      work.push({ tid: t.id, segId: 'trial_lapsed' })
    }

    // Marca expirados (independente de e-mail)
    for (const tid of toMarkExpired) {
      try { await sb.from('tenants').update({ subscription_status: 'expired' }).eq('id', tid) } catch {}
    }

    // ── 4) Processa por prioridade, respeitando o teto de e-mails ──
    work.sort((a, b) => (PRIORITY[a.segId] || 99) - (PRIORITY[b.segId] || 99))
    let emailsSent = 0, pushOnly = 0, deferred = 0
    const bySeg = {}

    for (const item of work) {
      const budgetLeft = emailsSent < EMAIL_BUDGET
      const r = await notifyTenant(sb, item.tid, item.segId, budgetLeft)
      if (r?.emailSent) emailsSent++
      if (r?.emailDeferred) deferred++
      if (r?.pushOnly) pushOnly++
      if (r?.segId) bySeg[r.segId] = (bySeg[r.segId] || 0) + 1
    }

    return NextResponse.json({
      ok: true, work: work.length, emailsSent, pushOnly,
      deferred_para_proximo_run: deferred, por_segmento: bySeg, budget: EMAIL_BUDGET,
    })
  } catch (err) {
    console.error('[cron/renewal] error', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function notifyTenant(sb, tid, segId, budgetLeft) {
  const seg = RENEWAL_SEGMENTS[segId]
  if (!seg) return null
  const { data: admin } = await sb.from('profiles')
    .select('id,email,nome').eq('tenant_id', tid).eq('role', 'admin').maybeSingle()
  if (!admin) return null

  const windowDays = SEG_WINDOW[segId] || 14
  const since = new Date(Date.now() - windowDays * 86400000).toISOString()
  const { data: recent } = await sb.from('winback_log')
    .select('channel,segment,sent_at').eq('user_id', admin.id).eq('segment', segId).gte('sent_at', since)

  // Cooldown global 24h: nao manda 2 e-mails pro mesmo user no mesmo dia
  const { data: recentAny } = await sb.from('winback_log')
    .select('id').eq('user_id', admin.id).eq('channel', 'email')
    .gte('sent_at', new Date(Date.now() - 24 * 3600000).toISOString()).limit(1)

  const url = `${APP_URL}/billing?utm_source=lifecycle&utm_medium=email&utm_campaign=${segId}`
  const vars = { nome: (admin.nome || '').split(' ')[0] || 'Operador' }
  const out = { segId }

  // PUSH (1x por segmento na janela)
  if (!recent?.some(r => r.channel === 'push')) {
    try {
      const pushRes = await sendPushToUser(sb, admin.id, {
        title: fill(seg.push.title, vars), body: fill(seg.push.body, vars), url, tag: segId,
      })
      const ok = pushRes && pushRes.sent > 0
      await sb.from('winback_log').insert({ user_id: admin.id, tenant_id: tid, segment: segId, channel: 'push', status: ok ? 'sent' : 'failed', payload: { raw: pushRes } })
      out.pushOnly = true
    } catch (e) { /* ignore */ }
  }

  // EMAIL (1x por segmento na janela, respeitando cooldown 24h e o teto)
  if (admin.email && !recent?.some(r => r.channel === 'email')) {
    if (recentAny && recentAny.length) { out.emailDeferred = true; return out }
    if (!budgetLeft) { out.emailDeferred = true; return out }
    // Preenche {nome} em TODOS os campos (o renderWinbackEmail so trata o assunto)
    const filledEmail = {}
    for (const k of Object.keys(seg.email)) filledEmail[k] = fill(seg.email[k], vars)
    const { subject, html } = renderWinbackEmail({ segment: { email: filledEmail }, vars: { ...vars, url } })
    const emailRes = await sendEmailViaResend({ to: admin.email, subject, html })
    if (!emailRes.skipped) {
      await sb.from('winback_log').insert({ user_id: admin.id, tenant_id: tid, segment: segId, channel: 'email', status: emailRes.ok ? 'sent' : 'failed', payload: { subject, raw: emailRes } })
      if (emailRes.ok) out.emailSent = true
    }
  }
  return out
}

function fill(text, vars = {}) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : `{${k}}`)
}

export async function GET(req) { return POST(req) }
