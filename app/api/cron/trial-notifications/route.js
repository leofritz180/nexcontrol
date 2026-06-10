import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToTenant, sendPushToUser } from '../../../../lib/push'
import { getOperatorLimitStatus } from '../../../../lib/operator-limit'
import { pickEngagementSegment, fillTemplate } from '../../../../lib/engagement-segments'
import { renderWinbackEmail, sendEmailViaResend } from '../../../../lib/email-templates'

// Call daily via Vercel Cron or external scheduler
// GET /api/cron/trial-notifications?secret=YOUR_SECRET

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'

// E-mails de conversao do TRIAL (espelham o push). Disparam junto com o push
// nos momentos-chave. Sem RESEND_API_KEY o envio e' apenas pulado (sem erro).
const TRIAL_EMAILS = {
  '3d': { subject: 'Faltam 3 dias do seu teste NexControl', preheader: 'Garanta R$ 39,90/mes antes de bloquear.', bodyTitle: 'Faltam 3 dias do seu teste', bodyText: 'Seu teste gratis esta acabando. Assine agora e garanta o NexControl por R$ 39,90/mes. Apos o trial o acesso e bloqueado e voce perde a visao da operacao em tempo real.', ctaText: 'Assinar agora' },
  '1d': { subject: 'Ultimo dia do seu teste gratis', preheader: 'Amanha o acesso e bloqueado.', bodyTitle: 'Ultimo dia do seu teste', bodyText: 'Amanha seu acesso e bloqueado. Assine em 1 clique pra nao perder seus dados, suas metas e o controle da sua equipe.', ctaText: 'Assinar antes de bloquear' },
  'expired': { subject: 'Seu teste expirou — reative em 1 clique', preheader: 'Recupere seu acesso agora.', bodyTitle: 'Seu teste expirou', bodyText: 'Seu teste gratis acabou e o acesso foi bloqueado. Reative sua conta agora pra recuperar seus dados e voltar a operar sem nenhuma pausa.', ctaText: 'Reativar acesso' },
}

async function sendTrialEmail(supabase, tenantId, segKey) {
  try {
    const seg = TRIAL_EMAILS[segKey]
    if (!seg) return
    const { data: admin } = await supabase.from('profiles')
      .select('email,nome').eq('tenant_id', tenantId).eq('role', 'admin').maybeSingle()
    if (!admin?.email) return
    const url = `${APP_URL}/billing-mp?utm_source=trial&utm_medium=email&utm_campaign=trial_${segKey}`
    const { subject, html } = renderWinbackEmail({
      segment: { email: seg },
      vars: { nome: (admin.nome || '').split(' ')[0] || 'Operador', url },
    })
    await sendEmailViaResend({ to: admin.email, subject, html })
  } catch (e) {
    console.error('[trial-cron] email failed', e?.message)
  }
}

export async function GET(req) {
  // Simple auth
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const today = new Date().toISOString().slice(0, 10)
  let sent = 0, expired = 0

  // Get all tenants in trial
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id,name,trial_end,subscription_status,last_trial_notif_date,trial_expired_notified')
    .eq('subscription_status', 'trial')

  if (!tenants?.length) return NextResponse.json({ sent: 0, expired: 0, msg: 'No trials' })

  const now = new Date()

  for (const t of tenants) {
    const trialEnd = new Date(t.trial_end)
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))

    // Skip if already notified today
    if (t.last_trial_notif_date === today) continue

    if (daysLeft > 0) {
      // Trial active — send daily reminder (so notifica em momentos chave: 3d, 1d, 0d)
      let title, body, shouldNotify = false

      if (daysLeft === 3) {
        title = 'Faltam 3 dias do seu teste'
        body = 'Assine agora e garanta R$ 39,90/mes. Apos o trial o acesso e bloqueado.'
        shouldNotify = true
      } else if (daysLeft === 1) {
        title = 'Ultimo dia do seu teste gratis'
        body = 'Amanha o acesso e bloqueado. Assine em 1 clique pra nao perder seus dados.'
        shouldNotify = true
      }
      // dias intermediarios (2, 4-7): nao notifica (evita spam)

      if (shouldNotify) {
        await sendPushToTenant(supabase, t.id, { title, body, url: '/billing-mp', tag: 'trial-' + daysLeft + 'd' })
        await sendTrialEmail(supabase, t.id, daysLeft === 3 ? '3d' : '1d')
        await supabase.from('tenants').update({ last_trial_notif_date: today }).eq('id', t.id)
        sent++
      }

    } else if (!t.trial_expired_notified) {
      // Trial expired — send expiration notice + update status
      await sendPushToTenant(supabase, t.id, {
        title: 'Seu teste expirou',
        body: 'Assine agora pra recuperar acesso e nao perder seus dados.',
        url: '/billing-mp',
        tag: 'trial-expired',
      })
      await sendTrialEmail(supabase, t.id, 'expired')

      await supabase.from('tenants').update({
        last_trial_notif_date: today,
        trial_expired_notified: true,
      }).eq('id', t.id)

      expired++
    }
  }

  // ── BONUS: detecta excesso de operadores e notifica admins ──
  // Roda 1x/dia (mesmo cron diario). Aviso suave, nao bloqueia.
  let opExcessNotified = 0
  try {
    const { data: activeTenants } = await supabase
      .from('tenants')
      .select('id, name, subscription_status')
      .eq('subscription_status', 'active')
    for (const t of activeTenants || []) {
      const status = await getOperatorLimitStatus(supabase, t.id)
      if (!status || status.excess === 0) continue
      // Anti-spam: so notifica 1x a cada 7 dias
      const { data: last } = await supabase
        .from('winback_log').select('id, sent_at')
        .eq('tenant_id', t.id).eq('segment', 'op_limit')
        .gte('sent_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1).maybeSingle()
      if (last) continue
      await sendPushToTenant(supabase, t.id, {
        title: 'Limite de operadores excedido',
        body: `Você tem ${status.current} operadores mas o plano cobre ${status.limit}. Remova ${status.excess} ou faça upgrade.`,
        url: '/operadores',
        tag: 'op-limit',
      })
      await supabase.from('winback_log').insert({
        tenant_id: t.id, segment: 'op_limit', channel: 'push', sent_at: new Date().toISOString(),
      })
      opExcessNotified++
    }
  } catch (e) {
    console.error('[trial-cron] op-limit check failed', e?.message)
  }

  // ── ENGAGEMENT PUSH: clientes PAGANTES inativos ha 1, 2, 3 ou 7 dias ──
  // Anti-spam: cada (user_id, segment) so dispara 1x — winback_log impede repeticao.
  let engagementSent = 0
  try {
    // Pega tenants com sub ativa nao expirada
    const { data: activeSubs } = await supabase.from('subscriptions')
      .select('tenant_id, expires_at, status').eq('status', 'active')
    const nowMs = Date.now()
    const activeTids = new Set(
      (activeSubs || [])
        .filter(s => !s.expires_at || new Date(s.expires_at).getTime() > nowMs)
        .map(s => s.tenant_id)
    )
    if (activeTids.size > 0) {
      const { data: admins } = await supabase.from('profiles')
        .select('id, nome, tenant_id, last_seen_at')
        .eq('role', 'admin')
        .in('tenant_id', [...activeTids])
      for (const adm of admins || []) {
        const lastSeen = adm.last_seen_at ? new Date(adm.last_seen_at).getTime() : null
        if (!lastSeen) continue // se nunca acessou, ignora (cobertura tem trial-cron)
        const daysInactive = Math.floor((nowMs - lastSeen) / 86400000)
        const seg = pickEngagementSegment(daysInactive)
        if (!seg) continue
        // Anti-spam: ja enviou esse segmento pra esse user?
        const { data: prev } = await supabase.from('winback_log')
          .select('id').eq('user_id', adm.id).eq('segment', seg.id).limit(1).maybeSingle()
        if (prev) continue
        // Cooldown global 24h: nao spam se ja recebeu qualquer push hoje
        const dayAgo = new Date(nowMs - 24 * 3600000).toISOString()
        const { data: recent } = await supabase.from('winback_log')
          .select('id').eq('user_id', adm.id).gte('sent_at', dayAgo).limit(1).maybeSingle()
        if (recent) continue
        const vars = { nome: (adm.nome || '').split(' ')[0] || 'Operador' }
        await sendPushToUser(supabase, adm.id, {
          title: fillTemplate(seg.push.title, vars),
          body: fillTemplate(seg.push.body, vars),
          url: '/admin',
          tag: seg.id,
        })
        await supabase.from('winback_log').insert({
          user_id: adm.id, tenant_id: adm.tenant_id,
          segment: seg.id, channel: 'push',
          sent_at: new Date().toISOString(),
        })
        engagementSent++
      }
    }
  } catch (e) {
    console.error('[trial-cron] engagement push failed', e?.message)
  }

  return NextResponse.json({ sent, expired, total: tenants.length, opExcessNotified, engagementSent })
}
