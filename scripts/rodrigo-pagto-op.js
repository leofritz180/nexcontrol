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
  const start = new Date('2026-05-21T00:00:00-03:00')
  const end = new Date('2026-05-24T23:59:59-03:00')

  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const { data: t } = await sb.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle()

  console.log('═══════════════════════════════════════════════════════════')
  console.log('CONFIG DE PAGAMENTO · RODRIGO')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('Modelo operacao padrao:    ' + (t.operation_model || 'salario_bau'))
  console.log('Modelo pagto operador:     ' + (t.operator_payment_model || 'fixo_por_depositante'))
  console.log('Valor pagto operador:      R$ ' + fmtR(t.operator_payment_value || 0) + ' (por conta)')
  console.log('')

  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metas = allMetas.filter(m => !m.deleted_at)
  const metaMap = new Map(metas.map(m => [m.id, m]))

  // Metas fechadas no periodo
  const fechadas = metas.filter(m => {
    if (m.status_fechamento !== 'fechada') return false
    const tm = new Date(m.updated_at || m.created_at)
    return tm >= start && tm <= end
  })

  // Modelos das metas fechadas
  const byModel = {}
  for (const m of fechadas) {
    const mo = m.modelo_remuneracao || 'fixo_por_depositante'
    byModel[mo] = (byModel[mo] || 0) + 1
  }
  console.log('METAS FECHADAS (' + fechadas.length + ') · modelos:')
  for (const [k, v] of Object.entries(byModel)) console.log('  ' + k + ': ' + v)
  console.log('')

  // Calcular: por meta fechada, quanto foi pago ao op e quanto ficou pro admin
  let totalSalario = 0
  let totalBau = 0
  let totalCustoFixo = 0
  let totalTaxaAgente = 0
  let totalResultadoRem = 0
  let totalLucroFinal = 0
  let totalPagamentoOperador = 0
  let totalContas = 0
  let totalResultadoAdmin = 0
  let totalResultadoOperador = 0

  for (const m of fechadas) {
    totalSalario += Number(m.salario || 0)
    totalBau += Number(m.bau || 0)
    totalCustoFixo += Number(m.custo_fixo || 0)
    totalTaxaAgente += Number(m.taxa_agente || 0)
    totalLucroFinal += Number(m.lucro_final || 0)
    totalContas += Number(m.quantidade_contas || 0)
    totalResultadoAdmin += Number(m.resultado_admin || 0)
    totalResultadoOperador += Number(m.resultado_operador || 0)

    // Pagamento por modelo
    const modelo = m.modelo_remuneracao || t.operator_payment_model || 'fixo_por_depositante'
    if (modelo === 'fixo_por_depositante') {
      const valorPorDep = Number(m.valor_por_depositante || t.operator_payment_value || 0)
      totalPagamentoOperador += valorPorDep * Number(m.quantidade_contas || 0)
    } else if (modelo === 'percentual_lucro') {
      const pct = Number(m.percentual_operador || 0) / 100
      totalPagamentoOperador += Number(m.lucro_final || 0) * pct
    }
  }

  console.log('━━━ TOTAIS DAS METAS FECHADAS NO PERIODO ━━━')
  console.log('  Quantidade contas:      ' + totalContas)
  console.log('  Soma SALARIO:          R$ ' + fmtR(totalSalario))
  console.log('  Soma BAU:              R$ ' + fmtR(totalBau))
  console.log('  Soma CUSTO_FIXO:       R$ ' + fmtR(totalCustoFixo))
  console.log('  Soma TAXA_AGENTE:      R$ ' + fmtR(totalTaxaAgente))
  console.log('  Soma RESULTADO_ADMIN:  R$ ' + fmtR(totalResultadoAdmin))
  console.log('  Soma RESULTADO_OPERADR:R$ ' + fmtR(totalResultadoOperador))
  console.log('')
  console.log('  → Pagamento estimado ao operador (fixo*contas): R$ ' + fmtR(totalPagamentoOperador))
  console.log('  → LUCRO FINAL do Rodrigo: R$ ' + fmtR(totalLucroFinal))
  console.log('')

  // Calculo da divisao
  const totalGerado = totalLucroFinal + totalPagamentoOperador
  if (totalGerado > 0) {
    const pctRodrigo = (totalLucroFinal / totalGerado * 100).toFixed(1)
    const pctOperador = (totalPagamentoOperador / totalGerado * 100).toFixed(1)
    console.log('━━━ DIVISAO APROXIMADA ━━━')
    console.log('  Total gerado (lucro_final + pagto_op): R$ ' + fmtR(totalGerado))
    console.log('  Rodrigo fica com: ' + pctRodrigo + '% (R$ ' + fmtR(totalLucroFinal) + ')')
    console.log('  Operadores ficam: ' + pctOperador + '% (R$ ' + fmtR(totalPagamentoOperador) + ')')
  }

  // Sample de meta pra ver os campos
  console.log('')
  console.log('━━━ SAMPLE DE 3 METAS FECHADAS ━━━')
  for (const m of fechadas.slice(0, 3)) {
    console.log('  Meta ' + m.id.slice(0, 8) + ' · rede ' + m.rede)
    console.log('    contas: ' + m.quantidade_contas + ' · modelo: ' + (m.modelo_remuneracao || '?'))
    console.log('    valor_por_dep: ' + (m.valor_por_depositante || '?') + ' · pct_op: ' + (m.percentual_operador || '?'))
    console.log('    salario: ' + (m.salario || 0) + ' · bau: ' + (m.bau || 0))
    console.log('    custo_fixo: ' + (m.custo_fixo || 0) + ' · taxa_agente: ' + (m.taxa_agente || 0))
    console.log('    lucro_final: ' + (m.lucro_final || 0) + ' · result_admin: ' + (m.resultado_admin || 0) + ' · result_op: ' + (m.resultado_operador || 0))
    console.log('')
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
