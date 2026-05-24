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
  const start = new Date('2026-05-21T00:00:00-03:00')
  const end = new Date('2026-05-24T23:59:59-03:00')

  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metaIds = new Set(allMetas.filter(m => !m.deleted_at).map(m => m.id))

  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaIds.has(r.meta_id)) return false
    const t = new Date(r.created_at)
    return t >= start && t <= end
  })

  // Distribuicao de contas/remessa
  const dist = {}
  for (const r of rem) {
    const c = Number(r.contas_remessa || 0)
    dist[c] = (dist[c] || 0) + 1
  }

  const total = rem.length
  const totalContas = rem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)

  console.log('═══════════════════════════════════════════════')
  console.log('DISTRIBUIÇÃO CONTAS/REMESSA · RODRIGO 21-24/05')
  console.log('═══════════════════════════════════════════════')
  console.log('Total remessas: ' + total)
  console.log('Total contas: ' + totalContas)
  console.log('Média: ' + (totalContas / total).toFixed(2) + ' contas/rem')
  console.log('')
  console.log('Distribuição:')
  console.log('Contas  · Qtd remessas · % do total')
  for (const [c, count] of Object.entries(dist).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const pct = (count / total * 100).toFixed(1)
    const bar = '█'.repeat(Math.ceil(count / 8))
    console.log('  ' + c.toString().padStart(3) + '   ·     ' + count.toString().padStart(4) + '     · ' + pct.padStart(5) + '%  ' + bar)
  }

  // Mediana
  const arr = rem.map(r => Number(r.contas_remessa || 0)).sort((a, b) => a - b)
  const median = arr.length % 2 === 0
    ? (arr[arr.length/2 - 1] + arr[arr.length/2]) / 2
    : arr[Math.floor(arr.length/2)]
  const moda = Object.entries(dist).sort((a, b) => b[1] - a[1])[0]
  console.log('')
  console.log('Mediana: ' + median + ' contas')
  console.log('Moda: ' + moda[0] + ' contas (' + moda[1] + ' remessas, ' + (moda[1]/total*100).toFixed(1) + '%)')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
