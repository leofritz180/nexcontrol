// Analise diaria: contas/dia, metas/dia, distribuicao de rede no tempo, metas negativas
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')

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

// Considera dia operacional como começando às 18h BR (a "noite de operação" se estende pra madrugada)
// Usar dia da CREATED_AT em BR
function brDay(utcDateStr) {
  const d = new Date(utcDateStr)
  const br = new Date(d.getTime() - 3 * 3600000)
  return br.toISOString().slice(0, 10)
}

async function main() {
  const email = process.argv[2] || 'rmrodrigomribeiro@gmail.com'
  const { data: p } = await sb.from('profiles').select('tenant_id,nome').eq('email', email).maybeSingle()
  if (!p) { console.log('Nao encontrado'); return }

  const metas = await fetchAll('metas', '*')
  const myMetas = metas.filter(m => m.tenant_id === p.tenant_id && !m.deleted_at)
  const fechadas = myMetas.filter(m => m.status_fechamento === 'fechada')

  console.log('═══════════════════════════════════════════════════')
  console.log('DIARIO · ' + p.nome)
  console.log('═══════════════════════════════════════════════════')

  // ── 1. CONTAS/DIA e METAS/DIA por dia ──
  const byDay = {}
  for (const m of fechadas) {
    if (!m.fechada_em) continue
    const day = brDay(m.fechada_em)
    if (!byDay[day]) byDay[day] = { metas: 0, contas: 0, lucro: 0, prej: 0, neg: 0 }
    byDay[day].metas++
    byDay[day].contas += Number(m.quantidade_contas || 0)
    const lf = Number(m.lucro_final || 0)
    byDay[day].lucro += lf
    if (lf < 0) { byDay[day].neg++; byDay[day].prej += Math.abs(lf) }
  }

  console.log('\n━━━ POR DIA DE FECHAMENTO ━━━')
  console.log('Data       · Metas · Contas · Lucro       · Neg · Prej')
  const days = Object.entries(byDay).sort()
  for (const [d, v] of days) {
    const tagNeg = v.neg > 0 ? '⚠ ' + v.neg : '  '
    console.log('  ' + d + ' · ' + v.metas.toString().padStart(5) + ' · ' + v.contas.toString().padStart(6) + ' · R$ ' + fmtR(v.lucro).padStart(10) + ' · ' + tagNeg + ' · R$ ' + fmtR(v.prej))
  }

  // ── Médias ──
  const totalDias = days.length
  const totalMetas = days.reduce((s, [, v]) => s + v.metas, 0)
  const totalContas = days.reduce((s, [, v]) => s + v.contas, 0)
  const totalLucro = days.reduce((s, [, v]) => s + v.lucro, 0)
  const diasAtivos = days.filter(([, v]) => v.metas > 0).length
  console.log('\n━━━ MEDIAS ━━━')
  console.log('  Total dias com fechamento: ' + diasAtivos)
  console.log('  Metas por dia (media):     ' + (totalMetas / diasAtivos).toFixed(1))
  console.log('  Contas por dia (media):    ' + Math.round(totalContas / diasAtivos))
  console.log('  Lucro por dia (media):     R$ ' + fmtR(totalLucro / diasAtivos))

  // Pico
  const top = days.sort((a, b) => b[1].contas - a[1].contas).slice(0, 5)
  console.log('  Top 5 dias por contas processadas:')
  for (const [d, v] of top) {
    console.log('    ' + d + ' · ' + v.contas + ' contas · ' + v.metas + ' metas · R$ ' + fmtR(v.lucro))
  }

  // ── 2. REDES NO TEMPO ──
  console.log('\n━━━ REDES UTILIZADAS POR SEMANA ━━━')
  const byWeekRede = {}
  for (const m of fechadas) {
    if (!m.fechada_em) continue
    const d = new Date(m.fechada_em)
    const day = d.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
    const wkey = monday.toISOString().slice(0, 10)
    const rede = m.rede || '?'
    if (!byWeekRede[wkey]) byWeekRede[wkey] = {}
    if (!byWeekRede[wkey][rede]) byWeekRede[wkey][rede] = { metas: 0, lucro: 0 }
    byWeekRede[wkey][rede].metas++
    byWeekRede[wkey][rede].lucro += Number(m.lucro_final || 0)
  }
  for (const [wk, redes] of Object.entries(byWeekRede).sort()) {
    console.log('  Sem ' + wk + ':')
    const sorted = Object.entries(redes).sort((a, b) => b[1].metas - a[1].metas)
    for (const [r, v] of sorted) {
      console.log('    ' + r.padEnd(8) + ' · ' + v.metas + ' metas · R$ ' + fmtR(v.lucro))
    }
  }

  // ── 3. METAS NEGATIVAS ──
  const negativas = fechadas.filter(m => Number(m.lucro_final || 0) < 0)
  const positivas = fechadas.filter(m => Number(m.lucro_final || 0) > 0)
  const neutras = fechadas.length - negativas.length - positivas.length

  console.log('\n━━━ METAS NEGATIVAS ━━━')
  console.log('  Total fechadas: ' + fechadas.length)
  console.log('  Positivas:      ' + positivas.length + ' (' + Math.round(positivas.length / fechadas.length * 100) + '%)')
  console.log('  Negativas:      ' + negativas.length + ' (' + Math.round(negativas.length / fechadas.length * 100) + '%)')
  console.log('  Neutras (R$0):  ' + neutras + ' (' + Math.round(neutras / fechadas.length * 100) + '%)')

  if (negativas.length > 0) {
    const totalPrej = negativas.reduce((s, m) => s + Math.abs(Number(m.lucro_final || 0)), 0)
    const totalContasNeg = negativas.reduce((s, m) => s + Number(m.quantidade_contas || 0), 0)
    console.log('  Total prejuizo: R$ ' + fmtR(totalPrej))
    console.log('  Contas em metas negativas: ' + totalContasNeg)
    console.log('  Prejuizo medio: R$ ' + fmtR(totalPrej / negativas.length) + ' por meta negativa')
    console.log()
    console.log('  Lista (piores primeiro):')
    const sortedNeg = negativas.sort((a, b) => Number(a.lucro_final) - Number(b.lucro_final))
    for (const m of sortedNeg) {
      const date = m.fechada_em ? brDay(m.fechada_em) : '?'
      console.log('    ' + date + ' · ' + (m.rede || '?').padEnd(6) + ' · ' + m.quantidade_contas + ' contas · ' + (m.operation_model || 'salario_bau').padEnd(11) + ' · R$ ' + fmtR(m.lucro_final))
    }
  }

  // ── 4. METAS POR REDE: positivas vs negativas ──
  console.log('\n━━━ TAXA DE NEGATIVAS POR REDE ━━━')
  const redeStats = {}
  for (const m of fechadas) {
    const r = m.rede || '?'
    if (!redeStats[r]) redeStats[r] = { total: 0, neg: 0, lucro: 0 }
    redeStats[r].total++
    const lf = Number(m.lucro_final || 0)
    if (lf < 0) redeStats[r].neg++
    redeStats[r].lucro += lf
  }
  console.log('  Rede     · Total · Negs · % neg · Lucro')
  for (const [r, v] of Object.entries(redeStats).sort((a, b) => b[1].lucro - a[1].lucro)) {
    const pctNeg = Math.round(v.neg / v.total * 100)
    console.log('  ' + r.padEnd(8) + ' · ' + v.total.toString().padStart(5) + ' · ' + v.neg.toString().padStart(4) + ' · ' + pctNeg.toString().padStart(4) + '% · R$ ' + fmtR(v.lucro))
  }
}

main().catch(console.error)
