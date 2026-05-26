// Corrige pagamentos aprovados no MP que ficaram pendentes no DB.
// Usa MESMA logica do webhook /api/webhook/mercadopago/route.js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)

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

async function activatePro(record, paymentId) {
  // Idempotencia
  const { data: existingSub } = await sb.from('subscriptions')
    .select('id').eq('external_id', String(paymentId)).maybeSingle()
  if (existingSub) {
    return { skipped: true, sub_id: existingSub.id }
  }

  const nowDate = new Date()
  const now = nowDate.toISOString()

  // Mesma logica do webhook: planMonths > 0 estende ciclo, =0 mantem
  const { data: activeSubs } = await sb.from('subscriptions')
    .select('expires_at').eq('tenant_id', record.tenant_id).eq('status', 'active')
  const validExpiries = (activeSubs || [])
    .map(s => s.expires_at ? new Date(s.expires_at) : null)
    .filter(d => d && d > nowDate)
    .sort((a, b) => b - a)
  const latestExpires = validExpiries[0]
  const planMonths = Number(record.plan_months) || 0

  let expires
  if (planMonths > 0) {
    const baseDate = (latestExpires && latestExpires > nowDate) ? latestExpires : nowDate
    expires = new Date(baseDate)
    expires.setMonth(expires.getMonth() + planMonths)
  } else if (latestExpires && latestExpires > nowDate) {
    expires = latestExpires
  } else {
    expires = new Date(nowDate)
    expires.setMonth(expires.getMonth() + 1)
  }

  // Resolve operator_count
  let resolvedOpCount = Number(record.operator_count)
  if (!Number.isFinite(resolvedOpCount) || resolvedOpCount <= 0) {
    const { count: currentOps } = await sb.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', record.tenant_id).eq('role', 'operator')
    const { data: prevSub } = await sb.from('subscriptions')
      .select('operator_count').eq('tenant_id', record.tenant_id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    const prevLimit = Number(prevSub?.operator_count || 0)
    resolvedOpCount = Math.max(prevLimit, (currentOps || 0) + 1)
  }

  await sb.from('tenants').update({
    subscription_status: 'active',
  }).eq('id', record.tenant_id)

  const { data: newSub } = await sb.from('subscriptions').insert({
    tenant_id: record.tenant_id,
    status: 'active',
    payment_method: 'pix_mp',
    external_id: String(paymentId),
    total_amount: record.amount,
    operator_count: resolvedOpCount,
    plan_months: planMonths,
    starts_at: now,
    expires_at: expires.toISOString(),
  }).select().single()

  // is_pro best-effort
  try {
    await sb.from('profiles').update({
      is_pro: true, pro_activated_at: now,
    }).eq('id', record.user_id)
  } catch {}

  return { created: true, sub_id: newSub.id, expires: expires.toISOString() }
}

async function main() {
  // Os 4 IDs identificados pela auditoria
  const TARGETS = [
    '156456457631', // Lucas Conceicao R$ 53,73 01/05
    '158438014930', // Kaio R$ 39,90 08/05
    '159749262906', // jose neto R$ 15,92 17/05
    '160137013633', // CPALFLUX R$ 124,50 25/05
  ]

  console.log('═══════════════════════════════════════════════════════')
  console.log('FIX · ATIVAR 4 PAGAMENTOS APROVADOS')
  console.log('═══════════════════════════════════════════════════════')

  for (const mpId of TARGETS) {
    console.log('\n━━━ MP ' + mpId + ' ━━━')

    // 1) Confirma com o MP
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    if (!r.ok) { console.log('  ❌ MP fetch fail ' + r.status); continue }
    const pay = await r.json()
    if (pay.status !== 'approved') {
      console.log('  ⚠️ MP atual: ' + pay.status + ' — pulando')
      continue
    }
    console.log('  ✅ MP confirma: approved · R$ ' + pay.transaction_amount)

    // 2) Pega o record do DB
    const { data: rec } = await sb.from('mp_payments')
      .select('id,tenant_id,user_id,status,amount,operator_count,plan_months')
      .eq('mp_payment_id', mpId).maybeSingle()
    if (!rec) { console.log('  ❌ nao achei em mp_payments'); continue }

    // 3) Atualiza status
    await sb.from('mp_payments').update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    }).eq('mp_payment_id', mpId)
    console.log('  ✅ mp_payments.status → approved')

    // 4) Ativa PRO
    const result = await activatePro(rec, mpId)
    if (result.skipped) {
      console.log('  ⚠️ sub ja existia: id ' + result.sub_id)
    } else {
      console.log('  ✅ subscription criada: id ' + result.sub_id + ' · expira ' + result.expires)
    }

    // 5) Buscar info do user pra log
    const { data: prof } = await sb.from('profiles').select('email,nome,tenant_id').eq('id', rec.user_id).maybeSingle()
    const { data: tenant } = await sb.from('tenants').select('name,subscription_status').eq('id', rec.tenant_id).maybeSingle()
    console.log('  · ' + (prof?.nome || '?') + ' (' + (prof?.email || '?') + ') · tenant ' + (tenant?.name || '?'))
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('FIM DA ATIVACAO')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
