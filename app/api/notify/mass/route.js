import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '../../../../lib/push'

export const dynamic = 'force-dynamic'

const OWNER_EMAIL = 'leofritz180@gmail.com'
const fmtBRL = v => (Number(v) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

function sbAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function authUser(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: 'Bearer ' + token } } }
  )
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

async function fetchAll(sb, table, sel) {
  const P=1000; let all=[], from=0
  while(true){ const {data}=await sb.from(table).select(sel).range(from,from+P-1); if(!data||!data.length) break; all=all.concat(data); if(data.length<P) break; from+=P }
  return all
}

// POST /api/notify/mass — disparo em massa pro owner.
// Body: { type: 'lucro_semana'|'lucro_hoje'|'lucro_mes', dryRun?: true }
// Auth: precisa estar logado como owner OU passar ?secret=CRON_SECRET
export async function POST(req) {
  let authorized = false
  // 1) CRON_SECRET via querystring (se configurado)
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  if (secret && process.env.CRON_SECRET && secret === process.env.CRON_SECRET) authorized = true
  // 2) Header x-internal-auth com SUPABASE_SERVICE_ROLE_KEY (so server-side conhece)
  if (!authorized) {
    const internal = (req.headers.get('x-internal-auth') || '').trim()
    const expected = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    if (internal && expected && internal === expected) authorized = true
  }
  // 3) Owner logado
  if (!authorized) {
    const user = await authUser(req)
    if (user?.email?.toLowerCase() === OWNER_EMAIL) authorized = true
  }
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, dryRun } = await req.json().catch(() => ({}))
  if (!type) return NextResponse.json({ error: 'type obrigatorio' }, { status: 400 })
  if (!['lucro_hoje', 'lucro_semana', 'lucro_mes', 'lucro_mes_atual'].includes(type)) {
    return NextResponse.json({ error: 'type invalido' }, { status: 400 })
  }

  const sb = sbAdmin()
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const today00 = new Date(todayISO + 'T00:00:00Z').getTime()
  const tomorrow = today00 + 86400000
  const day7 = today00 - 7 * 86400000
  const day30 = today00 - 30 * 86400000
  const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const monthStartSP = new Date(spNow.getFullYear(), spNow.getMonth(), 1, 0, 0, 0).getTime() + 3 * 3600000

  // Dia operacional do "hoje": vira 5h BRT (= 8h UTC), igual ao card do dashboard.
  const TZ = 3 * 3600000
  const _brt = new Date(now.getTime() - TZ)
  const _opStart = new Date(_brt); _opStart.setUTCHours(5, 0, 0, 0)
  if (_brt.getUTCHours() < 5) _opStart.setUTCDate(_opStart.getUTCDate() - 1)
  const opHojeStart = _opStart.getTime() + TZ
  const opHojeEnd = opHojeStart + 86400000

  let windowStart, windowEnd = null, label = ''
  if (type === 'lucro_hoje') { windowStart = opHojeStart; windowEnd = opHojeEnd; label = 'Lucro de hoje' }
  if (type === 'lucro_semana') { windowStart = day7; label = 'Lucro da semana' }
  if (type === 'lucro_mes') { windowStart = day30; label = 'Lucro do mes (ultimos 30d)' }
  if (type === 'lucro_mes_atual') { windowStart = monthStartSP; label = 'Lucro do mes atual' }

  const allMetas = await fetchAll(sb, 'metas', 'id,tenant_id,status_fechamento,fechada_em,lucro_final,deleted_at')
  const allMetodos = await fetchAll(sb, 'metodos_registros', 'tenant_id,valor,tipo,created_at,deleted_at').catch(() => [])
  const admins = (await fetchAll(sb, 'profiles', 'id,nome,tenant_id,role')).filter(p => p.role === 'admin')

  // Agrega lucro por tenant na janela
  const byTenant = new Map()
  for (const m of allMetas) {
    if (m.deleted_at || m.status_fechamento !== 'fechada' || !m.fechada_em) continue
    const t = new Date(m.fechada_em).getTime()
    if (t < windowStart || (windowEnd && t >= windowEnd)) continue
    byTenant.set(m.tenant_id, (byTenant.get(m.tenant_id) || 0) + Number(m.lucro_final || 0))
  }
  for (const r of allMetodos) {
    if (r.deleted_at) continue
    const t = new Date(r.created_at).getTime()
    if (t < windowStart || (windowEnd && t >= windowEnd)) continue
    const v = Number(r.valor || 0) * (r.tipo === 'lucro' ? 1 : -1)
    byTenant.set(r.tenant_id, (byTenant.get(r.tenant_id) || 0) + v)
  }

  const targets = []
  for (const adm of admins) {
    const total = byTenant.get(adm.tenant_id) || 0
    if (total === 0) continue // skip quem nao teve atividade
    targets.push({ id: adm.id, nome: adm.nome, total })
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true, dryRun: true, type, label,
      total_admins: admins.length,
      eligible: targets.length,
      sample: targets.slice(0, 10).map(t => ({ nome: t.nome, total: t.total })),
    })
  }

  let sent = 0, noDevice = 0, failed = 0
  for (const t of targets) {
    try {
      const sign = t.total >= 0 ? '+' : '-'
      const result = await sendPushToUser(sb, t.id, {
        title: label,
        body: '🚀 ' + sign + 'R$ ' + fmtBRL(Math.abs(t.total)),
        url: '/admin',
        tag: 'mass_' + type + '_' + Date.now(),
      })
      if ((result?.sent || 0) > 0) sent++
      else noDevice++
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    ok: true, type, label,
    total_admins: admins.length,
    eligible: targets.length,
    sent, noDevice, failed,
  })
}
