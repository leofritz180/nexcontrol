// Server-side — API routes only.
//
// A ponta que APLICA a preferência de quem recebe: lê `nx_push` do
// user_metadata de cada destinatário, pula quem desligou a categoria e
// monta o pacote na VOZ dele. Tudo que é push tipado do produto deve sair
// por aqui; sendPushToUser/Tenant (lib/push) continuam existindo pra
// pacote já montado (cobrança dos crons, anúncio), que não muda de voz.
//
// Por que user_metadata e não uma coluna: não precisa de migration, o
// cliente grava com supabase.auth.updateUser({ data: { nx_push } }) e o
// servidor lê com auth.admin. Custa uma chamada por destinatário — os
// destinatários de um push operacional são 1 a 3 pessoas; o broadcast
// pega todos de uma vez com listUsers.
import { sendPush } from './push'
import { montarNotificacao, normalizarPrefs, prefsPermitem, PREFS_PADRAO } from './notificacoes'

/** Preferências de push de uma lista de contas → Map(id → prefs). */
export async function lerPrefs(sb, ids = []) {
  const mapa = new Map()
  const unicos = [...new Set(ids.filter(Boolean))]
  if (!unicos.length) return mapa
  if (unicos.length <= 30) {
    await Promise.all(unicos.map(async id => {
      try { const { data } = await sb.auth.admin.getUserById(id); mapa.set(id, normalizarPrefs(data?.user?.user_metadata?.nx_push)) }
      catch { mapa.set(id, normalizarPrefs(null)) }
    }))
    return mapa
  }
  // muita gente (broadcast): páginas de 1000
  const quer = new Set(unicos)
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    for (const u of data.users) if (quer.has(u.id)) mapa.set(u.id, normalizarPrefs(u.user_metadata?.nx_push))
    if (data.users.length < 1000) break
  }
  for (const id of unicos) if (!mapa.has(id)) mapa.set(id, normalizarPrefs(null))
  return mapa
}

/**
 * Manda um push tipado pra uma lista de contas, cada uma na sua voz.
 * opts.forcarVoz  ignora a preferência (prévia "me manda um exemplo")
 * opts.ignorarCategoria  manda mesmo com a categoria desligada (prévia)
 */
export async function notificarUsuarios(sb, ids = [], tipo, dados = {}, opts = {}) {
  const unicos = [...new Set(ids.filter(Boolean))]
  if (!unicos.length) return { sent: 0, pulados: 0, total: 0 }
  const prefs = await lerPrefs(sb, unicos)
  const { data: subs } = await sb.from('push_subscriptions').select('*').in('user_id', unicos)
  if (!subs?.length) return { sent: 0, pulados: 0, total: 0 }

  const pacotePor = new Map()  // voz → pacote (monta uma vez por voz)
  let sent = 0, pulados = 0
  const mortas = []
  for (const sub of subs) {
    const p = prefs.get(sub.user_id) || PREFS_PADRAO
    if (!opts.ignorarCategoria && !prefsPermitem(p, tipo)) { pulados++; continue }
    const voz = opts.forcarVoz || p.voz
    if (!pacotePor.has(voz)) pacotePor.set(voz, montarNotificacao(tipo, dados, voz))
    const r = await sendPush(sub, pacotePor.get(voz))
    if (r.success) sent++
    else if (r.expired) mortas.push(sub.id)
  }
  if (mortas.length) await sb.from('push_subscriptions').delete().in('id', mortas)
  return { sent, pulados, total: subs.length }
}

/** Os admins de um tenant. */
export async function notificarAdmins(sb, tenantId, tipo, dados = {}, opts = {}) {
  if (!tenantId) return { sent: 0 }
  const { data: admins } = await sb.from('profiles').select('id').eq('tenant_id', tenantId).eq('role', 'admin')
  return notificarUsuarios(sb, (admins || []).map(a => a.id), tipo, dados, opts)
}
