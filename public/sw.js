// NexControl Service Worker — Push Notifications v3 (forced cache invalidation)

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
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
