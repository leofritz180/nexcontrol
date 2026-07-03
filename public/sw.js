// NexControl Service Worker — Push Notifications v116 (auto-cura: pushsubscriptionchange)

// VAPID public key (publica — seguro no SW). Usada pra re-inscrever na rotacao.
const VAPID_PUBLIC = 'BNZKMlrqHPUM0q-9c38Z3Wi885R1RjSDpwq-dwxNTNU2MxeFuo7BRQSCSeU7PUxSLD9lks8CZKmB5v3ZvjaKFv4'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}
function b64(buf) {
  return buf ? btoa(String.fromCharCode(...new Uint8Array(buf))) : ''
}

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

// AUTO-CURA em segundo plano: quando o navegador ROTACIONA a inscricao de push,
// re-inscreve e atualiza o servidor (pela inscricao antiga -> nova). Assim as
// notificacoes nao param sem o usuario perceber / precisar reinstalar o app.
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil((async () => {
    try {
      const key = e.oldSubscription?.options?.applicationServerKey || urlBase64ToUint8Array(VAPID_PUBLIC)
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_endpoint: e.oldSubscription?.endpoint || null,
          endpoint: sub.endpoint,
          p256dh: b64(sub.getKey('p256dh')),
          auth: b64(sub.getKey('auth')),
        }),
      })
    } catch (err) {
      // silencioso — a proxima abertura do app re-inscreve (auto-cura no cliente)
    }
  })())
})

// Receive push
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {}
  const title = data.title || 'NexControl'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'nexcontrol-' + Date.now(),
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// Click notification → open URL
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
