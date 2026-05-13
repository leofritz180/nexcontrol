import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Remove operador do tenant SEM apagar o profile.
// Mantem historico de metas/remessas/lucros — apenas desvincula o operador
// (tenant_id=null) e marca quem removeu / quando / de qual tenant.
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

    // Valida: admin existe, eh admin, e o operador eh do mesmo tenant
    const [{ data: admin }, { data: op }] = await Promise.all([
      sb.from('profiles').select('id, role, tenant_id').eq('id', admin_id).maybeSingle(),
      sb.from('profiles').select('id, role, tenant_id, nome, email').eq('id', operator_id).maybeSingle(),
    ])

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin pode remover operador' }, { status: 403 })
    }
    if (!op) {
      return NextResponse.json({ error: 'Operador nao encontrado' }, { status: 404 })
    }
    if (op.role !== 'operator') {
      return NextResponse.json({ error: 'Profile alvo nao eh operador' }, { status: 400 })
    }
    if (op.tenant_id !== admin.tenant_id) {
      return NextResponse.json({ error: 'Operador nao pertence ao seu tenant' }, { status: 403 })
    }

    const tenantId = op.tenant_id
    const now = new Date().toISOString()

    // Desvincula: tenant_id=null + marca historico
    const { error: updErr } = await sb.from('profiles').update({
      tenant_id: null,
      removed_from_tenant_id: tenantId,
      removed_from_tenant_at: now,
      removed_by: admin_id,
    }).eq('id', operator_id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      removed: {
        operator_id,
        operator_email: op.email,
        operator_name: op.nome,
        tenant_id: tenantId,
        removed_at: now,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
