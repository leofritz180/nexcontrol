// Detalhe diario de um operador especifico
// Uso: node scripts/report-op-detail.js <email_admin> <email_operador>
//      node scripts/report-op-detail.js rmrodrigomribeiro@gmail.com 99sergio00guimaraes@gmail.com
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

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

function brDay(utcDateStr) {
  const d = new Date(utcDateStr)
  return new Date(d.getTime() - 3 * 3600000).toISOString().slice(0, 10)
}

function brHour(utcDateStr) {
  const d = new Date(utcDateStr)
  return new Date(d.getTime() - 3 * 3600000).getUTCHours()
}

async function main() {
  const adminEmail = process.argv[2] || 'rmrodrigomribeiro@gmail.com'
  const opEmail = process.argv[3] || '99sergio00guimaraes@gmail.com'

  const { data: admin } = await sb.from('profiles').select('tenant_id,nome').eq('email', adminEmail).maybeSingle()
  const { data: op } = await sb.from('profiles').select('*').eq('email', opEmail).maybeSingle()
  if (!admin || !op) { console.log('Nao encontrado'); return }

  const metas = await fetchAll('metas', '*')
  const opMetas = metas.filter(m => m.tenant_id === admin.tenant_id && m.operator_id === op.id && !m.deleted_at)
  const opFechadas = opMetas.filter(m => m.status_fechamento === 'fechada')
  const metaIds = new Set(opMetas.map(m => m.id))
  const remessas = await fetchAll('remessas', '*')
  const opRem = remessas.filter(r => metaIds.has(r.meta_id))

  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('OPERADOR · ' + (op.nome || op.email))
  console.log('  email: ' + op.email)
  console.log('  cadastro: ' + new Date(op.created_at).toLocaleDateString('pt-BR'))
  console.log('  ultima atividade: ' + (op.last_seen_at ? new Date(op.last_seen_at).toLocaleString('pt-BR') : '—'))
  console.log('  total metas: ' + opMetas.length + ' (' + opFechadas.length + ' fechadas)')
  console.log('  total remessas: ' + opRem.length)
  console.log('═══════════════════════════════════════════════════════════════════════')

  // ── DIA A DIA ──
  const byDay = {}
  for (const r of opRem) {
    const d = brDay(r.created_at)
    if (!byDay[d]) byDay[d] = { rem: 0, contas: 0, dep: 0, saq: 0, bau: 0, win: 0, loss: 0, horas: new Set(), redes: new Set(), metas: new Set() }
    byDay[d].rem++
    if (r.tipo !== 'redeposito') byDay[d].contas += Number(r.contas_remessa || 0)
    byDay[d].dep += Number(r.deposito || 0)
    byDay[d].saq += Number(r.saque || 0)
    byDay[d].bau += Number(r.bau || 0)
    if (Number(r.resultado || 0) > 0) byDay[d].win++
    else if (Number(r.resultado || 0) < 0) byDay[d].loss++
    byDay[d].horas.add(brHour(r.created_at))
    byDay[d].metas.add(r.meta_id)
    const meta = opMetas.find(m => m.id === r.meta_id)
    if (meta?.rede) byDay[d].redes.add(meta.rede)
  }

  // Agrega lucro_final por dia (fechamento)
  const lucroByDay = {}
  for (const m of opFechadas) {
    if (!m.fechada_em) continue
    const d = brDay(m.fechada_em)
    lucroByDay[d] = (lucroByDay[d] || 0) + Number(m.lucro_final || 0)
  }

  console.log('\n━━━ DIA A DIA ━━━')
  console.log('Data       · Met · Rem · Contas · Win/Loss · Dep        · Saq        · BAU       · Lucro       · Horario · Redes')
  console.log('─'.repeat(140))
  const days = Object.entries(byDay).sort()
  for (const [d, v] of days) {
    const horas = [...v.horas].sort((a, b) => a - b)
    const horaRange = horas.length > 0 ? horas[0] + 'h-' + horas[horas.length - 1] + 'h' : '—'
    const redes = [...v.redes].join(',')
    const lucro = lucroByDay[d] || 0
    const lucroStr = lucro !== 0 ? 'R$ ' + fmtR(lucro) : '—'
    console.log(
      '  ' + d +
      ' · ' + v.metas.size.toString().padStart(3) +
      ' · ' + v.rem.toString().padStart(3) +
      ' · ' + v.contas.toString().padStart(6) +
      ' · ' + (v.win + '/' + v.loss).padStart(8) +
      ' · R$ ' + fmtR(v.dep).padStart(8) +
      ' · R$ ' + fmtR(v.saq).padStart(8) +
      ' · R$ ' + fmtR(v.bau).padStart(7) +
      ' · ' + lucroStr.padStart(11) +
      ' · ' + horaRange.padStart(7) +
      ' · ' + redes
    )
  }

  // ── MELHORES DIAS ──
  const sortedByContas = [...days].sort((a, b) => b[1].contas - a[1].contas).slice(0, 3)
  console.log('\n━━━ TOP 3 DIAS POR CONTAS ━━━')
  for (const [d, v] of sortedByContas) {
    console.log()
    console.log('  📅 ' + d + ' · ' + v.contas + ' contas em ' + v.metas.size + ' metas')
    console.log('     Remessas: ' + v.rem + ' (' + v.win + ' win / ' + v.loss + ' loss)')
    console.log('     Horario: ' + [...v.horas].sort((a, b) => a - b).map(h => h + 'h').join(', '))
    console.log('     Redes: ' + [...v.redes].join(', '))
    console.log('     Lucro: R$ ' + fmtR(lucroByDay[d] || 0))

    // Metas detalhadas do dia
    const dayMetaIds = [...v.metas]
    const dayMetas = opMetas.filter(m => dayMetaIds.includes(m.id))
    console.log('     Metas do dia:')
    for (const m of dayMetas) {
      const mRem = opRem.filter(r => r.meta_id === m.id)
      console.log('       · ' + (m.rede || '?').padEnd(6) + ' · ' + (m.quantidade_contas || 0) + ' contas alvo · ' + mRem.length + ' remessas · status_fechamento=' + (m.status_fechamento || 'pendente') + ' · model=' + (m.operation_model || 'salario_bau') + ' · lucro_final=R$ ' + fmtR(m.lucro_final))
    }
  }

  // ── DISTRIBUICAO POR REDE ──
  console.log('\n━━━ POR REDE (todas as metas dele) ━━━')
  const byRede = {}
  for (const m of opMetas) {
    const r = m.rede || '?'
    if (!byRede[r]) byRede[r] = { count: 0, fechadas: 0, contas: 0, lucro: 0 }
    byRede[r].count++
    if (m.status_fechamento === 'fechada') {
      byRede[r].fechadas++
      byRede[r].contas += Number(m.quantidade_contas || 0)
      byRede[r].lucro += Number(m.lucro_final || 0)
    }
  }
  for (const [r, v] of Object.entries(byRede).sort((a, b) => b[1].lucro - a[1].lucro)) {
    const rpc = v.contas > 0 ? v.lucro / v.contas : 0
    console.log('  ' + r.padEnd(8) + ' · ' + v.count + ' metas (' + v.fechadas + ' fechadas) · ' + v.contas + ' contas · R$ ' + fmtR(v.lucro) + ' · R$ ' + fmtR(rpc) + '/conta')
  }

  // ── HORARIOS ──
  console.log('\n━━━ DISTRIBUICAO HORARIA (BR) ━━━')
  const hourCount = Array(24).fill(0)
  for (const r of opRem) hourCount[brHour(r.created_at)]++
  const maxH = Math.max(...hourCount)
  for (let h = 0; h < 24; h++) {
    if (hourCount[h] === 0) continue
    const bar = '█'.repeat(Math.round(hourCount[h] / maxH * 30))
    console.log('  ' + h.toString().padStart(2, '0') + 'h · ' + hourCount[h].toString().padStart(4) + ' ' + bar)
  }
}

main().catch(console.error)
