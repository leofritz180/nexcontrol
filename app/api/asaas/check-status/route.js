import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { payment_id } = await req.json()
    if (!payment_id) return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data } = await supabase
      .from('asaas_payments')
      .select('status')
      .eq('asaas_payment_id', payment_id)
      .maybeSingle()

    return NextResponse.json({ status: data?.status || 'UNKNOWN' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
