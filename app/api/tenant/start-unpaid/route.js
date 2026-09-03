import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/tenant/start-unpaid
// Novo modelo: "só entra se pagar" — a conta recém-criada NÃO ganha trial.
// Rebaixa o tenant do usuário logado de 'trial' -> 'expired' (e zera trial_end),
// forçando a tela de pagamento. NUNCA libera acesso (só rebaixa), então é
// inofensivo mesmo se chamado fora do fluxo. Fail-open: qualquer erro retorna
// ok:false sem quebrar o signup (o pior caso é a conta manter o trial antigo).
export async function POST(req) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return NextResponse.json({ ok: false, reason: 'no_token' }, { status: 401 })

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false }, global: { headers: { Authorization: 'Bearer ' + token } } }
    )
    const { data } = await anon.auth.getUser()
    const user = data?.user
    if (!user?.id) return NextResponse.json({ ok: false, reason: 'no_user' }, { status: 401 })

    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: p } = await svc.from('profiles').select('tenant_id, role').eq('id', user.id).maybeSingle()
    if (!p?.tenant_id || p.role !== 'admin') return NextResponse.json({ ok: false, reason: 'not_admin' })

    // Só mexe se ainda estiver em 'trial' — nunca toca em quem já é 'active'/pagante.
    const { error } = await svc.from('tenants')
      .update({ subscription_status: 'expired', trial_end: null })
      .eq('id', p.tenant_id)
      .eq('subscription_status', 'trial')

    if (error) {
      console.error('[start-unpaid] update failed', error.message)
      return NextResponse.json({ ok: false, reason: 'update_failed' })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e?.message || 'error' })
  }
}
