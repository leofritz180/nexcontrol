// NexControl Service Worker — Push Notifications v118
// v118: destino externo (ex.: Instagram) abre em aba nova em vez de tentar
// navegar uma aba do proprio site, que nao funciona pra outro dominio.
// v117 (24/09/2026): botao da notificacao leva ao proprio destino, tag por
// assunto, peso por tipo (vibracao, exigeAcao, renotify), hora do FATO e o
// distintivo com silhueta propria. O pacote vem montado de lib/notificacoes.js.

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
// ── PUSH ──────────────────────────────────────────────────────────────
// O pacote vem montado de lib/notificacoes.js. Aqui so se traduz pro que a
// API do navegador espera, com padrao seguro pra cada campo: notificacao
// antiga (sem os campos novos) continua funcionando igual.
//
// O 'badge' e MASCARA: o Android le so o canal alfa e pinta com a cor do
// sistema. Por isso ele aponta pra uma silhueta branca, nao pro icone
// colorido — com o colorido, virava uma bolha cinza sem forma.
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {}
  const title = data.title || 'Nex Control'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png?v=8',
    badge: '/icons/badge-96.png?v=8',
    // tag por ASSUNTO: a nova substitui a anterior do mesmo grupo em vez de
    // empilhar. Sem tag, cai no comportamento antigo (cada uma por si).
    tag: data.tag || 'nexcontrol-' + Date.now(),
    renotify: data.renotify === true,
    requireInteraction: data.requireInteraction === true,
    vibrate: Array.isArray(data.vibrate) ? data.vibrate : [100, 50, 100],
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
    // 'destinos' diz pra onde cada BOTAO leva; o padrao web so carrega
    // action e title, entao o resto viaja aqui e volta no clique.
    data: { url: data.url || '/', destinos: data.destinos || {} },
  }
  if (data.image) options.image = data.image
  e.waitUntil(self.registration.showNotification(title, options))
})

// Click notification → open URL
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  // Tocar num BOTAO manda pro destino daquele botao; tocar no corpo da
  // notificacao mantem o destino geral. Antes o botao era ignorado e tudo
  // caia no mesmo lugar, o que tornava o botao decorativo.
  const d = e.notification.data || {}
  const url = (e.action && d.destinos && d.destinos[e.action]) || d.url || '/'
  const externo = /^https?:///i.test(url) && !url.startsWith(self.location.origin)
  if (externo) { e.waitUntil(clients.openWindow(url)); return }
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
