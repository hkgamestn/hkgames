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

export async function POST(req) {
  try {
    // Vérifier les VAPID keys
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return Response.json({ error: 'VAPID keys manquantes dans .env' }, { status: 500 })
    }

    // Récupérer toutes les subscriptions actives
    const { data: subs, error: dbErr } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, subscription')
      .eq('is_active', true)

    if (dbErr) {
      return Response.json({ error: 'DB error: ' + dbErr.message }, { status: 500 })
    }

    if (!subs || subs.length === 0) {
      return Response.json({
        error: 'Aucune subscription active en DB. Active les notifications depuis le dashboard admin.',
        subs: 0
      }, { status: 200 })
    }

    const payload = JSON.stringify({
      title:        '🧪 Test Push HK Games',
      body:         'Si tu vois ceci, les notifications fonctionnent ! ✅',
      tag:          'hk-test-' + Date.now(),
      icon:         '/icons/hk-logo-192.png',
      badge:        '/icons/badge-72.png',
      requireInteraction: false,
      vibrate:      [200, 100, 200],
      unseen_count: 0,
    })

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        // Construire pushSub (colonnes séparées en priorité, fallback JSON)
        const pushSub = sub.endpoint && sub.p256dh && sub.auth
          ? { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
          : sub.subscription

        if (!pushSub?.endpoint) {
          return { id: sub.id, status: 'skip', reason: 'no endpoint' }
        }

        try {
          await webpush.sendNotification(pushSub, payload, {
            urgency: 'high',
            TTL: 60,
          })
          return { id: sub.id, status: 'sent', endpoint: sub.endpoint.slice(0, 50) + '...' }
        } catch (err) {
          // Subscription expirée → désactiver
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id)
            return { id: sub.id, status: 'expired_deleted', code: err.statusCode }
          }
          return { id: sub.id, status: 'failed', code: err.statusCode, message: err.message }
        }
      })
    )

    const sent    = results.filter((r) => r.value?.status === 'sent').length
    const failed  = results.filter((r) => r.value?.status === 'failed').length
    const expired = results.filter((r) => r.value?.status === 'expired_deleted').length
    const details = results.map((r) => r.value || r.reason)

    return Response.json({
      total: subs.length,
      sent,
      failed,
      expired_deleted: expired,
      details,
    })
  } catch (err) {
    console.error('[test-push] Fatal:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
