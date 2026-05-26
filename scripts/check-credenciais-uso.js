require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // Total geral
  const { count: total } = await sb.from('metas').select('id', { count: 'exact', head: true })
  const { count: comCred } = await sb.from('metas').select('id', { count: 'exact', head: true }).not('conta_login', 'is', null)
  console.log('Total metas no sistema:        ' + total)
  console.log('Metas com credenciais salvas:  ' + comCred)

  if (comCred > 0) {
    const { data } = await sb.from('metas')
      .select('id,titulo,rede,conta_link,conta_login,conta_senha,tenant_id,operator_id,created_at')
      .not('conta_login', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    console.log('\nAmostra (max 10):')
    for (const m of data) {
      console.log('  · meta ' + m.id + ' (' + m.titulo + '/' + m.rede + ')')
      console.log('    link:  ' + (m.conta_link || '—'))
      console.log('    login: ' + (m.conta_login || '—'))
      console.log('    senha: ' + (m.conta_senha ? '[' + m.conta_senha.length + ' chars]' : '—'))
    }
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
