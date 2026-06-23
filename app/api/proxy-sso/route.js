import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { buildBettifyURL } from '../../../lib/bettify-sso'

export const dynamic = 'force-dynamic'

// FASE DE TESTE: só leofritz178 gera a URL. Pra liberar geral, basta esvaziar
// SSO_TEST_EMAILS ou trocar a checagem por "todos logados".
const SSO_TEST_EMAILS = new Set(['leofritz178@gmail.com', 'darkzinmg7@gmail.com'])

// Auth padrão do NexControl: Bearer token no header (igual /api/metodos).
async function authUser(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: 'Bearer ' + token } } }
  )
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

export async function POST(req) {
  const user = await authUser(req)
  if (!user?.email) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  // Gate de teste (remover/abrir no rollout geral)
  if (SSO_TEST_EMAILS.size && !SSO_TEST_EMAILS.has(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Indisponivel' }, { status: 403 })
  }

  try {
    const url = buildBettifyURL({
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
    })
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
