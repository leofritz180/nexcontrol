// POST /api/convite/resgatar { token } — com a sessão de quem acabou de
// criar a conta. Cria a assinatura de cortesia do tenant dela:
//   status active · payment_method 'cortesia_convite' · total_amount 0
//   operator_count = do convite · expires_at = hoje + meses
//   idempotency_key = 'convite:<id>'  ← UNIQUE: o link só serve uma vez
//
// Não empilha: se o tenant já tem assinatura ativa, não cria outra.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { lerConvite } from '../../../../lib/convite'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
const semCache = (u, o) => fetch(u, { ...o, cache: 'no-store' })

async function quemPede(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token } } })
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

export async function POST(req) {
  try {
    const user = await quemPede(req)
    if (!user) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 })
    const { token } = await req.json().catch(() => ({}))
    const c = lerConvite(token)
    if (!c.ok) return NextResponse.json({ error: c.motivo === 'expirado' ? 'Este convite expirou.' : 'Convite inválido.' }, { status: 400 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { global: { fetch: semCache } })
    const { data: perfil } = await sb.from('profiles').select('id, tenant_id, role').eq('id', user.id).maybeSingle()
    if (!perfil?.tenant_id || perfil.role !== 'admin') return NextResponse.json({ error: 'O convite é pra quem cria a conta (admin).' }, { status: 403 })

    const { data: usado } = await sb.from('subscriptions').select('id, tenant_id').eq('idempotency_key', c.chave).maybeSingle()
    if (usado) return NextResponse.json({ error: usado.tenant_id === perfil.tenant_id ? 'Este convite já está ativo na sua conta.' : 'Este convite já foi usado por outra conta.', jaSeu: usado.tenant_id === perfil.tenant_id }, { status: 409 })

    const agora = new Date()
    const { data: ativa } = await sb.from('subscriptions').select('id, expires_at').eq('tenant_id', perfil.tenant_id).eq('status', 'active').gt('expires_at', agora.toISOString()).limit(1).maybeSingle()
    if (ativa) return NextResponse.json({ error: 'Sua conta já tem uma assinatura ativa.' }, { status: 409 })

    const expira = new Date(agora); expira.setMonth(expira.getMonth() + c.meses)
    const { error } = await sb.from('subscriptions').insert({
      tenant_id: perfil.tenant_id, status: 'active', payment_method: 'cortesia_convite', external_id: c.chave,
      total_amount: 0, operator_count: c.operadores, plan_months: c.meses,
      starts_at: agora.toISOString(), expires_at: expira.toISOString(), idempotency_key: c.chave,
    })
    if (error) {
      if (/idempotency|duplicate|unique/i.test(error.message)) return NextResponse.json({ error: 'Este convite já foi usado.' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await sb.from('tenants').update({ subscription_status: 'active' }).eq('id', perfil.tenant_id)
    return NextResponse.json({ ok: true, operadores: c.operadores, meses: c.meses, expiraEm: expira.toISOString() })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
