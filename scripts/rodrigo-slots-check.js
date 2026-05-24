require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

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
  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const ops = await fetchAll('profiles', '*', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metaMap = new Map(allMetas.filter(m => !m.deleted_at).map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', '*')

  // Ultimos 30 dias
  const now = new Date()
  const start = new Date(now.getTime() - 30 * 86400000)
  const rem30 = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    return new Date(r.created_at) >= start
  })

  // Total geral (historico)
  const remTotal = allRem.filter(r => metaMap.has(r.meta_id))

  console.log('═══════════════════════════════════════════════════════')
  console.log('REGISTRO DE SLOT_NAME NAS REMESSAS DO RODRIGO')
  console.log('═══════════════════════════════════════════════════════')

  function stats(arr, label) {
    const comSlot = arr.filter(r => r.slot_name && r.slot_name.trim().length > 0)
    const semSlot = arr.length - comSlot.length
    const pct = arr.length > 0 ? (comSlot.length / arr.length * 100).toFixed(1) : '0'
    console.log('')
    console.log('━━━ ' + label + ' (' + arr.length + ' remessas) ━━━')
    console.log('  COM slot_name registrado: ' + comSlot.length + ' (' + pct + '%)')
    console.log('  SEM slot_name:            ' + semSlot + ' (' + (100 - Number(pct)).toFixed(1) + '%)')
    return comSlot
  }

  stats(remTotal, 'HISTORICO TOTAL')
  const com30 = stats(rem30, 'ULTIMOS 30 DIAS')

  // Por operador (ultimos 30d)
  console.log('')
  console.log('━━━ POR OPERADOR (ultimos 30d) — quem marca slot? ━━━')
  const byOp = new Map()
  for (const r of rem30) {
    const m = metaMap.get(r.meta_id)
    if (!m?.operator_id) continue
    if (!byOp.has(m.operator_id)) byOp.set(m.operator_id, { com: 0, sem: 0 })
    const s = byOp.get(m.operator_id)
    if (r.slot_name && r.slot_name.trim()) s.com++
    else s.sem++
  }

  const opStats = [...byOp.entries()]
    .map(([id, s]) => ({
      nome: opMap.get(id) || '? (sem perfil)',
      com: s.com, sem: s.sem,
      total: s.com + s.sem,
      pct: (s.com + s.sem) > 0 ? (s.com / (s.com + s.sem) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)

  console.log('  Operador                   · Total · Com slot · Sem slot · % preenchido')
  console.log('  ' + '─'.repeat(85))
  for (const s of opStats) {
    console.log(
      '  ' + s.nome.padEnd(26).slice(0, 26) + ' · ' +
      s.total.toString().padStart(4) + ' · ' +
      s.com.toString().padStart(7) + ' · ' +
      s.sem.toString().padStart(7) + ' · ' +
      s.pct.toFixed(1).padStart(6) + '%'
    )
  }

  // Slots mais usados (quando registram)
  if (com30.length > 0) {
    const slotCount = {}
    for (const r of com30) {
      slotCount[r.slot_name] = (slotCount[r.slot_name] || 0) + 1
    }
    const top = Object.entries(slotCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
    console.log('')
    console.log('━━━ TOP 15 SLOTS QUANDO REGISTRAM (ultimos 30d) ━━━')
    for (const [name, count] of top) {
      console.log('  ' + name.padEnd(30).slice(0, 30) + ' · ' + count + ' rem')
    }
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
