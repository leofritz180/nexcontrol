require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data, error } = await sb.from('metas').select('id,conta_link,conta_login,conta_senha').limit(1)
  if (error) {
    console.log('❌ FALTA: ' + error.message)
    process.exit(1)
  }
  console.log('✅ Colunas conta_link, conta_login, conta_senha existem em metas')
  console.log('   Sample:', data?.[0] || '(nenhuma meta ainda)')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
