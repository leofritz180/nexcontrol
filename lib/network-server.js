// ─────────────────────────────────────────────────────────────────────────
// NETWORK — helpers server-side (usados SO pelas API routes /api/network/*).
// Nunca importar no client: usa a service_role key.
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
import { networkEnabled } from './network-access'

const OWNER_EMAIL = 'leofritz180@gmail.com'

// Client com service_role (ignora RLS) — so no servidor.
export function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Valida o token do usuario logado (anon client) e devolve o user.
async function getUserFromReq(req) {
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

// Autoriza acesso ao Network: token valido -> admin -> allowlist.
// Retorna { user, profile, sb, isOwner } OU { error, status }.
export async function authNetwork(req) {
  const user = await getUserFromReq(req)
  if (!user?.id) return { error: 'Nao autenticado', status: 401 }
  const email = (user.email || '').toLowerCase()
  if (!networkEnabled(email)) return { error: 'Network indisponivel para esta conta', status: 403 }

  const sb = svc()
  const { data: profile } = await sb.from('profiles').select('id,email,nome,role,tenant_id,created_at').eq('id', user.id).maybeSingle()
  if (!profile) return { error: 'Perfil nao encontrado', status: 404 }
  const isOwner = email === OWNER_EMAIL
  // So admin (ou owner) participa — operador nunca.
  if (profile.role !== 'admin' && !isOwner) return { error: 'Somente admins participam do Network', status: 403 }

  return { user, profile, sb, isOwner, email }
}

// Nome publico (nunca expoe email cru; usa nome ou o handle antes do @).
export function publicName(p) {
  return (p?.nome && String(p.nome).trim()) || String(p?.email || 'admin').split('@')[0]
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
    sb.from('network_profiles').select('user_id,verified,founder,rank').in('user_id', ids),
  ])
  const npById = {}; (nps || []).forEach(n => { npById[n.user_id] = n })
  // Rank leve = so o override manual aqui (o rank completo/derivado aparece no perfil).
  for (const p of (profs || [])) {
    const np = npById[p.id] || {}
    const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / DAY : 0
    map[p.id] = {
      id: p.id,
      name: publicName(p),
      rank: np.rank || null,
      verified: !!np.verified,
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

  const rank = deriveRank(metasFechadas, np?.rank)
  const badges = buildBadges({ p, np, operadores, metasFechadas, depositantes, rank })
  const ageDays = p.created_at ? (Date.now() - new Date(p.created_at).getTime()) / DAY : 0

  return {
    id: p.id,
    name: publicName(p),
    color: colorFromId(p.id),
    rank,
    verified: !!np?.verified,
    founder: !!np?.founder,
    veterano: ageDays >= 60,
    bio: np?.bio || null,
    instagram: np?.instagram || null,
    since: p.created_at || null,
    operadores,
    metasFechadas,
    depositantes,
    redes,
    melhorRede: redes[0] || null,
    maiorMarco: maiorMeta,
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
