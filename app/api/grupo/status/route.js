// GET /api/grupo/status — pra quem está logado: já é membro do grupo? qual
// foi o último pagamento de plano aprovado (é o que dispara o convite
// pós-pagamento no painel)? e o preço atual.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GRUPO_PRECO, GRUPO_PRECOS } from '../../../../lib/network-grupo'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
const semCache = (u, o) => fetch(u, { ...o, cache: 'no-store' })

export async function GET(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 })
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token } } })
  const { data: u } = await anon.auth.getUser()
  if (!u?.user) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { global: { fetch: semCache } })
  const { data: perfil } = await sb.from('profiles').select('tenant_id, role').eq('id', u.user.id).maybeSingle()

  // membro: compra do grupo aprovada (marcador -1/0, ou o valor em qualquer época)
  const { data: compras } = await sb.from('mp_payments').select('id, amount, status, operator_count, plan_months')
    .eq('user_id', u.user.id).in('status', ['approved', 'paid'])
  const membro = (compras || []).some(p => (Number(p.operator_count) === -1 && Number(p.plan_months) === 0) || GRUPO_PRECOS.includes(Number(p.amount)))

  // último plano aprovado do tenant (não é compra do grupo)
  let ultimoPlano = null
  if (perfil?.tenant_id) {
    const { data: planos } = await sb.from('mp_payments').select('id, created_at, updated_at, amount')
      .eq('tenant_id', perfil.tenant_id).eq('status', 'approved').neq('plan_months', 0)
      .order('created_at', { ascending: false }).limit(1)
    if (planos?.[0]) ultimoPlano = { id: planos[0].id, em: planos[0].updated_at || planos[0].created_at }
  }
  // linkConfigurado: só um booleano (nunca o link) — pra conferir a variável em produção sem expor nada
  return NextResponse.json({ membro, ultimoPlano, preco: GRUPO_PRECO, papel: perfil?.role || null, linkConfigurado: !!(process.env.NEX_GRUPO_URL || '').trim() })
}
