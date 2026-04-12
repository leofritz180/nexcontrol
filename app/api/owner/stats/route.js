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
      sb.from('profiles').select('id,email,role,tenant_id,created_at'),
      sb.from('tenants').select('id,name,created_at,trial_ends_at'),
      sb.from('subscriptions').select('id,tenant_id,status,plan,operator_qty,created_at'),
      sb.from('metas').select('id,operator_id,tenant_id,status,status_fechamento,quantidade_contas,lucro_final,created_at,fechada_em,deleted_at'),
      sb.from('remessas').select('id,meta_id,lucro,prejuizo,deposito,saque,resultado,created_at'),
      sb.from('asaas_payments').select('id,tenant_id,amount,status,created_at').order('created_at', { ascending: false }),
    ])

    const admins = (profiles || []).filter(p => p.role === 'admin')
    const operators = (profiles || []).filter(p => p.role === 'operator')
    const allMetas = (metas || []).filter(m => !m.deleted_at)
    const allRem = remessas || []
    const allPay = payments || []
    const allSubs = subscriptions || []

    // Active subs
    const activeSubs = allSubs.filter(s => s.status === 'active')
    const cancelledSubs = allSubs.filter(s => s.status === 'cancelled')

    // Revenue
    const paidPayments = allPay.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
    const totalRevenue = paidPayments.reduce((a, p) => a + Number(p.amount || 0), 0)
    const rev30 = paidPayments.filter(p => new Date(p.created_at) >= d30).reduce((a, p) => a + Number(p.amount || 0), 0)
    const rev7 = paidPayments.filter(p => new Date(p.created_at) >= d7).reduce((a, p) => a + Number(p.amount || 0), 0)

    // MRR estimate (active subs * avg ticket)
    const avgTicket = paidPayments.length > 0 ? totalRevenue / paidPayments.length : 39.9
    const mrr = activeSubs.length * avgTicket

    // New clients
    const new7 = admins.filter(a => new Date(a.created_at) >= d7).length
    const new30 = admins.filter(a => new Date(a.created_at) >= d30).length

    // ARPU
    const arpu = admins.length > 0 ? totalRevenue / admins.length : 0

    // Churn (cancelled / total subs created)
    const churnRate = allSubs.length > 0 ? Math.round((cancelledSubs.length / allSubs.length) * 100) : 0

    // LTV
    const ltv = churnRate > 0 ? avgTicket / (churnRate / 100) : avgTicket * 12

    // Conversion funnel
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

    // Per-admin stats
    const adminStats = admins.map(a => {
      const tid = a.tenant_id
      const ops = operators.filter(o => o.tenant_id === tid).length
      const ms = allMetas.filter(m => m.tenant_id === tid)
      const fechadas = ms.filter(m => m.status_fechamento === 'fechada')
      const rems = allRem.filter(r => ms.some(m => m.id === r.meta_id))
      const lastActivity = rems.length > 0 ? rems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at : null
      const paid = allPay.filter(p => p.tenant_id === tid && (p.status === 'RECEIVED' || p.status === 'CONFIRMED'))
      const sub = allSubs.find(s => s.tenant_id === tid && s.status === 'active')
      return {
        id: a.id, email: a.email, tenant_id: tid, created_at: a.created_at,
        operators: ops, metas: ms.length, fechadas: fechadas.length,
        remessas: rems.length, totalPaid: paid.reduce((s, p) => s + Number(p.amount || 0), 0),
        lastActivity, hasActiveSub: !!sub,
        daysSinceActivity: lastActivity ? Math.floor((now - new Date(lastActivity)) / 86400000) : 999,
      }
    }).sort((a, b) => b.totalPaid - a.totalPaid)

    // Alerts
    const alerts = []
    const inactive = adminStats.filter(a => a.daysSinceActivity > 7 && a.daysSinceActivity < 999)
    if (inactive.length > 0) alerts.push({ text: `${inactive.length} cliente(s) sem atividade ha mais de 7 dias`, type: 'warn' })
    const noMeta = adminStats.filter(a => a.metas === 0)
    if (noMeta.length > 0) alerts.push({ text: `${noMeta.length} cliente(s) nunca criaram uma meta`, type: 'warn' })
    const unpaid = allPay.filter(p => p.status === 'PENDING')
    if (unpaid.length > 0) alerts.push({ text: `${unpaid.length} cobranca(s) pendente(s)`, type: 'loss' })
    const expired = (tenants || []).filter(t => t.trial_ends_at && new Date(t.trial_ends_at) < now)
    const expiredNoSub = expired.filter(t => !allSubs.find(s => s.tenant_id === t.id && s.status === 'active'))
    if (expiredNoSub.length > 0) alerts.push({ text: `${expiredNoSub.length} trial(s) expirado(s) sem assinatura`, type: 'loss' })

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
    if (mrr > 0) insights.push({ text: `MRR atual: R$ ${mrr.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, type: 'profit' })

    return NextResponse.json({
      kpis: {
        totalAdmins: admins.length, totalOperators: operators.length,
        activeSubs: activeSubs.length, cancelledSubs: cancelledSubs.length,
        mrr, totalRevenue, rev30, rev7,
        new7, new30, avgTicket, arpu, churnRate, ltv,
        totalMetas: allMetas.length, totalRemessas: allRem.length,
      },
      funnel: {
        registered: admins.length,
        withMeta, withRemessa, withSub,
      },
      activity: { activeToday, active7, active30 },
      adminStats: adminStats.slice(0, 20),
      alerts,
      insights,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
