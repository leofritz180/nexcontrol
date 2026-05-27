require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmt = d => d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16) : '—'

async function fetchAll(table, query, filters = {}) {
  const PAGE = 1000
  let all = [], from = 0
  while (true) {
    let q = sb.from(table).select(query)
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
    const { data } = await q.range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  const now = new Date()

  // Pega TODAS subs
  const subs = await fetchAll('subscriptions', 'tenant_id,operator_count,status,expires_at')
  // Pega TODOS profiles operadores
  const ops = await fetchAll('profiles', 'tenant_id,id,last_seen_at', { role: 'operator' })
  // Pega tenants ativos
  const tenants = await fetchAll('tenants', 'id,name,subscription_status')

  const opsByTenant = new Map()
  for (const o of ops) {
    if (!opsByTenant.has(o.tenant_id)) opsByTenant.set(o.tenant_id, [])
    opsByTenant.get(o.tenant_id).push(o)
  }

  const subsByTenant = new Map()
  for (const s of subs) {
    if (!subsByTenant.has(s.tenant_id)) subsByTenant.set(s.tenant_id, [])
    subsByTenant.get(s.tenant_id).push(s)
  }

  // Pra cada tenant, calcula limit vs current
  const excedentes = []
  const ok = []
  for (const t of tenants) {
    if (t.subscription_status !== 'active') continue
    const tSubs = subsByTenant.get(t.id) || []
    const validSubs = tSubs.filter(s => s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > now))
    if (validSubs.length === 0) continue
    const limit = Math.max(0, ...validSubs.map(s => Number(s.operator_count || 0)))
    const current = (opsByTenant.get(t.id) || []).length
    const excess = current - limit
    const row = { id: t.id, name: t.name, limit, current, excess, subs: validSubs.length }
    if (excess > 0) excedentes.push(row)
    else ok.push(row)
  }

  excedentes.sort((a, b) => b.excess - a.excess)
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('AUDITORIA · TENANTS COM EXCESSO DE OPERADORES (BUG REAL)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Tenants ativos auditados: ' + (excedentes.length + ok.length))
  console.log('Dentro do limite: ' + ok.length)
  console.log('⚠️  ACIMA DO LIMITE: ' + excedentes.length)
  console.log('')

  if (excedentes.length > 0) {
    console.log('Tenant'.padEnd(28) + ' · Limite · Cadastrados · Excesso · Subs ativas')
    console.log('─'.repeat(95))
    for (const r of excedentes) {
      console.log(
        (r.name || '?').padEnd(28).slice(0, 28) + ' · ' +
        r.limit.toString().padStart(6) + ' · ' +
        r.current.toString().padStart(11) + ' · ' +
        ('+' + r.excess).padStart(7) + ' 🚨 · ' +
        r.subs
      )
    }
    console.log('')
    console.log('Total de operadores excedentes no sistema:',
      excedentes.reduce((s, r) => s + r.excess, 0))
  } else {
    console.log('✅ Nenhum tenant acima do limite!')
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
