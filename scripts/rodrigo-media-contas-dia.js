// Media de contas/dia por operador no ultimo mes
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
  // ultimos 30 dias
  const now = new Date()
  const start = new Date(now.getTime() - 30 * 86400000)
  const totalDiasJanela = 30
  const dayKey = d => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const { data: p } = await sb.from('profiles').select('*').eq('email', 'rmrodrigomribeiro@gmail.com').maybeSingle()
  const ops = await fetchAll('profiles', '*', { tenant_id: p.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o]))

  const allMetas = await fetchAll('metas', '*', { tenant_id: p.tenant_id })
  const metaMap = new Map(allMetas.filter(m => !m.deleted_at).map(m => [m.id, m]))

  const allRem = await fetchAll('remessas', '*')
  const rem = allRem.filter(r => {
    if (!metaMap.has(r.meta_id)) return false
    return new Date(r.created_at) >= start
  })

  // Por operador: total contas + dias unicos com atividade
  const byOp = new Map()
  for (const r of rem) {
    const m = metaMap.get(r.meta_id)
    if (!m?.operator_id) continue
    if (!byOp.has(m.operator_id)) byOp.set(m.operator_id, { contas: 0, rem: 0, dias: new Set() })
    const s = byOp.get(m.operator_id)
    s.contas += Number(r.contas_remessa || 0)
    s.rem++
    s.dias.add(dayKey(r.created_at))
  }

  // Operadores que foram cadastrados DEPOIS do inicio da janela: ajusta total de dias possiveis
  const stats = []
  for (const [opId, s] of byOp.entries()) {
    const op = opMap.get(opId)
    const nome = op?.nome || op?.email?.split('@')[0] || '? (sem perfil)'
    const cadastro = op?.created_at ? new Date(op.created_at) : null
    const diasDisponiveis = cadastro && cadastro > start
      ? Math.max(1, Math.ceil((now - cadastro) / 86400000))
      : totalDiasJanela
    stats.push({
      nome,
      contas: s.contas,
      remessas: s.rem,
      diasAtivos: s.dias.size,
      diasDisponiveis,
      mediaContasPorDia: s.contas / totalDiasJanela,
      mediaContasPorDiaAtivo: s.contas / s.dias.size,
    })
  }

  stats.sort((a, b) => b.mediaContasPorDia - a.mediaContasPorDia)

  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('MEDIA DE CONTAS/DIA POR OPERADOR · ULTIMOS 30 DIAS')
  console.log('(' + start.toLocaleDateString('pt-BR') + ' → ' + now.toLocaleDateString('pt-BR') + ')')
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('')
  console.log('Operador'.padEnd(26) + ' · Contas · Rem  · DiasAtivos · Média/dia (janela) · Média/dia (ativos)')
  console.log('─'.repeat(115))
  for (const s of stats) {
    console.log(
      s.nome.padEnd(26).slice(0, 26) + ' · ' +
      s.contas.toString().padStart(5) + ' · ' +
      s.remessas.toString().padStart(4) + ' · ' +
      (s.diasAtivos + '/' + s.diasDisponiveis).padStart(8) + '   · ' +
      s.mediaContasPorDia.toFixed(1).padStart(6) + ' contas/d      · ' +
      s.mediaContasPorDiaAtivo.toFixed(1).padStart(6) + ' contas/d'
    )
  }

  // Inativos (cadastrados como operador mas sem remessas no mes)
  const ativosIds = new Set(byOp.keys())
  const inativos = ops.filter(o => !ativosIds.has(o.id))
  if (inativos.length > 0) {
    console.log('')
    console.log('━━━ INATIVOS NOS 30 DIAS (sem nenhuma remessa) ━━━')
    for (const o of inativos) {
      const last = o.last_seen_at ? new Date(o.last_seen_at).toLocaleDateString('pt-BR') : 'nunca'
      console.log('  · ' + (o.nome || o.email.split('@')[0]).padEnd(24).slice(0, 24) + ' · ult acesso ' + last)
    }
  }

  // Totais da equipe
  const totalContas = stats.reduce((s, x) => s + x.contas, 0)
  const totalRem = stats.reduce((s, x) => s + x.remessas, 0)
  console.log('')
  console.log('━━━ TOTAL DA EQUIPE NO MES ━━━')
  console.log('  Operadores ativos: ' + stats.length + ' / ' + ops.length + ' cadastrados')
  console.log('  Total contas processadas: ' + totalContas)
  console.log('  Total remessas: ' + totalRem)
  console.log('  Media contas/dia equipe inteira: ' + (totalContas / totalDiasJanela).toFixed(0))
  console.log('  Media contas/dia por operador ativo: ' + (totalContas / stats.length / totalDiasJanela).toFixed(1))
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
