import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  'mailto:admin@hap-p-kids.store',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const DOMAIN = 'https://hap-p-kids.store'

function buildPayload(type, orderId, orderData, unseenCount = 1) {
  const name  = orderData?.customer_name  || 'Nouveau client'
  const city  = orderData?.customer_city  || ''
  const total = orderData?.total_dt       || 0
  const phone = orderData?.customer_phone || ''

  const base = {
    icon:               DOMAIN + '/icons/hk-logo-192.png',
    badge:              DOMAIN + '/icons/badge-72.png',
    requireInteraction: true,
    vibrate:            [300, 100, 300, 100, 300],
    silent:             false,
    timestamp:          Date.now(),
    unseen_count:       unseenCount,
  }

  if (type === 'confirmed') return {
    ...base,
    title:   '✅ Commande confirmée !',
    body:    `${name}${city ? ' · ' + city : ''} · ${Number(total).toFixed(3)} DT`,
    tag:     'hk-confirmed-' + orderId,
    data:    { orderId, url: DOMAIN + '/admin/commandes', phone },
    actions: [{ action: 'view', title: '👁 Voir' }, { action: 'whatsapp', title: '💬 WhatsApp' }],
  }

  if (type === 'oto_accepted') return {
    ...base,
    title:   '🎉 OTO accepté !',
    body:    `${name} a ajouté un Buddy à sa commande`,
    tag:     'hk-oto-' + orderId,
    data:    { orderId, url: DOMAIN + '/admin/commandes' },
  }

  return {
    ...base,
    title: '📦 HK Games',
    body:  'Commande mise à jour',
    tag:   'hk-update-' + orderId,
    data:  { orderId, url: DOMAIN + '/admin/commandes' },
  }
}

export async function POST(req) {
  try {
    const { orderId, type } = await req.json()
    if (!orderId || !type) {
      return Response.json({ error: 'orderId et type requis' }, { status: 400 })
    }

    const { data: orderData } = await supabase
      .from('orders')
      .select('customer_phone, customer_name, customer_city, total_dt')
      .eq('id', orderId)
      .single()

    const { count: unseenCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const payload = JSON.stringify(buildPayload(type, orderId, orderData, unseenCount ?? 1))

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, subscription')
      .eq('is_active', true)

    if (!subs || subs.length === 0) {
      return Response.json({ sent: 0, message: 'Aucune subscription' })
    }

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const pushSub = sub.endpoint && sub.p256dh && sub.auth
          ? { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
          : sub.subscription

        if (!pushSub?.endpoint) return { status: 'skip' }

        try {
          await webpush.sendNotification(pushSub, payload, { urgency: 'high', TTL: 60 })
          return { id: sub.id, status: 'sent' }
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id)
            return { id: sub.id, status: 'expired' }
          }
          throw err
        }
      })
    )

    const sent = results.filter((r) => r.value?.status === 'sent').length
    return Response.json({ sent, total: subs.length })
  } catch (err) {
    console.error('[send-push API]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
