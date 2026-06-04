import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BETA_EMAILS = new Set(['leofritz180@gmail.com'])

// Modalidades aceitas — sincronizar com o frontend
const MODALIDADES = new Set([
  'metodo_novo',
  'delay_esportivo',
  'rodadas_gratis',
  'bonus',
  'kamikaze',
  'cashback',
  'arbitragem',
  'promo_casa',
  'outro',
])

function sbAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

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

function isBeta(user) { return user?.email && BETA_EMAILS.has(user.email.toLowerCase()) }

// GET — lista registros do tenant do user logado
export async function GET(req) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isBeta(user)) return NextResponse.json({ error: 'Feature em beta' }, { status: 403 })

  const sb = sbAdmin()
  const { data: prof } = await sb.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
  if (!prof?.tenant_id) return NextResponse.json({ items: [] })

  const { data: items } = await sb.from('metodos_registros')
    .select('id,modalidade,tipo,valor,descricao,created_at')
    .eq('tenant_id', prof.tenant_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(500)

  return NextResponse.json({ items: items || [] })
}

// POST — cria novo registro
export async function POST(req) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isBeta(user)) return NextResponse.json({ error: 'Feature em beta' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { modalidade, tipo, valor, descricao } = body

  if (!MODALIDADES.has(modalidade)) return NextResponse.json({ error: 'Modalidade invalida' }, { status: 400 })
  if (!['lucro', 'prejuizo'].includes(tipo)) return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
  const v = Number(valor)
  if (!Number.isFinite(v) || v <= 0) return NextResponse.json({ error: 'Valor invalido' }, { status: 400 })

  const sb = sbAdmin()
  const { data: prof } = await sb.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
  if (!prof?.tenant_id) return NextResponse.json({ error: 'Tenant nao encontrado' }, { status: 404 })

  const { data: inserted, error } = await sb.from('metodos_registros').insert({
    tenant_id: prof.tenant_id,
    user_id: user.id,
    modalidade, tipo,
    valor: Number(v.toFixed(2)),
    descricao: descricao ? String(descricao).slice(0, 280) : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, item: inserted })
}

// DELETE — soft delete por id (so o proprio tenant)
export async function DELETE(req) {
  const user = await authUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isBeta(user)) return NextResponse.json({ error: 'Feature em beta' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const sb = sbAdmin()
  const { data: prof } = await sb.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
  if (!prof?.tenant_id) return NextResponse.json({ error: 'Tenant nao encontrado' }, { status: 404 })

  const { error } = await sb.from('metodos_registros')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', prof.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
