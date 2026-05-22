// Reproduz a logica do endpoint allSales pra validar coerencia/ordem
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PAID = new Set([
  'RECEIVED','CONFIRMED','RECEIVED_IN_CASH','BILLING_TYPE_CONFIRMED','approved',
])

function fmt(d) {
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

async function main() {
  const [{ data: profiles }, { data: tenants }, { data: asaas }, { data: mp }] = await Promise.all([
    sb.from('profiles').select('id,email,nome,tenant_id,role'),
    sb.from('tenants').select('id,name'),
    sb.from('asaas_payments').select('id,tenant_id,amount,status,created_at').order('created_at', { ascending: false }),
    sb.from('mp_payments').select('id,tenant_id,amount,status,created_at').order('created_at', { ascending: false }),
  ])

  const admins = (profiles || []).filter(p => p.role === 'admin')
  const adminByTenant = {}
  for (const a of admins) if (!adminByTenant[a.tenant_id]) adminByTenant[a.tenant_id] = a
  const tenantNameMap = Object.fromEntries((tenants || []).map(t => [t.id, t.name]))

  const all = [
    ...(asaas || []).map(p => ({ ...p, _gw: 'asaas' })),
    ...(mp || []).map(p => ({ ...p, _gw: 'mp' })),
  ]
    .filter(p => PAID.has(p.status))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  console.log(`Total pagamentos aprovados: ${all.length}`)
  console.log(`Primeiro (mais antigo): ${fmt(all[all.length-1].created_at)}`)
  console.log(`Ultimo (mais recente):  ${fmt(all[0].created_at)}`)

  console.log('\n=== TOP 15 (mais recentes) ===')
  console.log('Data                Nome                       E-mail                          GW    Valor')
  console.log('─'.repeat(120))
  for (const p of all.slice(0, 15)) {
    const a = adminByTenant[p.tenant_id]
    const name = (a?.nome || a?.email?.split('@')[0] || tenantNameMap[p.tenant_id] || 'Cliente').padEnd(26).slice(0,26)
    const email = (a?.email || '—').padEnd(31).slice(0,31)
    const date = fmt(p.created_at).slice(0, 16).padEnd(18)
    const gw = (p._gw === 'mp' ? 'MP' : 'Asaas').padEnd(6)
    const val = `R$ ${Number(p.amount||0).toFixed(2).replace('.', ',')}`
    console.log(`${date}  ${name} ${email} ${gw} ${val}`)
  }

  console.log('\n=== ULTIMOS 5 (mais antigos do banco) ===')
  for (const p of all.slice(-5)) {
    const a = adminByTenant[p.tenant_id]
    const name = a?.nome || a?.email?.split('@')[0] || tenantNameMap[p.tenant_id] || 'Cliente'
    const email = a?.email || '—'
    console.log(`  ${fmt(p.created_at).slice(0,16)} · ${name} <${email}> · R$ ${Number(p.amount||0).toFixed(2)} · ${p._gw}`)
  }

  // Verificações de coerência
  console.log('\n=== VERIFICAÇÕES ===')
  let sortedOk = true
  for (let i = 1; i < all.length; i++) {
    if (new Date(all[i].created_at) > new Date(all[i-1].created_at)) {
      sortedOk = false
      console.log(`  ❌ Ordem quebrada no índice ${i}: ${fmt(all[i].created_at)} > ${fmt(all[i-1].created_at)}`)
      break
    }
  }
  if (sortedOk) console.log('  ✓ Ordem correta (desc por created_at)')

  const noName = all.filter(p => !adminByTenant[p.tenant_id]).length
  console.log(`  ${noName === 0 ? '✓' : '⚠'} Pagamentos sem admin: ${noName}/${all.length}`)

  const total = all.reduce((a, p) => a + Number(p.amount || 0), 0)
  console.log(`  ∑ Total arrecadado: R$ ${total.toFixed(2)}`)

  // Pagamentos por dia (últimos 7)
  console.log('\n=== ULTIMOS 7 DIAS ===')
  const byDay = {}
  for (const p of all) {
    const k = new Date(p.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    if (!byDay[k]) byDay[k] = { count: 0, total: 0 }
    byDay[k].count++
    byDay[k].total += Number(p.amount || 0)
  }
  const days = Object.entries(byDay).sort((a, b) => {
    const [dA, mA, yA] = a[0].split('/').map(Number)
    const [dB, mB, yB] = b[0].split('/').map(Number)
    return new Date(yB, mB-1, dB) - new Date(yA, mA-1, dA)
  }).slice(0, 10)
  for (const [d, v] of days) {
    console.log(`  ${d}  ·  ${v.count} pagamento(s)  ·  R$ ${v.total.toFixed(2)}`)
  }
}

main().catch(console.error)
