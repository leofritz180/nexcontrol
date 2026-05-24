// Calcula lucro liquido REAL do Rodrigo no periodo
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')

async function fetchAll(table, query, filters = {}) {
  const PAGE = 1000
  let all = []
  let from = 0
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
  const metas = allMetas.filter(m => !m.deleted_at)
  const metaMap = new Map(metas.map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', '*')
  const remPeriodo = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    const t = new Date(r.created_at)
    return t >= start && t <= end
  })

  // 1) FECHADAS no periodo
  const fechadasPeriodo = metas.filter(m => {
    if (m.status_fechamento !== 'fechada') return false
    const t = new Date(m.updated_at || m.created_at)
    return t >= start && t <= end
  })
  const lucroFechadas = fechadasPeriodo.reduce((s, m) => s + Number(m.lucro_final || 0), 0)

  // 2) Remessas das metas ainda abertas (criadas no periodo)
  const metaIdsRem = new Set(remPeriodo.map(r => r.meta_id))
  const metasComRemNoPeriodo = [...metaIdsRem].map(id => metaMap.get(id)).filter(Boolean)
  const abertas = metasComRemNoPeriodo.filter(m => m.status_fechamento !== 'fechada')
  const fechadasComRem = metasComRemNoPeriodo.filter(m => m.status_fechamento === 'fechada')

  // 3) Calcular o que ja seria lucro liquido dessas remessas
  //    Como nao temos fechamento ainda das abertas, aproximamos:
  //    lucro_aproximado = sum(lucro_rem) - sum(prej_rem) + sum(bau_rem)
  //    (sem deduzir custo_fixo nem taxa_agente porque eh calculado no fechamento)
  const remAbertas = remPeriodo.filter(r => {
    const m = metaMap.get(r.meta_id)
    return m && m.status_fechamento !== 'fechada'
  })
  const lucroAberto = remAbertas.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const prejAberto = remAbertas.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const bauAberto = remAbertas.reduce((s, r) => s + Number(r.bau || 0), 0)
  const aproximadoAbertas = lucroAberto - prejAberto + bauAberto

  // 4) Custos no periodo (proxy, SMS, etc tenant-level)
  const allCosts = await fetchAll('costs', '*', { tenant_id: p.tenant_id })
  const custosPeriodo = allCosts.filter(c => {
    const t = new Date(c.created_at)
    return t >= start && t <= end
  })
  const totalCustosPeriodo = custosPeriodo.reduce((s, c) => s + Number(c.amount || 0), 0)

  console.log('═══════════════════════════════════════════════════════')
  console.log('LUCRO LIQUIDO RODRIGO · 21-24/05/2026')
  console.log('═══════════════════════════════════════════════════════')
  console.log('')
  console.log('METAS FECHADAS NO PERIODO (' + fechadasPeriodo.length + ')')
  console.log('  Lucro final consolidado (ja descontou tudo): R$ ' + fmtR(lucroFechadas))
  console.log('')
  console.log('METAS AINDA ABERTAS COM REMESSAS NO PERIODO (' + abertas.length + ')')
  console.log('  Lucro remessas:    R$ ' + fmtR(lucroAberto))
  console.log('  - Prejuizo:        R$ ' + fmtR(prejAberto))
  console.log('  + BAU registrado:  R$ ' + fmtR(bauAberto))
  console.log('  = Lucro aproximado pendente: R$ ' + fmtR(aproximadoAbertas))
  console.log('  (sem deduzir custo_fixo/taxa_agente — so calculado no fechamento)')
  console.log('')
  console.log('CUSTOS TENANT REGISTRADOS NO PERIODO: R$ ' + fmtR(totalCustosPeriodo))
  console.log('')
  console.log('───────────────────────────────────────────────────────')
  console.log('LIQUIDO REAL JA CONSOLIDADO (so fechadas - custos):')
  console.log('  R$ ' + fmtR(lucroFechadas - totalCustosPeriodo))
  console.log('')
  console.log('PROJECAO TOTAL (fechadas + aproximado abertas - custos):')
  console.log('  R$ ' + fmtR(lucroFechadas + aproximadoAbertas - totalCustosPeriodo))
  console.log('───────────────────────────────────────────────────────')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
