import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { payment_id } = await req.json()
    if (!payment_id) return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 })

    // Check status directly from Asaas API
    const API_KEY = (process.env.ASAAS_API_KEY || '').trim()
    const BASE_URL = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').trim()

    const asaasRes = await fetch(`${BASE_URL}/payments/${payment_id}`, {
      headers: { 'access_token': API_KEY },
    })
    const asaasData = await asaasRes.json()
    const asaasStatus = asaasData.status || 'UNKNOWN'

    // If confirmed, update database and activate subscription
    if (asaasStatus === 'RECEIVED' || asaasStatus === 'CONFIRMED') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data: payment } = await supabase
        .from('asaas_payments')
        .select('id,tenant_id,status')
        .eq('asaas_payment_id', payment_id)
        .maybeSingle()

      if (payment && payment.status !== asaasStatus) {
        // Update payment
        await supabase.from('asaas_payments').update({
          status: asaasStatus,
          updated_at: new Date().toISOString(),
        }).eq('asaas_payment_id', payment_id)

        // Activate subscription
        const expires = new Date()
        expires.setDate(expires.getDate() + 30)

        await supabase.from('tenants').update({
          subscription_status: 'active',
        }).eq('id', payment.tenant_id)

        await supabase.from('subscriptions').insert({
          tenant_id: payment.tenant_id,
          status: 'active',
          payment_method: 'pix_asaas',
          external_id: payment_id,
          total_amount: asaasData.value,
          starts_at: new Date().toISOString(),
          expires_at: expires.toISOString(),
        })
      }
    }

    return NextResponse.json({ status: asaasStatus })
  } catch (err) {
    return NextResponse.json({ error: err.message, status: 'UNKNOWN' }, { status: 200 })
  }
}
