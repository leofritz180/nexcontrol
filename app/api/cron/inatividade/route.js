import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notificarUsuarios } from '../../../../lib/pushNotificar'
import { renderWinbackEmail, sendEmailViaResend } from '../../../../lib/email-templates'
import { cronAutorizado } from '../../../../lib/cron-auth'
import { alvosInatividade, dataCurta, jaAvisado, textos } from '../../../../lib/inatividade'

export const maxDuration = 60
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'
const EMAIL_CAP = 60 // teto por execução (limite diário do Resend é dividido com os outros crons)

// AVISO DE INATIVIDADE (06/10/2026) — cliente pagante que parou de lançar.
// Por que, o que conta e os marcos estão em lib/inatividade.js.
//   push   tipo 'alerta-operacao', categoria 'insights': sai por
//          notificarUsuarios, que respeita quem desligou a categoria
//   email  sempre, com teto
//   dedup  winback_log por (user, marco) desde o último lançamento: um
//          aviso por marco por silêncio. Cooldown de 24h com qualquer outro
//          e-mail nosso, pra não empilhar com renovação/winback.
//   ?dry=1 lista os alvos sem enviar nada (pra conferir antes).
export async function GET(req) {
  if (!cronAutorizado(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = new URL(req.url).searchParams.get('dry') === '1'
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const agora = Date.now()

  let alvos
  try { alvos = await alvosInatividade(sb, agora) }
  catch (e) { console.error('[inatividade] alvos falhou', e?.message); return NextResponse.json({ error: e?.message }, { status: 500 }) }

  const url = `${APP_URL}/admin?utm_source=inatividade&utm_medium=email`
  let pushSent = 0, emailSent = 0, skipped = 0
  const lista = []

  for (const a of alvos) {
    if (emailSent >= EMAIL_CAP) break
    try {
      const { data: admin } = await sb.from('profiles').select('id,email,nome').eq('tenant_id', a.tenantId).eq('role', 'admin').maybeSingle()
      if (!admin?.email) continue
      if (await jaAvisado(sb, admin.id, a.marco.segmento, a.ultimo)) { skipped++; continue }
      const ontem = new Date(agora - 24 * 3600000).toISOString()
      const { data: recente } = await sb.from('winback_log').select('id').eq('user_id', admin.id).eq('channel', 'email').gte('sent_at', ontem).limit(1).maybeSingle()
      if (recente) { skipped++; continue }

      const nome = (admin.nome || '').split(' ')[0] || 'Operador'
      const t = textos(a.marco, { nome, desde: dataCurta(a.ultimo) })
      lista.push({ tenant: a.tenantId, email: admin.email, dias: a.dias, marco: a.marco.segmento })
      if (dry) continue

      try {
        const r = await notificarUsuarios(sb, [admin.id], 'alerta-operacao', { titulo: t.push.titulo, corpo: t.push.corpo, url: '/admin', chave: 'inativo' })
        if (r?.sent > 0) pushSent++
      } catch (e) { console.error('[inatividade] push falhou', admin.id, e?.message) }

      const { subject, html } = renderWinbackEmail({ segment: { email: t.email }, vars: { nome, url } })
      const res = await sendEmailViaResend({ to: admin.email, subject, html })
      if (!res.skipped) {
        await sb.from('winback_log').insert({ user_id: admin.id, tenant_id: a.tenantId, segment: a.marco.segmento, channel: 'email', status: res.ok ? 'sent' : 'failed', payload: { dias: a.dias, ultimo: new Date(a.ultimo).toISOString() } })
        if (res.ok) emailSent++
      }
    } catch (e) {
      console.error('[inatividade] tenant falhou', a.tenantId, e?.message)
    }
  }

  return NextResponse.json({ ok: true, dry, alvos: alvos.length, pushSent, emailSent, skipped, cap: EMAIL_CAP, ...(dry ? { lista } : {}) })
}
