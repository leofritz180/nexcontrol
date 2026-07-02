import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Retorna as proxies (giga em tempo real) do usuario logado, consultando a
// Bettify (fonte oficial). Server-to-server autenticado pelo BETTIFY_SSO_SECRET
// (a mesma secret ja compartilhada com a loja). O segredo nunca sai do backend.
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

export async function GET(req) {
  const user = await authUser(req)
  if (!user?.email) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  // Forca www: o apex (bettifyproxy.com) redireciona 308 -> www, e o redirect
  // DESCARTA o header Authorization num fetch server-to-server. Chamando www direto, a auth passa.
  const base = (process.env.BETTIFY_URL || 'https://www.bettifyproxy.com')
    .replace(/\/+$/, '')
    .replace('://bettifyproxy.com', '://www.bettifyproxy.com')
  const secret = process.env.BETTIFY_SSO_SECRET
  if (!secret) return NextResponse.json({ proxies: [], error: 'not_configured' })

  try {
    const res = await fetch(`${base}/api/nex/proxies?email=${encodeURIComponent(user.email)}`, {
      headers: { Authorization: 'Bearer ' + secret },
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ proxies: [], error: `bettify_${res.status}` })
    }
    const data = await res.json()
    return NextResponse.json({ proxies: Array.isArray(data?.proxies) ? data.proxies : [] })
  } catch (e) {
    return NextResponse.json({ proxies: [], error: 'fetch_failed' })
  }
}
