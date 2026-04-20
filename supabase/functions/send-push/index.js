import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

webpush.setVapidDetails('mailto:contact@hkgames.tn', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const body = await req.json()
    const { order_id, customer_name, total_dt, item_count } = body

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Compter les commandes non vues → badge count
    const { count: unseenCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('is_seen', false)

    const badgeCount = unseenCount ?? 1

    // Récupérer toutes les souscriptions push
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (subError) {
      console.error('push_subscriptions error:', subError.message)
      return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions' }), { status: 200 })
    }

    const payload = JSON.stringify({
      title:        '🛍️ Nouvelle commande !',
      body:         `${customer_name ?? 'Client'} — ${item_count ?? '?'} article(s) — ${total_dt ?? '?'} DT`,
      icon:         '/icons/hk-logo-192.png',
      badge:        '/icons/badge-72.png',
      url:          '/admin/commandes',
      unseen_count: badgeCount,
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }
        try {
          await webpush.sendNotification(pushSub, payload)
          return { id: sub.id, status: 'sent' }
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            return { id: sub.id, status: 'deleted_expired' }
          }
          return { id: sub.id, status: 'failed', error: pushErr.message }
        }
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value?.status === 'sent').length

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, unseen_count: badgeCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-push fatal:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
})
