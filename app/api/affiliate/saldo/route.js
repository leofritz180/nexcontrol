// GET /api/affiliate/saldo — saldo de afiliado do admin logado, pra tela de
// pagamento mostrar o desconto ANTES de gerar o PIX. Quem aplica de verdade
// é o create-payment (servidor); isto é só leitura.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { saldoAfiliado } from '../../../../lib/affiliate-credit'

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
  const { data: p } = await sb.from('profiles').select('tenant_id, role').eq('id', u.user.id).maybeSingle()
  if (!p?.tenant_id || p.role !== 'admin') return NextResponse.json({ saldo: 0 })
  return NextResponse.json({ saldo: await saldoAfiliado(sb, p.tenant_id) })
}
