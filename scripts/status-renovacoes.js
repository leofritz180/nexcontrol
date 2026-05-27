require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
const fmtDate = d => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

const OWN_EMAILS = ['leofritz178@gmail.com', 'leofritz180@gmail.com']
const MOCK_METHODS = ['mock', 'manual', 'admin', 'test']

async function fetchAll(table, query) {
  const PAGE = 1000
  let all = [], from = 0
  while (true) {
    const { data } = await sb.from(table).select(query).range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  const now = new Date()
  // Pega TODAS subscriptions
  const subs = await fetchAll('subscriptions', 'id,tenant_id,total_amount,status,payment_method,plan_months,starts_at,expires_at,created_at,external_id')
  const realSubs = subs.filter(s => !MOCK_METHODS.includes(s.payment_method))

  // Tenants info
  const tenants = await fetchAll('tenants', 'id,name')
  const tenantMap = new Map(tenants.map(t => [t.id, t.name]))

  // Admins (pra excluir minhas contas)
  const profiles = await fetchAll('profiles', 'id,email,nome,tenant_id,role')
  const adminByTenant = new Map()
  for (const p of profiles.filter(x => x.role === 'admin')) adminByTenant.set(p.tenant_id, p)
  const myTenants = new Set(profiles.filter(p => OWN_EMAILS.includes((p.email || '').toLowerCase())).map(p => p.tenant_id))

  // Filtra tenants proprios
  const externalSubs = realSubs.filter(s => !myTenants.has(s.tenant_id))

  // Agrupa subs por tenant pra contar renovacoes
  const byTenant = new Map()
  for (const s of externalSubs) {
    if (!byTenant.has(s.tenant_id)) byTenant.set(s.tenant_id, [])
    byTenant.get(s.tenant_id).push(s)
  }
  for (const arr of byTenant.values()) arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  // Periodos
  const start7 = new Date(now.getTime() - 7 * 86400000)
  const start30 = new Date(now.getTime() - 30 * 86400000)

  // Renovacoes = 2a ou Na sub do mesmo tenant
  const allRenewals = []
  const allFirstPays = []
  for (const [tenantId, arr] of byTenant.entries()) {
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i]
      const item = {
        ...s,
        tenant_name: tenantMap.get(tenantId) || '?',
        admin_email: adminByTenant.get(tenantId)?.email || '?',
        admin_nome: adminByTenant.get(tenantId)?.nome || '?',
        sequence: i + 1, // 1a, 2a, 3a paga
      }
      if (i === 0) allFirstPays.push(item)
      else allRenewals.push(item)
    }
  }

  // Total RECEITA
  const sumAmount = arr => arr.reduce((s, x) => s + Number(x.total_amount || 0), 0)
  const renewals7 = allRenewals.filter(s => new Date(s.created_at) >= start7)
  const renewals30 = allRenewals.filter(s => new Date(s.created_at) >= start30)
  const newPays7 = allFirstPays.filter(s => new Date(s.created_at) >= start7)
  const newPays30 = allFirstPays.filter(s => new Date(s.created_at) >= start30)

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('STATUS DE RENOVACOES · ' + fmtDate(now))
  console.log('(exclui contas proprias e subs mock)')
  console.log('═══════════════════════════════════════════════════════════════')

  console.log('\n━━━ 7 DIAS ━━━')
  console.log('  Novos clientes:    ' + newPays7.length + ' (R$ ' + fmtR(sumAmount(newPays7)) + ')')
  console.log('  Renovacoes:        ' + renewals7.length + ' (R$ ' + fmtR(sumAmount(renewals7)) + ')')
  console.log('  TOTAL RECEITA 7d:  R$ ' + fmtR(sumAmount(newPays7) + sumAmount(renewals7)))

  console.log('\n━━━ 30 DIAS ━━━')
  console.log('  Novos clientes:    ' + newPays30.length + ' (R$ ' + fmtR(sumAmount(newPays30)) + ')')
  console.log('  Renovacoes:        ' + renewals30.length + ' (R$ ' + fmtR(sumAmount(renewals30)) + ')')
  console.log('  TOTAL RECEITA 30d: R$ ' + fmtR(sumAmount(newPays30) + sumAmount(renewals30)))
  const pctRenovacao30 = newPays30.length + renewals30.length > 0
    ? (renewals30.length / (newPays30.length + renewals30.length) * 100).toFixed(0)
    : 0
  console.log('  % MRR vindo de renovacao: ' + pctRenovacao30 + '%')

  console.log('\n━━━ RENOVACOES DOS ULTIMOS 7 DIAS ━━━')
  if (renewals7.length === 0) {
    console.log('  Nenhuma.')
  } else {
    for (const r of renewals7.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))) {
      const planLabel = r.plan_months === 12 ? 'ANUAL' : r.plan_months === 6 ? 'SEMESTRAL' : r.plan_months === 3 ? 'TRIMESTRAL' : r.plan_months === 1 ? 'mensal' : (r.plan_months === 0 ? 'add-ops' : '?')
      console.log('  ' + fmt(r.created_at) + ' · R$ ' + fmtR(r.total_amount).padStart(8) + ' · ' + planLabel.padEnd(10) + ' · ' + (r.sequence + 'a').padEnd(3) + ' · ' + r.tenant_name + ' (' + r.admin_email + ')')
    }
  }

  // Quem vence ate 7 dias e ainda nao renovou
  const start = new Date(now.getTime())
  const end7 = new Date(now.getTime() + 7 * 86400000)
  const ativosVencendo7 = externalSubs.filter(s =>
    s.status === 'active' &&
    s.expires_at &&
    new Date(s.expires_at) >= start &&
    new Date(s.expires_at) <= end7
  )
  // Pega o mais recente sub por tenant
  const latestByTenant = new Map()
  for (const s of externalSubs) {
    if (!latestByTenant.has(s.tenant_id) || new Date(s.created_at) > new Date(latestByTenant.get(s.tenant_id).created_at)) {
      latestByTenant.set(s.tenant_id, s)
    }
  }
  const proximosVencer = [...latestByTenant.values()].filter(s =>
    s.status === 'active' &&
    s.expires_at &&
    new Date(s.expires_at) >= start &&
    new Date(s.expires_at) <= end7
  ).sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at))

  console.log('\n━━━ VENCEM NOS PROXIMOS 7 DIAS (' + proximosVencer.length + ') ━━━')
  if (proximosVencer.length === 0) {
    console.log('  Nenhuma.')
  } else {
    for (const s of proximosVencer) {
      const days = Math.ceil((new Date(s.expires_at) - now) / 86400000)
      const tenant = tenantMap.get(s.tenant_id) || '?'
      const admin = adminByTenant.get(s.tenant_id)
      console.log('  ' + fmtDate(s.expires_at) + ' (em ' + days + 'd) · R$ ' + fmtR(s.total_amount) + ' · ' + tenant + ' (' + (admin?.email || '?') + ')')
    }
  }

  // Vencidos nao renovados (entre 30d atras e hoje)
  const vencidosNaoRenov = [...latestByTenant.values()].filter(s =>
    s.expires_at &&
    new Date(s.expires_at) < now &&
    new Date(s.expires_at) >= start30
  ).sort((a, b) => new Date(b.expires_at) - new Date(a.expires_at))

  console.log('\n━━━ VENCERAM NOS ULTIMOS 30d E NAO RENOVARAM (' + vencidosNaoRenov.length + ') ━━━')
  if (vencidosNaoRenov.length === 0) {
    console.log('  Nenhum.')
  } else {
    for (const s of vencidosNaoRenov) {
      const daysAgo = Math.ceil((now - new Date(s.expires_at)) / 86400000)
      const tenant = tenantMap.get(s.tenant_id) || '?'
      const admin = adminByTenant.get(s.tenant_id)
      console.log('  ' + fmtDate(s.expires_at) + ' (ha ' + daysAgo + 'd) · R$ ' + fmtR(s.total_amount) + ' · ' + tenant + ' (' + (admin?.email || '?') + ')')
    }
  }

  // Taxa de retencao
  console.log('\n━━━ TAXA DE RETENCAO HISTORICA ━━━')
  const tenantsComUmaPaga = byTenant.size
  const tenantsComDuasOuMais = [...byTenant.values()].filter(arr => arr.length >= 2).length
  console.log('  Tenants que pagaram >=1x:  ' + tenantsComUmaPaga)
  console.log('  Tenants que pagaram >=2x:  ' + tenantsComDuasOuMais)
  if (tenantsComUmaPaga > 0) {
    console.log('  Taxa de renovacao real:    ' + (tenantsComDuasOuMais / tenantsComUmaPaga * 100).toFixed(1) + '%')
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
