// ─────────────────────────────────────────────────────────────────────────
// NETWORK — helpers server-side (usados SO pelas API routes /api/network/*).
// Nunca importar no client: usa a service_role key.
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { networkEnabled, NETWORK_EMAILS, NETWORK_GA, FOUNDERS_LIMIT, socialBetaEnabled, NETWORK_SOCIAL_GA, canMentionAll } from './network-access'

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
  const socialBetaAllow = socialBetaEnabled(email)  // conta de teste (garante acesso mesmo sem PRO)

  // Acesso: allowlist (fase de teste) OU beta social OU rollout geral (GA) com admin PRO ativo.
  // Enquanto NETWORK_GA = false, so a allowlist libera (comportamento inalterado).
  let allowed = networkEnabled(email) || socialBetaAllow
  if (!allowed && NETWORK_GA) allowed = await hasActiveSubscription(sb, profile.tenant_id)
  if (!allowed) return { error: 'Network indisponivel para esta conta', status: 403 }

  // So admin (ou owner) participa — operador nunca.
  if (profile.role !== 'admin' && !isOwner) return { error: 'Somente admins participam do Network', status: 403 }

  // Banimento: usuario removido nao acessa (o owner nunca fica banido).
  if (!isOwner) {
    const { data: np } = await sb.from('network_profiles').select('banned').eq('user_id', user.id).maybeSingle()
    if (np?.banned === true) return { error: 'Você foi removido do Network.', status: 403 }
  }

  // Rollout: no GA social, TODOS os autorizados recebem a versao rede social.
  const socialBeta = NETWORK_SOCIAL_GA || socialBetaAllow
  return { user, profile, sb, isOwner, email, socialBeta, canMentionAll: canMentionAll(email) }
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

// Tenants com assinatura PRO ativa (usado no rollout geral).
async function activePaidTenantIds(sb) {
  const nowIso = new Date().toISOString()
  const [{ data: subs }, { data: tns }] = await Promise.all([
    sb.from('subscriptions').select('tenant_id,expires_at').eq('status', 'active'),
    sb.from('tenants').select('id,subscription_status').eq('subscription_status', 'active'),
  ])
  const set = new Set()
  for (const s of (subs || [])) if (!s.expires_at || s.expires_at > nowIso) set.add(s.tenant_id)
  for (const t of (tns || [])) set.add(t.id)
  return set
}

// Membros do Network. Allowlist + (se GA) todos os admins PRO ativos.
// Usado pra @mencao, diretorio e push de avisos.
export async function getMembers(sb) {
  const emails = [...NETWORK_EMAILS]
  let profs = []
  if (NETWORK_GA) {
    const tenantIds = await activePaidTenantIds(sb)
    // admins (allowlist OU de tenant PRO ativo)
    const { data: admins } = await sb.from('profiles').select('id,nome,email,tenant_id,role').eq('role', 'admin')
    profs = (admins || []).filter(p => tenantIds.has(p.tenant_id) || emails.includes((p.email || '').toLowerCase()))
  } else {
    const { data } = await sb.from('profiles').select('id,nome,email').in('email', emails)
    profs = data || []
  }
  const ids = profs.map(p => p.id)
  const { data: nps } = ids.length ? await sb.from('network_profiles').select('user_id,avatar_url,instagram').in('user_id', ids) : { data: [] }
  const npById = {}; (nps || []).forEach(n => { npById[n.user_id] = n })
  return profs.map(p => ({ id: p.id, name: displayName(p, npById[p.id]), avatar: npById[p.id]?.avatar_url || null, color: colorFromId(p.id) }))
}

// Selo FUNDADOR automatico pros primeiros a entrar (ate FOUNDERS_LIMIT).
export async function maybeGrantFounder(sb, userId, alreadyFounder) {
  try {
    if (alreadyFounder) return
    const { count } = await sb.from('network_profiles').select('user_id', { count: 'exact', head: true }).eq('founder', true)
    if ((count || 0) >= FOUNDERS_LIMIT) return
    await sb.from('network_profiles').upsert({ user_id: userId, founder: true }, { onConflict: 'user_id' })
  } catch {}
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
    sb.from('network_profiles').select('user_id,verified,founder,rank,tag,tag_color,avatar_url,instagram').in('user_id', ids),
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
      // OWNER: tag custom (se definiu) OU "OWNER" padrao; verificado sempre. Demais: do banco.
      tag: isOwner ? (np.tag || 'OWNER') : (np.tag || null),
      tagColor: np.tag_color || null,
      rank: np.rank || null,
      verified: isOwner ? true : !!np.verified,
      founder: isOwner ? false : !!np.founder,
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

// Perfil SIMULADO pras mensagens semente (fake_name). Numeros pequenos, plausiveis
// e DETERMINISTICOS pelo nome (sempre iguais ao reabrir). Sem dado real.
export function computeFakeProfile(name) {
  let h = 0; const s = String(name || '')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const rnd = salt => Math.abs(Math.sin((h + salt) * 12.9898) * 43758.5453) % 1
  const between = (min, max, salt) => Math.round(min + rnd(salt) * (max - min))
  const operadores = between(1, 5, 1)
  const depositantes = between(40, 780, 2)
  const networkScore = between(1, 28, 3)
  const ranks = ['Iniciante', 'Avançado', 'Mestre']
  const rank = ranks[Math.min(ranks.length - 1, Math.floor(rnd(4) * ranks.length))]
  const monthsAgo = between(1, 8, 5)
  const since = new Date(Date.now() - monthsAgo * 30 * 86400000).toISOString()
  const badges = []
  if (rank === 'Mestre') badges.push({ key: 'mestre', label: 'Mestre', tone: 'red' })
  if (monthsAgo >= 4) badges.push({ key: 'antigo', label: 'Antigo na Dash', tone: 'purple' })
  return {
    id: 'fake:' + name, name, color: colorFromId('fake:' + name), avatar: null, fake: true,
    mute: { muted: false }, banned: false, tag: null, rank,
    verified: false, founder: false, veterano: false, bio: null, instagram: null,
    since, operadores, depositantes, networkScore, badges,
  }
}

// Perfil publico completo (stats agregadas via service_role, SEM dados sensiveis).
// opts.full = tambem calcula extras premium do modo social (maior lucro/meta,
// galeria de Resultados, conquistas). So passar full quando o solicitante e beta.
export async function computePublicProfile(sb, userId, opts = {}) {
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
  const founder = isOwner ? false : !!np?.founder // owner nunca mostra Veterano
  const badges = buildBadges({ p, np: { ...np, verified, founder }, operadores, metasFechadas, depositantes, rank })
  const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / DAY : 0

  const base = {
    id: p.id,
    name: displayName(p, np),
    color: colorFromId(p.id),
    avatar: np?.avatar_url || null,
    mute: muteInfo(np),
    banned: !!np?.banned,
    tag: isOwner ? (np?.tag || 'OWNER') : (np?.tag || null),
    tagColor: np?.tag_color || null,
    rank,
    verified,
    founder,
    veterano: ageDays >= 60,
    bio: np?.bio || null,
    instagram: np?.instagram || null,
    since: p.created_at || null,
    operadores,
    depositantes,
    metasFechadas,
    networkScore: netScore,
    badges,
  }

  // ── Extras do modo SOCIAL (so quando full; nao expostos no perfil padrao) ──
  if (opts.full) {
    // Maior lucro registrado (financeiro — so aparece no perfil premium beta)
    let maiorLucro = 0
    try {
      const { data: lucros } = await sb.from('metas').select('lucro_final').eq('tenant_id', tid).is('deleted_at', null)
      for (const l of (lucros || [])) maiorLucro = Math.max(maiorLucro, Number(l.lucro_final || 0))
    } catch {}
    // Galeria: ultimas fotos publicadas no canal Resultados
    let gallery = []
    try {
      const { data: chRes } = await sb.from('network_channels').select('id').eq('key', 'resultados').maybeSingle()
      if (chRes?.id) {
        const { data: posts } = await sb.from('network_messages')
          .select('id,image_url,created_at').eq('channel_id', chRes.id).eq('author_id', userId)
          .not('image_url', 'is', null).is('deleted_at', null)
          .order('created_at', { ascending: false }).limit(9)
        gallery = (posts || []).map(m => ({ id: m.id, image: m.image_url }))
      }
    } catch {}
    base.maiorLucro = maiorLucro
    base.maiorMeta = maiorMeta
    base.gallery = gallery
    base.achievements = buildAchievements({ metasFechadas, depositantes, operadores, maiorLucro, rank, founder, ageDays, networkScore: netScore })
    base.teamSize = operadores + 1
  }

  return base
}

// Conquistas (achievements) derivadas das stats — exibidas como selos no perfil social.
export function buildAchievements({ metasFechadas, depositantes, operadores, maiorLucro, rank, founder, ageDays, networkScore }) {
  const A = []
  const push = (key, icon, label, desc, unlocked) => A.push({ key, icon, label, desc, unlocked: !!unlocked })
  push('primeira_meta', '🏆', 'Primeira Meta', 'Fechou a 1ª meta', metasFechadas >= 1)
  push('metas_100', '🥇', '100 Metas', 'Fechou 100 metas', metasFechadas >= 100)
  push('lucro_10k', '💰', '10K', 'R$ 10 mil de lucro numa meta', (maiorLucro || 0) >= 10000)
  push('dep_1000', '🚀', '1000 Depositantes', '1.000 depositantes processados', (depositantes || 0) >= 1000)
  push('apex', '👑', 'APEX', 'Alcançou o rank máximo', rank === 'APEX')
  push('top_network', '🔥', 'Top Network', 'Alto engajamento na comunidade', (networkScore || 0) >= 50)
  push('operacao_grande', '🎯', 'Operação Grande', '10+ operadores na equipe', (operadores || 0) >= 10)
  push('veterano', '⭐', 'Veterano', 'Entre os primeiros da comunidade', !!founder)
  return A
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
  if (np?.founder) out.push({ key: 'pioneiro', label: '👑 Veterano', tone: 'gold' })
  const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / 86400000 : 0
  if (ageDays >= 60) out.push({ key: 'antigo', label: 'Antigo na Dash', tone: 'purple' })
  if (rank === 'APEX') out.push({ key: 'apex', label: 'APEX', tone: 'red' })
  else if (rank === 'Elite') out.push({ key: 'elite', label: 'Elite', tone: 'red' })
  else if (rank === 'Mestre') out.push({ key: 'mestre', label: 'Mestre', tone: 'red' })
  if (operadores >= 10) out.push({ key: 'equipe10', label: 'Equipe 10+', tone: 'green' })
  if (depositantes >= 3000) out.push({ key: 'grande', label: 'Operação Grande', tone: 'green' })
  return out
}
