import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Salva a chave PIX do afiliado pra receber comissoes
// POST /api/affiliate/pix { email, pix_key, pix_type }
export async function POST(req) {
  try {
    const { email, pix_key, pix_type } = await req.json()
    if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: prof } = await sb.from('profiles').select('tenant_id,role').eq('email', email).maybeSingle()
    if (!prof || prof.role !== 'admin' || !prof.tenant_id) {
      return NextResponse.json({ error: 'not_admin' }, { status: 403 })
    }

    const trimmed = (pix_key || '').trim()
    const validType = ['cpf', 'email', 'phone', 'random'].includes(pix_type) ? pix_type : null

    const { error } = await sb.from('affiliates')
      .update({ pix_key: trimmed || null, pix_type: validType })
      .eq('tenant_id', prof.tenant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
