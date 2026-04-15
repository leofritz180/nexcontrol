import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { email, ref } = await req.json()
    if (!email || !ref) return NextResponse.json({ ok: false, msg: 'missing' })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: aff } = await sb.from('affiliates').select('tenant_id,enabled').eq('code', ref).maybeSingle()
    if (!aff || !aff.enabled) return NextResponse.json({ ok: false, msg: 'invalid_ref' })

    // Resolver tenant do novo usuario (pode ser eventualmente consistente — cliente faz retry)
    const { data: prof } = await sb.from('profiles').select('tenant_id').eq('email', email).maybeSingle()
    if (!prof?.tenant_id) return NextResponse.json({ ok: false, msg: 'profile_not_ready' })

    if (prof.tenant_id === aff.tenant_id) return NextResponse.json({ ok: false, msg: 'self_ref' })

    // Idempotente: UNIQUE(referred_tenant_id) garante 1 afiliado por cliente
    const { error } = await sb.from('referrals').insert({
      affiliate_tenant_id: aff.tenant_id,
      referred_tenant_id: prof.tenant_id,
    })
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return NextResponse.json({ ok: false, msg: error.message })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 })
  }
}
