// Lista assinaturas vencendo hoje, ontem e ja vencidas — pra saber quem precisa ser cobrado
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function fmtDate(d) {
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

async function main() {
  const now = new Date()
  const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0)
  const endOfToday = new Date(now); endOfToday.setHours(23,59,59,999)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)

  // Pega TODAS as subs ativas com expires_at, ordenado por data
  const { data: subs, error } = await sb.from('subscriptions')
    .select('id, tenant_id, status, expires_at, total_amount, operator_count, payment_method, starts_at')
    .eq('status', 'active')
    .order('expires_at', { ascending: true })

  if (error) { console.error(error); return }

  // Categoriza
  const expiredOld = []      // venceu antes de 7 dias atras
  const expiredRecent = []   // venceu nos ultimos 7 dias
  const expiringToday = []   // vence hoje
  const expiringSoon = []    // vence em ate 7 dias
  const future = []

  for (const s of subs) {
    if (!s.expires_at) continue
    const exp = new Date(s.expires_at)
    if (exp < sevenDaysAgo) expiredOld.push(s)
    else if (exp < startOfToday) expiredRecent.push(s)
    else if (exp >= startOfToday && exp <= endOfToday) expiringToday.push(s)
    else if (exp <= new Date(now.getTime() + 7 * 86400000)) expiringSoon.push(s)
    else future.push(s)
  }

  // Resolve admin emails
  async function adminFor(tenantId) {
    const { data: p } = await sb.from('profiles')
      .select('email, nome')
      .eq('tenant_id', tenantId)
      .eq('role', 'admin')
      .limit(1).maybeSingle()
    return p
  }

  async function printGroup(label, list) {
    if (list.length === 0) { console.log(`\n${label}: nenhuma`); return }
    console.log(`\n${label} (${list.length}):`)
    for (const s of list) {
      const p = await adminFor(s.tenant_id)
      const who = p ? `${p.nome || '?'} <${p.email}>` : `tenant ${s.tenant_id.slice(0,8)}`
      console.log(`  • ${fmtDate(s.expires_at).slice(0,16)} · ${who} · R$ ${Number(s.total_amount||0).toFixed(2)} · ${s.operator_count||'?'} op · ${s.payment_method||'?'}`)
    }
  }

  console.log(`==== Snapshot ${fmtDate(now)} ====`)
  await printGroup('VENCERAM HOJE', expiringToday)
  await printGroup('JA VENCIDAS · ultimos 7 dias', expiredRecent)
  await printGroup('VENCEM em ate 7 dias', expiringSoon)
  await printGroup('VENCIDAS HA MAIS DE 7 DIAS', expiredOld)
}

main().catch(console.error)
