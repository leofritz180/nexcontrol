// GET /api/convite/verificar?t=<token> — o link é válido? já foi usado?
// Público (a página /convite/<token> chama antes de mostrar a oferta).
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { lerConvite } from '../../../../lib/convite'

export const dynamic = 'force-dynamic'
// O Next guarda em cache o GET que o supabase-js faz ao PostgREST: a primeira
// consulta (antes do resgate) voltava pra sempre como 'não usado'. Sem cache.
export const fetchCache = 'force-no-store'
const semCache = (u, o) => fetch(u, { ...o, cache: 'no-store' })

export async function GET(req) {
  const t = new URL(req.url).searchParams.get('t')
  const c = lerConvite(t)
  if (!c.ok) return NextResponse.json({ ok: false, motivo: c.motivo })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { global: { fetch: semCache } })
  const { data: usado } = await sb.from('subscriptions').select('id').eq('idempotency_key', c.chave).maybeSingle()
  return NextResponse.json({ ok: true, operadores: c.operadores, meses: c.meses, validoAte: c.validoAte, usado: !!usado })
}
