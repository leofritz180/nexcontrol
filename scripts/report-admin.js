// Relatorio completo de um admin
// Uso: node scripts/report-admin.js <email>
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)
const fmtR = v => Number(v || 0).toFixed(2).replace('.', ',')

async function fetchAll(table, query) {
  const PAGE = 1000
  let all = []
  let from = 0
  while (true) {
    const { data } = await sb.from(table).select(query).range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  const email = process.argv[2] || 'rmrodrigomribeiro@gmail.com'
  const { data: p } = await sb.from('profiles').select('*').eq('email', email).maybeSingle()
  if (!p) { console.log('Admin nao encontrado: ' + email); return }

  console.log('═══════════════════════════════════════════════════')
  console.log('RELATORIO COMPLETO · ' + p.nome + ' (' + p.email + ')')
  console.log('═══════════════════════════════════════════════════')

  // 1. TENANT
  const { data: t } = await sb.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle()
  console.log('\n━ TENANT ━')
  console.log('  Nome:', t?.name)
  console.log('  ID:', p.tenant_id)
  console.log('  Cadastro:', fmt(p.created_at))
  console.log('  is_pro:', p.is_pro, '· pro_activated_at:', p.pro_activated_at ? fmt(p.pro_activated_at) : '—')
  console.log('  Subscription status:', t?.subscription_status)
  console.log('  Trial end:', t?.trial_end ? fmt(t.trial_end) : '—')
  console.log('  Modelo operacao padrao:', t?.operation_model || 'salario_bau')
  console.log('  Modelo pagto operador:', t?.operator_payment_model || 'fixo_dep')
  console.log('  Valor pagto operador:', t?.operator_payment_value || 0)
  console.log('  Favorite slots:', (t?.favorite_slots || []).join(', ') || '—')
  console.log('  Ultima atividade:', p.last_seen_at ? fmt(p.last_seen_at) : '—')

  // 2. SUBSCRIPTIONS
  const { data: subs } = await sb.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false })
  console.log('\n━ SUBSCRIPTIONS (' + (subs || []).length + ') ━')
  for (const s of subs || []) {
    console.log('  R$ ' + fmtR(s.total_amount) + ' · ' + s.operator_count + ' op · ' + s.payment_method + ' · ' + s.status + ' · vence ' + fmt(s.expires_at) + ' · criada ' + fmt(s.created_at))
  }

  // 3. PAGAMENTOS
  const { data: ap } = await sb.from('asaas_payments').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false })
  const { data: mp } = await sb.from('mp_payments').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false })
  console.log('\n━ PAGAMENTOS ━')
  console.log('  Asaas (' + (ap || []).length + '):')
  for (const pp of ap || []) console.log('    R$ ' + fmtR(pp.amount) + ' · ' + pp.status + ' · ' + fmt(pp.created_at))
  console.log('  MP (' + (mp || []).length + '):')
  for (const x of mp || []) console.log('    R$ ' + fmtR(x.amount) + ' · ' + x.status + ' · ' + fmt(x.created_at))
  const totalPago = [...(ap || []), ...(mp || [])].filter(x => ['RECEIVED', 'CONFIRMED', 'approved'].includes(x.status)).reduce((s, x) => s + Number(x.amount || 0), 0)
  console.log('  TOTAL JA PAGO: R$ ' + fmtR(totalPago))

  // 4. OPERADORES
  const { data: ops } = await sb.from('profiles').select('*').eq('tenant_id', p.tenant_id).eq('role', 'operator').order('created_at', { ascending: true })
  console.log('\n━ OPERADORES (' + (ops || []).length + ') ━')
  for (const op of ops || []) {
    const lastSeen = op.last_seen_at ? fmt(op.last_seen_at) : 'nunca'
    console.log('  ' + (op.nome || '?').padEnd(28).slice(0, 28) + ' · ' + op.email.padEnd(35).slice(0, 35) + ' · ult ' + lastSeen)
  }

  // 5. METAS
  const metas = await fetchAll('metas', '*')
  const myMetas = metas.filter(m => m.tenant_id === p.tenant_id && !m.deleted_at)
  console.log('\n━ METAS (' + myMetas.length + ' nao deletadas) ━')
  const ativas = myMetas.filter(m => m.status === 'ativa' || m.status === 'em_andamento')
  const finalizadas = myMetas.filter(m => m.status === 'finalizada' && m.status_fechamento !== 'fechada')
  const fechadas = myMetas.filter(m => m.status_fechamento === 'fechada')
  console.log('  Ativas: ' + ativas.length)
  console.log('  Finalizadas (aguardando fechamento): ' + finalizadas.length)
  console.log('  Fechadas: ' + fechadas.length)
  const apenasBau = myMetas.filter(m => m.operation_model === 'apenas_bau').length
  const salarioBau = myMetas.filter(m => m.operation_model === 'salario_bau' || !m.operation_model).length
  console.log('  Modelo apenas_bau: ' + apenasBau)
  console.log('  Modelo salario_bau: ' + salarioBau)

  // Por rede
  const byRede = {}
  for (const m of myMetas) {
    const r = m.rede || '?'
    if (!byRede[r]) byRede[r] = { count: 0, contas: 0, lucro: 0 }
    byRede[r].count++
    byRede[r].contas += Number(m.quantidade_contas || 0)
    byRede[r].lucro += Number(m.lucro_final || 0)
  }
  console.log('  Por rede:')
  for (const [r, v] of Object.entries(byRede).sort((a, b) => b[1].lucro - a[1].lucro)) {
    console.log('    ' + r.padEnd(10) + ' · ' + v.count + ' metas · ' + v.contas + ' contas · lucro R$ ' + fmtR(v.lucro))
  }

  // 6. FINANCEIRO
  const lucroTotal = fechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0)
  const contasTotais = fechadas.reduce((s, m) => s + Number(m.quantidade_contas || 0), 0)
  console.log('\n━ FINANCEIRO ━')
  console.log('  Lucro final acumulado (fechadas): R$ ' + fmtR(lucroTotal))
  console.log('  Total depositantes fechados: ' + contasTotais)
  console.log('  Lucro medio/conta: R$ ' + fmtR(contasTotais > 0 ? lucroTotal / contasTotais : 0))

  // 7. REMESSAS
  const metaIds = new Set(myMetas.map(m => m.id))
  const remessas = await fetchAll('remessas', '*')
  const myRem = remessas.filter(r => metaIds.has(r.meta_id))
  console.log('\n━ REMESSAS (' + myRem.length + ') ━')
  const totalDep = myRem.reduce((s, r) => s + Number(r.deposito || 0), 0)
  const totalSaq = myRem.reduce((s, r) => s + Number(r.saque || 0), 0)
  const totalLucroRem = myRem.reduce((s, r) => s + Number(r.lucro || 0), 0)
  const totalPrejRem = myRem.reduce((s, r) => s + Number(r.prejuizo || 0), 0)
  const totalBau = myRem.reduce((s, r) => s + Number(r.bau || 0), 0)
  console.log('  Total depositado: R$ ' + fmtR(totalDep))
  console.log('  Total sacado: R$ ' + fmtR(totalSaq))
  console.log('  Bruto (saque-dep): R$ ' + fmtR(totalSaq - totalDep))
  console.log('  Soma lucros: R$ ' + fmtR(totalLucroRem))
  console.log('  Soma prejuizos: R$ ' + fmtR(totalPrejRem))
  console.log('  Soma BAU registrado: R$ ' + fmtR(totalBau))

  // Status problemas
  const sp = myRem.filter(r => r.status_problema === 'saque_pendente').length
  const cb = myRem.filter(r => r.status_problema === 'conta_bloqueada').length
  const ba = myRem.filter(r => r.status_problema === 'banco_analise').length
  console.log('  Saques pendentes: ' + sp)
  console.log('  Contas bloqueadas: ' + cb)
  console.log('  Bancos em analise: ' + ba)

  // 8. SLOTS
  const slotCount = {}
  for (const r of myRem) {
    if (!r.slot_name) continue
    slotCount[r.slot_name] = (slotCount[r.slot_name] || 0) + 1
  }
  const topSlots = Object.entries(slotCount).sort((a, b) => b[1] - a[1]).slice(0, 20)
  console.log('\n━ TOP 20 SLOTS USADOS (' + Object.keys(slotCount).length + ' diferentes) ━')
  for (const [name, count] of topSlots) {
    console.log('  ' + name.padEnd(28).slice(0, 28) + ' · ' + count + ' vezes')
  }

  // 9. CUSTOS
  const { data: costs } = await sb.from('costs').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false })
  console.log('\n━ CUSTOS REGISTRADOS (' + (costs || []).length + ') ━')
  const totalCustos = (costs || []).reduce((s, c) => s + Number(c.amount || 0), 0)
  console.log('  Total: R$ ' + fmtR(totalCustos))
  const byType = {}
  for (const c of costs || []) {
    const tp = c.type || 'outros'
    byType[tp] = (byType[tp] || 0) + Number(c.amount || 0)
  }
  for (const [tp, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log('    ' + tp.padEnd(15) + ' · R$ ' + fmtR(v))
  }

  // 10. PIX
  const { data: pix } = await sb.from('pix_keys').select('tipo,status').eq('tenant_id', p.tenant_id)
  if (pix && pix.length > 0) {
    console.log('\n━ CHAVES PIX (' + pix.length + ') ━')
    const byPixType = {}
    for (const k of pix) {
      const tp = k.tipo || '?'
      byPixType[tp] = (byPixType[tp] || 0) + 1
    }
    for (const [tp, c] of Object.entries(byPixType)) console.log('  ' + tp + ': ' + c)
  } else {
    console.log('\n━ CHAVES PIX: nenhuma ━')
  }

  // 11. RANKING OPERADORES
  console.log('\n━ RANKING OPERADORES POR LUCRO GERADO ━')
  const opStats = {}
  for (const op of ops || []) {
    const opFechadas = fechadas.filter(m => m.operator_id === op.id)
    const opAllMetas = myMetas.filter(m => m.operator_id === op.id)
    const opRem = myRem.filter(r => opAllMetas.some(m => m.id === r.meta_id))
    opStats[op.id] = {
      nome: op.nome || op.email.split('@')[0],
      metas: opAllMetas.length,
      fechadas: opFechadas.length,
      remessas: opRem.length,
      lucro: opFechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0),
      contas: opFechadas.reduce((s, m) => s + Number(m.quantidade_contas || 0), 0),
    }
  }
  const ranking = Object.values(opStats).sort((a, b) => b.lucro - a.lucro)
  for (let i = 0; i < ranking.length; i++) {
    const r = ranking[i]
    console.log('  ' + (i + 1).toString().padStart(2) + '. ' + r.nome.padEnd(26).slice(0, 26) + ' · ' + r.metas + ' metas · ' + r.fechadas + ' fechadas · ' + r.remessas + ' rem · ' + r.contas + ' contas · R$ ' + fmtR(r.lucro))
  }

  // 12. ATIVIDADE TEMPORAL (ultimos 7d)
  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 86400000)
  const remLast7 = myRem.filter(r => new Date(r.created_at) >= d7).length
  const metasLast7 = myMetas.filter(m => new Date(m.created_at) >= d7).length
  console.log('\n━ ATIVIDADE ULTIMOS 7 DIAS ━')
  console.log('  Metas criadas: ' + metasLast7)
  console.log('  Remessas registradas: ' + remLast7)

  console.log('\n═══════════════════════════════════════════════════')
}

main().catch(console.error)
