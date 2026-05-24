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
  const metaIds = new Set(allMetas.filter(m => !m.deleted_at).map(m => m.id))

  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaIds.has(r.meta_id)) return false
    const t = new Date(r.created_at)
    return t >= start && t <= end
  })

  const total = rem.length
  const totalDep = rem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const totalSaq = rem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const totalLucroRem = rem.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const totalPrejRem = rem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalContas = rem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)

  console.log('═══════════════════════════════════════════════════════')
  console.log('MEDIAS DEP/SAQ POR REMESSA · RODRIGO 21-24/05')
  console.log('═══════════════════════════════════════════════════════')
  console.log('Total remessas: ' + total)
  console.log('Total contas: ' + totalContas)
  console.log('')

  console.log('━━━ POR REMESSA ━━━')
  console.log('  Deposito medio: R$ ' + fmtR(totalDep / total))
  console.log('  Saque medio:    R$ ' + fmtR(totalSaq / total))
  console.log('  Diferenca media (saq-dep): R$ ' + fmtR((totalSaq - totalDep) / total))
  console.log('  Lucro medio (campo lucro): R$ ' + fmtR(totalLucroRem / total))
  console.log('  Prejuizo medio (campo prej): R$ ' + fmtR(totalPrejRem / total))
  console.log('')

  console.log('━━━ POR CONTA (depositante) ━━━')
  console.log('  Deposito medio/conta: R$ ' + fmtR(totalDep / totalContas))
  console.log('  Saque medio/conta:    R$ ' + fmtR(totalSaq / totalContas))
  console.log('  Diferenca/conta:      R$ ' + fmtR((totalSaq - totalDep) / totalContas))
  console.log('')

  console.log('━━━ TOTAIS AGREGADOS ━━━')
  console.log('  Total depositado:  R$ ' + fmtR(totalDep))
  console.log('  Total sacado:      R$ ' + fmtR(totalSaq))
  console.log('  Saldo bruto (saq-dep): R$ ' + fmtR(totalSaq - totalDep))
  console.log('  Soma campo lucro:  R$ ' + fmtR(totalLucroRem))
  console.log('  Soma campo prej:   R$ ' + fmtR(totalPrejRem))
  console.log('  Resultado liquido (lucro-prej): R$ ' + fmtR(totalLucroRem - totalPrejRem))
  console.log('')

  // Distribuicao de resultados por remessa (positivos vs negativos)
  const positivas = rem.filter(r => Number(r.lucro || 0) > 0)
  const negativas = rem.filter(r => Number(r.prejuizo || 0) > 0)
  const neutras = rem.filter(r => !Number(r.lucro || 0) && !Number(r.prejuizo || 0))
  console.log('━━━ DISTRIBUIÇÃO DE RESULTADOS ━━━')
  console.log('  Remessas com LUCRO:    ' + positivas.length + ' (' + (positivas.length/total*100).toFixed(1) + '%)')
  console.log('  Remessas com PREJUIZO: ' + negativas.length + ' (' + (negativas.length/total*100).toFixed(1) + '%)')
  console.log('  Remessas neutras:      ' + neutras.length + ' (' + (neutras.length/total*100).toFixed(1) + '%)')
  console.log('  Taxa de remessas positivas: ' + (positivas.length / (positivas.length + negativas.length) * 100).toFixed(1) + '%')
  console.log('')

  // Quando der prejuizo, quanto eh em media?
  if (negativas.length > 0) {
    const avgPrej = negativas.reduce((s, r) => s + Number(r.prejuizo || 0), 0) / negativas.length
    const avgPrejDep = negativas.reduce((s, r) => s + Number(r.deposito || 0), 0) / negativas.length
    const avgPrejSaq = negativas.reduce((s, r) => s + Number(r.saque || 0), 0) / negativas.length
    console.log('  Quando perde — prejuizo medio: R$ ' + fmtR(avgPrej))
    console.log('  Quando perde — dep medio: R$ ' + fmtR(avgPrejDep) + ' · saq medio: R$ ' + fmtR(avgPrejSaq))
  }
  if (positivas.length > 0) {
    const avgLucro = positivas.reduce((s, r) => s + Number(r.lucro || 0), 0) / positivas.length
    const avgLucroDep = positivas.reduce((s, r) => s + Number(r.deposito || 0), 0) / positivas.length
    const avgLucroSaq = positivas.reduce((s, r) => s + Number(r.saque || 0), 0) / positivas.length
    console.log('  Quando ganha — lucro medio: R$ ' + fmtR(avgLucro))
    console.log('  Quando ganha — dep medio: R$ ' + fmtR(avgLucroDep) + ' · saq medio: R$ ' + fmtR(avgLucroSaq))
  }
  console.log('')

  // RTP global (return to player)
  const rtp = (totalSaq / totalDep * 100).toFixed(2)
  console.log('━━━ RTP DA OPERACAO ━━━')
  console.log('  RTP (saque/deposito): ' + rtp + '%')
  console.log('  (RTP > 100% = perde dinheiro nas remessas, < 100% = ganha)')
  console.log('  Margem do admin (1 - saq/dep): ' + (100 - Number(rtp)).toFixed(2) + '%')
  console.log('')
  console.log('  Pela conta dele paga R$' + (totalDep/totalContas).toFixed(2) + ' em deposito por conta')
  console.log('  Saca em media R$' + (totalSaq/totalContas).toFixed(2) + ' por conta')
  console.log('  Perde R$' + ((totalSaq-totalDep)/totalContas).toFixed(2) + ' por conta em SAQUE (saq > dep significa perda)')
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
