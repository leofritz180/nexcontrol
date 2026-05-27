require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)

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
  const ops = await fetchAll('profiles', 'id,nome,email,last_seen_at', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metas = allMetas.filter(m => !m.deleted_at)
  const metaMap = new Map(metas.map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    return new Date(r.created_at) >= start
  })

  // Novas metas e fechadas
  const metasNovas = metas.filter(m => new Date(m.created_at) >= start)
  const metasFechadas = metas.filter(m => m.status_fechamento === 'fechada' && new Date(m.updated_at || m.created_at) >= start)

  const totalContas = rem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)
  const totalDep = rem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const totalSaq = rem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const totalLucro = rem.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const totalPrej = rem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalBau = rem.reduce((s, r) => s + Number(r.bau || 0), 0)
  const lucroFechadas = metasFechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0)

  console.log('═══════════════════════════════════════════════════════')
  console.log('OPERAÇÃO RODRIGO · ÚLTIMAS 24h')
  console.log('(' + fmt(start) + ' → ' + fmt(now) + ')')
  console.log('═══════════════════════════════════════════════════════')

  console.log('\n━━━ RESUMO ━━━')
  console.log('  Remessas:           ' + rem.length)
  console.log('  Contas processadas: ' + totalContas)
  console.log('  Metas criadas:      ' + metasNovas.length)
  console.log('  Metas fechadas:     ' + metasFechadas.length)
  console.log('  Operadores ativos:  ' + new Set(rem.map(r => metaMap.get(r.meta_id)?.operator_id).filter(Boolean)).size + '/' + ops.length)

  console.log('\n━━━ FINANCEIRO ━━━')
  console.log('  Depositado:         R$ ' + fmtR(totalDep))
  console.log('  Sacado:             R$ ' + fmtR(totalSaq))
  console.log('  Perda no saque:     R$ ' + fmtR(totalSaq - totalDep))
  console.log('  Lucro remessas:     R$ ' + fmtR(totalLucro))
  console.log('  Prejuizo remessas:  R$ ' + fmtR(totalPrej))
  console.log('  BAU registrado:     R$ ' + fmtR(totalBau))
  console.log('  Lucro final (fechadas): R$ ' + fmtR(lucroFechadas))

  // Por hora
  console.log('\n━━━ DISTRIBUIÇÃO POR HORA ━━━')
  const byHour = {}
  for (const r of rem) {
    const h = new Date(r.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).slice(0, 2)
    if (!byHour[h]) byHour[h] = { rem: 0, contas: 0 }
    byHour[h].rem++
    byHour[h].contas += Number(r.contas_remessa || 0)
  }
  for (const [h, v] of Object.entries(byHour).sort()) {
    const bar = '█'.repeat(Math.min(40, Math.ceil(v.rem / 2)))
    console.log('  ' + h + 'h · ' + v.rem.toString().padStart(3) + ' rem · ' + v.contas.toString().padStart(3) + ' contas ' + bar)
  }

  // Top operadores
  const byOp = new Map()
  for (const r of rem) {
    const m = metaMap.get(r.meta_id)
    if (!m?.operator_id) continue
    if (!byOp.has(m.operator_id)) byOp.set(m.operator_id, { rem: 0, contas: 0, lucro: 0, prej: 0, bau: 0, ultima: r.created_at })
    const s = byOp.get(m.operator_id)
    s.rem++
    s.contas += Number(r.contas_remessa || 0)
    s.lucro += Number(r.lucro || 0)
    s.prej += Number(r.prejuizo || 0)
    s.bau += Number(r.bau || 0)
    if (new Date(r.created_at) > new Date(s.ultima)) s.ultima = r.created_at
  }
  const ranking = [...byOp.entries()]
    .map(([id, s]) => ({ id, nome: opMap.get(id) || '?', ...s, liq: s.lucro - s.prej + s.bau }))
    .sort((a, b) => b.contas - a.contas)

  console.log('\n━━━ POR OPERADOR ━━━')
  for (let i = 0; i < ranking.length; i++) {
    const r = ranking[i]
    console.log(
      '  ' + (i + 1).toString().padStart(2) + '. ' + r.nome.padEnd(24).slice(0, 24) +
      ' · ' + r.rem.toString().padStart(3) + ' rem' +
      ' · ' + r.contas.toString().padStart(4) + ' contas' +
      ' · liq R$' + fmtR(r.liq).padStart(8) +
      ' · ult ' + fmt(r.ultima)
    )
  }

  // Inativos
  const activeIds = new Set(byOp.keys())
  const inactive = ops.filter(o => !activeIds.has(o.id))
  if (inactive.length > 0) {
    console.log('\n━━━ INATIVOS NAS 24h (' + inactive.length + ') ━━━')
    for (const o of inactive) {
      const last = o.last_seen_at ? fmt(o.last_seen_at) : 'nunca'
      console.log('  · ' + (o.nome || o.email.split('@')[0]).padEnd(24).slice(0, 24) + ' · ult acesso ' + last)
    }
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
