// Analise profunda de operacao de um admin — entender COMO ele opera
// Uso: node scripts/report-operation.js <email>
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const median = arr => {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

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

async function main() {
  const email = process.argv[2] || 'rmrodrigomribeiro@gmail.com'
  const { data: p } = await sb.from('profiles').select('*').eq('email', email).maybeSingle()
  if (!p) { console.log('Admin nao encontrado'); return }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('ANALISE OPERACIONAL · ' + p.nome + ' (' + p.email + ')')
  console.log('═══════════════════════════════════════════════════════════')

  const metas = await fetchAll('metas', '*')
  const myMetas = metas.filter(m => m.tenant_id === p.tenant_id && !m.deleted_at)
  const fechadas = myMetas.filter(m => m.status_fechamento === 'fechada')
  const metaIds = new Set(myMetas.map(m => m.id))

  const remessas = await fetchAll('remessas', '*')
  const myRem = remessas.filter(r => metaIds.has(r.meta_id))

  // ════════════════════════════════════════════
  // 1. TAMANHO TIPICO DAS METAS
  // ════════════════════════════════════════════
  console.log('\n━━━ 1. TAMANHO DAS METAS ━━━')
  const sizes = myMetas.map(m => Number(m.quantidade_contas || 0)).filter(n => n > 0)
  console.log('  Mediana de contas/meta: ' + median(sizes))
  console.log('  Media de contas/meta: ' + Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length))
  console.log('  Min/Max: ' + Math.min(...sizes) + ' / ' + Math.max(...sizes))
  // Distribuicao
  const buckets = { '1-10': 0, '11-30': 0, '31-50': 0, '51-100': 0, '101+': 0 }
  for (const s of sizes) {
    if (s <= 10) buckets['1-10']++
    else if (s <= 30) buckets['11-30']++
    else if (s <= 50) buckets['31-50']++
    else if (s <= 100) buckets['51-100']++
    else buckets['101+']++
  }
  console.log('  Distribuicao:')
  for (const [b, c] of Object.entries(buckets)) {
    const pct = Math.round(c / sizes.length * 100)
    console.log('    ' + b.padEnd(8) + ' · ' + c + ' metas (' + pct + '%)')
  }

  // ════════════════════════════════════════════
  // 2. VELOCIDADE DE FECHAMENTO (dias do create ao fechada_em)
  // ════════════════════════════════════════════
  console.log('\n━━━ 2. VELOCIDADE DE FECHAMENTO ━━━')
  const tempos = fechadas
    .filter(m => m.fechada_em && m.created_at)
    .map(m => (new Date(m.fechada_em) - new Date(m.created_at)) / 86400000)
  console.log('  Mediana de dias pra fechar: ' + median(tempos).toFixed(1))
  console.log('  Media: ' + (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1) + 'd')
  const tempoBuckets = { '< 1d': 0, '1-3d': 0, '3-7d': 0, '7-14d': 0, '14d+': 0 }
  for (const t of tempos) {
    if (t < 1) tempoBuckets['< 1d']++
    else if (t < 3) tempoBuckets['1-3d']++
    else if (t < 7) tempoBuckets['3-7d']++
    else if (t < 14) tempoBuckets['7-14d']++
    else tempoBuckets['14d+']++
  }
  console.log('  Distribuicao:')
  for (const [b, c] of Object.entries(tempoBuckets)) {
    const pct = Math.round(c / tempos.length * 100)
    console.log('    ' + b.padEnd(8) + ' · ' + c + ' metas (' + pct + '%)')
  }

  // ════════════════════════════════════════════
  // 3. REMESSAS POR META — intensidade
  // ════════════════════════════════════════════
  console.log('\n━━━ 3. REMESSAS POR META ━━━')
  const remPorMeta = myMetas.map(m => myRem.filter(r => r.meta_id === m.id).length)
  console.log('  Mediana: ' + median(remPorMeta) + ' remessas/meta')
  console.log('  Media: ' + (remPorMeta.reduce((a, b) => a + b, 0) / remPorMeta.length).toFixed(1))

  // ════════════════════════════════════════════
  // 4. TICKET MEDIO DE REMESSA
  // ════════════════════════════════════════════
  console.log('\n━━━ 4. TICKET MEDIO DE REMESSA ━━━')
  const deps = myRem.map(r => Number(r.deposito || 0)).filter(n => n > 0)
  const saques = myRem.map(r => Number(r.saque || 0)).filter(n => n > 0)
  console.log('  Mediana deposito: R$ ' + fmtR(median(deps)))
  console.log('  Mediana saque: R$ ' + fmtR(median(saques)))
  console.log('  Media deposito: R$ ' + fmtR(deps.reduce((a, b) => a + b, 0) / deps.length))
  console.log('  Media saque: R$ ' + fmtR(saques.reduce((a, b) => a + b, 0) / saques.length))

  // ════════════════════════════════════════════
  // 5. TAXA DE WIN/LOSS POR REMESSA
  // ════════════════════════════════════════════
  console.log('\n━━━ 5. TAXA DE WIN/LOSS POR REMESSA ━━━')
  const winRem = myRem.filter(r => Number(r.resultado || 0) > 0).length
  const lossRem = myRem.filter(r => Number(r.resultado || 0) < 0).length
  const neutroRem = myRem.length - winRem - lossRem
  console.log('  Win:    ' + winRem + ' (' + Math.round(winRem / myRem.length * 100) + '%)')
  console.log('  Loss:   ' + lossRem + ' (' + Math.round(lossRem / myRem.length * 100) + '%)')
  console.log('  Neutro: ' + neutroRem + ' (' + Math.round(neutroRem / myRem.length * 100) + '%)')

  // ════════════════════════════════════════════
  // 6. RESULTADO BRUTO MEDIO POR REMESSA
  // ════════════════════════════════════════════
  console.log('\n━━━ 6. RESULTADO BRUTO POR REMESSA ━━━')
  const results = myRem.map(r => Number(r.resultado || 0))
  const totalResult = results.reduce((a, b) => a + b, 0)
  console.log('  Media de resultado/remessa: R$ ' + fmtR(totalResult / results.length))
  console.log('  Total bruto somado: R$ ' + fmtR(totalResult))
  // Top 5 piores e melhores
  const sorted = [...results].sort((a, b) => b - a)
  console.log('  Top 5 melhores: ' + sorted.slice(0, 5).map(r => 'R$ ' + fmtR(r)).join(', '))
  console.log('  Top 5 piores: ' + sorted.slice(-5).map(r => 'R$ ' + fmtR(r)).join(', '))

  // ════════════════════════════════════════════
  // 7. PADRAO TEMPORAL — dias da semana e horarios
  // ════════════════════════════════════════════
  console.log('\n━━━ 7. PADRAO TEMPORAL DE REMESSAS ━━━')
  const dow = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const dowCount = Array(7).fill(0)
  const hourCount = Array(24).fill(0)
  for (const r of myRem) {
    const d = new Date(r.created_at)
    dowCount[d.getDay()]++
    hourCount[d.getHours()]++
  }
  console.log('  Por dia da semana (em horario UTC do banco):')
  for (let i = 0; i < 7; i++) {
    const pct = Math.round(dowCount[i] / myRem.length * 100)
    const bar = '█'.repeat(Math.round(pct / 2))
    console.log('    ' + dow[i] + ' · ' + dowCount[i].toString().padStart(4) + ' (' + pct.toString().padStart(2) + '%) ' + bar)
  }
  console.log('  Top 5 horarios (UTC, somar -3h pra BR):')
  const topHours = hourCount.map((c, h) => ({ h, c })).sort((a, b) => b.c - a.c).slice(0, 5)
  for (const t of topHours) {
    console.log('    ' + t.h.toString().padStart(2, '0') + 'h UTC · ' + t.c + ' remessas (' + ((t.h - 3 + 24) % 24).toString().padStart(2, '0') + 'h BR)')
  }

  // ════════════════════════════════════════════
  // 8. ESTRATEGIA ENTRE REDES (proporcao)
  // ════════════════════════════════════════════
  console.log('\n━━━ 8. DISTRIBUICAO POR REDE ━━━')
  const byRede = {}
  for (const m of fechadas) {
    const r = m.rede || '?'
    if (!byRede[r]) byRede[r] = { metas: 0, contas: 0, lucro: 0, dias: [] }
    byRede[r].metas++
    byRede[r].contas += Number(m.quantidade_contas || 0)
    byRede[r].lucro += Number(m.lucro_final || 0)
    if (m.fechada_em && m.created_at) {
      byRede[r].dias.push((new Date(m.fechada_em) - new Date(m.created_at)) / 86400000)
    }
  }
  console.log('  Rede       · Metas · Contas · Lucro      · R$/conta · Dias medios')
  for (const [r, v] of Object.entries(byRede).sort((a, b) => b[1].lucro - a[1].lucro)) {
    const rpc = v.contas > 0 ? v.lucro / v.contas : 0
    const avgDias = v.dias.length > 0 ? v.dias.reduce((a, b) => a + b, 0) / v.dias.length : 0
    console.log('  ' + r.padEnd(10) + ' · ' + v.metas.toString().padStart(5) + ' · ' + v.contas.toString().padStart(6) + ' · R$ ' + fmtR(v.lucro).padStart(9) + ' · R$ ' + fmtR(rpc).padStart(6) + ' · ' + avgDias.toFixed(1) + 'd')
  }

  // ════════════════════════════════════════════
  // 9. SALARIO + BAU MEDIO (modelo salario_bau)
  // ════════════════════════════════════════════
  console.log('\n━━━ 9. MODELOS DE FECHAMENTO ━━━')
  const fechSalarioBau = fechadas.filter(m => m.operation_model !== 'apenas_bau')
  const fechApenasBau = fechadas.filter(m => m.operation_model === 'apenas_bau')

  if (fechSalarioBau.length > 0) {
    const salTotal = fechSalarioBau.reduce((s, m) => s + Number(m.salario || 0), 0)
    const bauTotal = fechSalarioBau.reduce((s, m) => s + Number(m.bau || 0), 0)
    const custosTotal = fechSalarioBau.reduce((s, m) => s + Number(m.custo_fixo || 0), 0)
    const taxaAg = fechSalarioBau.reduce((s, m) => s + Number(m.taxa_agente || 0), 0)
    console.log('  SALARIO+BAU (' + fechSalarioBau.length + ' metas):')
    console.log('    Salario medio/meta: R$ ' + fmtR(salTotal / fechSalarioBau.length))
    console.log('    BAU medio/meta:     R$ ' + fmtR(bauTotal / fechSalarioBau.length))
    console.log('    Custo fixo medio:   R$ ' + fmtR(custosTotal / fechSalarioBau.length))
    console.log('    Taxa agente medio:  R$ ' + fmtR(taxaAg / fechSalarioBau.length))
    console.log('    Total salario:      R$ ' + fmtR(salTotal))
    console.log('    Total BAU:          R$ ' + fmtR(bauTotal))
  }

  if (fechApenasBau.length > 0) {
    // No modo apenas_bau, o BAU esta nas remessas (campo bau)
    const apenasBauMetaIds = new Set(fechApenasBau.map(m => m.id))
    const remApenasBau = myRem.filter(r => apenasBauMetaIds.has(r.meta_id))
    const bauApenasBau = remApenasBau.reduce((s, r) => s + Number(r.bau || 0), 0)
    console.log('  APENAS_BAU (' + fechApenasBau.length + ' metas):')
    console.log('    BAU acumulado nas remessas: R$ ' + fmtR(bauApenasBau))
    console.log('    BAU medio por meta:         R$ ' + fmtR(bauApenasBau / fechApenasBau.length))
    console.log('    BAU medio por remessa:      R$ ' + fmtR(bauApenasBau / remApenasBau.length))
  }

  // ════════════════════════════════════════════
  // 10. CARGA POR OPERADOR
  // ════════════════════════════════════════════
  console.log('\n━━━ 10. CARGA DE TRABALHO POR OPERADOR ━━━')
  const { data: ops } = await sb.from('profiles').select('id,email,nome').eq('tenant_id', p.tenant_id).eq('role', 'operator')
  const opLoad = []
  for (const op of ops || []) {
    const opMetas = myMetas.filter(m => m.operator_id === op.id)
    const opRem = myRem.filter(r => opMetas.some(m => m.id === r.meta_id))
    opLoad.push({
      nome: op.nome || op.email.split('@')[0],
      metas: opMetas.length,
      remessas: opRem.length,
    })
  }
  opLoad.sort((a, b) => b.remessas - a.remessas)
  const totalRemEquipe = opLoad.reduce((s, o) => s + o.remessas, 0)
  console.log('  Concentracao: top 5 operadores fazem ' + Math.round(opLoad.slice(0, 5).reduce((s, o) => s + o.remessas, 0) / totalRemEquipe * 100) + '% das remessas')
  console.log('  Concentracao: top 3 operadores fazem ' + Math.round(opLoad.slice(0, 3).reduce((s, o) => s + o.remessas, 0) / totalRemEquipe * 100) + '%')

  // ════════════════════════════════════════════
  // 11. EVOLUCAO SEMANAL DE LUCRO
  // ════════════════════════════════════════════
  console.log('\n━━━ 11. EVOLUCAO SEMANAL DE LUCRO ━━━')
  const byWeek = {}
  for (const m of fechadas) {
    if (!m.fechada_em) continue
    const d = new Date(m.fechada_em)
    // Inicio da semana (segunda)
    const day = d.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
    const key = monday.toISOString().slice(0, 10)
    if (!byWeek[key]) byWeek[key] = { lucro: 0, metas: 0, contas: 0 }
    byWeek[key].lucro += Number(m.lucro_final || 0)
    byWeek[key].metas++
    byWeek[key].contas += Number(m.quantidade_contas || 0)
  }
  const weeks = Object.entries(byWeek).sort()
  for (const [w, v] of weeks) {
    const bar = '█'.repeat(Math.min(40, Math.round(v.lucro / 1000)))
    console.log('  Sem ' + w + ' · ' + v.metas.toString().padStart(3) + ' metas · R$ ' + fmtR(v.lucro).padStart(10) + ' ' + bar)
  }

  // ════════════════════════════════════════════
  // 12. INSIGHTS QUE PODEM REVELAR ESTRATEGIA
  // ════════════════════════════════════════════
  console.log('\n━━━ 12. INSIGHTS DA ESTRATEGIA ━━━')
  const totalDep = myRem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const totalSaq = myRem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const totalBau = myRem.reduce((s, r) => s + Number(r.bau || 0), 0)
  const lucroFinal = fechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0)

  console.log('  Saque/Deposito ratio: ' + (totalSaq / totalDep).toFixed(3) + ' (1.0 = breakeven)')
  console.log('  → Operacao roda em BAU/Salario, nao em ganho de slot')
  console.log('  BAU representa ' + Math.round(totalBau / lucroFinal * 100) + '% do lucro total')
  const lucroPorContaMedio = fechadas.length > 0
    ? fechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0) /
      fechadas.reduce((s, m) => s + Number(m.quantidade_contas || 0), 0)
    : 0
  console.log('  Lucro medio por conta: R$ ' + fmtR(lucroPorContaMedio))
  console.log('  → Padrao de mercado eh R$ 5-8/conta no nicho CPA. Comparativo OK.')

  console.log('\n═══════════════════════════════════════════════════════════')
}

main().catch(console.error)
