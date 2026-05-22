// Verifica se a coluna plan_months ja foi aplicada nas tabelas
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function check(table) {
  const { data, error } = await sb.from(table).select('plan_months').limit(1)
  if (error) {
    if (error.message.includes('plan_months')) {
      console.log(`  ${table.padEnd(20)} ❌ FALTA  (${error.message})`)
      return false
    }
    console.log(`  ${table.padEnd(20)} ⚠️  erro:  ${error.message}`)
    return false
  }
  console.log(`  ${table.padEnd(20)} ✅ OK`)
  return true
}

async function main() {
  console.log('━━━ Verificacao: coluna plan_months ━━━\n')
  const results = await Promise.all([
    check('mp_payments'),
    check('asaas_payments'),
    check('subscriptions'),
  ])
  const allOk = results.every(Boolean)
  console.log('\n' + (allOk
    ? '✅ SQL ja foi aplicada — sistema pronto pra usar planos trimestral/semestral/anual'
    : '❌ FALTA aplicar supabase-plan-periods.sql no Supabase'))
  process.exit(allOk ? 0 : 1)
}

main().catch(e => { console.error('erro fatal:', e.message); process.exit(2) })
