// public/sw.js — App Badge API + Web Push

// ─── FETCH : PAS de cache (évite ERR_INTERNET_DISCONNECTED) ─────────────────
self.addEventListener('fetch', () => { return })

// ─── PUSH NOTIFICATION ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'HK Games', body: 'Nouvelle commande reçue !' }
  }

  const title   = data.title   || '🛍️ HK Games'
  const body    = data.body    || 'Nouvelle commande reçue !'
  const badge   = data.badge   || '/icons/badge-72.png'
  const icon    = data.icon    || '/icons/hk-logo-192.png'
  const unseen  = typeof data.unseen_count === 'number' ? data.unseen_count : null
  const url     = data.url    || '/admin/commandes'

  const notifOptions = {
    body,
    icon,
    badge,
    tag:           'new-order',
    renotify:      true,
    requireInteraction: true,
    data:          { url },
    actions: [
      { action: 'view',    title: '👀 Voir commande' },
      { action: 'dismiss', title: 'Ignorer'          },
    ],
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, notifOptions)

      // ── App Badge API ──────────────────────────────────────────────────────
      if ('setAppBadge' in self.registration) {
        try {
          if (unseen !== null && unseen > 0) {
            await self.registration.setAppBadge(unseen)
          } else {
            await self.registration.setAppBadge()
          }
        } catch (e) {
          console.warn('[SW] App Badge not supported:', e)
        }
      }
    })()
  )
})

// ─── NOTIFICATION CLICK ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/admin/commandes'

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const adminClient = clients.find((c) => c.url.includes('/admin'))

      if (adminClient) {
        await adminClient.focus()
        adminClient.navigate(targetUrl)
      } else {
        await self.clients.openWindow(targetUrl)
      }

      clients.forEach((c) => c.postMessage({ type: 'NOTIFICATION_CLICKED' }))
    })()
  )
})

// ─── MESSAGE depuis la page (clear / set badge) ───────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return

  if (event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in self.registration) {
      self.registration.clearAppBadge().catch(() => {})
    }
  }

  if (event.data.type === 'SET_BADGE' && typeof event.data.count === 'number') {
    if ('setAppBadge' in self.registration) {
      if (event.data.count > 0) {
        self.registration.setAppBadge(event.data.count).catch(() => {})
      } else {
        self.registration.clearAppBadge().catch(() => {})
      }
    }
  }
})

// ─── INSTALL / ACTIVATE ──────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
