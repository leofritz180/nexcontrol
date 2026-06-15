import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// EQUIPES / OPERADOR LÍDER — exclusivo DS MENTORIA 2.0
// Atribui um operador a uma equipe (campo `team`) e/ou marca como
// líder (`is_team_leader`). Líder é UNICO por equipe: ao marcar um
// novo líder, os demais da mesma equipe perdem a flag.
// Tudo gated ao tenant da DS MENTORIA 2.0 — não afeta outras contas.
// ─────────────────────────────────────────────────────────────

const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'

export async function POST(req) {
  try {
    const { admin_id, operator_id, team, is_leader } = await req.json()
    if (!admin_id || !operator_id) {
      return NextResponse.json({ error: 'Missing admin_id/operator_id' }, { status: 400 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Admin precisa ser admin do tenant DS MENTORIA
    const { data: admin } = await sb.from('profiles').select('id,role,tenant_id').eq('id', admin_id).maybeSingle()
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    if (admin.tenant_id !== DS_MENTORIA_TENANT) {
      return NextResponse.json({ error: 'Recurso indisponivel para esta conta' }, { status: 403 })
    }

    // 2. Operador precisa ser do MESMO tenant
    const { data: op } = await sb.from('profiles').select('id,role,tenant_id,team,is_team_leader').eq('id', operator_id).maybeSingle()
    if (!op) return NextResponse.json({ error: 'Operador nao encontrado' }, { status: 404 })
    if (op.tenant_id !== admin.tenant_id) return NextResponse.json({ error: 'Operador de outro tenant' }, { status: 403 })

    // Normaliza time: string limpa ou null (sem equipe)
    const teamVal = (typeof team === 'string' && team.trim()) ? team.trim() : null
    const wantLeader = !!is_leader && !!teamVal // só pode ser líder se tiver equipe

    // 3. Se vai virar líder, tira a flag de líder dos OUTROS da mesma equipe
    if (wantLeader) {
      await sb.from('profiles')
        .update({ is_team_leader: false })
        .eq('tenant_id', admin.tenant_id)
        .eq('team', teamVal)
        .neq('id', operator_id)
    }

    // 4. Aplica no operador
    const { error } = await sb.from('profiles')
      .update({ team: teamVal, is_team_leader: wantLeader })
      .eq('id', operator_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, team: teamVal, is_team_leader: wantLeader })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
