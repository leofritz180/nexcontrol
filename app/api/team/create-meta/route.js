import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// PAINEL DO LÍDER — criar meta (DS MENTORIA 2.0)
// O líder pode criar meta pra si mesmo OU pra um operador da SUA equipe.
// service_role + gate triplo (líder + tenant DS + mesma equipe).
// ─────────────────────────────────────────────────────────────

const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'

export async function POST(req) {
  try {
    const body = await req.json()
    const { leader_id, operator_id, titulo, plataforma, rede, quantidade_contas, observacoes, conta_link, conta_login, conta_senha } = body
    if (!leader_id || !operator_id) return NextResponse.json({ error: 'Missing leader_id/operator_id' }, { status: 400 })
    if (!titulo?.trim() || !plataforma?.trim() || !rede?.trim()) {
      return NextResponse.json({ error: 'Preencha título, plataforma e rede' }, { status: 400 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Confirmar líder
    const { data: leader } = await sb.from('profiles')
      .select('id,team,is_team_leader,tenant_id').eq('id', leader_id).maybeSingle()
    if (!leader || !leader.is_team_leader || leader.tenant_id !== DS_MENTORIA_TENANT || !leader.team) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    // 2. Operador alvo: o próprio líder OU alguém da mesma equipe
    let targetOk = operator_id === leader_id
    if (!targetOk) {
      const { data: op } = await sb.from('profiles').select('team,tenant_id').eq('id', operator_id).maybeSingle()
      targetOk = !!op && op.tenant_id === DS_MENTORIA_TENANT && op.team === leader.team
    }
    if (!targetOk) return NextResponse.json({ error: 'Operador fora da sua equipe' }, { status: 403 })

    // 3. operation_model do tenant
    const { data: tenant } = await sb.from('tenants').select('operation_model').eq('id', DS_MENTORIA_TENANT).maybeSingle()

    // 4. Cria a meta
    const { data: meta, error } = await sb.from('metas').insert({
      operator_id,
      titulo: titulo.trim(),
      observacoes: observacoes?.trim() || null,
      plataforma: plataforma.trim(),
      rede: rede.trim().toUpperCase(),
      quantidade_contas: Math.max(1, Math.floor(Number(quantidade_contas || 10))),
      status: 'ativa',
      tenant_id: DS_MENTORIA_TENANT,
      operation_model: tenant?.operation_model || 'salario_bau',
      conta_link: conta_link?.trim() || null,
      conta_login: conta_login?.trim() || null,
      conta_senha: conta_senha || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, meta })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
