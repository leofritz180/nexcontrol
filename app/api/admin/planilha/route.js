import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const OWNER_EMAIL = 'leofritz180@gmail.com'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function auth(email) {
  if (email !== OWNER_EMAIL) return null
  const { data } = await sb().from('profiles').select('id,tenant_id,role').eq('email', email).maybeSingle()
  return data?.role === 'admin' ? data : null
}

// GET: listar
export async function GET(req) {
  const email = req.nextUrl.searchParams.get('email')
  const prof = await auth(email)
  if (!prof) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await sb()
    .from('admin_planilha').select('*')
    .eq('tenant_id', prof.tenant_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data || [] })
}

// POST: upsert (create ou update)
export async function POST(req) {
  const { email, row } = await req.json()
  const prof = await auth(email)
  if (!prof) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Calcula lucro_final automaticamente
  const prej = Number(row.prejuizo || 0)
  const custos = Number(row.custos || 0)
  const salBau = Number(row.salario_bau || 0)
  const lucro = salBau - prej - custos
  const status = row.status || 'pendente'
  const payload = {
    ...row,
    tenant_id: prof.tenant_id,
    prejuizo: prej,
    custos,
    salario_bau: salBau,
    lucro_final: Number(lucro.toFixed(2)),
    status,
    concluido: status === 'concluido',
    updated_at: new Date().toISOString(),
  }
  delete payload.created_at

  let result
  if (row.id) {
    const { data, error } = await sb().from('admin_planilha')
      .update(payload).eq('id', row.id).eq('tenant_id', prof.tenant_id).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    payload.tenant_id = prof.tenant_id
    const { data, error } = await sb().from('admin_planilha')
      .insert(payload).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }
  return NextResponse.json({ ok: true, row: result })
}

// DELETE
export async function DELETE(req) {
  const { email, id } = await req.json()
  const prof = await auth(email)
  if (!prof) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { error } = await sb().from('admin_planilha').delete().eq('id', id).eq('tenant_id', prof.tenant_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
