import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Endpoint publico (sem auth) pra validar convite via token.
// Necessario porque a tabela 'invites' tem RLS que so libera pra users
// autenticados, e o operador-a-ser-convidado ainda nao tem login.
//
// GET /api/invite/lookup?token=XXX
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Aceita pending E accepted (links compartilhaveis — varios operadores
    // podem usar o mesmo link). Soh bloqueia se 'revoked' ou 'expired'.
    const { data: inv, error: invErr } = await sb.from('invites')
      .select('id, tenant_id, email, role, status')
      .eq('token', token)
      .in('status', ['pending', 'accepted'])
      .limit(1)
      .maybeSingle()

    if (invErr) {
      console.error('[invite/lookup] DB error:', invErr.message)
      return NextResponse.json({ valid: false, reason: 'db_error', error: invErr.message }, { status: 500 })
    }
    if (!inv) return NextResponse.json({ valid: false, reason: 'not_found_or_revoked' })

    // Pega nome do tenant pra mostrar na tela
    const { data: t } = await sb.from('tenants').select('name').eq('id', inv.tenant_id).maybeSingle()

    return NextResponse.json({
      valid: true,
      invite: { id: inv.id, tenant_id: inv.tenant_id, email: inv.email, role: inv.role },
      tenant: t ? { name: t.name } : null,
    })
  } catch (e) {
    return NextResponse.json({ valid: false, reason: 'error', error: e.message }, { status: 500 })
  }
}
