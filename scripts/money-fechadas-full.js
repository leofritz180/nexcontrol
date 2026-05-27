require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
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
  const TENANT = 'a69b4ff0-aaa5-47e4-ad14-749e24e51e1f'

  // Todas as metas (incluindo deletadas) deste tenant
  const { data: allMetas } = await sb.from('metas').select('*').eq('tenant_id', TENANT)
  const fechadas = allMetas.filter(m => m.status_fechamento === 'fechada')
  const ativasNaoFechadas = allMetas.filter(m => m.status_fechamento !== 'fechada' && !m.deleted_at)
  const deletadas = allMetas.filter(m => m.deleted_at)

  // Todas remessas (vinculadas a metas deste tenant)
  const allMetaIds = allMetas.map(m => m.id)
  let allRem = []
  if (allMetaIds.length > 0) {
    const remResp = await sb.from('remessas').select('*').in('meta_id', allMetaIds)
    allRem = remResp.data || []
  }

  // Operadores
  const { data: ops } = await sb.from('profiles').select('id,nome,email').eq('tenant_id', TENANT).eq('role', 'operator')
  const opMap = new Map(ops.map(o => [o.id, o.nome || o.email.split('@')[0]]))

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('OPERACAO MONEY · TUDO SOBRE METAS FECHADAS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Total metas no tenant:    ' + allMetas.length)
  console.log('  FECHADAS:                ' + fechadas.length + ' (todas deletadas em 26/05 08:35)')
  console.log('  Em andamento (ativas):   ' + ativasNaoFechadas.length)
  console.log('  Outras deletadas:        ' + (deletadas.length - fechadas.filter(f => f.deleted_at).length))
  console.log('')

  // ━━━ DETALHE DAS FECHADAS ━━━
  console.log('━━━ DETALHE DE CADA META FECHADA ━━━')
  let acumLucro = 0, acumSalario = 0, acumBau = 0, acumContas = 0
  let acumDep = 0, acumSaq = 0, acumLucroRem = 0, acumPrejRem = 0, acumBauRem = 0
  let acumRem = 0

  for (const m of fechadas.sort((a, b) => new Date(a.fechada_em || a.updated_at) - new Date(b.fechada_em || b.updated_at))) {
    const opName = opMap.get(m.operator_id) || m.operator_id?.slice(0, 8) || '?'
    const myRem = allRem.filter(r => r.meta_id === m.id)
    const dep = myRem.reduce((s, r) => s + Number(r.deposito || 0), 0)
    const saq = myRem.reduce((s, r) => s + Number(r.saque || 0), 0)
    const lucroR = myRem.reduce((s, r) => s + Number(r.lucro || 0), 0)
    const prejR = myRem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
    const bauR = myRem.reduce((s, r) => s + Number(r.bau || 0), 0)
    const contasRealizadas = myRem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)

    console.log('')
    console.log('  📌 ' + (m.titulo || '?') + ' (' + m.rede + ') · op ' + opName)
    console.log('     Alvo: ' + m.quantidade_contas + ' contas · Realizadas: ' + contasRealizadas + ' · Remessas: ' + myRem.length)
    console.log('     Fechada: ' + fmt(m.fechada_em || m.updated_at))
    console.log('     ─ REMESSAS ─')
    console.log('       Depositado:  R$ ' + fmtR(dep))
    console.log('       Sacado:      R$ ' + fmtR(saq))
    console.log('       Diff saq-dep: R$ ' + fmtR(saq - dep))
    console.log('       Lucro rem:   R$ ' + fmtR(lucroR))
    console.log('       Prejuizo:    R$ ' + fmtR(prejR))
    console.log('       BAU remessa: R$ ' + fmtR(bauR))
    console.log('     ─ FECHAMENTO ─')
    console.log('       Salario:     R$ ' + fmtR(m.salario))
    console.log('       BAU:         R$ ' + fmtR(m.bau))
    console.log('       Custo fixo:  R$ ' + fmtR(m.custo_fixo))
    console.log('       Taxa agente: R$ ' + fmtR(m.taxa_agente))
    console.log('       LUCRO FINAL: R$ ' + fmtR(m.lucro_final))

    acumLucro += Number(m.lucro_final || 0)
    acumSalario += Number(m.salario || 0)
    acumBau += Number(m.bau || 0)
    acumContas += Number(m.quantidade_contas || 0)
    acumDep += dep
    acumSaq += saq
    acumLucroRem += lucroR
    acumPrejRem += prejR
    acumBauRem += bauR
    acumRem += myRem.length
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('CONSOLIDADO DAS 8 METAS FECHADAS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Total contas (alvo):           ' + acumContas)
  console.log('Total remessas:                ' + acumRem)
  console.log('')
  console.log('Depositado total:              R$ ' + fmtR(acumDep))
  console.log('Sacado total:                  R$ ' + fmtR(acumSaq))
  console.log('PERDA NO SAQUE (sem BAU):      R$ ' + fmtR(acumDep - acumSaq))
  console.log('Lucro remessas:                R$ ' + fmtR(acumLucroRem))
  console.log('Prejuizo remessas:             R$ ' + fmtR(acumPrejRem))
  console.log('BAU registrado (remessas):     R$ ' + fmtR(acumBauRem))
  console.log('')
  console.log('Salario fechamento:            R$ ' + fmtR(acumSalario))
  console.log('BAU fechamento:                R$ ' + fmtR(acumBau))
  console.log('')
  console.log('🎯 LUCRO FINAL (Sheik):        R$ ' + fmtR(acumLucro))

  console.log('')
  console.log('━━━ MÉDIAS ━━━')
  console.log('  Contas por meta:             ' + (acumContas / fechadas.length).toFixed(1))
  console.log('  Remessas por meta:           ' + (acumRem / fechadas.length).toFixed(1))
  console.log('  Contas por remessa:          ' + (acumContas / acumRem).toFixed(1) + ' (alvo) · realizadas: ' + ((acumLucroRem + acumPrejRem > 0) ? '...' : ''))
  console.log('  Depósito médio por meta:     R$ ' + fmtR(acumDep / fechadas.length))
  console.log('  Depósito médio por remessa:  R$ ' + fmtR(acumDep / acumRem))
  console.log('  Depósito médio por conta:    R$ ' + fmtR(acumDep / acumContas))
  console.log('  Saque médio por meta:        R$ ' + fmtR(acumSaq / fechadas.length))
  console.log('  Saque médio por remessa:     R$ ' + fmtR(acumSaq / acumRem))
  console.log('  RTP:                         ' + (acumSaq / acumDep * 100).toFixed(2) + '%')

  // Distribuicao contas por remessa
  const remFechadas = allRem.filter(r => fechadas.some(f => f.id === r.meta_id))
  console.log('')
  console.log('━━━ DISTRIBUIÇÃO CONTAS/REMESSA ━━━')
  const distRem = {}
  for (const r of remFechadas) {
    const c = Number(r.contas_remessa || 0)
    distRem[c] = (distRem[c] || 0) + 1
  }
  for (const [c, count] of Object.entries(distRem).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log('  ' + c.toString().padStart(3) + ' contas → ' + count + ' remessas (' + (count / remFechadas.length * 100).toFixed(1) + '%)')
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
