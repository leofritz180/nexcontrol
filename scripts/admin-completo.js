// Relatorio completo de um admin · INCLUI deletadas
// Uso: node scripts/admin-completo.js <email>
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmt = d => d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16) : '—'
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
  const email = process.argv[2]
  if (!email) { console.log('uso: node admin-completo.js <email>'); return }

  const { data: admin } = await sb.from('profiles').select('*').eq('email', email).maybeSingle()
  if (!admin) { console.log('admin nao encontrado: ' + email); return }
  if (admin.role !== 'admin') { console.log('atencao: ' + email + ' tem role=' + admin.role + ' (nao admin)') }

  const { data: tenant } = await sb.from('tenants').select('*').eq('id', admin.tenant_id).maybeSingle()
  const ops = await fetchAll('profiles', '*', { tenant_id: admin.tenant_id, role: 'operator' })
  const opMap = new Map(ops.map(o => [o.id, o]))
  opMap.set(admin.id, admin)

  // Metas — TODAS incluindo deletadas
  const allMetas = await fetchAll('metas', '*', { tenant_id: admin.tenant_id })
  const metaMap = new Map(allMetas.map(m => [m.id, m]))

  // Remessas
  const metaIds = allMetas.map(m => m.id)
  let allRem = []
  if (metaIds.length > 0) {
    for (let i = 0; i < metaIds.length; i += 200) {
      const chunk = metaIds.slice(i, i + 200)
      const { data } = await sb.from('remessas').select('*').in('meta_id', chunk)
      if (data) allRem = allRem.concat(data)
    }
  }

  // Pagamentos
  const { data: mp } = await sb.from('mp_payments').select('*').eq('tenant_id', admin.tenant_id).order('created_at', { ascending: false })
  const { data: ap } = await sb.from('asaas_payments').select('*').eq('tenant_id', admin.tenant_id).order('created_at', { ascending: false })
  const { data: subs } = await sb.from('subscriptions').select('*').eq('tenant_id', admin.tenant_id).order('created_at', { ascending: false })

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('OPERAÇÃO · ' + (admin.nome || '?') + ' (' + admin.email + ')')
  console.log('═══════════════════════════════════════════════════════════════')

  // ── IDENTIDADE
  console.log('\n━━━ IDENTIDADE ━━━')
  console.log('  Nome:                ' + (admin.nome || '?'))
  console.log('  Email:               ' + admin.email)
  console.log('  Role:                ' + admin.role)
  console.log('  Cadastro:            ' + fmt(admin.created_at))
  console.log('  Ultimo acesso:       ' + fmt(admin.last_seen_at))
  console.log('  is_pro:              ' + admin.is_pro)
  console.log('  pro_activated_at:    ' + fmt(admin.pro_activated_at))

  // ── TENANT
  console.log('\n━━━ TENANT ━━━')
  console.log('  Nome:                ' + (tenant?.name || '?'))
  console.log('  ID:                  ' + admin.tenant_id)
  console.log('  subscription_status: ' + tenant?.subscription_status)
  console.log('  trial_end:           ' + fmt(tenant?.trial_end))
  console.log('  operation_model:     ' + (tenant?.operation_model || 'salario_bau'))
  console.log('  pagto operador:      ' + (tenant?.operator_payment_model || '?') + ' = ' + (tenant?.operator_payment_value || 0))

  // ── PAGAMENTOS
  console.log('\n━━━ PAGAMENTOS (MP: ' + (mp?.length || 0) + ', Asaas: ' + (ap?.length || 0) + ') ━━━')
  for (const x of (mp || [])) console.log('  MP · R$ ' + fmtR(x.amount) + ' · ' + x.status + ' · plan=' + x.plan_months + 'm · ' + fmt(x.created_at))
  for (const x of (ap || [])) console.log('  Asaas · R$ ' + fmtR(x.amount) + ' · ' + x.status + ' · ' + fmt(x.created_at))
  const totalPago = [...(mp || []), ...(ap || [])]
    .filter(x => ['approved', 'RECEIVED', 'CONFIRMED'].includes(x.status))
    .reduce((s, x) => s + Number(x.amount || 0), 0)
  console.log('  TOTAL JÁ PAGO:       R$ ' + fmtR(totalPago))

  // ── SUBSCRIPTIONS
  console.log('\n━━━ SUBSCRIPTIONS (' + (subs?.length || 0) + ') ━━━')
  for (const s of (subs || [])) {
    console.log('  #' + s.id + ' · R$ ' + fmtR(s.total_amount) + ' · plan=' + s.plan_months + 'm · op=' + s.operator_count + ' · ' + s.status + ' · expira ' + fmt(s.expires_at))
  }

  // ── OPERADORES
  console.log('\n━━━ OPERADORES (' + ops.length + ') ━━━')
  for (const op of ops) {
    console.log('  · ' + (op.nome || '?').padEnd(28).slice(0, 28) + ' · ' + op.email.padEnd(40).slice(0, 40) + ' · ult acesso ' + fmt(op.last_seen_at))
  }

  // ── METAS (todas)
  console.log('\n━━━ METAS (' + allMetas.length + ' totais — INCLUI deletadas) ━━━')
  const ativas = allMetas.filter(m => !m.deleted_at && m.status_fechamento !== 'fechada')
  const fechadas = allMetas.filter(m => m.status_fechamento === 'fechada')
  const deletadas = allMetas.filter(m => m.deleted_at)
  console.log('  Em andamento (não deletadas, não fechadas): ' + ativas.length)
  console.log('  Fechadas (total): ' + fechadas.length)
  console.log('    Fechadas ativas (UI): ' + fechadas.filter(m => !m.deleted_at).length)
  console.log('    Fechadas DELETADAS:   ' + fechadas.filter(m => m.deleted_at).length)
  console.log('  Soft-deleted total: ' + deletadas.length)

  // Por rede
  const byRede = {}
  for (const m of allMetas) {
    const r = m.rede || '?'
    if (!byRede[r]) byRede[r] = { count: 0, contas: 0 }
    byRede[r].count++
    byRede[r].contas += Number(m.quantidade_contas || 0)
  }
  console.log('\n  Por rede:')
  for (const [r, v] of Object.entries(byRede).sort((a, b) => b[1].count - a[1].count)) {
    console.log('    ' + r.padEnd(8) + ' · ' + v.count + ' metas · ' + v.contas + ' contas alvo')
  }

  // ── FINANCEIRO DAS FECHADAS
  console.log('\n━━━ FECHADAS · DETALHE ━━━')
  let acumLucro = 0, acumSalario = 0, acumBau = 0, acumDep = 0, acumSaq = 0, acumLucroR = 0, acumPrejR = 0, acumBauR = 0
  let acumContas = 0, acumRem = 0
  for (const m of fechadas.sort((a, b) => new Date(a.fechada_em || a.updated_at) - new Date(b.fechada_em || b.updated_at))) {
    const opName = opMap.get(m.operator_id)?.nome || (m.operator_id ? m.operator_id.slice(0, 8) : '?')
    const myRem = allRem.filter(r => r.meta_id === m.id)
    const dep = myRem.reduce((s, r) => s + Number(r.deposito || 0), 0)
    const saq = myRem.reduce((s, r) => s + Number(r.saque || 0), 0)
    const lucroR = myRem.reduce((s, r) => s + Number(r.lucro || 0), 0)
    const prejR = myRem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
    const bauR = myRem.reduce((s, r) => s + Number(r.bau || 0), 0)
    const isDel = m.deleted_at ? ' 🗑️' : ''
    console.log('  · ' + (m.titulo || '?').padEnd(18).slice(0, 18) + ' (' + (m.rede || '?').padEnd(4) + ') · op ' + opName.padEnd(20).slice(0, 20) + ' · ' + m.quantidade_contas + ' contas · ' + myRem.length + ' rem · dep R$' + fmtR(dep) + ' · saq R$' + fmtR(saq) + ' · BAU R$' + fmtR(m.bau) + ' · LUCRO R$' + fmtR(m.lucro_final) + isDel)
    acumLucro += Number(m.lucro_final || 0)
    acumSalario += Number(m.salario || 0)
    acumBau += Number(m.bau || 0)
    acumContas += Number(m.quantidade_contas || 0)
    acumDep += dep
    acumSaq += saq
    acumLucroR += lucroR
    acumPrejR += prejR
    acumBauR += bauR
    acumRem += myRem.length
  }

  console.log('\n━━━ CONSOLIDADO DAS FECHADAS ━━━')
  console.log('  Total contas:        ' + acumContas)
  console.log('  Total remessas:      ' + acumRem)
  console.log('  Depositado:          R$ ' + fmtR(acumDep))
  console.log('  Sacado:              R$ ' + fmtR(acumSaq))
  console.log('  Perda no saque:      R$ ' + fmtR(acumDep - acumSaq))
  console.log('  Salario fechamento:  R$ ' + fmtR(acumSalario))
  console.log('  BAU fechamento:      R$ ' + fmtR(acumBau))
  console.log('  LUCRO FINAL TOTAL:   R$ ' + fmtR(acumLucro))
  if (acumDep > 0) console.log('  RTP:                 ' + (acumSaq / acumDep * 100).toFixed(2) + '%')
  if (acumRem > 0) console.log('  Médias: ' + (acumContas / fechadas.length).toFixed(1) + ' contas/meta · ' + (acumContas / acumRem).toFixed(1) + ' contas/rem · R$' + fmtR(acumDep / acumContas) + '/conta dep')

  // ── REMESSAS GERAL
  console.log('\n━━━ REMESSAS TOTAIS (' + allRem.length + ') ━━━')
  const dGeral = allRem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const sGeral = allRem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const lGeral = allRem.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const pGeral = allRem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const bGeral = allRem.reduce((s, r) => s + Number(r.bau || 0), 0)
  const cGeral = allRem.reduce((s, r) => s + Number(r.contas_remessa || 0), 0)
  console.log('  Total contas processadas: ' + cGeral)
  console.log('  Depositado:               R$ ' + fmtR(dGeral))
  console.log('  Sacado:                   R$ ' + fmtR(sGeral))
  console.log('  Lucro remessas:           R$ ' + fmtR(lGeral))
  console.log('  Prejuizo remessas:        R$ ' + fmtR(pGeral))
  console.log('  BAU registrado:           R$ ' + fmtR(bGeral))

  // Atividade ultimos 7d
  const d7 = new Date(Date.now() - 7 * 86400000)
  const rem7 = allRem.filter(r => new Date(r.created_at) >= d7)
  const metas7 = allMetas.filter(m => new Date(m.created_at) >= d7)
  console.log('\n━━━ ATIVIDADE ULTIMOS 7 DIAS ━━━')
  console.log('  Metas criadas:   ' + metas7.length)
  console.log('  Remessas:        ' + rem7.length)
  console.log('  Contas:          ' + rem7.reduce((s, r) => s + Number(r.contas_remessa || 0), 0))
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })
