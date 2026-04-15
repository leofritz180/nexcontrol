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

    const [
      { data: profiles },
      { data: tenants },
      { data: subscriptions },
      { data: metas },
      { data: remessas },
      { data: payments },
    ] = await Promise.all([
      sb.from('profiles').select('*'),
      sb.from('tenants').select('id,name,created_at,trial_end,subscription_status'),
      sb.from('subscriptions').select('*'),
      sb.from('metas').select('id,operator_id,tenant_id,status,status_fechamento,quantidade_contas,lucro_final,rede,created_at,fechada_em,deleted_at'),
      sb.from('remessas').select('id,meta_id,lucro,prejuizo,deposito,saque,resultado,created_at'),
      sb.from('asaas_payments').select('id,tenant_id,amount,status,created_at').order('created_at', { ascending: false }),
    ])

    const admins = (profiles || []).filter(p => p.role === 'admin')
    const operators = (profiles || []).filter(p => p.role === 'operator')
    const allMetas = (metas || []).filter(m => !m.deleted_at)
    const allRem = remessas || []
    const allPay = payments || []
    const allSubs = subscriptions || []

    // Active / cancelled subs
    const activeSubs = allSubs.filter(s => s.status === 'active')
    const cancelledSubs = allSubs.filter(s => s.status === 'cancelled')

    // Revenue calculations
    const paidPayments = allPay.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
    const totalRevenue = paidPayments.reduce((a, p) => a + Number(p.amount || 0), 0)

    const today = now.toISOString().slice(0, 10)
    const revenueToday = paidPayments.filter(p => (p.created_at || '').slice(0, 10) === today).reduce((a, p) => a + Number(p.amount || 0), 0)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const revenueMonth = paidPayments.filter(p => p.created_at >= monthStart).reduce((a, p) => a + Number(p.amount || 0), 0)

    const rev30 = paidPayments.filter(p => new Date(p.created_at) >= d30).reduce((a, p) => a + Number(p.amount || 0), 0)
    const rev7 = paidPayments.filter(p => new Date(p.created_at) >= d7).reduce((a, p) => a + Number(p.amount || 0), 0)

    const prevD7 = new Date(d7.getTime() - 7 * 86400000)
    const prevRevenue7d = paidPayments.filter(p => new Date(p.created_at) >= prevD7 && new Date(p.created_at) < d7).reduce((a, p) => a + Number(p.amount || 0), 0)

    // MRR estimate
    const avgTicket = paidPayments.length > 0 ? totalRevenue / paidPayments.length : 39.9
    const mrr = activeSubs.length * avgTicket

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
    const withSub = activeSubs.length

    // Activity
    const activeToday = new Set(allRem.filter(r => new Date(r.created_at).toDateString() === now.toDateString()).map(r => {
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
      const paid = allPay.filter(p => p.tenant_id === tid && (p.status === 'RECEIVED' || p.status === 'CONFIRMED'))

      // Fix plan status: check subscriptions with expiry + tenant trial status
      const hasSub = (subscriptions || []).some(s =>
        s.tenant_id === tid &&
        s.status === 'active' &&
        (!s.expires_at || new Date(s.expires_at) > now)
      )
      const tenant = (tenants || []).find(t => t.id === tid)
      const isTrial = tenant?.subscription_status === 'trial' && tenant?.trial_end && new Date(tenant.trial_end) > now
      const planStatus = hasSub ? 'PRO' : isTrial ? 'TRIAL' : 'FREE'

      // Last activity: most recent meta or remessa created_at
      const metaDates = ms.map(m => m.created_at).filter(Boolean)
      const remDates = rems.map(r => r.created_at).filter(Boolean)
      const allDates = [...metaDates, ...remDates].sort((a, b) => new Date(b) - new Date(a))
      const lastActivity = allDates.length > 0 ? allDates[0] : null

      // Last seen: profile updated_at or lastActivity
      const lastSeen = a.updated_at || lastActivity

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
    const unpaid = allPay.filter(p => p.status === 'PENDING')
    if (unpaid.length > 0) alerts.push({ text: `${unpaid.length} cobranca(s) pendente(s)`, type: 'critical' })
    const expired = (tenants || []).filter(t => t.trial_end && new Date(t.trial_end) < now)
    const expiredNoSub = expired.filter(t => !allSubs.find(s => s.tenant_id === t.id && s.status === 'active'))
    if (expiredNoSub.length > 0) alerts.push({ text: `${expiredNoSub.length} trial(s) expirado(s) sem assinatura`, type: 'critical' })

    // Revenue by day (last 30 days) for chart
    const revenueByDay = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayRev = paidPayments.filter(p => (p.created_at || '').slice(0, 10) === dateStr).reduce((a, p) => a + Number(p.amount || 0), 0)
      revenueByDay.push({ date: dateStr, value: dayRev })
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
    const recentSales = paidPayments.slice(0, 10).map(p => ({
      id: p.id,
      tenant_id: p.tenant_id,
      tenant_name: tenantNameMap[p.tenant_id] || 'Cliente',
      amount: Number(p.amount || 0),
      created_at: p.created_at,
    }))

    return NextResponse.json({
      kpis: {
        totalAdmins: admins.length, totalOperators: operators.length,
        activeSubs: activeSubs.length, cancelledSubs: cancelledSubs.length,
        mrr, totalRevenue, revenueToday, revenueMonth, rev30, rev7,
        prevRevenue7d, revenueVariation,
        new7, new30, avgTicket, arpu, churnRate, ltv,
        totalMetas: allMetas.length, totalRemessas: allRem.length,
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
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
