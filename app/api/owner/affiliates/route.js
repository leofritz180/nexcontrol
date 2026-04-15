import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const OWNER_EMAIL = 'leofritz180@gmail.com'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (email !== OWNER_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const [{ data: affiliates }, { data: referrals }, { data: commissions }, { data: tenants }, { data: profiles }] = await Promise.all([
      sb.from('affiliates').select('*'),
      sb.from('referrals').select('affiliate_tenant_id,referred_tenant_id,created_at'),
      sb.from('affiliate_commissions').select('affiliate_tenant_id,payment_amount,commission_amount,status'),
      sb.from('tenants').select('id,name'),
      sb.from('profiles').select('tenant_id,email,role').eq('role', 'admin'),
    ])

    const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]))
    const adminByTenant = Object.fromEntries((profiles || []).map(p => [p.tenant_id, p]))

    const rows = (affiliates || []).map(a => {
      const refs = (referrals || []).filter(r => r.affiliate_tenant_id === a.tenant_id)
      const cs   = (commissions || []).filter(c => c.affiliate_tenant_id === a.tenant_id)
      const totalFaturado = cs.reduce((s, c) => s + Number(c.payment_amount || 0), 0)
      const totalComissao = cs.reduce((s, c) => s + Number(c.commission_amount || 0), 0)
      const pendente = cs.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount || 0), 0)
      const pago     = cs.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount || 0), 0)
      const tn = tenantMap[a.tenant_id] || {}
      const ad = adminByTenant[a.tenant_id] || {}
      return {
        tenant_id: a.tenant_id,
        tenant_name: tn.name || ad.email || 'Sem nome',
        email: ad.email || null,
        code: a.code, enabled: !!a.enabled,
        rate: Number(a.commission_rate || 0.30),
        indicados: refs.length,
        totalFaturado, totalComissao, pendente, pago,
      }
    }).sort((a, b) => b.totalComissao - a.totalComissao)

    const totals = {
      affiliates: rows.length,
      enabled: rows.filter(r => r.enabled).length,
      indicados: rows.reduce((s, r) => s + r.indicados, 0),
      totalFaturado: rows.reduce((s, r) => s + r.totalFaturado, 0),
      totalComissao: rows.reduce((s, r) => s + r.totalComissao, 0),
      pendente: rows.reduce((s, r) => s + r.pendente, 0),
      pago:     rows.reduce((s, r) => s + r.pago, 0),
    }

    return NextResponse.json({ rows, totals })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
