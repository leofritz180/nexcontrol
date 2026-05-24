// Relatorio operacao Rodrigo num periodo
// Uso: node scripts/report-rodrigo-periodo.js 2026-05-21 2026-05-25
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const dayKey = d => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const hourKey = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).slice(0, 2)

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
  const startStr = process.argv[2] || '2026-05-21'
  const endStr = process.argv[3] || '2026-05-25'
  const start = new Date(startStr + 'T00:00:00-03:00')
  const end = new Date(endStr + 'T23:59:59-03:00')

  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  if (!p) { console.log('Admin nao encontrado'); return }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('OPERAÇÃO RODRIGO · ' + startStr + ' → ' + endStr)
  console.log('═══════════════════════════════════════════════════════════════')

  // Operadores
  const ops = await fetchAll('profiles', '*', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  // Metas do tenant
  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metas = allMetas.filter(m => !m.deleted_at)
  const metaMap = new Map(metas.map(m => [m.id, m]))

  // Remessas no periodo
  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    const t = new Date(r.created_at)
    return t >= start && t <= end
  })

  // Metas criadas no periodo
  const newMetas = metas.filter(m => {
    const t = new Date(m.created_at)
    return t >= start && t <= end
  })

  // Metas FECHADAS no periodo (status_fechamento + updated_at)
  const closedInPeriod = metas.filter(m => {
    if (m.status_fechamento !== 'fechada') return false
    const t = new Date(m.updated_at || m.created_at)
    return t >= start && t <= end
  })

  console.log('\n━ RESUMO DO PERÍODO ━')
  console.log('  Operadores ativos no tenant: ' + ops.length)
  console.log('  Metas criadas: ' + newMetas.length)
  console.log('  Metas fechadas: ' + closedInPeriod.length)
  console.log('  Remessas registradas: ' + rem.length)

  const totalContas = rem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)
  const totalDep = rem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const totalSaq = rem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const totalLucroRem = rem.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const totalPrejRem = rem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalBau = rem.reduce((s, r) => s + Number(r.bau || 0), 0)
  const lucroFechadas = closedInPeriod.reduce((s, m) => s + Number(m.lucro_final || 0), 0)

  console.log('\n━ VOLUMES ━')
  console.log('  Contas processadas (remessas):  ' + totalContas)
  console.log('  Depositado:        R$ ' + fmtR(totalDep))
  console.log('  Sacado:            R$ ' + fmtR(totalSaq))
  console.log('  Bruto saque-dep:   R$ ' + fmtR(totalSaq - totalDep))
  console.log('  Lucro remessas:    R$ ' + fmtR(totalLucroRem))
  console.log('  Prejuizo remessas: R$ ' + fmtR(totalPrejRem))
  console.log('  BAU registrado:    R$ ' + fmtR(totalBau))
  console.log('  Lucro final (metas fechadas no periodo): R$ ' + fmtR(lucroFechadas))

  // Por dia
  console.log('\n━ POR DIA ━')
  const byDay = {}
  for (const r of rem) {
    const k = dayKey(r.created_at)
    if (!byDay[k]) byDay[k] = { rem: 0, contas: 0, lucro: 0, prej: 0 }
    byDay[k].rem++
    byDay[k].contas += Number(r.contas_remessa || 0)
    byDay[k].lucro += Number(r.lucro || 0)
    byDay[k].prej += Number(r.prejuizo || 0)
  }
  for (const [day, v] of Object.entries(byDay).sort()) {
    console.log('  ' + day + ' · ' + v.rem.toString().padStart(3) + ' rem · ' + v.contas.toString().padStart(4) + ' contas · lucro R$ ' + fmtR(v.lucro).padStart(9) + ' · prej R$ ' + fmtR(v.prej).padStart(7))
  }

  // Por hora (faixas)
  console.log('\n━ POR HORA (todos os dias do periodo) ━')
  const byHour = {}
  for (const r of rem) {
    const h = hourKey(r.created_at)
    if (!byHour[h]) byHour[h] = { rem: 0, contas: 0 }
    byHour[h].rem++
    byHour[h].contas += Number(r.contas_remessa || 0)
  }
  const sortedHours = Object.entries(byHour).sort()
  for (const [h, v] of sortedHours) {
    const bar = '█'.repeat(Math.min(40, Math.ceil(v.rem / 2)))
    console.log('  ' + h + 'h · ' + v.rem.toString().padStart(3) + ' rem · ' + v.contas.toString().padStart(3) + ' contas  ' + bar)
  }

  // Por operador
  console.log('\n━ POR OPERADOR (apenas os ativos no periodo) ━')
  const byOp = {}
  for (const r of rem) {
    const m = metaMap.get(r.meta_id)
    if (!m) continue
    const opId = m.operator_id
    if (!byOp[opId]) byOp[opId] = { nome: opMap.get(opId) || '?', rem: 0, contas: 0, lucro: 0, prej: 0, bau: 0, metas: new Set() }
    byOp[opId].rem++
    byOp[opId].contas += Number(r.contas_remessa || 0)
    byOp[opId].lucro += Number(r.lucro || 0)
    byOp[opId].prej += Number(r.prejuizo || 0)
    byOp[opId].bau += Number(r.bau || 0)
    byOp[opId].metas.add(r.meta_id)
  }
  const ranking = Object.entries(byOp)
    .map(([id, v]) => ({ id, ...v, metas: v.metas.size, liquido: v.lucro - v.prej + v.bau }))
    .sort((a, b) => b.liquido - a.liquido)

  for (let i = 0; i < ranking.length; i++) {
    const r = ranking[i]
    console.log(
      '  ' + (i + 1).toString().padStart(2) + '. ' +
      r.nome.padEnd(22).slice(0, 22) + ' · ' +
      r.metas.toString().padStart(2) + ' metas · ' +
      r.rem.toString().padStart(3) + ' rem · ' +
      r.contas.toString().padStart(4) + ' contas · ' +
      'L:R$' + fmtR(r.lucro).padStart(8) + ' · ' +
      'P:R$' + fmtR(r.prej).padStart(7) + ' · ' +
      'BAU:R$' + fmtR(r.bau).padStart(7) + ' · ' +
      'líq R$' + fmtR(r.liquido).padStart(8)
    )
  }

  // Operadores inativos
  const activeOpIds = new Set(ranking.map(r => r.id))
  const inactive = ops.filter(o => !activeOpIds.has(o.id))
  if (inactive.length > 0) {
    console.log('\n━ INATIVOS NO PERÍODO (sem nenhuma remessa) ━')
    for (const o of inactive) {
      const last = o.last_seen_at ? fmt(o.last_seen_at) : 'nunca'
      console.log('  · ' + (o.nome || o.email.split('@')[0]).padEnd(22).slice(0, 22) + ' · ult acesso ' + last)
    }
  }

  // Top slots
  const slotCount = {}
  for (const r of rem) {
    if (!r.slot_name) continue
    slotCount[r.slot_name] = (slotCount[r.slot_name] || 0) + 1
  }
  const topSlots = Object.entries(slotCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
  if (topSlots.length > 0) {
    console.log('\n━ TOP 10 SLOTS NO PERÍODO ━')
    for (const [name, count] of topSlots) {
      console.log('  ' + name.padEnd(28).slice(0, 28) + ' · ' + count + ' rem')
    }
  }

  // Por rede
  console.log('\n━ POR REDE (no periodo) ━')
  const byRede = {}
  for (const r of rem) {
    const m = metaMap.get(r.meta_id)
    const rd = (m?.rede || '?').toUpperCase()
    if (!byRede[rd]) byRede[rd] = { rem: 0, contas: 0, lucro: 0, prej: 0 }
    byRede[rd].rem++
    byRede[rd].contas += Number(r.contas_remessa || 0)
    byRede[rd].lucro += Number(r.lucro || 0)
    byRede[rd].prej += Number(r.prejuizo || 0)
  }
  for (const [rd, v] of Object.entries(byRede).sort((a, b) => b[1].lucro - a[1].lucro)) {
    console.log('  ' + rd.padEnd(8) + ' · ' + v.rem.toString().padStart(3) + ' rem · ' + v.contas.toString().padStart(4) + ' contas · L:R$' + fmtR(v.lucro).padStart(8) + ' · P:R$' + fmtR(v.prej).padStart(7))
  }

  // Problemas registrados
  const problems = rem.filter(r => r.status_problema)
  if (problems.length > 0) {
    console.log('\n━ REMESSAS COM STATUS DE PROBLEMA ━')
    const byProb = {}
    for (const r of problems) byProb[r.status_problema] = (byProb[r.status_problema] || 0) + 1
    for (const [k, v] of Object.entries(byProb)) console.log('  ' + k.padEnd(20) + ' · ' + v)
  }

  // Observacoes interessantes
  const obs = rem.filter(r => r.observacao && r.observacao.trim().length > 5).slice(0, 30)
  if (obs.length > 0) {
    console.log('\n━ OBSERVAÇÕES (sample, max 30) ━')
    for (const r of obs.slice(0, 30)) {
      const m = metaMap.get(r.meta_id)
      const opNome = opMap.get(m?.operator_id) || '?'
      console.log('  [' + opNome.slice(0, 12).padEnd(12) + '] ' + (r.observacao || '').slice(0, 90))
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('FIM · ' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
  console.log('═══════════════════════════════════════════════════════════════')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
