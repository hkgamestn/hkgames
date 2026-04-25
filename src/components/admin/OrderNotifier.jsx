'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './OrderNotifier.module.css'

export default function OrderNotifier() {
  const [toasts, setToasts]     = useState([])
  const audioRef                = useRef(null)
  const soundUrlRef             = useRef('/sounds/order-alert.mp3') // fallback
  const knownIds                = useRef(new Set())
  const readyRef                = useRef(false)

  // Charger l'URL du son depuis la DB
  useEffect(() => {
    const supabase = createClient()
    supabase.from('settings').select('value').eq('key', 'sound_new_order').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          soundUrlRef.current = data.value
          // Reset l'audio pour forcer le rechargement du nouveau son
          audioRef.current = null
        }
      })
  }, [])

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current || audioRef.current.src !== soundUrlRef.current) {
        audioRef.current = new Audio(soundUrlRef.current)
        audioRef.current.volume = 1.0
      }
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((e) => console.warn('[HK] Son bloqué:', e))
    } catch (e) {
      console.warn('[HK] Audio error:', e)
    }
  }, [])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    console.log('[HK] Toast déclenché:', toast)
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }])
    playSound()
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 8000)
  }, [playSound])

  // Déverrouiller l'audio au premier clic (politique autoplay navigateur)
  useEffect(() => {
    function unlock() {
      if (!audioRef.current) {
        audioRef.current = new Audio(soundUrlRef.current)
        audioRef.current.volume = 1.0
      }
      audioRef.current.play().then(() => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }).catch(() => {})
      document.removeEventListener('click', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('click', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  // Charger IDs existants
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('orders')
      .select('id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) console.error('[HK] Fetch IDs error:', error)
        if (data) data.forEach((o) => knownIds.current.add(o.id))
        readyRef.current = true
        console.log('[HK] OrderNotifier prêt —', knownIds.current.size, 'commandes existantes')
      })
  }, [])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    console.log('[HK] Abonnement Realtime orders...')

    const channel = supabase
      .channel('hk-order-notifier-v2')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        console.log('[HK] INSERT reçu:', payload.new?.id, 'ready:', readyRef.current)
        if (!readyRef.current) return
        const order = payload.new
        if (knownIds.current.has(order.id)) return
        knownIds.current.add(order.id)
        addToast({
          type:  'new',
          title: '🛒 Nouvelle commande !',
          name:  order.customer_name || order.customer_phone || '—',
          city:  order.customer_city || '',
          total: order.total_dt || 0,
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        console.log('[HK] UPDATE reçu:', payload.new?.status, '←', payload.old?.status)
        const order = payload.new
        const old   = payload.old
        if (old.status === 'pending' && order.status === 'confirmed') {
          addToast({
            type:  'confirmed',
            title: '✅ Commande confirmée',
            name:  order.customer_name || '—',
            city:  order.customer_city || '',
            total: order.total_dt || 0,
          })
        }
      })
      .subscribe((status) => {
        console.log('[HK] Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addToast])

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <>

      {toasts.length > 0 && (
        <div className={styles.container}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${styles.toast} ${toast.type === 'new' ? styles.toastNew : styles.toastConfirmed}`}
            >
              <div className={styles.toastIcon}>
                {toast.type === 'new' ? '🛒' : '✅'}
              </div>
              <div className={styles.toastBody}>
                <div className={styles.toastTitle}>{toast.title}</div>
                <div className={styles.toastSub}>
                  {toast.name}{toast.city ? ` · ${toast.city}` : ''} · {Number(toast.total).toFixed(3)} DT
                </div>
              </div>
              <div className={styles.toastActions}>
                <a href="/admin/commandes" className={styles.toastBtn} onClick={() => dismiss(toast.id)}>Voir</a>
                <button className={styles.toastClose} onClick={() => dismiss(toast.id)}>✕</button>
              </div>
              <div className={styles.toastProgress} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
