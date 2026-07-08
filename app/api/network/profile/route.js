import { NextResponse } from 'next/server'
import { authNetwork, computePublicProfile } from '../../../../lib/network-server'
import { VERIFIER_EMAILS } from '../../../../lib/network-access'

export const dynamic = 'force-dynamic'

// GET  /api/network/profile?user_id=<uuid>   -> perfil publico + stats + badges
// POST /api/network/profile  { bio, instagram }  -> edita o PROPRIO perfil publico
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb } = a
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') || a.user.id
  const profile = await computePublicProfile(sb, userId)
  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  return NextResponse.json({ profile, isMe: userId === a.user.id })
}

export async function POST(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb, user, isOwner, email } = a
  const body = await req.json().catch(() => ({}))
  const action = body.action || 'edit-self'

  // ── OWNER define a TAG de um usuario ──
  if (action === 'set-tag') {
    if (!isOwner) return NextResponse.json({ error: 'Só o admin master define tags.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const tag = body.tag != null ? String(body.tag).trim().slice(0, 24) : null
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, tag: tag || null }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── OWNER ou darkzin dao VERIFICADO ──
  if (action === 'set-verified') {
    if (!VERIFIER_EMAILS.has(email)) return NextResponse.json({ error: 'Sem permissão para verificar.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, verified: !!body.verified }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── EDITAR o proprio perfil (bio/instagram) ──
  const bio = body.bio != null ? String(body.bio).slice(0, 240) : undefined
  let instagram = body.instagram != null ? String(body.instagram).trim().replace(/^@/, '').slice(0, 60) : undefined
  const patch = { user_id: user.id }
  if (bio !== undefined) patch.bio = bio
  if (instagram !== undefined) patch.instagram = instagram || null
  const { error } = await sb.from('network_profiles').upsert(patch, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
