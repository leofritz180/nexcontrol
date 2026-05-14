import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'
import { renderWinbackEmail, sendEmailViaResend } from '../../../../lib/email-templates'

// Cron diario que detecta subs vencidas e:
// 1. Atualiza tenant.subscription_status='expired'
// 2. Manda push + email de renovacao (anti-spam: 1x por user)
//
// Vercel cron: "schedule": "30 12 * * *" (12:30 UTC = 9:30 Brasilia)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'

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

const RENEWAL_SEGMENTS = {
  expired: {
    push: { title: 'Sua assinatura venceu', body: 'Renove em 1 clique e continue operando sem interrupcao.' },
    email: {
      subject: 'Sua assinatura NexControl venceu — renove em 1 clique',
      preheader: 'Acesso bloqueado ate renovar.',
      bodyTitle: 'Sua assinatura venceu',
      bodyText: 'Seus 30 dias acabaram. Pra continuar usando o NexControl e nao perder o acesso, renove sua assinatura agora. O processo leva menos de 1 minuto.',
      ctaText: 'Renovar agora',
    },
  },
  expiring_soon: { // 3 dias antes
    push: { title: 'Assinatura vence em breve', body: 'Renove com antecedencia pra nao perder acesso.' },
    email: {
      subject: 'Sua assinatura NexControl vence em 3 dias',
      preheader: 'Renove com antecedencia.',
      bodyTitle: 'Sua assinatura vence em 3 dias',
      bodyText: 'Pra evitar interrupcao no seu acesso e nas operacoes da equipe, renove sua assinatura agora. Mantem o sistema rodando sem nenhuma pausa.',
      ctaText: 'Renovar antes de expirar',
    },
  },
}

export async function POST(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 86400000)

    // Pega TODAS subs ativas, agrupa por tenant pra saber quem nao tem nenhuma valida
    const { data: allSubs } = await sb.from('subscriptions')
      .select('tenant_id,expires_at,status')
      .eq('status', 'active')

    const tenantValidity = {} // tid → { hasValid: bool, nearestExpiry: Date|null, lastExpiredAt: Date|null }
    for (const s of (allSubs || [])) {
      const exp = s.expires_at ? new Date(s.expires_at) : null
      if (!tenantValidity[s.tenant_id]) tenantValidity[s.tenant_id] = { hasValid: false, nearestExpiry: null, lastExpiredAt: null }
      if (!exp || exp > now) {
        tenantValidity[s.tenant_id].hasValid = true
        if (exp && (!tenantValidity[s.tenant_id].nearestExpiry || exp < tenantValidity[s.tenant_id].nearestExpiry)) {
          tenantValidity[s.tenant_id].nearestExpiry = exp
        }
      } else if (exp) {
        // Sub vencida — salva a data MAIS RECENTE de expiracao (pra saber ha quanto tempo o tenant ta vencido)
        if (!tenantValidity[s.tenant_id].lastExpiredAt || exp > tenantValidity[s.tenant_id].lastExpiredAt) {
          tenantValidity[s.tenant_id].lastExpiredAt = exp
        }
      }
    }

    // Expired SO conta quem venceu ha >= 24h. Quem venceu hoje ganha 1 dia de gracia
    // antes de receber o primeiro push de renovacao.
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000)
    const expiredTenants = Object.entries(tenantValidity).filter(([_, v]) => {
      if (v.hasValid) return false
      if (!v.lastExpiredAt) return false // sem data, ignora
      return v.lastExpiredAt <= oneDayAgo
    }).map(([t]) => t)
    const expiringSoonTenants = Object.entries(tenantValidity)
      .filter(([_, v]) => v.hasValid && v.nearestExpiry && v.nearestExpiry < in3Days)
      .map(([t]) => t)

    const results = { expired: [], expiring_soon: [] }

    // Process EXPIRED
    for (const tid of expiredTenants) {
      // Atualiza tenant
      try { await sb.from('tenants').update({ subscription_status: 'expired' }).eq('id', tid) } catch {}
      const { data: admin } = await sb.from('profiles').select('id,email,nome').eq('tenant_id', tid).eq('role', 'admin').maybeSingle()
      if (!admin) continue
      const r = await notifyAdmin(sb, admin, RENEWAL_SEGMENTS.expired, 'expired_renewal')
      results.expired.push({ tenant_id: tid, admin: admin.email, ...r })
    }

    // Process EXPIRING_SOON (3d antes)
    for (const tid of expiringSoonTenants) {
      const { data: admin } = await sb.from('profiles').select('id,email,nome').eq('tenant_id', tid).eq('role', 'admin').maybeSingle()
      if (!admin) continue
      const r = await notifyAdmin(sb, admin, RENEWAL_SEGMENTS.expiring_soon, 'expiring_soon_renewal')
      results.expiring_soon.push({ tenant_id: tid, admin: admin.email, ...r })
    }

    return NextResponse.json({
      ok: true,
      expired_count: expiredTenants.length,
      expiring_soon_count: expiringSoonTenants.length,
      results,
    })
  } catch (err) {
    console.error('[cron/renewal] error', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function notifyAdmin(sb, admin, segment, segmentId) {
  const result = { push: null, email: null }
  // Anti-spam: re-tenta a cada 48h enquanto o tenant nao renovar.
  // Antes era 7d, mas isso espacava demais e perdia a janela quente
  // de renovacao logo apos o vencimento.
  const ANTI_SPAM_MS = 48 * 3600000
  const { data: recent } = await sb.from('winback_log')
    .select('id,channel')
    .eq('user_id', admin.id)
    .eq('segment', segmentId)
    .gte('sent_at', new Date(Date.now() - ANTI_SPAM_MS).toISOString())

  const url = `${APP_URL}/billing?utm_source=renewal&utm_medium=email&utm_campaign=${segmentId}`
  const vars = { nome: (admin.nome || '').split(' ')[0] || 'Operador' }

  // PUSH (1x por week)
  if (!recent?.some(r => r.channel === 'push')) {
    try {
      const pushRes = await sendPushToUser(sb, admin.id, {
        title: segment.push.title,
        body: segment.push.body,
        url,
        tag: segmentId,
      })
      const ok = pushRes && pushRes.sent > 0
      await sb.from('winback_log').insert({
        user_id: admin.id, segment: segmentId, channel: 'push',
        status: ok ? 'sent' : 'failed', payload: { raw: pushRes },
      })
      result.push = { ok }
    } catch (e) {
      result.push = { ok: false, error: e?.message }
    }
  } else {
    result.push = { skipped: 'recent' }
  }

  // EMAIL (1x por week)
  if (admin.email && !recent?.some(r => r.channel === 'email')) {
    const emailObj = { ...segment, email: { ...segment.email } }
    const { subject, html } = renderWinbackEmail({ segment: emailObj, vars: { ...vars, url } })
    const emailRes = await sendEmailViaResend({ to: admin.email, subject, html })
    if (!emailRes.skipped) {
      await sb.from('winback_log').insert({
        user_id: admin.id, segment: segmentId, channel: 'email',
        status: emailRes.ok ? 'sent' : 'failed', payload: { subject, raw: emailRes },
      })
    }
    result.email = emailRes
  } else {
    result.email = { skipped: admin.email ? 'recent' : 'no_email' }
  }

  return result
}

export async function GET(req) { return POST(req) }
