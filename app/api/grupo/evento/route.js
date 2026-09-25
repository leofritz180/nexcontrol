// POST /api/grupo/evento { evento: 'view' | 'click' | 'qr', origem }
// Funil do grupo: quem VIU a oferta, quem CLICOU, quem GEROU o PIX. Sem
// tabela nova: vai pro winback_log (segment 'grupo_<evento>', channel 'ui'),
// que já é o log de ciclo de vida. A compra em si está em mp_payments.
// Ler: node scripts/grupo-funil.mjs
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const EVENTOS = new Set(['view', 'click', 'qr'])

export async function POST(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 })
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token } } })
  const { data: u } = await anon.auth.getUser()
  if (!u?.user) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 })
  const { evento, origem } = await req.json().catch(() => ({}))
  if (!EVENTOS.has(evento)) return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: perfil } = await sb.from('profiles').select('tenant_id').eq('id', u.user.id).maybeSingle()
  await sb.from('winback_log').insert({ user_id: u.user.id, tenant_id: perfil?.tenant_id || null, segment: 'grupo_' + evento, channel: 'ui', status: String(origem || 'app').slice(0, 40), payload: { origem: origem || null }, sent_at: new Date().toISOString() })
  return NextResponse.json({ ok: true })
}
