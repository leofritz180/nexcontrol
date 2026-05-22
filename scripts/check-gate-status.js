// Pra cada sub que venceu hoje, simula o que o SubscriptionGate faria
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function fmtBR(d) {
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

async function checkTenant(email) {
  // Pega o profile/tenant
  const { data: p } = await sb.from('profiles')
    .select('id, email, nome, tenant_id, role')
    .eq('email', email).maybeSingle()
  if (!p) { console.log(`\n[${email}] profile nao encontrado`); return }

  const { data: t } = await sb.from('tenants')
    .select('id, subscription_status, trial_ends_at')
    .eq('id', p.tenant_id).maybeSingle()

  // TODAS subs do tenant (qualquer status)
  const { data: subs } = await sb.from('subscriptions')
    .select('id, status, expires_at, starts_at, total_amount, operator_count, payment_method')
    .eq('tenant_id', p.tenant_id)
    .order('expires_at', { ascending: false })

  const now = new Date()
  const activeSubs = (subs || []).filter(s => s.status === 'active')
  const hasValidSub = activeSubs.some(s => !s.expires_at || new Date(s.expires_at) > now)

  // Trial ainda valido?
  const trialValid = t?.trial_ends_at && new Date(t.trial_ends_at) > now

  console.log(`\n═════ ${p.nome || '?'}  <${p.email}>  [${p.role}]`)
  console.log(`  tenant.subscription_status: ${t?.subscription_status}`)
  console.log(`  trial_ends_at: ${t?.trial_ends_at ? fmtBR(t.trial_ends_at) : '—'}${trialValid ? ' (VALIDO)' : ' (expirado)'}`)
  console.log(`  Subs ativas (${activeSubs.length}):`)
  for (const s of activeSubs) {
    const exp = s.expires_at ? new Date(s.expires_at) : null
    const valid = !exp || exp > now
    const mark = valid ? '[VALIDA]' : '[VENCIDA]'
    console.log(`    ${mark} expires ${exp ? fmtBR(exp) : 'nunca'} · R$ ${Number(s.total_amount||0).toFixed(2)} · ${s.payment_method}`)
  }
  console.log(`  ▶ SubscriptionGate: ${hasValidSub ? 'LIBERA acesso' : trialValid ? 'LIBERA (trial)' : 'BLOQUEIA → /billing'}`)
}

async function main() {
  console.log(`Snapshot ${fmtBR(new Date())}`)
  const emails = [
    'leofritz178@gmail.com',
    'leofritz180@gmail.com',
    'dspods1@gmail.com',
    'ricolorenzo771@gmail.com',
  ]
  for (const e of emails) await checkTenant(e)
}

main().catch(console.error)
