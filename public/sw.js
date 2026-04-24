// HK Games SW — v4 — force update Android
const SW_VERSION = '4.0'

self.addEventListener('install', (e) => {
  console.log('[SW] Install v' + SW_VERSION)
  self.skipWaiting() // Prend le contrôle immédiatement
})

self.addEventListener('activate', (e) => {
  console.log('[SW] Activate v' + SW_VERSION)
  e.waitUntil(
    clients.claim().then(() => {
      // Notifier tous les clients que le SW a été mis à jour
      clients.matchAll({ type: 'window' }).then((list) => {
        list.forEach((c) => c.postMessage({ type: 'SW_UPDATED', version: SW_VERSION }))
      })
    })
  )
})

self.addEventListener('fetch', () => {}) // Ne pas intercepter les requêtes

// ─── PUSH ─────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu')
  if (!event.data) {
    console.warn('[SW] Push sans données')
    return
  }

  let data
  try { data = event.data.json() }
  catch { data = { title: 'HK Games Admin', body: event.data.text() } }

  event.waitUntil(
    (async () => {
      // Badge icône PWA
      if ('setAppBadge' in self.registration) {
        const count = typeof data.unseen_count === 'number' ? data.unseen_count : 1
        await self.registration.setAppBadge(count).catch(() => {})
      }

      await self.registration.showNotification(data.title || '🛍️ HK Games Admin', {
        body:               data.body || '',
        icon:               '/icons/hk-logo-192.png',
        badge:              '/icons/badge-72.png',
        tag:                data.tag  || 'hkgames-order',
        data:               { ...(data.data || {}), url: data.url || '/admin/commandes' },
        vibrate:            [300, 100, 300, 100, 300],
        requireInteraction: true,
        silent:             false,
        actions: data.actions || [
          { action: 'view',     title: '👁 Voir commande' },
          { action: 'whatsapp', title: '💬 WhatsApp' },
        ],
      })
    })()
  )
})

// ─── CLIC NOTIFICATION ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if ('clearAppBadge' in self.registration) {
    self.registration.clearAppBadge().catch(() => {})
  }

  const d = event.notification.data || {}
  let target = d.url || '/admin/commandes'

  if (event.action === 'whatsapp' && d.phone) {
    const num = String(d.phone).replace(/[^0-9]/g, '').replace(/^0/, '216')
    const msg = encodeURIComponent('Bonjour, je vous contacte pour votre commande HK Games.')
    target = 'https://wa.me/' + num + '?text=' + msg
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const adminWin = list.find((c) => c.url.includes('/admin'))
      if (adminWin) { adminWin.focus(); return adminWin.navigate(target) }
      const anyWin = list.find((c) => 'focus' in c)
      if (anyWin) { anyWin.focus(); return anyWin.navigate(target) }
      return clients.openWindow(target)
    })
  )
})

// ─── MESSAGES depuis la page ──────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return
  if (event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in self.registration) self.registration.clearAppBadge().catch(() => {})
  }
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
