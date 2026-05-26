// Auditoria: pagamentos que podem ter sido aprovados no MP mas nao ativaram sub
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)

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

async function checkMpStatus(mpId) {
  if (!process.env.MP_ACCESS_TOKEN) return { error: 'no MP token' }
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    if (!r.ok) return { error: `MP HTTP ${r.status}` }
    const d = await r.json()
    return { status: d.status, date_approved: d.date_approved, date_created: d.date_created }
  } catch (e) { return { error: e.message } }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('AUDITORIA · PAGAMENTOS QUE PODEM TER PASSADO BATIDO')
  console.log('═══════════════════════════════════════════════════════════════')

  // 1) Buscar TODOS mp_payments dos ultimos 60 dias
  const since = new Date(Date.now() - 60 * 86400000)
  const mpPayments = await fetchAll('mp_payments', 'id,tenant_id,user_id,mp_payment_id,status,amount,plan_months,created_at,updated_at',
    { /* sem eq, vamos filtrar por data depois */ })
  const recent = mpPayments.filter(x => new Date(x.created_at) >= since)

  // 2) Buscar todas subscriptions
  const subs = await fetchAll('subscriptions', 'id,tenant_id,external_id,status,total_amount,created_at')
  const subsByExt = new Map(subs.map(s => [String(s.external_id), s]))

  console.log('\nTotal mp_payments (60d): ' + recent.length)
  console.log('Total subscriptions: ' + subs.length)

  // 3) Pendings antigas (>30min) — webhook pode ter falhado
  const now = Date.now()
  const pendings = recent.filter(x => x.status !== 'approved' && x.status !== 'cancelled' && x.status !== 'rejected')
  const stalePendings = pendings.filter(x => (now - new Date(x.created_at).getTime()) > 30 * 60 * 1000)

  console.log('\n━━━ PENDINGS > 30 min (suspeito de webhook perdido) ━━━')
  if (stalePendings.length === 0) {
    console.log('  ✅ nenhum')
  } else {
    for (const x of stalePendings) {
      const prof = await sb.from('profiles').select('email,nome').eq('id', x.user_id).maybeSingle()
      const mpReal = await checkMpStatus(x.mp_payment_id)
      const inconsistente = mpReal.status && mpReal.status !== x.status
      console.log('  · MP ' + x.mp_payment_id + ' · R$ ' + fmtR(x.amount) + ' · DB=' + x.status + ' · MP_REAL=' + (mpReal.status || mpReal.error) + (inconsistente ? '  🚨 DIVERGE' : ''))
      console.log('    user: ' + (prof.data?.nome || '?') + ' (' + (prof.data?.email || '?') + ') · criado ' + fmt(x.created_at))
      if (mpReal.status === 'approved') {
        console.log('    ⚠️ APROVADO NO MP MAS PENDENTE NO DB — webhook perdido')
      }
    }
  }

  // 4) Approveds sem subscription
  const approved = recent.filter(x => x.status === 'approved')
  const approvedSemSub = approved.filter(x => !subsByExt.has(String(x.mp_payment_id)))
  console.log('\n━━━ APPROVEDS SEM SUBSCRIPTION (falhou ativacao) ━━━')
  if (approvedSemSub.length === 0) {
    console.log('  ✅ nenhum')
  } else {
    for (const x of approvedSemSub) {
      const prof = await sb.from('profiles').select('email,nome').eq('id', x.user_id).maybeSingle()
      console.log('  · MP ' + x.mp_payment_id + ' · R$ ' + fmtR(x.amount) + ' · plan ' + x.plan_months + 'm')
      console.log('    user: ' + (prof.data?.nome || '?') + ' (' + (prof.data?.email || '?') + ')')
      console.log('    criado ' + fmt(x.created_at) + ' · atualizado ' + fmt(x.updated_at))
    }
  }

  // 5) Verifica TODOS pendings com check ao MP (mesmo recentes)
  console.log('\n━━━ TODOS PENDINGS (recentes inclusive) consultados no MP ━━━')
  if (pendings.length === 0) {
    console.log('  ✅ nenhum pending')
  } else {
    for (const x of pendings) {
      const mpReal = await checkMpStatus(x.mp_payment_id)
      const flag = mpReal.status === 'approved' ? '  🚨 APROVADO LA NO MP' : ''
      console.log('  · MP ' + x.mp_payment_id + ' · DB=' + x.status + ' · MP_REAL=' + (mpReal.status || mpReal.error) + flag)
    }
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
