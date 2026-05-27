import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToTenant } from '../../../../../lib/push'

const OWNER_EMAIL = 'leofritz180@gmail.com'

// Marca comissoes como pagas. So owner.
// POST /api/owner/affiliates/pay { email, ids: [..commissionIds], note?: '' }
export async function POST(req) {
  try {
    const { email, ids, note } = await req.json()
    if (email !== OWNER_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'missing ids' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Pega afiliado_tenant_id pra notificar
    const { data: comms } = await sb.from('affiliate_commissions')
      .select('affiliate_tenant_id, commission_amount')
      .in('id', ids)

    // Atualiza pra paid
    const { error } = await sb.from('affiliate_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: OWNER_EMAIL,
        paid_note: note || null,
      })
      .in('id', ids)
      .eq('status', 'pending') // so paga as pendentes (idempotente)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notifica afiliados via push (agrupado por tenant)
    const byTenant = new Map()
    for (const c of comms || []) {
      if (!byTenant.has(c.affiliate_tenant_id)) byTenant.set(c.affiliate_tenant_id, 0)
      byTenant.set(c.affiliate_tenant_id, byTenant.get(c.affiliate_tenant_id) + Number(c.commission_amount || 0))
    }
    for (const [tenantId, total] of byTenant.entries()) {
      try {
        await sendPushToTenant(sb, tenantId, {
          title: 'Comissão paga!',
          body: `R$ ${total.toFixed(2).replace('.', ',')} enviada via PIX`,
          url: '/afiliados',
          tag: 'aff-paid',
        })
      } catch {}
    }

    return NextResponse.json({ ok: true, paid: ids.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
