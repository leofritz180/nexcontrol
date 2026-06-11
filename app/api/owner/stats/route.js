import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const OWNER_EMAIL = 'leofritz180@gmail.com'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (email !== OWNER_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const now = new Date()
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30)

    // Timezone BR: chave YYYY-MM-DD em America/Sao_Paulo (servidor Vercel roda em UTC)
    const BR_TZ = 'America/Sao_Paulo'
    const brDateKey = d => {
      if (!d) return ''
      const dt = d instanceof Date ? d : new Date(d)
      if (isNaN(dt)) return ''
      return dt.toLocaleDateString('en-CA', { timeZone: BR_TZ })
    }

    // ========================================================
    // Helper: pagina automaticamente pra contornar limite 1000
    // do Supabase. Sem isso, owner panel mostra dados parciais
    // (caso da remessas com 10000+ linhas).
    // ========================================================
    async function fetchAll(table, select, opts = {}) {
      const PAGE = 1000
      let all = []
      let from = 0
      while (true) {
        let q = sb.from(table).select(select).range(from, from + PAGE - 1)
        if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? false })
        const { data, error } = await q
        if (error) throw error
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return all
    }

    const [
      profiles,
      tenants,
      subscriptions,
      metas,
      remessas,
      asaasPayments,
      mpPayments,
    ] = await Promise.all([
      fetchAll('profiles', '*'),
      fetchAll('tenants', 'id,name,created_at,trial_end,subscription_status,migrated_to_tenant_id,migrated_at'),
      fetchAll('subscriptions', '*'),
      fetchAll('metas', 'id,operator_id,tenant_id,status,status_fechamento,quantidade_contas,lucro_final,rede,created_at,fechada_em,deleted_at'),
      fetchAll('remessas', 'id,meta_id,lucro,prejuizo,deposito,saque,resultado,created_at'),
      fetchAll('asaas_payments', 'id,tenant_id,amount,status,created_at,updated_at', { order: { column: 'created_at', ascending: false } }),
      fetchAll('mp_payments', 'id,mp_payment_id,tenant_id,amount,status,created_at,updated_at', { order: { column: 'created_at', ascending: false } }),
    ])

    const admins = (profiles || []).filter(p => p.role === 'admin')
    const operators = (profiles || []).filter(p => p.role === 'operator')
    const allMetas = (metas || []).filter(m => !m.deleted_at)
    const allRem = remessas || []
    const allSubs = subscriptions || []

    // Mesclar pagamentos Asaas + Mercado Pago (gateways diferentes, mesma tela)
    // Status MP: 'approved' = pago, 'refunded'/'cancelled' = estornado
    const asaasNorm = (asaasPayments || []).map(p => ({ ...p, _gateway: 'asaas' }))
    const mpNorm = (mpPayments || []).map(p => ({ ...p, _gateway: 'mp' }))
    const allPay = [...asaasNorm, ...mpNorm].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Active / cancelled subs
    const activeSubs = allSubs.filter(s => s.status === 'active')
    const cancelledSubs = allSubs.filter(s => s.status === 'cancelled')

    // PAGANTES REAIS: tenants ÚNICOS com assinatura active e NÃO vencida.
    // (Bug antigo: contava LINHAS de assinatura — cada renovação/add-on inflava
    //  o número, ex: 187 linhas para ~82 clientes reais.)
    const _nowMs = Date.now()
    const activePayingTenantIds = new Set(
      activeSubs
        .filter(s => !s.expires_at || new Date(s.expires_at).getTime() > _nowMs)
        .map(s => s.tenant_id)
    )
    const activePayingCount = activePayingTenantIds.size
    // MRR REAL: soma do valor MENSAL de cada tenant pagante — pega a assinatura de
    // ciclo mais recente (plan_months>=1) e normaliza pra mensal. Antes era
    // count*avgTicket (duplamente errado: linhas x ticket por transação).
    const _cycleByTenant = {}
    for (const s of activeSubs) {
      if (Number(s.plan_months || 0) < 1) continue
      if (!activePayingTenantIds.has(s.tenant_id)) continue
      ;(_cycleByTenant[s.tenant_id] = _cycleByTenant[s.tenant_id] || []).push(s)
    }
    let mrrReal = 0
    for (const tid of Object.keys(_cycleByTenant)) {
      const arr = _cycleByTenant[tid].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const s = arr[0]
      mrrReal += Number(s.total_amount || 0) / Math.max(Number(s.plan_months || 1), 1)
    }
    mrrReal = Number(mrrReal.toFixed(2))
    // Total de PESSOAS pagantes = admins pagantes + operadores das contas pagantes
    const payingOperators = operators.filter(o => o.tenant_id && activePayingTenantIds.has(o.tenant_id)).length
    const payingPeople = activePayingCount + payingOperators

    // Revenue calculations — incluir status de ambos gateways
    const PAID_STATUSES = new Set([
      // Asaas
      'RECEIVED','CONFIRMED','RECEIVED_IN_CASH','BILLING_TYPE_CONFIRMED',
      // Mercado Pago
      'approved',
    ])
    const REFUND_STATUSES = new Set([
      // Asaas
      'REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL','PAYMENT_DELETED',
      // Mercado Pago — APENAS reembolsos reais (passou por approved e foi devolvido).
      // NAO incluir 'cancelled' (PIX que expirou sem pagamento — nunca houve dinheiro)
      // nem 'rejected' (pagamento recusado — tambem nunca houve dinheiro).
      'refunded','charged_back',
    ])
    const paidPayments = allPay.filter(p => PAID_STATUSES.has(p.status))
    const refundPayments = allPay.filter(p => REFUND_STATUSES.has(p.status))
    // mantida para retrocompat onde se referenciar
    const refundStatuses = Array.from(REFUND_STATUSES)
    const totalRevenue = paidPayments.reduce((a, p) => a + Number(p.amount || 0), 0)
    const totalRefunded = refundPayments.reduce((a, p) => a + Number(p.amount || 0), 0)

    const today = brDateKey(now)
    const revenueToday = paidPayments.filter(p => brDateKey(p.created_at) === today).reduce((a, p) => a + Number(p.amount || 0), 0)

    const monthPrefix = today.slice(0, 7) // YYYY-MM no horario BR
    const revenueMonth = paidPayments.filter(p => brDateKey(p.created_at).startsWith(monthPrefix)).reduce((a, p) => a + Number(p.amount || 0), 0)

    const rev30 = paidPayments.filter(p => new Date(p.created_at) >= d30).reduce((a, p) => a + Number(p.amount || 0), 0)
    const rev7 = paidPayments.filter(p => new Date(p.created_at) >= d7).reduce((a, p) => a + Number(p.amount || 0), 0)

    const prevD7 = new Date(d7.getTime() - 7 * 86400000)
    const prevRevenue7d = paidPayments.filter(p => new Date(p.created_at) >= prevD7 && new Date(p.created_at) < d7).reduce((a, p) => a + Number(p.amount || 0), 0)

    // MRR estimate
    const avgTicket = paidPayments.length > 0 ? totalRevenue / paidPayments.length : 39.9
    const mrr = mrrReal

    // New clients
    const new7 = admins.filter(a => new Date(a.created_at) >= d7).length
    const new30 = admins.filter(a => new Date(a.created_at) >= d30).length

    // ARPU / Churn / LTV
    const arpu = admins.length > 0 ? totalRevenue / admins.length : 0
    const churnRate = allSubs.length > 0 ? Math.round((cancelledSubs.length / allSubs.length) * 100) : 0
    const ltv = churnRate > 0 ? avgTicket / (churnRate / 100) : avgTicket * 12

    // Conversion funnel
    const totalSignups = admins.length
    const withMeta = new Set(allMetas.map(m => m.operator_id || m.tenant_id)).size
    const withRemessa = new Set(allRem.map(r => {
      const meta = allMetas.find(m => m.id === r.meta_id)
      return meta?.operator_id || meta?.tenant_id
    }).filter(Boolean)).size
    const withSub = activePayingCount

    // Activity
    const activeToday = new Set(allRem.filter(r => brDateKey(r.created_at) === today).map(r => {
      const m = allMetas.find(x => x.id === r.meta_id); return m?.tenant_id
    }).filter(Boolean)).size
    const active7 = new Set(allRem.filter(r => new Date(r.created_at) >= d7).map(r => {
      const m = allMetas.find(x => x.id === r.meta_id); return m?.tenant_id
    }).filter(Boolean)).size
    const active30 = new Set(allRem.filter(r => new Date(r.created_at) >= d30).map(r => {
      const m = allMetas.find(x => x.id === r.meta_id); return m?.tenant_id
    }).filter(Boolean)).size

    // Per-admin stats (rankings)
    const adminStats = admins.map(a => {
      const tid = a.tenant_id
      const ops = operators.filter(o => o.tenant_id === tid).length
      const ms = allMetas.filter(m => m.tenant_id === tid)
      const fechadas = ms.filter(m => m.status_fechamento === 'fechada')
      const rems = allRem.filter(r => ms.some(m => m.id === r.meta_id))
      const paid = allPay.filter(p => p.tenant_id === tid && PAID_STATUSES.has(p.status))

      // Fix plan status: check subscriptions with expiry + tenant trial status
      const hasSub = (subscriptions || []).some(s =>
        s.tenant_id === tid &&
        s.status === 'active' &&
        (!s.expires_at || new Date(s.expires_at) > now)
      )
      const tenant = (tenants || []).find(t => t.id === tid)
      const isTrial = tenant?.subscription_status === 'trial' && tenant?.trial_end && new Date(tenant.trial_end) > now
      const planStatus = hasSub ? 'PRO' : isTrial ? 'TRIAL' : 'FREE'

      // Last activity: profile.last_seen_at (atualizado pelo trigger via presence ping a cada 30s)
      // Fallback: ultima meta/remessa created_at, ou profile.updated_at
      const metaDates = ms.map(m => m.created_at).filter(Boolean)
      const remDates = rems.map(r => r.created_at).filter(Boolean)
      const allDates = [...metaDates, ...remDates].sort((a, b) => new Date(b) - new Date(a))
      const lastDataActivity = allDates.length > 0 ? allDates[0] : null

      // Pega o MAIS RECENTE entre last_seen_at (real time) e ultima data/remessa
      const candidates = [a.last_seen_at, lastDataActivity, a.updated_at].filter(Boolean)
      const lastActivity = candidates.length > 0
        ? candidates.sort((x, y) => new Date(y) - new Date(x))[0]
        : null

      // Last seen = mesma coisa pra retrocompat
      const lastSeen = lastActivity

      // Lucro final
      const lucroFinal = fechadas.reduce((s, m) => s + Number(m.lucro_final || 0), 0)
      const totalContas = fechadas.reduce((s, m) => s + Number(m.quantidade_contas || 0), 0)
      const lucroPerConta = totalContas > 0 ? lucroFinal / totalContas : 0

      // Top redes (by lucro)
      const redeMap = {}
      fechadas.forEach(m => {
        const r = m.rede || 'Outros'
        if (!redeMap[r]) redeMap[r] = { rede: r, lucro: 0, metas: 0 }
        redeMap[r].lucro += Number(m.lucro_final || 0)
        redeMap[r].metas++
      })
      const topRedes = Object.values(redeMap).sort((a, b) => b.lucro - a.lucro).slice(0, 3)

      // Deposito/saque totais
      const totalDep = rems.reduce((s, r) => s + Number(r.deposito || 0), 0)
      const totalSaq = rems.reduce((s, r) => s + Number(r.saque || 0), 0)

      return {
        id: a.id, email: a.email, name: a.email.split('@')[0], tenant_id: tid, created_at: a.created_at,
        operators: ops, metas: ms.length, fechadas: fechadas.length,
        remessas: rems.length, totalRemessas: rems.length,
        totalPaid: paid.reduce((s, p) => s + Number(p.amount || 0), 0),
        lastActivity, lastSeen,
        hasActiveSub: hasSub, planStatus,
        daysSinceActivity: lastActivity ? Math.floor((now - new Date(lastActivity)) / 86400000) : 999,
        lucroFinal, totalContas, lucroPerConta, topRedes, totalDep, totalSaq,
      }
    }).sort((a, b) => b.metas - a.metas || b.operators - a.operators || (new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)))

    // Alerts
    const alerts = []
    if (revenueToday === 0) alerts.push({ text: 'Nenhuma receita registrada hoje', type: 'warn' })
    if (rev7 < prevRevenue7d * 0.7 && prevRevenue7d > 0) alerts.push({ text: `Receita semanal caiu ${Math.round((1 - rev7 / Math.max(prevRevenue7d, 1)) * 100)}%`, type: 'critical' })
    const inactiveAdmins = admins.filter(a => !allMetas.some(m => m.tenant_id === a.tenant_id && new Date(m.created_at) >= d7))
    if (inactiveAdmins.length > 2) alerts.push({ text: `${inactiveAdmins.length} admins sem atividade nos ultimos 7 dias`, type: 'warn' })
    const noMeta = adminStats.filter(a => a.metas === 0)
    if (noMeta.length > 0) alerts.push({ text: `${noMeta.length} cliente(s) nunca criaram uma meta`, type: 'warn' })
    const unpaid = allPay.filter(p => p.status === 'PENDING' || p.status === 'pending')
    if (unpaid.length > 0) alerts.push({ text: `${unpaid.length} cobranca(s) pendente(s)`, type: 'critical' })
    // Reembolsos recentes (criticos)
    const refund24h = refundPayments.filter(p => (now - new Date(p.updated_at || p.created_at)) < 86400000)
    if (refund24h.length > 0) {
      const val = refund24h.reduce((s, p) => s + Number(p.amount || 0), 0)
      alerts.push({ text: `${refund24h.length} reembolso(s) nas ultimas 24h — R$ ${val.toFixed(2).replace('.',',')}`, type: 'critical' })
    }
    const refund7d = refundPayments.filter(p => new Date(p.updated_at || p.created_at) >= d7)
    if (refund7d.length > refund24h.length) {
      alerts.push({ text: `${refund7d.length} reembolso(s) nos ultimos 7 dias`, type: 'warn' })
    }
    // Trials expirados sem sub — exclui tenants migrados (cliente foi pra conta nova)
    const expired = (tenants || []).filter(t => t.trial_end && new Date(t.trial_end) < now && !t.migrated_to_tenant_id)
    const expiredNoSub = expired.filter(t => !allSubs.find(s => s.tenant_id === t.id && s.status === 'active'))
    if (expiredNoSub.length > 0) alerts.push({ text: `${expiredNoSub.length} trial(s) expirado(s) sem assinatura`, type: 'critical' })

    // Revenue by day (last 30 days) for chart — indexado por chave BR para casar com "hoje"
    const payByDayBR = {}
    for (const p of paidPayments) {
      const k = brDateKey(p.created_at)
      if (!k) continue
      payByDayBR[k] = (payByDayBR[k] || 0) + Number(p.amount || 0)
    }
    const revenueByDay = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = brDateKey(d)
      revenueByDay.push({ date: dateStr, value: payByDayBR[dateStr] || 0 })
    }

    // Insights
    const insights = []
    const convRate = admins.length > 0 ? Math.round((withSub / admins.length) * 100) : 0
    insights.push({ text: `Taxa de conversao: ${convRate}% dos admins assinam`, type: convRate >= 30 ? 'profit' : 'warn' })
    if (admins.length > 0) {
      const noMetaPct = Math.round((noMeta.length / admins.length) * 100)
      if (noMetaPct > 30) insights.push({ text: `${noMetaPct}% dos clientes nunca criaram meta`, type: 'warn' })
    }
    const avgOps = admins.length > 0 ? (operators.length / admins.length).toFixed(1) : '0'
    insights.push({ text: `Media de ${avgOps} operadores por admin`, type: 'neutral' })
    if (mrr > 0) insights.push({ text: `MRR atual: R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, type: 'profit' })

    // Revenue variation percentage (7d vs prev 7d)
    const revenueVariation = prevRevenue7d > 0 ? Math.round(((rev7 - prevRevenue7d) / prevRevenue7d) * 100) : rev7 > 0 ? 100 : 0

    // Recent sales (last 10 paid) — paidPayments already ordered desc by created_at
    const tenantNameMap = Object.fromEntries((tenants || []).map(t => [t.id, t.name]))
    // Mapa tenant_id → admin profile (nome, email) pra resolver pagamentos
    const adminByTenant = {}
    for (const a of admins) {
      if (!adminByTenant[a.tenant_id]) adminByTenant[a.tenant_id] = a
    }
    const resolveName = p => {
      const a = adminByTenant[p.tenant_id]
      return a?.nome || a?.email?.split('@')[0] || tenantNameMap[p.tenant_id] || 'Cliente'
    }
    const resolveEmail = p => adminByTenant[p.tenant_id]?.email || '—'

    // Pra cada tenant, calcula o PRIMEIRO pagamento aprovado (mais antigo)
    // Isso permite classificar cada pagamento como new/upgrade/renewal:
    //   - new:     eh o primeiro pagamento do tenant
    //   - upgrade: nao eh o primeiro, gap < 25 dias do anterior do mesmo tenant
    //   - renewal: nao eh o primeiro, gap >= 25 dias do anterior do mesmo tenant
    const paidByTenant = {}
    for (const p of paidPayments) {
      if (!paidByTenant[p.tenant_id]) paidByTenant[p.tenant_id] = []
      paidByTenant[p.tenant_id].push(p)
    }
    // Ordena cada tenant cronologico (mais antigo primeiro)
    for (const tid of Object.keys(paidByTenant)) {
      paidByTenant[tid].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }
    function classifySale(p) {
      const list = paidByTenant[p.tenant_id] || []
      const idx = list.findIndex(x => x.id === p.id && x._gateway === p._gateway)
      if (idx <= 0) return 'new'
      const prev = list[idx - 1]
      const gapDays = (new Date(p.created_at) - new Date(prev.created_at)) / 86400000
      return gapDays >= 25 ? 'renewal' : 'upgrade'
    }

    const recentSales = paidPayments.slice(0, 10).map(p => ({
      id: p.id,
      tenant_id: p.tenant_id,
      tenant_name: resolveName(p),
      amount: Number(p.amount || 0),
      created_at: p.created_at,
      kind: classifySale(p),
    }))

    // HISTORICO COMPLETO — todos pagamentos aprovados desde o lancamento
    const allSales = paidPayments.map(p => ({
      id: p.id,
      tenant_id: p.tenant_id,
      name: resolveName(p),
      email: resolveEmail(p),
      amount: Number(p.amount || 0),
      gateway: p._gateway, // 'asaas' | 'mp'
      created_at: p.created_at,
      kind: classifySale(p), // 'new' | 'renewal' | 'upgrade'
    }))

    // Agregados extras pro card de histórico
    const firstSaleAt = allSales.length > 0 ? allSales[allSales.length - 1].created_at : null
    const lastSaleAt = allSales.length > 0 ? allSales[0].created_at : null
    const uniqueCustomers = new Set(allSales.map(s => s.tenant_id)).size

    // Recent refunds (last 10) — ordenar por updated_at (quando o estorno ocorreu)
    const refundsSorted = [...refundPayments].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    const recentRefunds = refundsSorted.slice(0, 10).map(p => ({
      id: p.id,
      tenant_id: p.tenant_id,
      tenant_name: tenantNameMap[p.tenant_id] || 'Cliente',
      amount: Number(p.amount || 0),
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))
    const refundsMonth = refundPayments.filter(p => brDateKey(p.updated_at || p.created_at).startsWith(monthPrefix)).reduce((a, p) => a + Number(p.amount || 0), 0)
    const netRevenue = totalRevenue - totalRefunded

    // ============================================================
    // WEBHOOK HEALTH — saude do gateway MP
    // Calcula latencia entre criacao do PIX e confirmacao da MP.
    // <60s = instant (ideal), 60-300s = delayed, >300s = orfao.
    // ============================================================
    const cutoff24h = new Date(Date.now() - 24 * 3600 * 1000).getTime()
    const cutoff7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).getTime()
    const mpApproved24h = (mpPayments || []).filter(p =>
      p.status === 'approved' &&
      new Date(p.created_at).getTime() > cutoff24h
    )
    const mpApproved7d = (mpPayments || []).filter(p =>
      p.status === 'approved' &&
      new Date(p.created_at).getTime() > cutoff7d
    )
    const calcLatency = list => {
      const buckets = { instant: 0, delayed: 0, orfao: 0, total: list.length }
      const recent = []
      for (const p of list) {
        const delta = Math.round((new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 1000)
        if (delta < 60) buckets.instant++
        else if (delta < 300) buckets.delayed++
        else buckets.orfao++
        recent.push({
          mp_id: p.mp_payment_id || String(p.id),
          amount: Number(p.amount || 0),
          created_at: p.created_at,
          updated_at: p.updated_at,
          latency_s: delta,
          tenant_id: p.tenant_id,
        })
      }
      return { buckets, recent }
    }
    const health24h = calcLatency(mpApproved24h)
    const health7d = calcLatency(mpApproved7d)

    // Pendings antigos (>10min) que ainda nao foram processados — indicador critico
    const pendingsOld = (mpPayments || [])
      .filter(p => p.status === 'pending' && new Date(p.created_at).getTime() < Date.now() - 10 * 60 * 1000)
      .slice(0, 20)
      .map(p => ({
        mp_id: p.mp_payment_id || String(p.id),
        amount: Number(p.amount || 0),
        created_at: p.created_at,
        tenant_id: p.tenant_id,
      }))

    const webhookHealth = {
      h24: {
        total: health24h.buckets.total,
        instant: health24h.buckets.instant,
        delayed: health24h.buckets.delayed,
        orfao: health24h.buckets.orfao,
        successRate: health24h.buckets.total > 0
          ? Math.round((health24h.buckets.instant / health24h.buckets.total) * 100)
          : 100,
      },
      d7: {
        total: health7d.buckets.total,
        instant: health7d.buckets.instant,
        delayed: health7d.buckets.delayed,
        orfao: health7d.buckets.orfao,
        successRate: health7d.buckets.total > 0
          ? Math.round((health7d.buckets.instant / health7d.buckets.total) * 100)
          : 100,
      },
      lastPayments: health24h.recent.slice(0, 15),
      pendingsOld,
    }

    // ============================================================
    // ISSUES DETECTADOS — painel de problemas operacionais
    // 4 categorias: pendings antigos, excesso de operadores, operadores
    // duplicados, webhooks lentos. Cada uma com lista acionavel.
    // ============================================================
    const tenantMap = new Map((tenants || []).map(t => [t.id, t]))
    const adminByTenantMap = new Map()
    for (const p of admins) {
      if (p.tenant_id && !adminByTenantMap.has(p.tenant_id)) adminByTenantMap.set(p.tenant_id, p)
    }
    const tenantLabel = tid => {
      const t = tenantMap.get(tid)
      const a = adminByTenantMap.get(tid)
      return t?.name || a?.nome || a?.email?.split('@')[0] || tid?.slice(0, 8) || '?'
    }

    // Emails de teste/dev que poluem os paineis — filtrar do "Problemas detectados"
    const TEST_EMAIL_PATTERNS = ['leofritz', 'testandodarkzin', 'bob@bob', 'tk@gmail', '@test.', 'fake@']
    const isTestTenant = tid => {
      const adm = adminByTenantMap.get(tid)
      const em = (adm?.email || '').toLowerCase()
      if (!em) return false
      return TEST_EMAIL_PATTERNS.some(p => em.includes(p))
    }

    // 1. Pagamentos pendentes >10min (ja calculado acima) — sem testes
    const issuePendings = pendingsOld
      .filter(p => !isTestTenant(p.tenant_id))
      .map(p => ({
        mp_id: p.mp_id,
        amount: p.amount,
        tenant: tenantLabel(p.tenant_id),
        tenant_id: p.tenant_id,
        created_at: p.created_at,
        minutesOld: Math.round((Date.now() - new Date(p.created_at).getTime()) / 60000),
      }))

    // 2. Tenants excedendo limite de operadores (active subs)
    const issueOpLimit = []
    const activeSubsByTenant = new Map()
    for (const s of allSubs) {
      if (s.status !== 'active') continue
      const exp = s.expires_at ? new Date(s.expires_at) : null
      if (exp && exp < now) continue
      const cur = activeSubsByTenant.get(s.tenant_id) || 0
      const v = Number(s.operator_count || 0)
      activeSubsByTenant.set(s.tenant_id, Math.max(cur, v))
    }
    const opsByTenant = new Map()
    for (const op of operators) {
      if (!op.tenant_id) continue
      opsByTenant.set(op.tenant_id, (opsByTenant.get(op.tenant_id) || 0) + 1)
    }
    for (const [tid, limit] of activeSubsByTenant) {
      if (isTestTenant(tid)) continue
      const current = opsByTenant.get(tid) || 0
      if (current > limit) {
        issueOpLimit.push({
          tenant: tenantLabel(tid),
          tenant_id: tid,
          limit,
          current,
          excess: current - limit,
        })
      }
    }
    issueOpLimit.sort((a, b) => b.excess - a.excess)

    // 3. Operadores duplicados — mesmo primeiro+segundo nome no mesmo tenant
    const issueDup = []
    const seenByTenant = new Map() // tid → Map(normName → [opIds])
    for (const op of operators) {
      if (!op.tenant_id || !op.nome) continue
      if (isTestTenant(op.tenant_id)) continue
      const parts = String(op.nome).trim().toLowerCase().split(/\s+/)
      // Considera duplicado se primeiro + segundo nome batem (evita match so pelo primeiro nome)
      const key = parts.slice(0, 2).join(' ')
      if (key.length < 3) continue
      let m = seenByTenant.get(op.tenant_id)
      if (!m) { m = new Map(); seenByTenant.set(op.tenant_id, m) }
      const arr = m.get(key) || []
      arr.push({ id: op.id, nome: op.nome })
      m.set(key, arr)
    }
    for (const [tid, m] of seenByTenant) {
      for (const [name, arr] of m) {
        if (arr.length >= 2) {
          issueDup.push({
            tenant: tenantLabel(tid),
            tenant_id: tid,
            name,
            count: arr.length,
            ops: arr,
          })
        }
      }
    }
    issueDup.sort((a, b) => b.count - a.count)

    // 4. Webhooks com latencia anormal (>10min — abaixo disso eh cliente normal demorando pra pagar)
    const issueSlowHooks = health24h.recent
      .filter(p => p.latency_s >= 600)
      .filter(p => !isTestTenant(p.tenant_id))
      .map(p => ({
        mp_id: p.mp_id,
        amount: p.amount,
        tenant: tenantLabel(p.tenant_id),
        tenant_id: p.tenant_id,
        created_at: p.created_at,
        latency_min: Math.round(p.latency_s / 60),
      }))
      .sort((a, b) => b.latency_min - a.latency_min)

    const issues = {
      pendings: issuePendings,
      opLimit: issueOpLimit,
      duplicates: issueDup,
      slowHooks: issueSlowHooks,
      totalCount: issuePendings.length + issueOpLimit.length + issueDup.length + issueSlowHooks.length,
    }

    return NextResponse.json({
      kpis: {
        totalAdmins: admins.length, totalOperators: operators.length,
        activeSubs: activePayingCount, cancelledSubs: cancelledSubs.length,
        payingPeople, payingOperators,
        mrr, totalRevenue, revenueToday, revenueMonth, rev30, rev7,
        prevRevenue7d, revenueVariation,
        new7, new30, avgTicket, arpu, churnRate, ltv,
        totalMetas: allMetas.length, totalRemessas: allRem.length,
        totalRefunded, refundsMonth, refundsCount: refundPayments.length,
        refunds24h: refund24h.length, refunds7d: refund7d.length,
        netRevenue,
      },
      funnel: {
        registered: totalSignups,
        withMeta, withRemessa, withSub,
      },
      activity: { activeToday, active7, active30 },
      adminStats,
      alerts,
      insights,
      revenueByDay,
      recentSales,
      recentRefunds,
      allSales,
      salesMeta: { firstSaleAt, lastSaleAt, uniqueCustomers, total: allSales.length },
      webhookHealth,
      issues,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
