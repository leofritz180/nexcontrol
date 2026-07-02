import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

// Robo de consumo de proxy. Usa o endpoint low-balance do allan (via Bettify):
// 1 chamada em lote que devolve SO as proxies abaixo do limite (leve, sem checar tudo).
// Casa por email com o usuario da Nex e dispara:
//   - "parabens" quando uma proxy NOVA aparece (compra <= limite),
//   - "restam X" quando o restante cruza um limiar fixo (1x cada).
// Estado em bettify_proxies (chave = proxy_id do allan) evita repetir.

const THRESHOLDS = [40, 30, 20, 10, 5, 2, 1, 0.5, 0.3, 0.1]

function milestoneFor(remaining) {
  if (remaining === null || remaining === undefined) return null
  const c = THRESHOLDS.filter((t) => remaining <= t)
  return c.length ? Math.min(...c) : null
}
function milestoneLabel(m) {
  return m >= 1 ? `${m} GB` : `${Math.round(m * 1000)} MB`
}
function bettifyBase() {
  return (process.env.BETTIFY_URL || 'https://www.bettifyproxy.com')
    .replace(/\/+$/, '')
    .replace('://bettifyproxy.com', '://www.bettifyproxy.com')
}

export async function GET(req) {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const secret = process.env.BETTIFY_SSO_SECRET
  if (!secret) return NextResponse.json({ error: 'no_bettify_secret' }, { status: 500 })

  // 1. Low-balance: so as proxies <= 40GB (cobre todos os limiares), 1 chamada
  let proxies = []
  try {
    const res = await fetch(`${bettifyBase()}/api/nex/low-balance?threshold_gb=40&limit=300`, {
      headers: { Authorization: 'Bearer ' + secret }, cache: 'no-store',
    })
    const d = await res.json()
    proxies = Array.isArray(d?.proxies) ? d.proxies : []
  } catch {
    return NextResponse.json({ error: 'bettify_fetch_failed' }, { status: 502 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: existingRows } = await sb.from('bettify_proxies').select('*')
  const existing = new Map((existingRows || []).map((r) => [r.proxy_id, r]))
  const isFirstRun = (existingRows || []).length === 0

  const emails = [...new Set(proxies.map((p) => p.email).filter(Boolean))]
  const profByEmail = new Map()
  if (emails.length) {
    const { data: profs } = await sb.from('profiles').select('id,tenant_id,email').in('email', emails)
    for (const p of profs || []) profByEmail.set(String(p.email || '').toLowerCase(), p)
  }

  let welcomed = 0, alerts = 0, seen = 0
  for (const px of proxies) {
    const pid = String(px.proxy_id || '')
    if (!pid) continue
    seen++
    const email = String(px.email || '').toLowerCase()
    const prof = email ? profByEmail.get(email) : null
    const rem = px.remaining_gb === null || px.remaining_gb === undefined ? null : Number(px.remaining_gb)
    const total = px.total_gb === null || px.total_gb === undefined ? null : Number(px.total_gb)
    const m = milestoneFor(rem)
    const row = existing.get(pid)

    if (!row) {
      await sb.from('bettify_proxies').insert({
        proxy_id: pid, email: email || null, user_id: prof?.id || null, tenant_id: prof?.tenant_id || null,
        gb_total: total, gb_remaining: rem, status: px.status || null,
        welcomed: true, last_threshold_gb: m,
      })
      if (!isFirstRun && prof?.id) {
        await sendPushToUser(sb, prof.id, {
          title: '🎉 Proxy adquirida!',
          body: `Parabéns! Você adquiriu ${total != null ? milestoneLabel(total) : 'sua'} de proxy. Bora operar!`,
          url: '/minhas-proxies', tag: 'proxy_welcome_' + pid,
        }).catch(() => {})
        welcomed++
      }
      continue
    }

    const last = row.last_threshold_gb === null || row.last_threshold_gb === undefined ? null : Number(row.last_threshold_gb)
    let notify = false, newLast = last
    if (m === null) newLast = null
    else if (last === null || m < last) { notify = true; newLast = m }
    else if (m > last) newLast = m

    await sb.from('bettify_proxies').update({
      gb_total: total, gb_remaining: rem, status: px.status || null,
      user_id: prof?.id || row.user_id, tenant_id: prof?.tenant_id || row.tenant_id,
      last_threshold_gb: newLast, updated_at: new Date().toISOString(),
    }).eq('proxy_id', pid)

    const uid = prof?.id || row.user_id
    if (notify && uid && !isFirstRun) {
      const acabando = m <= 0.1
      await sendPushToUser(sb, uid, {
        title: acabando ? '⚠️ Proxy acabando!' : 'Aviso de consumo — proxy',
        body: acabando
          ? `Sua proxy está acabando: restam ${milestoneLabel(m)}. Recarregue pra não parar a operação.`
          : `Sua proxy: restam ${milestoneLabel(m)}.`,
        url: '/minhas-proxies', tag: 'proxy_thr_' + pid + '_' + m,
      }).catch(() => {})
      alerts++
    }
  }

  return NextResponse.json({ ok: true, seen, firstRun: isFirstRun, welcomed, alerts })
}
