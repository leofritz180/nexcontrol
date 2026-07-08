// ─────────────────────────────────────────────────────────────────────────
// NETWORK — helpers server-side (usados SO pelas API routes /api/network/*).
// Nunca importar no client: usa a service_role key.
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { networkEnabled, NETWORK_EMAILS, NETWORK_GA } from './network-access'

const OWNER_EMAIL = 'leofritz180@gmail.com'

// fetch que NUNCA cacheia — o App Router do Next.js cacheia fetch por padrao,
// e o supabase-js usa fetch por baixo. Sem isso, as leituras (GET) do feed
// vinham do cache (mensagens novas nao apareciam ate o cache expirar).
const noStoreFetch = (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' })

// Client com service_role (ignora RLS) — so no servidor. Sempre sem cache.
export function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  })
}

// Sobe um data URL de imagem pro bucket "network" e devolve a URL publica.
// upsert=true + path fixo (ex: avatar) sobrescreve; senao gera nome unico.
export async function uploadImage(sb, folder, dataUrl, opts = {}) {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/i.exec(dataUrl || '')
  if (!m) return { error: 'Imagem inválida' }
  const contentType = m[1]
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2]
  const buf = Buffer.from(m[3], 'base64')
  if (buf.length > 6 * 1024 * 1024) return { error: 'Imagem muito grande (máx 6MB)' }
  const name = opts.fixedName ? `${opts.fixedName}.${ext}` : `${crypto.randomUUID()}.${ext}`
  const path = `${folder}/${name}`
  const { error } = await sb.storage.from('network').upload(path, buf, { contentType, upsert: !!opts.upsert })
  if (error) return { error: 'Falha no upload da imagem' }
  const { data } = sb.storage.from('network').getPublicUrl(path)
  return { url: data?.publicUrl }
}

// Valida o token do usuario logado (anon client) e devolve o user.
async function getUserFromReq(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false }, global: { headers: { Authorization: 'Bearer ' + token }, fetch: noStoreFetch } }
  )
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

// Verdadeiro se o tenant tem assinatura PRO ativa (usado no rollout geral).
// Regra: linha ativa em `subscriptions` (expires_at nulo ou futuro) OU
// `tenants.subscription_status === 'active'`.
async function hasActiveSubscription(sb, tenantId) {
  if (!tenantId) return false
  const { data: subs } = await sb.from('subscriptions')
    .select('status,expires_at').eq('tenant_id', tenantId).eq('status', 'active')
  const now = Date.now()
  if ((subs || []).some(s => !s.expires_at || new Date(s.expires_at).getTime() > now)) return true
  const { data: t } = await sb.from('tenants').select('subscription_status').eq('id', tenantId).maybeSingle()
  return t?.subscription_status === 'active'
}

// Autoriza acesso ao Network: token valido -> admin -> allowlist (ou PRO no GA).
// Retorna { user, profile, sb, isOwner } OU { error, status }.
export async function authNetwork(req) {
  const user = await getUserFromReq(req)
  if (!user?.id) return { error: 'Nao autenticado', status: 401 }
  const email = (user.email || '').toLowerCase()

  const sb = svc()
  const { data: profile } = await sb.from('profiles').select('id,email,nome,role,tenant_id,created_at').eq('id', user.id).maybeSingle()
  if (!profile) return { error: 'Perfil nao encontrado', status: 404 }
  const isOwner = email === OWNER_EMAIL

  // Acesso: allowlist (fase de teste) OU rollout geral (GA) com admin PRO ativo.
  // Enquanto NETWORK_GA = false, so a allowlist libera (comportamento inalterado).
  let allowed = networkEnabled(email)
  if (!allowed && NETWORK_GA) allowed = await hasActiveSubscription(sb, profile.tenant_id)
  if (!allowed) return { error: 'Network indisponivel para esta conta', status: 403 }

  // So admin (ou owner) participa — operador nunca.
  if (profile.role !== 'admin' && !isOwner) return { error: 'Somente admins participam do Network', status: 403 }

  // Banimento: usuario removido nao acessa (o owner nunca fica banido).
  if (!isOwner) {
    const { data: np } = await sb.from('network_profiles').select('banned').eq('user_id', user.id).maybeSingle()
    if (np?.banned === true) return { error: 'Você foi removido do Network.', status: 403 }
  }

  return { user, profile, sb, isOwner, email }
}

// Nome publico (nunca expoe email cru; usa nome ou o handle antes do @).
export function publicName(p) {
  return (p?.nome && String(p.nome).trim()) || String(p?.email || 'admin').split('@')[0]
}

// Nome EXIBIDO no chat: se o admin definiu um @ (instagram) no perfil, esse @ vira
// o nome dele nas mensagens. Senao, cai no nome publico.
export function displayName(p, np) {
  const ig = np?.instagram && String(np.instagram).trim()
  return ig ? '@' + ig : publicName(p)
}

// Status de silenciamento (castigo de fala). muted_until >2099 = permanente.
export function muteInfo(np) {
  const until = np?.muted_until ? new Date(np.muted_until) : null
  const muted = !!(until && until > new Date())
  return {
    muted,
    until: muted ? np.muted_until : null,
    reason: muted ? (np.mute_reason || null) : null,
    permanent: muted && until.getFullYear() >= 2099,
  }
}

// Registra uma acao de moderacao no log (nunca lanca — moderar nao pode quebrar).
// action = slug curto: 'mute','unmute','ban','unban','verify','unverify','set_tag'.
export async function logMod(sb, { action, targetId, targetName, actorId, actorName, reason }) {
  try {
    await sb.from('network_mod_log').insert({
      action,
      target_id: targetId || null,
      target_name: targetName || null,
      actor_id: actorId || null,
      actor_name: actorName || null,
      reason: reason || null,
    })
  } catch {}
}

// Membros do Network (fase de teste = allowlist). Usado pra menção e push de avisos.
// No rollout geral, trocar por "admins PRO ativos".
export async function getMembers(sb) {
  const emails = [...NETWORK_EMAILS]
  const [{ data: profs }, { data: nps }] = await Promise.all([
    sb.from('profiles').select('id,nome,email').in('email', emails),
    sb.from('network_profiles').select('user_id,avatar_url,instagram'),
  ])
  const npById = {}; (nps || []).forEach(n => { npById[n.user_id] = n })
  return (profs || []).map(p => ({ id: p.id, name: displayName(p, npById[p.id]), avatar: npById[p.id]?.avatar_url || null, color: colorFromId(p.id) }))
}

// Rank derivado por metas fechadas (override manual em network_profiles.rank vence).
export function deriveRank(metasFechadas, override) {
  if (override) return override
  const n = Number(metasFechadas || 0)
  if (n >= 150) return 'APEX'
  if (n >= 80) return 'Elite'
  if (n >= 30) return 'Mestre'
  if (n >= 10) return 'Avançado'
  return 'Iniciante'
}

const DAY = 86400000

// Marca presenca do usuario (poll do feed).
export async function touchPresence(sb, userId) {
  try {
    await sb.from('network_profiles').upsert(
      { user_id: userId, last_active: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  } catch {}
}

// Info leve do autor pra exibir no chat (sem stats pesadas).
// authorIds: array de uuids. Retorna { [id]: {id,name,rank,verified,founder,veterano,color} }
export async function buildAuthorMap(sb, authorIds) {
  const ids = [...new Set(authorIds.filter(Boolean))]
  const map = {}
  if (!ids.length) return map
  const [{ data: profs }, { data: nps }] = await Promise.all([
    sb.from('profiles').select('id,nome,email,created_at').in('id', ids),
    sb.from('network_profiles').select('user_id,verified,founder,rank,tag,avatar_url,instagram').in('user_id', ids),
  ])
  const npById = {}; (nps || []).forEach(n => { npById[n.user_id] = n })
  for (const p of (profs || [])) {
    const np = npById[p.id] || {}
    const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / DAY : 0
    const isOwner = (p.email || '').toLowerCase() === OWNER_EMAIL
    map[p.id] = {
      id: p.id,
      name: displayName(p, np),
      avatar: np.avatar_url || null,
      // OWNER: tag fixa "OWNER" + verificado sempre. Demais: tag/verified do banco.
      tag: isOwner ? 'OWNER' : (np.tag || null),
      rank: np.rank || null,
      verified: isOwner ? true : !!np.verified,
      founder: !!np.founder,
      veterano: ageDays >= 60,
      color: colorFromId(p.id),
    }
  }
  return map
}

// Cor estavel a partir do id (avatar por inicial).
export function colorFromId(id) {
  const palette = ['#e53935', '#22C55E', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316']
  let h = 0
  const s = String(id || '')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

// Perfil publico completo (stats agregadas via service_role, SEM dados sensiveis).
export async function computePublicProfile(sb, userId) {
  const { data: p } = await sb.from('profiles').select('id,nome,email,role,tenant_id,created_at').eq('id', userId).maybeSingle()
  if (!p) return null
  const tid = p.tenant_id
  const { data: np } = await sb.from('network_profiles').select('*').eq('user_id', userId).maybeSingle()

  // Stats da operacao (publicas, nao-financeiras)
  const [opsRes, closedRes, remessasRes, netScore] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('role', 'operator').is('removed_from_tenant_id', null),
    sb.from('metas').select('rede,quantidade_contas,status_fechamento,deleted_at').eq('tenant_id', tid).is('deleted_at', null),
    sb.from('remessas').select('contas_remessa').eq('tenant_id', tid),
    computeNetworkScore(sb, userId),
  ])
  const operadores = opsRes.count || 0
  const metas = closedRes.data || []
  const metasFechadas = metas.filter(m => m.status_fechamento === 'fechada').length
  const redeCount = {}
  let maiorMeta = 0
  for (const m of metas) {
    if (m.rede) redeCount[m.rede] = (redeCount[m.rede] || 0) + 1
    maiorMeta = Math.max(maiorMeta, Number(m.quantidade_contas || 0))
  }
  const redes = Object.entries(redeCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r)
  const depositantes = (remessasRes.data || []).reduce((a, r) => a + Number(r.contas_remessa || 0), 0)

  const isOwner = (p.email || '').toLowerCase() === OWNER_EMAIL
  const rank = deriveRank(metasFechadas, np?.rank)
  const verified = isOwner ? true : !!np?.verified
  const badges = buildBadges({ p, np: { ...np, verified }, operadores, metasFechadas, depositantes, rank })
  const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / DAY : 0

  return {
    id: p.id,
    name: displayName(p, np),
    color: colorFromId(p.id),
    avatar: np?.avatar_url || null,
    mute: muteInfo(np),
    banned: !!np?.banned,
    tag: isOwner ? 'OWNER' : (np?.tag || null),
    rank,
    verified,
    founder: !!np?.founder,
    veterano: ageDays >= 60,
    bio: np?.bio || null,
    instagram: np?.instagram || null,
    since: p.created_at || null,
    operadores,
    depositantes,
    networkScore: netScore,
    badges,
  }
}

// network_score = mensagens enviadas + reacoes recebidas
export async function computeNetworkScore(sb, userId) {
  const [{ count: msgs }, myMsgs] = await Promise.all([
    sb.from('network_messages').select('id', { count: 'exact', head: true }).eq('author_id', userId).is('deleted_at', null),
    sb.from('network_messages').select('id').eq('author_id', userId).is('deleted_at', null),
  ])
  const ids = (myMsgs.data || []).map(m => m.id)
  let reacts = 0
  if (ids.length) {
    const { count } = await sb.from('network_reactions').select('id', { count: 'exact', head: true }).in('message_id', ids)
    reacts = count || 0
  }
  return (msgs || 0) + reacts
}

// Selos visuais a partir das stats.
export function buildBadges({ p, np, operadores, metasFechadas, depositantes, rank }) {
  const out = []
  if (np?.verified) out.push({ key: 'verificado', label: 'Verificado', tone: 'blue' })
  if (np?.founder) out.push({ key: 'fundador', label: 'Fundador', tone: 'gold' })
  const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / 86400000 : 0
  if (ageDays >= 120) out.push({ key: 'veterano', label: 'Veterano', tone: 'purple' })
  else if (ageDays >= 60) out.push({ key: 'antigo', label: 'Antigo na Dash', tone: 'purple' })
  if (rank === 'APEX') out.push({ key: 'apex', label: 'APEX', tone: 'red' })
  else if (rank === 'Elite') out.push({ key: 'elite', label: 'Elite', tone: 'red' })
  else if (rank === 'Mestre') out.push({ key: 'mestre', label: 'Mestre', tone: 'red' })
  if (operadores >= 10) out.push({ key: 'equipe10', label: 'Equipe 10+', tone: 'green' })
  if (depositantes >= 3000) out.push({ key: 'grande', label: 'Operação Grande', tone: 'green' })
  return out
}
