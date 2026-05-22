// Distribuicao horaria COMPLETA das remessas e metas do admin
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

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

// Converte UTC pra horario BR (UTC-3)
function brHour(utcDateStr) {
  const d = new Date(utcDateStr)
  return new Date(d.getTime() - 3 * 3600000).getUTCHours()
}

async function main() {
  const email = process.argv[2] || 'rmrodrigomribeiro@gmail.com'
  const { data: p } = await sb.from('profiles').select('tenant_id,nome').eq('email', email).maybeSingle()
  if (!p) { console.log('Nao encontrado'); return }

  const metas = await fetchAll('metas', 'id,tenant_id,deleted_at,created_at')
  const myMetas = metas.filter(m => m.tenant_id === p.tenant_id && !m.deleted_at)
  const metaIds = new Set(myMetas.map(m => m.id))
  const remessas = await fetchAll('remessas', 'meta_id,created_at')
  const myRem = remessas.filter(r => metaIds.has(r.meta_id))

  console.log('Total metas:    ' + myMetas.length)
  console.log('Total remessas: ' + myRem.length)
  console.log()

  // ── Distribuicao COMPLETA por hora (BR) ──
  console.log('━━━ REMESSAS POR HORA (BR) ━━━')
  const remHora = Array(24).fill(0)
  for (const r of myRem) remHora[brHour(r.created_at)]++
  const maxRem = Math.max(...remHora)
  for (let h = 0; h < 24; h++) {
    const pct = Math.round(remHora[h] / myRem.length * 100)
    const bar = '█'.repeat(Math.round(remHora[h] / maxRem * 40))
    console.log('  ' + h.toString().padStart(2, '0') + 'h · ' + remHora[h].toString().padStart(4) + ' (' + pct.toString().padStart(2) + '%) ' + bar)
  }

  // ── Distribuicao por META (quando comeca) ──
  console.log('\n━━━ METAS POR HORA DE CRIACAO (BR) ━━━')
  const metaHora = Array(24).fill(0)
  for (const m of myMetas) metaHora[brHour(m.created_at)]++
  const maxMeta = Math.max(...metaHora)
  for (let h = 0; h < 24; h++) {
    const pct = Math.round(metaHora[h] / myMetas.length * 100)
    const bar = '█'.repeat(Math.round(metaHora[h] / maxMeta * 40))
    console.log('  ' + h.toString().padStart(2, '0') + 'h · ' + metaHora[h].toString().padStart(3) + ' (' + pct.toString().padStart(2) + '%) ' + bar)
  }

  // ── Resumo por faixa ──
  console.log('\n━━━ POR FAIXA DO DIA ━━━')
  const faixas = {
    'Madrugada (00-05h)': [0, 5],
    'Manha (06-11h)':     [6, 11],
    'Tarde (12-17h)':     [12, 17],
    'Noite (18-23h)':     [18, 23],
  }
  for (const [nome, [ini, fim]] of Object.entries(faixas)) {
    const remCount = remHora.slice(ini, fim + 1).reduce((a, b) => a + b, 0)
    const metaCount = metaHora.slice(ini, fim + 1).reduce((a, b) => a + b, 0)
    const pctRem = Math.round(remCount / myRem.length * 100)
    const pctMeta = Math.round(metaCount / myMetas.length * 100)
    console.log('  ' + nome.padEnd(22) + ' · Metas: ' + metaCount.toString().padStart(3) + ' (' + pctMeta + '%) · Remessas: ' + remCount.toString().padStart(4) + ' (' + pctRem + '%)')
  }

  // ── Lista metas que rodaram fora do horario noturno ──
  const metasForaNoite = myMetas.filter(m => {
    const h = brHour(m.created_at)
    return h < 18 && h >= 6  // criada entre 6h e 18h (manha/tarde)
  })
  console.log('\n━━━ METAS CRIADAS DE DIA (06-18h BR) ━━━')
  console.log('  Total: ' + metasForaNoite.length + ' metas (' + Math.round(metasForaNoite.length / myMetas.length * 100) + '% do total)')

  // ── Remessas registradas de dia ──
  const remForaNoite = myRem.filter(r => {
    const h = brHour(r.created_at)
    return h < 18 && h >= 6
  })
  console.log('  Remessas registradas de dia: ' + remForaNoite.length + ' (' + Math.round(remForaNoite.length / myRem.length * 100) + '%)')
}

main().catch(console.error)
