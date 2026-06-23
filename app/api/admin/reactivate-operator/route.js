import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Reativa um operador que foi removido do tenant (inverso de remove-operator).
// Restaura tenant_id e limpa os campos removed_*.
//
// REGRA CRITICA: so reativa se o admin tiver VAGA PAGA livre.
// vaga = MAIOR operator_count entre subs ativas e nao expiradas.
// current = operadores ativos no tenant (tenant_id = admin.tenant_id, role=operator).
// Operadores removidos tem tenant_id=null, entao nao contam como ocupados.
// Reativar so e permitido quando current < limit.
export async function POST(req) {
  try {
    const { operator_id, admin_id } = await req.json()
    if (!operator_id || !admin_id) {
      return NextResponse.json({ error: 'operator_id e admin_id obrigatorios' }, { status: 400 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Valida: admin existe, eh admin, e o operador foi removido DESTE tenant
    const [{ data: admin }, { data: op }] = await Promise.all([
      sb.from('profiles').select('id, role, tenant_id').eq('id', admin_id).maybeSingle(),
      sb.from('profiles').select('id, role, tenant_id, nome, email, removed_from_tenant_id').eq('id', operator_id).maybeSingle(),
    ])

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin pode reativar operador' }, { status: 403 })
    }
    if (!admin.tenant_id) {
      return NextResponse.json({ error: 'Admin sem tenant valido' }, { status: 400 })
    }
    if (!op) {
      return NextResponse.json({ error: 'Operador nao encontrado' }, { status: 404 })
    }
    if (op.role !== 'operator') {
      return NextResponse.json({ error: 'Profile alvo nao eh operador' }, { status: 400 })
    }
    // So reativa quem foi removido EXATAMENTE deste tenant
    if (op.removed_from_tenant_id !== admin.tenant_id) {
      return NextResponse.json({ error: 'Este operador nao foi removido da sua equipe' }, { status: 403 })
    }
    // Se ja esta vinculado a algum tenant, nao reativa por cima
    if (op.tenant_id) {
      return NextResponse.json({ error: 'Operador ja esta ativo em uma equipe' }, { status: 409 })
    }

    const tenantId = admin.tenant_id

    // ── CHECA VAGA PAGA ──────────────────────────────────────────────
    // Mesma regra do sendInvite/operator-limit: limite = MAX(operator_count)
    // entre subs ativas e nao expiradas; current = operadores ativos do tenant.
    const now = new Date()
    const [{ data: activeSubs }, { count: currentOps }] = await Promise.all([
      sb.from('subscriptions')
        .select('operator_count, expires_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'active'),
      sb.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'operator'),
    ])

    const validLimits = (activeSubs || [])
      .filter(s => !s.expires_at || new Date(s.expires_at) > now)
      .map(s => Number(s.operator_count || 0))

    if (validLimits.length === 0) {
      return NextResponse.json({
        error: 'Voce nao tem uma assinatura ativa. Renove para reativar operadores.',
        code: 'no_active_sub',
      }, { status: 402 })
    }

    const limit = Math.max(...validLimits)
    const current = currentOps || 0
    if (current >= limit) {
      return NextResponse.json({
        error: `Sem vaga paga: seu plano inclui ${limit} operador${limit !== 1 ? 'es' : ''} e voce ja tem ${current} ativo${current !== 1 ? 's' : ''}. Adicione uma vaga na Assinatura para reativar este operador.`,
        code: 'no_slot',
        limit,
        current,
      }, { status: 409 })
    }

    // ── REATIVA: restaura tenant_id e limpa os campos removed_* ───────
    const { error: updErr } = await sb.from('profiles').update({
      tenant_id: tenantId,
      removed_from_tenant_id: null,
      removed_from_tenant_at: null,
      removed_by: null,
    }).eq('id', operator_id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      reactivated: {
        operator_id,
        operator_email: op.email,
        operator_name: op.nome,
        tenant_id: tenantId,
        limit,
        current: current + 1,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
