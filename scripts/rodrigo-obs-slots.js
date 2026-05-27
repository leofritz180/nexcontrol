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
  const now = new Date()
  const start = new Date(now.getTime() - 4 * 86400000)

  const { data: p } = await sb.from('profiles').select('id,tenant_id').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const ops = await fetchAll('profiles', 'id,nome,email', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  const allMetas = await fetchAll('metas', 'id,operator_id,deleted_at,tenant_id', { tenant_id: p.tenant_id })
  const metaMap = new Map(allMetas.filter(m => !m.deleted_at).map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', 'meta_id,observacoes,created_at,contas_remessa,lucro,prejuizo,bau')
  const rem = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    return new Date(r.created_at) >= start
  })

  // Termos de slot pra procurar
  const SLOT_TERMS = [
    'fortune', 'tiger', 'ox', 'rabbit', 'mouse', 'gem', 'gems',
    'panda', 'pig', 'porco', 'santa', 'sweet', 'bonanza',
    'gates', 'olympus', 'zeus', 'aztec', 'gold', 'mahjong',
    'sugar', 'rush', 'fire', 'starlight', 'princess', 'wild',
    'crazy', 'aviator', 'mines', 'mina', 'spaceman', 'galo',
    'rooster', 'dragon', 'phoenix', 'wolf', 'lion', 'tigre',
    'queen', 'king', 'midas', 'rio', 'samba', 'magnum',
    'reels', 'pyramid', 'jewel', 'bonus buy', 'pgsoft', 'pg soft',
    'pragmatic', 'rtp', 'cassino', 'casino', 'roleta', 'blackjack',
    'baccarat', 'mascot', 'demo', 'leprechaun', 'magic', 'wizard',
  ]

  // Filtra remessas com observacao + termo
  const found = []
  for (const r of rem) {
    if (!r.observacoes || r.observacoes.trim().length < 3) continue
    const lower = r.observacoes.toLowerCase()
    const matches = SLOT_TERMS.filter(t => lower.includes(t))
    if (matches.length > 0) {
      const m = metaMap.get(r.meta_id)
      found.push({
        opNome: opMap.get(m?.operator_id) || '?',
        obs: r.observacoes.trim(),
        matches,
        contas: r.contas_remessa,
        lucro: r.lucro,
        prej: r.prejuizo,
        bau: r.bau,
        when: r.created_at,
      })
    }
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('OBSERVAÇÕES RODRIGO · ULTIMOS 4 DIAS')
  console.log('Total remessas no periodo:        ' + rem.length)
  console.log('Com observação preenchida:        ' + rem.filter(r => r.observacoes && r.observacoes.trim().length >= 3).length)
  console.log('Com termo relacionado a slot:     ' + found.length)
  console.log('═══════════════════════════════════════════════════════════════')

  if (found.length > 0) {
    // Contagem de termos
    const termCount = {}
    for (const f of found) for (const t of f.matches) termCount[t] = (termCount[t] || 0) + 1
    console.log('\n━━━ TERMOS MAIS COMUNS ━━━')
    for (const [t, c] of Object.entries(termCount).sort((a, b) => b[1] - a[1])) {
      console.log('  · ' + t.padEnd(15) + ' · ' + c + ' menções')
    }

    console.log('\n━━━ AMOSTRA (até 40) ━━━')
    for (const f of found.slice(0, 40)) {
      console.log('  [' + f.opNome.slice(0, 14).padEnd(14) + '] ' + f.obs.slice(0, 100))
    }
  }

  // Tambem mostra TODAS observacoes longas pra ter contexto
  console.log('\n━━━ AMOSTRA GERAL DE OBSERVAÇÕES (não só slot) ━━━')
  const todasObs = rem.filter(r => r.observacoes && r.observacoes.trim().length >= 5)
  // Mistura aleatoria pra pegar amostra variada
  const shuffled = todasObs.sort(() => Math.random() - 0.5).slice(0, 30)
  for (const r of shuffled) {
    const m = metaMap.get(r.meta_id)
    const opNome = opMap.get(m?.operator_id) || '?'
    console.log('  [' + opNome.slice(0, 14).padEnd(14) + '] ' + r.observacoes.trim().slice(0, 100))
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
