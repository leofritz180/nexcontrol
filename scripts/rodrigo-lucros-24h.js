require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')

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
  const now = new Date()
  const start = new Date(now.getTime() - 24 * 3600000)

  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metaMap = new Map(allMetas.filter(m => !m.deleted_at).map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    return new Date(r.created_at) >= start
  })

  const totalContas = rem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)
  const totalDep = rem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const totalSaq = rem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const totalLucro = rem.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const totalPrej = rem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalBau = rem.reduce((s, r) => s + Number(r.bau || 0), 0)

  const resultadoRemessas = totalLucro - totalPrej
  const brutoGerado = resultadoRemessas + totalBau
  const parteAdmin = resultadoRemessas // Rodrigo no modelo apenas_bau
  const parteOperadores = totalBau

  // Fechadas no periodo
  const fechadas = allMetas.filter(m =>
    m.status_fechamento === 'fechada' &&
    new Date(m.updated_at || m.created_at) >= start
  )
  const lucroFechadas = fechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0)

  console.log('═══════════════════════════════════════════════════════')
  console.log('LUCROS RODRIGO · ULTIMAS 24h')
  console.log('═══════════════════════════════════════════════════════')

  console.log('\n━━━ JÁ CONSOLIDADO (metas fechadas no periodo) ━━━')
  console.log('  Metas fechadas:       ' + fechadas.length)
  console.log('  Lucro final Rodrigo:  R$ ' + fmtR(lucroFechadas))

  console.log('\n━━━ EM ANDAMENTO (remessas no periodo, ainda nao fechado) ━━━')
  console.log('  Remessas:             ' + rem.length)
  console.log('  Contas processadas:   ' + totalContas)
  console.log('  Lucro remessas:       R$ ' + fmtR(totalLucro).padStart(10))
  console.log('  - Prejuizo remessas:  R$ ' + fmtR(totalPrej).padStart(10))
  console.log('  = Resultado remessas: R$ ' + fmtR(resultadoRemessas).padStart(10) + ' ← parte do Rodrigo')
  console.log('  + BAU registrado:     R$ ' + fmtR(totalBau).padStart(10) + ' ← parte dos operadores')
  console.log('  ─────────────────────────────────────')
  console.log('  Bruto gerado total:   R$ ' + fmtR(brutoGerado).padStart(10))

  console.log('\n━━━ DIVISÃO ESTIMADA ━━━')
  console.log('  → Rodrigo (resultado remessas):  R$ ' + fmtR(parteAdmin))
  console.log('  → Operadores (BAU):              R$ ' + fmtR(parteOperadores))

  // Por conta
  if (totalContas > 0) {
    console.log('\n━━━ POR CONTA ━━━')
    console.log('  Lucro Rodrigo/conta:   R$ ' + (parteAdmin / totalContas).toFixed(2).replace('.', ','))
    console.log('  BAU operadores/conta:  R$ ' + (parteOperadores / totalContas).toFixed(2).replace('.', ','))
    console.log('  Bruto total/conta:     R$ ' + (brutoGerado / totalContas).toFixed(2).replace('.', ','))
  }

  // Projecao mensal
  console.log('\n━━━ PROJEÇÃO MENSAL (se manter esse ritmo) ━━━')
  console.log('  Rodrigo:    R$ ' + fmtR(parteAdmin * 30) + '/mês')
  console.log('  Operadores: R$ ' + fmtR(parteOperadores * 30) + '/mês')
  console.log('  Total:      R$ ' + fmtR(brutoGerado * 30) + '/mês')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
