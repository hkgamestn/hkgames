'use client'

import { createClient } from '@/lib/supabase/client'

export function isIOS() {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isAndroid() {
  return typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
}

export function isPWA() {
  return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output  = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { error: 'not_supported' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { error: 'permission_denied' }
  }

  const registration = await navigator.serviceWorker.ready
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return { error: 'VAPID key manquante' }

  // Sur Android : forcer une nouvelle subscription (évite les tokens expirés)
  let subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
    subscription = null
  }

  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  } catch (err) {
    console.error('[subscribeToPush] subscribe error:', err)
    return { error: 'subscription_failed' }
  }

  const subJson  = subscription.toJSON()
  const endpoint = subJson.endpoint
  const p256dh   = subJson.keys?.p256dh
  const auth     = subJson.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return { error: 'invalid_subscription' }
  }

  const supabase = createClient()

  // Désactiver les anciennes subscriptions de cet appareil (même user agent)
  const ua = navigator.userAgent.slice(0, 200)

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint,
        p256dh,
        auth,
        subscription: subJson,
        device_name:  ua,
        is_active:    true,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'endpoint', ignoreDuplicates: false }
    )

  if (error) {
    console.error('[subscribeToPush] DB error:', error.message)
    return { error: 'db_error: ' + error.message }
  }

  return { success: true }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return { success: true }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    const supabase = createClient()
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', subscription.endpoint)

    await subscription.unsubscribe()
  }

  return { success: true }
}

export async function checkPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}
