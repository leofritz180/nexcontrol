import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// PAINEL DO LÍDER — custos da equipe (DS MENTORIA 2.0)
// add / delete de custos tagueados com a equipe do líder (costs.team).
// service_role + gate triplo. Não afeta custos de outras contas/equipes.
// ─────────────────────────────────────────────────────────────

const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'

async function getLeader(sb, leader_id) {
  const { data: leader } = await sb.from('profiles')
    .select('id,team,is_team_leader,tenant_id').eq('id', leader_id).maybeSingle()
  if (!leader || !leader.is_team_leader || leader.tenant_id !== DS_MENTORIA_TENANT || !leader.team) return null
  return leader
}

export async function POST(req) {
  try {
    const { leader_id, action, type, amount, date, note, cost_id } = await req.json()
    if (!leader_id) return NextResponse.json({ error: 'Missing leader_id' }, { status: 400 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const leader = await getLeader(sb, leader_id)
    if (!leader) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

    if (action === 'delete') {
      if (!cost_id) return NextResponse.json({ error: 'Missing cost_id' }, { status: 400 })
      // Só deleta custo da própria equipe
      const { error } = await sb.from('costs').delete()
        .eq('id', cost_id).eq('tenant_id', DS_MENTORIA_TENANT).eq('team', leader.team)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // add
    const amt = Number(amount)
    if (!amt || amt <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    const { data, error } = await sb.from('costs').insert({
      tenant_id: DS_MENTORIA_TENANT,
      team: leader.team,
      type: type || 'outros',
      amount: amt,
      date: date || new Date().toISOString().slice(0, 10),
      note: note?.trim() || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, cost: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
