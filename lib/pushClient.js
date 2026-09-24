// Client-side push subscription helpers

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
  reg.update().catch(() => {})
  await navigator.serviceWorker.ready
  return reg
}

export async function subscribePush(reg) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) throw new Error('VAPID key not configured')

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })
  return sub
}

export async function savePushSubscription(sub, userId, tenantId) {
  const key = sub.getKey('p256dh')
  const auth = sub.getKey('auth')

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
      user_id: userId,
      tenant_id: tenantId,
    }),
  })
  return res.ok
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// ── Pedir um push tipado pro servidor ──────────────────────────────────
// O texto, os botões e a vibração vêm do catálogo (lib/notificacoes); aqui
// só se diz o tipo, os dados e pra quem: 'admins' (do meu tenant), 'eu' ou
// { user_id } (alguém do meu tenant). Leva o token da sessão, porque o
// /api/push/send não aceita mais pedido anônimo. Nunca lança: push perdido
// não pode travar remessa, meta ou fechamento.
export async function dispararPush(tipo, dados = {}, alvo = 'admins', extra = {}) {
  try {
    const { supabase } = await import('./supabase/client')
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return { sent: 0, motivo: 'sem sessão' }
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      // extra: { vozPrevia } — só pra "me manda um exemplo" (alvo 'eu')
      body: JSON.stringify({ tipo, dados, alvo, ...extra }),
    })
    return await res.json().catch(() => ({ sent: 0 }))
  } catch {
    return { sent: 0 }
  }
}
