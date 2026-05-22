// Contas/dia em media POR OPERADOR
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

async function main() {
  const email = process.argv[2] || 'rmrodrigomribeiro@gmail.com'
  const { data: p } = await sb.from('profiles').select('tenant_id,nome').eq('email', email).maybeSingle()
  if (!p) { console.log('Nao encontrado'); return }

  const { data: ops } = await sb.from('profiles').select('id,email,nome,created_at,last_seen_at').eq('tenant_id', p.tenant_id).eq('role', 'operator')
  const metas = await fetchAll('metas', '*')
  const myMetas = metas.filter(m => m.tenant_id === p.tenant_id && !m.deleted_at)
  const fechadas = myMetas.filter(m => m.status_fechamento === 'fechada')
  const metaIds = new Set(myMetas.map(m => m.id))
  const remessas = await fetchAll('remessas', 'meta_id,contas_remessa,tipo,created_at,resultado')
  const myRem = remessas.filter(r => metaIds.has(r.meta_id))

  const metaById = Object.fromEntries(myMetas.map(m => [m.id, m]))

  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('CONTAS/DIA POR OPERADOR · ' + p.nome)
  console.log('═══════════════════════════════════════════════════════════════════════')

  const opStats = []
  for (const op of ops || []) {
    const opMetas = myMetas.filter(m => m.operator_id === op.id)
    const opFechadas = fechadas.filter(m => m.operator_id === op.id)
    const opRem = myRem.filter(r => {
      const meta = metaById[r.meta_id]
      return meta && meta.operator_id === op.id
    })

    // Dias com atividade (dia BR onde ele criou pelo menos 1 remessa)
    const diasAtivos = new Set(opRem.map(r => brDay(r.created_at)))

    // Contas TOTAIS processadas em remessas (nao redeposito)
    const contasTotais = opRem
      .filter(r => r.tipo !== 'redeposito')
      .reduce((s, r) => s + Number(r.contas_remessa || 0), 0)

    // Contas em metas fechadas (mais conservador)
    const contasFechadas = opFechadas.reduce((s, m) => s + Number(m.quantidade_contas || 0), 0)

    // Pega contas POR DIA pra calcular pico
    const byDay = {}
    for (const r of opRem.filter(r => r.tipo !== 'redeposito')) {
      const d = brDay(r.created_at)
      byDay[d] = (byDay[d] || 0) + Number(r.contas_remessa || 0)
    }
    const contasPorDia = Object.values(byDay)
    const melhorDia = contasPorDia.length > 0 ? Math.max(...contasPorDia) : 0
    const mediana = contasPorDia.length > 0
      ? [...contasPorDia].sort((a, b) => a - b)[Math.floor(contasPorDia.length / 2)]
      : 0

    opStats.push({
      nome: op.nome || op.email.split('@')[0],
      email: op.email,
      cadastro: op.created_at,
      diasAtivos: diasAtivos.size,
      metas: opMetas.length,
      fechadas: opFechadas.length,
      remessas: opRem.length,
      contasTotais,
      contasFechadas,
      mediaContasDia: diasAtivos.size > 0 ? Math.round(contasTotais / diasAtivos.size) : 0,
      mediana,
      melhorDia,
      lucro: opFechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0),
    })
  }

  // Ordena por contas/dia
  opStats.sort((a, b) => b.mediaContasDia - a.mediaContasDia)

  console.log('\nLegenda:')
  console.log('  Dias = dias unicos com remessa registrada')
  console.log('  Contas = total processadas (sem contar redepositos)')
  console.log('  Contas/dia = media (total / dias ativos)')
  console.log()
  console.log('# · Operador                        · Dias · Contas · C/dia · Mediana · Pico · Metas/Fech · Lucro')
  console.log('─────────────────────────────────────────────────────────────────────────────────────────────')

  for (let i = 0; i < opStats.length; i++) {
    const s = opStats[i]
    const rank = (i + 1).toString().padStart(2)
    const nome = s.nome.padEnd(30).slice(0, 30)
    const dias = s.diasAtivos.toString().padStart(4)
    const cTot = s.contasTotais.toString().padStart(6)
    const cDia = s.mediaContasDia.toString().padStart(5)
    const med = s.mediana.toString().padStart(7)
    const pico = s.melhorDia.toString().padStart(4)
    const mf = (s.metas + '/' + s.fechadas).padStart(7)
    const lucro = ('R$ ' + fmtR(s.lucro)).padStart(11)
    console.log(`${rank} · ${nome} · ${dias} · ${cTot} · ${cDia} · ${med} · ${pico} · ${mf} · ${lucro}`)
  }

  // Resumo da equipe
  console.log('\n━━━ RESUMO DA EQUIPE ━━━')
  const totalContas = opStats.reduce((s, o) => s + o.contasTotais, 0)
  const totalDiasOp = opStats.reduce((s, o) => s + o.diasAtivos, 0)
  const opAtivos = opStats.filter(o => o.diasAtivos > 0).length
  console.log('  Operadores que ja registraram remessa: ' + opAtivos + ' de ' + opStats.length)
  console.log('  Total contas processadas pela equipe: ' + totalContas)
  console.log('  Media de C/dia (entre operadores ativos): ' + Math.round(opStats.filter(o => o.diasAtivos > 0).reduce((s, o) => s + o.mediaContasDia, 0) / opAtivos))
  console.log('  Top 3 operadores juntos: ' + opStats.slice(0, 3).reduce((s, o) => s + o.contasTotais, 0) + ' contas (' + Math.round(opStats.slice(0, 3).reduce((s, o) => s + o.contasTotais, 0) / totalContas * 100) + '% do total)')
}

main().catch(console.error)
