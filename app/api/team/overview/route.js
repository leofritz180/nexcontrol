import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// PAINEL DO OPERADOR LÍDER — overview da equipe (DS MENTORIA 2.0)
// Retorna operadores + metas + remessas APENAS da equipe do líder.
// Roda com service_role, mas com gate triplo: flag líder + tenant DS
// MENTORIA + equipe definida. Não afeta nenhuma outra conta.
// ─────────────────────────────────────────────────────────────

const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'
// Corte: líder só vê metas criadas a partir da CRIAÇÃO DA CONTA DELE
// (cada líder tem seu próprio corte = profiles.created_at)

export async function POST(req) {
  try {
    const { leader_id } = await req.json()
    if (!leader_id) return NextResponse.json({ error: 'Missing leader_id' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Confirmar que é líder da DS MENTORIA com equipe
    const { data: leader } = await sb.from('profiles')
      .select('id,nome,email,team,is_team_leader,tenant_id,role,created_at')
      .eq('id', leader_id).maybeSingle()
    if (!leader || !leader.is_team_leader || leader.tenant_id !== DS_MENTORIA_TENANT || !leader.team) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    // 2. Operadores da equipe (mesmo tenant + mesma equipe, não removidos)
    const { data: ops } = await sb.from('profiles')
      .select('id,nome,email,team,is_team_leader,created_at,removed_from_tenant_id')
      .eq('tenant_id', DS_MENTORIA_TENANT)
      .eq('team', leader.team)
    const teamOps = (ops || []).filter(o => !o.removed_from_tenant_id)
    const opIds = teamOps.map(o => o.id)

    if (opIds.length === 0) {
      return NextResponse.json({ leader: { id: leader.id, nome: leader.nome, email: leader.email, team: leader.team }, operators: [], metas: [], remessas: [] })
    }

    // 3. Metas da equipe (não deletadas)
    const { data: ms } = await sb.from('metas')
      .select('*')
      .eq('tenant_id', DS_MENTORIA_TENANT)
      .in('operator_id', opIds)
      .gte('created_at', leader.created_at)
      .order('created_at', { ascending: false })
    const metas = (ms || []).filter(m => !m.deleted_at)
    const metaIds = metas.map(m => m.id)

    // 4. Remessas dessas metas
    let remessas = []
    if (metaIds.length > 0) {
      const { data: rs } = await sb.from('remessas')
        .select('*')
        .in('meta_id', metaIds)
        .order('created_at', { ascending: false })
      remessas = rs || []
    }

    // 5. Custos da equipe (coluna `costs.team`). Resiliente: se a coluna ainda
    //    não existir, retorna [] e o painel segue funcionando.
    let costs = []
    try {
      const { data: cs, error: cErr } = await sb.from('costs')
        .select('*')
        .eq('tenant_id', DS_MENTORIA_TENANT)
        .eq('team', leader.team)
        .order('date', { ascending: false })
      if (!cErr) costs = cs || []
    } catch {}

    return NextResponse.json({
      leader: { id: leader.id, nome: leader.nome, email: leader.email, team: leader.team },
      operators: teamOps,
      metas,
      remessas,
      costs,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
