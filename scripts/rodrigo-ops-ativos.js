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
  // ultimos 3 dias (22, 23, 24/05) — janela 72h voltando de agora
  const now = new Date()
  const start = new Date(now.getTime() - 3 * 86400000)

  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const ops = await fetchAll('profiles', '*', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metaMap = new Map(allMetas.filter(m => !m.deleted_at).map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', '*')
  const rem3d = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    return new Date(r.created_at) >= start
  })

  // Por operador (via meta.operator_id)
  const ativos = new Map() // opId -> { rem, contas, ultima }
  for (const r of rem3d) {
    const m = metaMap.get(r.meta_id)
    if (!m?.operator_id) continue
    if (!ativos.has(m.operator_id)) ativos.set(m.operator_id, { rem: 0, contas: 0, ultima: r.created_at })
    const s = ativos.get(m.operator_id)
    s.rem++
    s.contas += Number(r.contas_remessa || 0)
    if (new Date(r.created_at) > new Date(s.ultima)) s.ultima = r.created_at
  }

  console.log('═══════════════════════════════════════════════════')
  console.log('OPERADORES ATIVOS · ÚLTIMAS 72H (' + start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16) + ' → agora)')
  console.log('═══════════════════════════════════════════════════')
  console.log('Total operadores cadastrados: ' + ops.length)
  console.log('Operadores que registraram remessa nas ultimas 72h: ' + ativos.size)
  console.log('Inativos nas ultimas 72h: ' + (ops.length - ativos.size))
  console.log('')
  console.log('━━━ ATIVOS ━━━')
  const ranking = [...ativos.entries()]
    .map(([id, s]) => ({ id, nome: opMap.get(id) || '?', ...s }))
    .sort((a, b) => b.rem - a.rem)
  for (let i = 0; i < ranking.length; i++) {
    const r = ranking[i]
    const ultLocal = new Date(r.ultima).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
    console.log('  ' + (i+1).toString().padStart(2) + '. ' + r.nome.padEnd(24).slice(0, 24) + ' · ' + r.rem.toString().padStart(3) + ' rem · ' + r.contas.toString().padStart(4) + ' contas · ult ' + ultLocal)
  }

  // Inativos
  const ativosIds = new Set(ativos.keys())
  const inativos = ops.filter(o => !ativosIds.has(o.id))
  if (inativos.length > 0) {
    console.log('')
    console.log('━━━ INATIVOS (sem remessas nas 72h) ━━━')
    for (const o of inativos) {
      const last = o.last_seen_at ? new Date(o.last_seen_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16) : 'nunca logou'
      console.log('  · ' + (o.nome || o.email.split('@')[0]).padEnd(24).slice(0, 24) + ' · ult acesso ' + last)
    }
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
