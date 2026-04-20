self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() }
  catch { data = { title: 'HK Games Admin', body: event.data.text() } }

  event.waitUntil(
    (async () => {
      // Badge sur l'icône de l'app
      if ('setAppBadge' in self.registration) {
        const count = typeof data.unseen_count === 'number' ? data.unseen_count : 1
        await self.registration.setAppBadge(count).catch(() => {})
      }
      await self.registration.showNotification(data.title || 'HK Games Admin', {
      body:              data.body || '',
      icon:              '/icons/hk-logo-192.png',
      badge:             '/icons/badge-72.png',
      tag:               data.tag || 'hkgames-order',
      data:              data.data || {},
      vibrate:           [300, 100, 300, 100, 300],
      requireInteraction: true,
      silent:            false,
      actions:           data.actions || [
        { action: 'view',     title: '👁 Voir commande' },
        { action: 'whatsapp', title: '💬 WhatsApp' },
      ],
    })
    })()
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Clear badge icône quand l'admin clique sur la notif
  if ('clearAppBadge' in self.registration) {
    self.registration.clearAppBadge().catch(() => {})
  }
  const d = event.notification.data || {}

  let target = '/admin/commandes'
  if (d.orderId) target = '/admin/commandes?id=' + d.orderId

  if (event.action === 'whatsapp' && d.phone) {
    const num = String(d.phone).replace(/[^0-9]/g, '').replace(/^0/, '216')
    const msg = encodeURIComponent('Bonjour, je vous contacte pour votre commande HK Games.')
    target = 'https://wa.me/' + num + '?text=' + msg
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Chercher une fenêtre admin ouverte
      const adminWindow = list.find((c) => c.url.includes('/admin'))
      if (adminWindow) {
        adminWindow.focus()
        return adminWindow.navigate(target)
      }
      // Chercher n'importe quelle fenêtre ouverte
      const anyWindow = list.find((c) => 'focus' in c)
      if (anyWindow) {
        anyWindow.focus()
        return anyWindow.navigate(target)
      }
      // Ouvrir nouvelle fenêtre
      return clients.openWindow(target)
    })
  )
})
