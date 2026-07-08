import { NextResponse } from 'next/server'
import { authNetwork, computePublicProfile, computeFakeProfile, uploadImage, logMod, displayName } from '../../../../lib/network-server'
import { VERIFIER_EMAILS, OWNER_EMAIL } from '../../../../lib/network-access'

export const dynamic = 'force-dynamic'

// Nome exibido de um usuario (pra registrar no log de moderacao). Fetch minimo.
async function nameOf(sb, userId) {
  if (!userId) return null
  const [{ data: p }, { data: np }] = await Promise.all([
    sb.from('profiles').select('nome,email').eq('id', userId).maybeSingle(),
    sb.from('network_profiles').select('instagram').eq('user_id', userId).maybeSingle(),
  ])
  return displayName(p, np)
}

// GET  /api/network/profile?user_id=<uuid>   -> perfil publico + stats + badges
// POST /api/network/profile  { bio, instagram }  -> edita o PROPRIO perfil publico
export async function GET(req) {
  const a = await authNetwork(req)
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status })
  const { sb } = a
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') || a.user.id
  // Perfil de mensagem semente (fake) -> perfil simulado
  if (userId.startsWith('fake:')) {
    return NextResponse.json({ profile: computeFakeProfile(userId.slice(5)), isMe: false })
  }
  const profile = await computePublicProfile(sb, userId, { full: !!a.socialBeta })
  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  return NextResponse.json({ profile, isMe: userId === a.user.id, socialBeta: !!a.socialBeta })
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
    const patch = { user_id: target, tag: tag || null }
    if ('color' in body) patch.tag_color = (body.color && /^#[0-9a-fA-F]{6}$/.test(body.color)) ? body.color : null
    const { error } = await sb.from('network_profiles').upsert(patch, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: 'set_tag', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id), reason: tag || 'removida' })
    return NextResponse.json({ ok: true })
  }

  // ── OWNER concede/remove o selo VETERANO (founder) ──
  if (action === 'set-founder') {
    if (!isOwner) return NextResponse.json({ error: 'Só o admin master define o selo Veterano.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const grant = !!body.founder
    // Ao remover, trava (founder_revoked) pra não ser reconcedido no próximo feed.
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, founder: grant, founder_revoked: !grant }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: grant ? 'grant_veterano' : 'remove_veterano', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id) })
    return NextResponse.json({ ok: true })
  }

  // ── OWNER silencia (castigo de fala) ──
  if (action === 'mute') {
    if (!isOwner) return NextResponse.json({ error: 'Só o admin master pode silenciar.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    if (target === user.id) return NextResponse.json({ error: 'Você não pode se silenciar.' }, { status: 400 })
    let until
    if (body.permanent) until = '2099-01-01T00:00:00Z'
    else { const min = Number(body.minutes); if (!(min > 0)) return NextResponse.json({ error: 'Duração inválida' }, { status: 400 }); until = new Date(Date.now() + min * 60000).toISOString() }
    const reason = body.reason ? String(body.reason).slice(0, 120) : null
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, muted_until: until, mute_reason: reason }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: 'mute', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id), reason })
    return NextResponse.json({ ok: true })
  }
  if (action === 'unmute') {
    if (!isOwner) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, muted_until: null, mute_reason: null }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: 'unmute', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id) })
    return NextResponse.json({ ok: true })
  }

  // ── OWNER ou darkzin dao VERIFICADO ──
  if (action === 'set-verified') {
    if (!VERIFIER_EMAILS.has(email)) return NextResponse.json({ error: 'Sem permissão para verificar.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const verified = !!body.verified
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, verified }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: verified ? 'verify' : 'unverify', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id) })
    return NextResponse.json({ ok: true })
  }

  // ── OWNER bane / desbane (remove do Network) ──
  if (action === 'ban') {
    if (!isOwner) return NextResponse.json({ error: 'Só o admin master pode remover.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    if (target === user.id) return NextResponse.json({ error: 'Você não pode se remover.' }, { status: 400 })
    // Nunca banir a conta do owner.
    const { data: tp } = await sb.from('profiles').select('email').eq('id', target).maybeSingle()
    if ((tp?.email || '').toLowerCase() === OWNER_EMAIL) return NextResponse.json({ error: 'Não é possível remover o dono.' }, { status: 400 })
    const reason = body.reason ? String(body.reason).slice(0, 120) : null
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, banned: true }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: 'ban', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id), reason })
    return NextResponse.json({ ok: true })
  }
  if (action === 'unban') {
    if (!isOwner) return NextResponse.json({ error: 'Só o admin master pode reverter.' }, { status: 403 })
    const target = body.target_user_id
    if (!target) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const { error } = await sb.from('network_profiles').upsert({ user_id: target, banned: false }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logMod(sb, { action: 'unban', targetId: target, targetName: await nameOf(sb, target), actorId: user.id, actorName: await nameOf(sb, user.id) })
    return NextResponse.json({ ok: true })
  }

  // ── EDITAR o proprio perfil (foto/bio/instagram) ──
  const bio = body.bio != null ? String(body.bio).slice(0, 240) : undefined
  let instagram = body.instagram != null ? String(body.instagram).trim().replace(/^@/, '').slice(0, 60) : undefined
  const patch = { user_id: user.id }
  if (bio !== undefined) patch.bio = bio
  if (instagram !== undefined) patch.instagram = instagram || null
  // Foto de perfil: nova (data URL) faz upload; null remove; undefined mantem.
  if (body.avatar === null) {
    patch.avatar_url = null
  } else if (typeof body.avatar === 'string' && body.avatar.startsWith('data:')) {
    const up = await uploadImage(sb, 'avatars', body.avatar, { fixedName: user.id, upsert: true })
    if (up.error) return NextResponse.json({ error: up.error }, { status: 400 })
    // cache-bust pra a foto nova aparecer na hora (mesmo path sobrescrito)
    patch.avatar_url = up.url + '?v=' + Date.now()
  }
  const { error } = await sb.from('network_profiles').upsert(patch, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
