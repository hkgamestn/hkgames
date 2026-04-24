// HK Games — Edge Function: send-push v3
import webpush from 'npm:web-push'
import { createClient } from 'npm:@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const DOMAIN = 'https://hap-p-kids.store'

function buildPayload(type, orderId, orderData, unseenCount = 1) {
  const phone = orderData?.customer_phone || ''
  const name  = orderData?.customer_name  || 'Nouveau client'
  const city  = orderData?.customer_city  || ''
  const total = orderData?.total_dt       || 0

  const base = {
    icon:  DOMAIN + '/icons/hk-logo-192.png',
    badge: DOMAIN + '/icons/badge-72.png',
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    silent: false,
    timestamp: Date.now(),
    unseen_count: unseenCount,
  }

  if (type === 'pending') {
    return {
      ...base,
      title: '🛒 Nouvelle commande !',
      body:  `${name}${city ? ' · ' + city : ''} · ${Number(total).toFixed(3)} DT`,
      tag:   'hk-pending-' + orderId,
      data:  { orderId, url: DOMAIN + '/admin/commandes', phone },
      actions: [
        { action: 'view',     title: '👁 Voir' },
        { action: 'whatsapp', title: '💬 WhatsApp' },
      ],
    }
  }

  if (type === 'confirmed') {
    return {
      ...base,
      title: '✅ Commande confirmée',
      body:  `${name}${city ? ' · ' + city : ''} · ${Number(total).toFixed(3)} DT`,
      tag:   'hk-confirmed-' + orderId,
      data:  { orderId, url: DOMAIN + '/admin/commandes', phone },
      actions: [
        { action: 'view', title: '👁 Voir' },
      ],
    }
  }

  if (type === 'oto_accepted') {
    return {
      ...base,
      title: '🎉 OTO accepté !',
      body:  `${name} a ajouté un Buddy à sa commande`,
      tag:   'hk-oto-' + orderId,
      data:  { orderId, url: DOMAIN + '/admin/commandes' },
    }
  }

  return {
    ...base,
    title: '📦 HK Games',
    body:  'Commande #' + String(orderId).slice(0,8).toUpperCase() + ' mise à jour',
    tag:   'hk-update-' + orderId,
    data:  { orderId, url: DOMAIN + '/admin/commandes' },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const { orderId, type } = await req.json()

    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
    if (!vapidPublic || !vapidPrivate) {
      console.error('[send-push] VAPID keys manquantes')
      return new Response('VAPID keys manquantes', { status: 500 })
    }

    webpush.setVapidDetails('mailto:admin@hap-p-kids.store', vapidPublic, vapidPrivate)

    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .select('customer_phone, customer_name, customer_city, total_dt')
      .eq('id', orderId)
      .single()

    // Compter les commandes pending (non traitées) pour le badge icône
    const { count: unseenCount } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const payload = buildPayload(type, orderId, orderData, unseenCount ?? 1)
    console.log('[send-push] Payload:', JSON.stringify(payload))

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, subscription')
      .eq('is_active', true)

    if (!subs || subs.length === 0) {
      console.log('[send-push] Aucune subscription active')
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    console.log('[send-push] Envoi à', subs.length, 'subscription(s)')

    const results = await Promise.allSettled(
      subs.map(async ({ id, endpoint, p256dh, auth, subscription }) => {
        // Construire l'objet push subscription (colonnes séparées en priorité, fallback JSON)
        const pushSub = endpoint && p256dh && auth
          ? { endpoint, keys: { p256dh, auth } }
          : subscription
        try {
          await webpush.sendNotification(pushSub, JSON.stringify(payload), {
            urgency: 'high',
            TTL: 60,
          })
          console.log('[send-push] ✅ Envoyé à sub', id)
        } catch (err) {
          console.error('[send-push] Erreur sub', id, ':', err.statusCode, err.message)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', id)
          }
          throw err
        }
      })
    )

    const sent   = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    console.log('[send-push] Résultat: sent=' + sent + ' failed=' + failed)

    return new Response(
      JSON.stringify({ sent, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-push] Erreur globale:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
