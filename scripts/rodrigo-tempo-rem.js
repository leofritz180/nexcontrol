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
  const ops = await fetchAll('profiles', '*', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metaMap = new Map(allMetas.filter(m => !m.deleted_at).map(m => [m.id, m]))

  // Sample raw — ver todos os campos
  const { data: sampleRem } = await sb.from('remessas').select('*').limit(1)
  console.log('=== CAMPOS DISPONIVEIS NA TABELA REMESSAS ===')
  console.log(Object.keys(sampleRem[0]).join(', '))
  console.log('')

  // Periodo 21-24/05
  const start = new Date('2026-05-21T00:00:00-03:00')
  const end = new Date('2026-05-24T23:59:59-03:00')
  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    const t = new Date(r.created_at)
    return t >= start && t <= end
  })

  // === Metodo 1: usar updated_at - created_at ===
  console.log('=== TEMPO ENTRE created_at E updated_at (se atualizada apos criar) ===')
  const tempos1 = rem
    .filter(r => r.updated_at && r.created_at && r.updated_at !== r.created_at)
    .map(r => {
      const dur = (new Date(r.updated_at) - new Date(r.created_at)) / 60000 // minutos
      return dur
    })
    .filter(d => d > 0 && d < 24 * 60) // descarta outliers (>24h)
  if (tempos1.length > 0) {
    tempos1.sort((a, b) => a - b)
    const avg = tempos1.reduce((s, x) => s + x, 0) / tempos1.length
    const median = tempos1[Math.floor(tempos1.length / 2)]
    console.log('  amostras: ' + tempos1.length + ' de ' + rem.length + ' remessas')
    console.log('  media:    ' + avg.toFixed(1) + ' min')
    console.log('  mediana:  ' + median.toFixed(1) + ' min')
    console.log('  p25:      ' + tempos1[Math.floor(tempos1.length * 0.25)].toFixed(1) + ' min')
    console.log('  p75:      ' + tempos1[Math.floor(tempos1.length * 0.75)].toFixed(1) + ' min')
  } else {
    console.log('  Nenhuma remessa com updated_at diferente de created_at')
  }
  console.log('')

  // === Metodo 2: tempo entre remessas consecutivas do mesmo operador ===
  console.log('=== INTERVALO ENTRE REMESSAS CONSECUTIVAS (mesmo operador) ===')
  // Agrupa por operador via meta.operator_id
  const byOp = new Map()
  for (const r of rem) {
    const m = metaMap.get(r.meta_id)
    if (!m?.operator_id) continue
    if (!byOp.has(m.operator_id)) byOp.set(m.operator_id, [])
    byOp.get(m.operator_id).push(r)
  }

  const allIntervals = []
  const byOpStats = []
  for (const [opId, arr] of byOp.entries()) {
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const intervals = []
    for (let i = 1; i < arr.length; i++) {
      const dur = (new Date(arr[i].created_at) - new Date(arr[i - 1].created_at)) / 60000
      // Filtra: intervalo entre 1 min e 4h (descarta pausas longas tipo dormir)
      if (dur >= 1 && dur <= 240) intervals.push(dur)
    }
    if (intervals.length > 0) {
      intervals.sort((a, b) => a - b)
      const avg = intervals.reduce((s, x) => s + x, 0) / intervals.length
      const median = intervals[Math.floor(intervals.length / 2)]
      byOpStats.push({
        nome: opMap.get(opId) || '?',
        total: arr.length,
        intervalos: intervals.length,
        media: avg,
        mediana: median,
      })
      allIntervals.push(...intervals)
    }
  }

  allIntervals.sort((a, b) => a - b)
  if (allIntervals.length > 0) {
    const avgGlobal = allIntervals.reduce((s, x) => s + x, 0) / allIntervals.length
    const medianGlobal = allIntervals[Math.floor(allIntervals.length / 2)]
    console.log('  total de intervalos analisados: ' + allIntervals.length)
    console.log('  (descarta intervalos < 1 min e > 4h, removendo pausas longas)')
    console.log('  MEDIA GLOBAL:   ' + avgGlobal.toFixed(1) + ' min')
    console.log('  MEDIANA GLOBAL: ' + medianGlobal.toFixed(1) + ' min')
    console.log('  p25: ' + allIntervals[Math.floor(allIntervals.length * 0.25)].toFixed(1) + ' min')
    console.log('  p75: ' + allIntervals[Math.floor(allIntervals.length * 0.75)].toFixed(1) + ' min')
    console.log('')
    console.log('  Por operador (top 10 por volume):')
    byOpStats.sort((a, b) => b.total - a.total).slice(0, 12).forEach(s => {
      console.log('    ' + s.nome.padEnd(24).slice(0, 24) + ' · ' + s.total.toString().padStart(3) + ' rem · ' + s.intervalos.toString().padStart(3) + ' interv · media ' + s.media.toFixed(1).padStart(5) + ' min · mediana ' + s.mediana.toFixed(1).padStart(5) + ' min')
    })
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
