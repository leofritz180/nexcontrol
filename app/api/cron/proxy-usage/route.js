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

// Copy por limiar — tom crescente (tranquilo -> atencao -> urgente).
const ALERT_COPY = {
  40:  { title: '🟢 Proxy · 40 GB restantes', body: 'Tá tranquilo! Sua proxy ainda tem 40 GB. Bora operar. 🚀' },
  30:  { title: '🟢 Proxy · 30 GB restantes', body: 'Sua proxy tá voando: restam 30 GB. Segue o baile!' },
  20:  { title: '🟢 Proxy · 20 GB restantes', body: 'Restam 20 GB na sua proxy — ainda tem bastante gás. 💪' },
  10:  { title: '🔵 Proxy · 10 GB restantes', body: 'Chegou a 10 GB. Fica de olho pra não zerar no meio da operação.' },
  5:   { title: '🟡 Proxy · 5 GB restantes', body: 'Atenção: restam 5 GB. Já vale planejar a recarga. ⏳' },
  2:   { title: '🟠 Proxy · 2 GB restantes', body: 'Restam só 2 GB! Recarrega logo pra não parar a operação.' },
  1:   { title: '🟠 Proxy · 1 GB restante', body: '1 GB restante! Sua proxy tá quase no fim — recarrega antes de acabar.' },
  0.5: { title: '🔴 Proxy · 500 MB restantes', body: 'Só 500 MB! Corre e recarrega antes que pare. 🏃' },
  0.3: { title: '🔴 Proxy · 300 MB restantes', body: '300 MB! Sua proxy tá no vermelho — recarrega já.' },
  0.1: { title: '⚠️ Proxy ACABANDO · 100 MB', body: 'Só 100 MB restantes! Recarregue AGORA pra não perder o acesso. 🚨' },
}
function alertCopy(m) {
  return ALERT_COPY[m] || { title: 'Aviso de consumo — proxy', body: `Sua proxy: restam ${milestoneLabel(m)}.` }
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
      const copy = alertCopy(m)
      await sendPushToUser(sb, uid, {
        title: copy.title, body: copy.body,
        url: '/minhas-proxies', tag: 'proxy_thr_' + pid + '_' + m,
      }).catch(() => {})
      alerts++
    }
  }

  return NextResponse.json({ ok: true, seen, firstRun: isFirstRun, welcomed, alerts })
}
