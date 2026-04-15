import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: prof } = await sb.from('profiles').select('tenant_id,role').eq('email', email).maybeSingle()
    if (!prof || prof.role !== 'admin' || !prof.tenant_id) {
      return NextResponse.json({ error: 'not_admin' }, { status: 403 })
    }

    let { data: aff } = await sb.from('affiliates').select('*').eq('tenant_id', prof.tenant_id).maybeSingle()

    // Se nao tem registro, criar row disabled (admin pode ver tela de bloqueio)
    if (!aff) {
      const code = Math.random().toString(36).slice(2, 10)
      const { data: inserted } = await sb.from('affiliates')
        .insert({ tenant_id: prof.tenant_id, code, enabled: false, commission_rate: 0.30 })
        .select().maybeSingle()
      aff = inserted
    }

    if (!aff?.enabled) {
      return NextResponse.json({ enabled: false, code: aff?.code || null })
    }

    // Indicados
    const { data: refs } = await sb.from('referrals')
      .select('referred_tenant_id,created_at')
      .eq('affiliate_tenant_id', prof.tenant_id)
      .order('created_at', { ascending: false })

    const tenantIds = (refs || []).map(r => r.referred_tenant_id)

    // Dados dos tenants indicados
    let tenantMap = {}
    if (tenantIds.length > 0) {
      const { data: tns } = await sb.from('tenants')
        .select('id,name,subscription_status,trial_end')
        .in('id', tenantIds)
      tenantMap = Object.fromEntries((tns || []).map(t => [t.id, t]))
    }

    // Profiles (admins) dos indicados, para nome/email
    let adminMap = {}
    if (tenantIds.length > 0) {
      const { data: admins } = await sb.from('profiles')
        .select('tenant_id,email').eq('role', 'admin').in('tenant_id', tenantIds)
      adminMap = Object.fromEntries((admins || []).map(a => [a.tenant_id, a]))
    }

    // Comissoes
    const { data: comms } = await sb.from('affiliate_commissions')
      .select('payment_amount,commission_amount,status,referred_tenant_id,created_at')
      .eq('affiliate_tenant_id', prof.tenant_id)

    const allComms = comms || []
    const totalFaturado = allComms.reduce((s, c) => s + Number(c.payment_amount || 0), 0)
    const totalComissao = allComms.reduce((s, c) => s + Number(c.commission_amount || 0), 0)
    const pendente = allComms.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount || 0), 0)
    const pago     = allComms.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount || 0), 0)

    // Por indicado
    const perRef = (refs || []).map(r => {
      const tn = tenantMap[r.referred_tenant_id] || {}
      const ad = adminMap[r.referred_tenant_id] || {}
      const cs = allComms.filter(c => c.referred_tenant_id === r.referred_tenant_id)
      const generated = cs.reduce((s, c) => s + Number(c.payment_amount || 0), 0)
      const commission = cs.reduce((s, c) => s + Number(c.commission_amount || 0), 0)
      return {
        tenant_id: r.referred_tenant_id,
        tenant_name: tn.name || ad.email || 'Cliente',
        email: ad.email || null,
        subscription_status: tn.subscription_status || 'trial',
        joined_at: r.created_at,
        payments_count: cs.length,
        generated, commission,
      }
    })

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || ''
    const link = origin ? `${origin}/signup?ref=${aff.code}` : `/signup?ref=${aff.code}`

    return NextResponse.json({
      enabled: true,
      code: aff.code,
      rate: Number(aff.commission_rate),
      link,
      totals: {
        totalIndicados: (refs || []).length,
        totalFaturado, totalComissao, pendente, pago,
      },
      referrals: perRef,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
