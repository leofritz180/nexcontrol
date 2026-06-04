import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Marca rotas como dinamicas pra evitar collect-page-data no build sem env
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function triggerReconcile(req) {
  try {
    const host = req.headers.get('host')
    if (!host) return
    const proto = host.includes('localhost') ? 'http' : 'https'
    fetch(`${proto}://${host}/api/reconcile-pending`, { method: 'GET', cache: 'no-store' }).catch(() => {})
  } catch {}
}

export async function POST(req) {
  try {
    const sb = getClient()
    const { user_id } = await req.json()
    if (user_id) {
      const now = new Date().toISOString()
      // 1. Upsert na tabela presence (count online)
      await sb.from('presence').upsert(
        { session_id: String(user_id), last_seen: now },
        { onConflict: 'session_id' }
      )
      // 2. Defesa em profundidade: se for UUID valido, atualiza profiles.last_seen_at
      //    direto via service role (alem do trigger). Garante que /owner ve em tempo real.
      if (UUID_RE.test(String(user_id))) {
        try {
          await sb.from('profiles').update({ last_seen_at: now }).eq('id', user_id)
        } catch {}
      }
    }
    const cutoff = new Date(Date.now() - 300000).toISOString()
    const { count } = await sb.from('presence').select('*', { count: 'exact', head: true }).gte('last_seen', cutoff)

    // Fire-and-forget: dispara reconcile de pagamentos pendentes em background.
    // Endpoint internamente rate-limited (1 exec/minuto) entao varios pings nao
    // sobrecarregam. Garante que pagamentos orfaos sao capturados em ~30s mesmo
    // se o webhook do MP falhar.
    triggerReconcile(req)

    return NextResponse.json({ online: count || 0 })
  } catch (err) {
    return NextResponse.json({ online: 0 })
  }
}

export async function GET(req) {
  try {
    const sb = getClient()
    const cutoff = new Date(Date.now() - 300000).toISOString()
    const { count } = await sb.from('presence').select('*', { count: 'exact', head: true }).gte('last_seen', cutoff)
    triggerReconcile(req)
    return NextResponse.json({ online: count || 0 })
  } catch {
    return NextResponse.json({ online: 0 })
  }
}
