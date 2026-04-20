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

// Convertit la VAPID key base64url → Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
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
  if (!vapidKey) return { error: 'VAPID public key manquante.' }

  // Récupérer ou créer la subscription
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const subJson = subscription.toJSON()
  const endpoint  = subJson.endpoint
  const p256dh    = subJson.keys?.p256dh
  const auth      = subJson.keys?.auth
  const userAgent = navigator.userAgent.slice(0, 150)

  const supabase = createClient()

  // Upsert sur l'endpoint (évite les doublons, renouvelle si expiré)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint,
        p256dh,
        auth,
        subscription: subJson,
        device_name: userAgent,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint', ignoreDuplicates: false }
    )

  if (error) {
    console.error('[subscribeToPush] DB error:', error.message)
    return { error: 'db_error' }
  }

  return { success: true }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return { success: true }

  const supabase = createClient()
  await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('endpoint', subscription.endpoint)

  await subscription.unsubscribe()
  return { success: true }
}

export async function checkPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}
