import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'
import { renderWinbackEmail, sendEmailViaResend } from '../../../../lib/email-templates'

export const maxDuration = 60
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'
const SEGMENT = 'comeback_flex'
const EMAIL_CAP = 60 // teto por execução (respeita o limite diário do Resend)

// Winback ONE-SHOT pros pagantes que venceram nos últimos 30 dias: mensagem
// honesta de "volte" reconhecendo que a renovação ficou flexível (reduzir
// operadores / plano base). Dedup por winback_log(segment=comeback_flex) — cada
// pessoa recebe UMA vez, mesmo rodando o cron todo dia. Some sozinho quando
// todos ja receberam. Remover a rota depois de entregue.
const COPY = {
  push: {
    title: 'Sua operação continua salva',
    body: 'Consertamos o que travava sua renovação — agora você renova do seu jeito, até só o plano base. Volte em 1 clique.',
  },
  email: {
    subject: '{nome}, renovar ficou mais flexível — sua operação te espera',
    preheader: 'Renove do seu jeito, até só o plano base. Seus dados estão intactos.',
    bodyTitle: 'Sua operação está te esperando',
    bodyText: '{nome}, seus dados, metas e histórico continuam salvos no NexControl. E tem novidade: a renovação ficou flexível — agora você renova do seu jeito, reduzindo operadores ou ficando só no plano base, e o sistema acerta tudo sozinho. Se algo travou sua renovação antes, já foi resolvido. Volte em 1 clique via PIX e retome o controle da sua operação de onde parou.',
    ctaText: 'Renovar agora',
  },
}
const fill = (t, v) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : `{${k}}`)

export async function GET(req) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const now = Date.now()

  // Todas as subs pagas (paginado) -> ultima expiracao por tenant
  let subs = [], from = 0
  while (true) {
    const { data } = await sb.from('subscriptions').select('tenant_id,total_amount,payment_method,expires_at').gt('total_amount', 0).range(from, from + 999)
    subs.push(...(data || [])); if (!data || data.length < 1000) break; from += 1000
  }
  subs = subs.filter(s => s.payment_method !== 'cortesia_parceiro')
  const byT = {}
  for (const s of subs) {
    const e = s.expires_at ? new Date(s.expires_at).getTime() : null
    if (e && (!byT[s.tenant_id] || e > byT[s.tenant_id])) byT[s.tenant_id] = e
  }
  // churn nos ultimos 30 dias, ainda vencido hoje
  const targets = Object.entries(byT)
    .filter(([, exp]) => exp <= now && exp > now - 30 * 86400000)
    .map(([t]) => t)

  const url = `${APP_URL}/billing-mp?renewal=1&utm_source=comeback&utm_medium=email`
  let pushSent = 0, emailSent = 0, skipped = 0

  for (const tenantId of targets) {
    if (emailSent >= EMAIL_CAP) break
    try {
      const { data: admin } = await sb.from('profiles').select('id,email,nome').eq('tenant_id', tenantId).eq('role', 'admin').maybeSingle()
      if (!admin?.email) continue

      // Dedup: ja recebeu este winback?
      const { data: prev } = await sb.from('winback_log').select('id').eq('user_id', admin.id).eq('segment', SEGMENT).limit(1).maybeSingle()
      if (prev) { skipped++; continue }
      // Cooldown 24h: nao empilha com outro email do mesmo dia
      const dayAgo = new Date(now - 24 * 3600000).toISOString()
      const { data: recent } = await sb.from('winback_log').select('id').eq('user_id', admin.id).eq('channel', 'email').gte('sent_at', dayAgo).limit(1).maybeSingle()
      if (recent) { skipped++; continue }

      const nome = (admin.nome || '').split(' ')[0] || 'Operador'
      const vars = { nome }
      try { const r = await sendPushToUser(sb, admin.id, { title: fill(COPY.push.title, vars), body: fill(COPY.push.body, vars), url, tag: SEGMENT }); if (r?.sent > 0) pushSent++ } catch {}
      const filledEmail = {}
      for (const k of Object.keys(COPY.email)) filledEmail[k] = fill(COPY.email[k], vars)
      const { subject, html } = renderWinbackEmail({ segment: { email: filledEmail }, vars: { nome, url } })
      const res = await sendEmailViaResend({ to: admin.email, subject, html })
      if (!res.skipped) {
        await sb.from('winback_log').insert({ user_id: admin.id, tenant_id: tenantId, segment: SEGMENT, channel: 'email', status: res.ok ? 'sent' : 'failed' })
        if (res.ok) emailSent++
      }
    } catch (e) {
      console.error('[comeback] tenant falhou', tenantId, e?.message)
    }
  }

  return NextResponse.json({ ok: true, targets: targets.length, pushSent, emailSent, skipped, cap: EMAIL_CAP })
}
