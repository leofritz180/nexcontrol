require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)

async function main() {
  const since = new Date(Date.now() - 3 * 86400000) // ultimos 3 dias pra ter margem

  // 1) MP_payments com valor entre 100-150
  console.log('═══════════════════════════════════════════════════')
  console.log('PAGAMENTOS RECENTES (3 dias) NO SISTEMA')
  console.log('═══════════════════════════════════════════════════')

  const { data: mp } = await sb.from('mp_payments')
    .select('id,tenant_id,user_id,mp_payment_id,status,amount,plan_months,created_at,updated_at,pix_qr_code')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  console.log('\n━━━ mp_payments (' + (mp || []).length + ' totais) ━━━')
  for (const x of mp || []) {
    // Pega email
    let email = '?'
    const { data: prof } = await sb.from('profiles').select('email,nome').eq('id', x.user_id).maybeSingle()
    if (prof) email = prof.nome + ' (' + prof.email + ')'
    console.log('  ' + fmt(x.created_at).padEnd(16) + ' · R$ ' + fmtR(x.amount).padStart(8) + ' · ' + (x.status || '?').padEnd(10) + ' · plan=' + (x.plan_months ?? '?') + 'm · ' + email)
  }

  // 2) Filtra os R$ 120 +- 10
  const cerca120 = (mp || []).filter(x => {
    const v = Number(x.amount || 0)
    return v >= 100 && v <= 150
  })
  if (cerca120.length > 0) {
    console.log('\n━━━ PAGAMENTOS NA FAIXA R$ 100-150 ━━━')
    for (const x of cerca120) {
      const { data: prof } = await sb.from('profiles').select('email,nome,tenant_id').eq('id', x.user_id).maybeSingle()
      const { data: tenant } = await sb.from('tenants').select('name,subscription_status').eq('id', x.tenant_id).maybeSingle()
      const { data: subs } = await sb.from('subscriptions').select('*').eq('external_id', x.mp_payment_id).maybeSingle()
      console.log('\n  MP_ID: ' + x.mp_payment_id)
      console.log('  Valor: R$ ' + fmtR(x.amount) + ' · plan ' + x.plan_months + 'm')
      console.log('  Status MP_payments: ' + x.status)
      console.log('  Criado: ' + fmt(x.created_at) + ' · atualizado: ' + fmt(x.updated_at))
      console.log('  Usuario: ' + prof?.nome + ' (' + prof?.email + ')')
      console.log('  Tenant: ' + tenant?.name + ' · sub_status: ' + tenant?.subscription_status)
      console.log('  Subscription criada? ' + (subs ? 'SIM (id ' + subs.id + ', expires ' + fmt(subs.expires_at) + ')' : 'NAO ❌'))
    }
  }

  // 3) Subscriptions criadas recentemente
  const { data: recentSubs } = await sb.from('subscriptions')
    .select('id,tenant_id,total_amount,status,payment_method,external_id,plan_months,created_at,expires_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  console.log('\n━━━ SUBSCRIPTIONS RECENTES (' + (recentSubs || []).length + ') ━━━')
  for (const s of recentSubs || []) {
    const { data: t } = await sb.from('tenants').select('name').eq('id', s.tenant_id).maybeSingle()
    console.log('  ' + fmt(s.created_at) + ' · R$ ' + fmtR(s.total_amount).padStart(8) + ' · plan=' + (s.plan_months ?? '?') + 'm · ' + s.status + ' · ' + (t?.name || '?') + ' · ext=' + s.external_id)
  }

  // 4) Asaas (caso tenha)
  const { data: ap } = await sb.from('asaas_payments')
    .select('id,tenant_id,amount,status,asaas_payment_id,created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  if (ap && ap.length > 0) {
    console.log('\n━━━ asaas_payments recentes (' + ap.length + ') ━━━')
    for (const x of ap) {
      console.log('  ' + fmt(x.created_at) + ' · R$ ' + fmtR(x.amount) + ' · ' + x.status)
    }
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
