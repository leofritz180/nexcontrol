import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

// Robo de consumo de proxy: le a giga (tempo real) de todas as proxies via Bettify,
// casa por email com o usuario da Nex e dispara:
//   - "parabens" quando uma proxy NOVA aparece (compra),
//   - "restam X" quando o restante cruza um limiar fixo (1x cada).
// Guarda estado em bettify_proxies pra nao repetir. Roda via Vercel Cron.

// Limiares fixos (em GB). Ordem nao importa.
const THRESHOLDS = [40, 30, 20, 10, 5, 2, 1, 0.5, 0.3, 0.1]

// Menor limiar que "cobre" o restante = o marco atual (ex: restam 0.4 -> marco 0.5 = 500MB)
function milestoneFor(remaining) {
  if (remaining === null || remaining === undefined) return null
  const c = THRESHOLDS.filter((t) => remaining <= t)
  return c.length ? Math.min(...c) : null
}

// Rotulo do marco: >=1 -> "X GB" | <1 -> "XXX MB" (500/300/100)
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

  // 1. Busca todas as proxies + giga na Bettify
  let proxies = []
  try {
    const res = await fetch(`${bettifyBase()}/api/nex/proxies`, {
      headers: { Authorization: 'Bearer ' + secret }, cache: 'no-store',
    })
    const d = await res.json()
    proxies = Array.isArray(d?.proxies) ? d.proxies : []
  } catch {
    return NextResponse.json({ error: 'bettify_fetch_failed' }, { status: 502 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // 2. Estado atual + perfis por email
  const { data: existingRows } = await sb.from('bettify_proxies').select('*')
  const existing = new Map((existingRows || []).map((r) => [r.proxy_id, r]))
  const isFirstRun = (existingRows || []).length === 0 // 1o run: so semeia, nao notifica ninguem

  const emails = [...new Set(proxies.map((p) => p.email).filter(Boolean))]
  const profByEmail = new Map()
  if (emails.length) {
    const { data: profs } = await sb.from('profiles').select('id,tenant_id,email').in('email', emails)
    for (const p of profs || []) profByEmail.set(String(p.email || '').toLowerCase(), p)
  }

  let welcomed = 0, alerts = 0, seen = 0
  for (const px of proxies) {
    const pid = String(px.id || '')
    if (!pid) continue
    seen++
    const email = String(px.email || '').toLowerCase()
    const prof = profByEmail.get(email)
    const uidFallback = prof?.id || null
    const rem = px.gb_remaining === null || px.gb_remaining === undefined ? null : Number(px.gb_remaining)
    const total = px.gb_total === null || px.gb_total === undefined ? null : Number(px.gb_total)
    const m = milestoneFor(rem)
    const row = existing.get(pid)

    if (!row) {
      // Proxy nova pra nossa base
      await sb.from('bettify_proxies').insert({
        proxy_id: pid, email, user_id: prof?.id || null, tenant_id: prof?.tenant_id || null,
        gb_total: total, gb_remaining: rem, status: px.status || null,
        welcomed: true, last_threshold_gb: m,
      })
      // Parabens SO se nao for o 1o run (backfill) e tiver usuario casado
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

    // Ja existe: atualiza estado + checa limiar
    const last = row.last_threshold_gb === null || row.last_threshold_gb === undefined ? null : Number(row.last_threshold_gb)
    let notify = false, newLast = last
    if (m === null) newLast = null                    // recarregou acima de todos os limiares
    else if (last === null || m < last) { notify = true; newLast = m } // desceu pra um marco novo
    else if (m > last) newLast = m                    // recarga parcial (nao avisa)

    await sb.from('bettify_proxies').update({
      gb_total: total, gb_remaining: rem, status: px.status || null,
      user_id: prof?.id || row.user_id, tenant_id: prof?.tenant_id || row.tenant_id,
      last_threshold_gb: newLast, updated_at: new Date().toISOString(),
    }).eq('proxy_id', pid)

    const uid = uidFallback || row.user_id
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
