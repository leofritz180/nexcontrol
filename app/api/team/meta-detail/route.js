import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// PAINEL DO LÍDER — detalhe da meta (remessas + timeline)
// Gate triplo + corte de data. Só metas da equipe do líder.
// ─────────────────────────────────────────────────────────────

const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'
const TEAM_METAS_SINCE = '2026-06-15T11:54:00Z'

export async function POST(req) {
  try {
    const { leader_id, meta_id } = await req.json()
    if (!leader_id || !meta_id) return NextResponse.json({ error: 'Missing leader_id/meta_id' }, { status: 400 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: leader } = await sb.from('profiles')
      .select('id,team,is_team_leader,tenant_id').eq('id', leader_id).maybeSingle()
    if (!leader || !leader.is_team_leader || leader.tenant_id !== DS_MENTORIA_TENANT || !leader.team) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const { data: meta } = await sb.from('metas').select('*').eq('id', meta_id).maybeSingle()
    if (!meta || meta.tenant_id !== DS_MENTORIA_TENANT) return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 })
    if (meta.created_at && new Date(meta.created_at) < new Date(TEAM_METAS_SINCE)) {
      return NextResponse.json({ error: 'Meta fora do periodo' }, { status: 403 })
    }
    // Operador da meta tem que ser da equipe do líder (ou o próprio líder)
    if (meta.operator_id !== leader_id) {
      const { data: op } = await sb.from('profiles').select('team').eq('id', meta.operator_id).maybeSingle()
      if (!op || op.team !== leader.team) return NextResponse.json({ error: 'Meta fora da sua equipe' }, { status: 403 })
    }

    const [{ data: remessas }, { data: logs }] = await Promise.all([
      sb.from('remessas').select('*').eq('meta_id', meta_id).order('created_at', { ascending: true }),
      sb.from('activity_logs').select('*').eq('meta_id', meta_id).order('created_at', { ascending: false }).limit(50),
    ])

    return NextResponse.json({ meta, remessas: remessas || [], logs: logs || [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
