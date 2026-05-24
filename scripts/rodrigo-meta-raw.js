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
  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const fechadas = allMetas.filter(m => {
    if (m.deleted_at) return false
    if (m.status_fechamento !== 'fechada') return false
    const tm = new Date(m.updated_at || m.created_at)
    return tm >= start && tm <= end
  })

  console.log('Total metas fechadas no periodo: ' + fechadas.length)
  console.log('')
  console.log('=== TODOS OS CAMPOS DA PRIMEIRA META FECHADA ===')
  console.log(JSON.stringify(fechadas[0], null, 2))
  console.log('')
  console.log('=== AMOSTRA: lucro_final + modelo + key fields de 5 metas ===')
  for (const m of fechadas.slice(0, 5)) {
    console.log({
      id_short: String(m.id).slice(0, 8),
      rede: m.rede,
      modelo_remuneracao: m.modelo_remuneracao,
      operation_model: m.operation_model,
      quantidade_contas: m.quantidade_contas,
      salario: m.salario,
      bau: m.bau,
      custo_fixo: m.custo_fixo,
      taxa_agente: m.taxa_agente,
      valor_por_depositante: m.valor_por_depositante,
      percentual_operador: m.percentual_operador,
      resultado_admin: m.resultado_admin,
      resultado_operador: m.resultado_operador,
      lucro_final: m.lucro_final,
    })
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
