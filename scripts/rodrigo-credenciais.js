require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

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

async function main() {
  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const ops = await fetchAll('profiles', 'id,nome,email', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))
  opMap.set(p.id, p.nome + ' (admin)')

  const metas = await fetchAll('metas', 'id,titulo,rede,operator_id,conta_link,conta_login,conta_senha,created_at', { tenant_id: p.tenant_id })

  const comCred = metas.filter(m => m.conta_link || m.conta_login || m.conta_senha)

  console.log('═══════════════════════════════════════════════')
  console.log('CREDENCIAIS NO TENANT DO RODRIGO')
  console.log('═══════════════════════════════════════════════')
  console.log('Total metas:                ' + metas.length)
  console.log('Metas com credenciais:      ' + comCred.length)
  console.log('')

  if (comCred.length > 0) {
    for (const m of comCred) {
      const nome = opMap.get(m.operator_id) || '?'
      console.log('  · meta ' + m.id + ' · ' + m.titulo + ' (' + m.rede + ')')
      console.log('    operador: ' + nome)
      console.log('    link:  ' + (m.conta_link || '—'))
      console.log('    login: ' + (m.conta_login || '—'))
      console.log('    senha: ' + (m.conta_senha || '—'))
      console.log('    criada: ' + new Date(m.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
      console.log('')
    }
  } else {
    console.log('  Ninguem da equipe usou o recurso ainda.')
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
