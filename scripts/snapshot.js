// Snapshot REAL do NexControl — exclui suas contas e subs mock.
// Uso: node scripts/snapshot.js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// ── Filtros padrão ──
const OWN_EMAILS = ['leofritz178@gmail.com', 'leofritz180@gmail.com']
const PAID_STATUSES = ['RECEIVED', 'CONFIRMED', 'approved']

const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const daysBetween = (a, b) => Math.floor((new Date(a) - new Date(b)) / 86400000)

async function main() {
  const now = new Date()
  console.log('━━━ SNAPSHOT NEXCONTROL · ' + fmt(now) + ' ━━━')
  console.log('(excluindo contas proprias e subs mock)\n')

  // ── Pega tenants das suas contas pra excluir ──
  const ownTids = new Set()
  for (const email of OWN_EMAILS) {
    const { data: p } = await sb.from('profiles').select('tenant_id').eq('email', email).maybeSingle()
    if (p?.tenant_id) ownTids.add(p.tenant_id)
  }

  // ── Migrados ──
  const { data: migs } = await sb.from('tenants').select('id, migrated_to_tenant_id').not('migrated_to_tenant_id', 'is', null)
  const migratedSet = new Set((migs || []).map(m => m.id))

  // ── Pagamentos 24h ──
  const yest = new Date(now.getTime() - 24 * 3600 * 1000)
  const [{ data: ap24 }, { data: mp24 }] = await Promise.all([
    sb.from('asaas_payments').select('tenant_id,amount,created_at').gte('created_at', yest.toISOString()).in('status', ['RECEIVED', 'CONFIRMED']),
    sb.from('mp_payments').select('tenant_id,amount,created_at').gte('created_at', yest.toISOString()).eq('status', 'approved'),
  ])
  const r24 = [...(ap24 || []), ...(mp24 || [])]
    .filter(p => !ownTids.has(p.tenant_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const t24 = r24.reduce((a, p) => a + Number(p.amount || 0), 0)

  console.log('━ ULTIMAS 24h: R$ ' + fmtR(t24) + ' · ' + r24.length + ' pagto(s) ━')
  for (const p of r24) {
    const { data: a } = await sb.from('profiles').select('email,nome').eq('tenant_id', p.tenant_id).eq('role', 'admin').limit(1).maybeSingle()
    console.log('  ' + fmt(p.created_at) + ' · ' + (a?.nome || '?').padEnd(22).slice(0, 22) + ' R$ ' + fmtR(p.amount))
  }

  // ── Mes atual ──
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [{ data: apMo }, { data: mpMo }] = await Promise.all([
    sb.from('asaas_payments').select('tenant_id,amount').gte('created_at', monthStart.toISOString()).in('status', ['RECEIVED', 'CONFIRMED']),
    sb.from('mp_payments').select('tenant_id,amount').gte('created_at', monthStart.toISOString()).eq('status', 'approved'),
  ])
  const mTotal = [...(apMo || []), ...(mpMo || [])].filter(p => !ownTids.has(p.tenant_id)).reduce((a, p) => a + Number(p.amount || 0), 0)
  const mCount = [...(apMo || []), ...(mpMo || [])].filter(p => !ownTids.has(p.tenant_id)).length
  console.log('\n━ MES ATUAL: R$ ' + fmtR(mTotal) + ' · ' + mCount + ' pagto(s) ━')

  // ── Total acumulado real ──
  const [{ data: apAll }, { data: mpAll }] = await Promise.all([
    sb.from('asaas_payments').select('tenant_id,amount').in('status', ['RECEIVED', 'CONFIRMED']),
    sb.from('mp_payments').select('tenant_id,amount').eq('status', 'approved'),
  ])
  const totalAcum = [...(apAll || []), ...(mpAll || [])].filter(p => !ownTids.has(p.tenant_id)).reduce((a, p) => a + Number(p.amount || 0), 0)
  console.log('\n━ TOTAL ACUMULADO REAL: R$ ' + fmtR(totalAcum) + ' ━')

  // ── Cohort de renovacao (subs nao-mock, sem suas contas, primeira ja vencida) ──
  const { data: subs } = await sb.from('subscriptions')
    .select('id, tenant_id, total_amount, payment_method, created_at, expires_at')
    .gt('total_amount', 0)
    .neq('payment_method', 'mock')
    .order('created_at', { ascending: true })

  const byTenant = {}
  for (const s of subs || []) {
    if (ownTids.has(s.tenant_id)) continue
    if (!byTenant[s.tenant_id]) byTenant[s.tenant_id] = []
    byTenant[s.tenant_id].push(s)
  }

  const cohort = []
  for (const tid of Object.keys(byTenant)) {
    const list = byTenant[tid]
    const firstSub = list[0]
    const firstExpire = firstSub.expires_at
      ? new Date(firstSub.expires_at)
      : new Date(new Date(firstSub.created_at).getTime() + 30 * 86400000)
    if (firstExpire > now) continue

    let renovou = false
    for (let i = 1; i < list.length; i++) {
      const gap = daysBetween(list[i].created_at, list[i - 1].created_at)
      if (gap >= 25) { renovou = true; break }
    }
    const migrou = migratedSet.has(tid)
    const { data: a } = await sb.from('profiles').select('email,nome').eq('tenant_id', tid).eq('role', 'admin').limit(1).maybeSingle()
    const totalPago = list.reduce((s, x) => s + Number(x.total_amount || 0), 0)
    cohort.push({
      tid, nome: a?.nome || '?', email: a?.email || '?',
      firstExpire, renovou, migrou, totalPago,
      diasSinceExpire: daysBetween(now, firstExpire),
    })
  }

  const retentos = cohort.filter(c => c.renovou || c.migrou)
  const churnaram = cohort.filter(c => !c.renovou && !c.migrou)
  const taxa = cohort.length > 0 ? Math.round((retentos.length / cohort.length) * 100) : 0

  console.log('\n━ COHORT DE RENOVACAO (1a sub ja vencida) ━')
  console.log('Elegiveis: ' + cohort.length + '  ·  Retentos: ' + retentos.length + '  ·  Churn: ' + churnaram.length + '  ·  TAXA: ' + taxa + '%')

  console.log('\n━ CHURN ━')
  for (const c of churnaram.sort((a, b) => a.diasSinceExpire - b.diasSinceExpire)) {
    const tag = c.diasSinceExpire <= 4 ? '🔥' : c.diasSinceExpire <= 7 ? '🟡' : '🔴'
    console.log('  ' + tag + ' ' + c.nome.padEnd(22).slice(0, 22) + ' R$ ' + fmtR(c.totalPago).padStart(7) + ' · ' + c.diasSinceExpire + 'd · ' + c.email)
  }

  // ── Vencendo proximos 7d ──
  const d7next = new Date(now.getTime() + 7 * 86400000)
  const { data: soon } = await sb.from('subscriptions')
    .select('tenant_id, expires_at, total_amount')
    .eq('status', 'active').gte('expires_at', now.toISOString()).lte('expires_at', d7next.toISOString())
    .neq('payment_method', 'mock')
  const soonFiltered = (soon || []).filter(s => !ownTids.has(s.tenant_id))
  const soonValue = soonFiltered.reduce((a, s) => a + Number(s.total_amount || 0), 0)
  console.log('\n━ VENCEM PROX 7d: ' + soonFiltered.length + ' subs · R$ ' + fmtR(soonValue) + ' em risco ━')
}

main().catch(console.error)
