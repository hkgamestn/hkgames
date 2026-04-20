'use client'

import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '@/lib/cart/store'
import { computeBundle, getBundleProgress } from '@/lib/utils/bundleRules'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './BundleToast.module.css'

const FREE_THRESHOLD = 50

export default function BundleToast() {
  const [discounts, setDiscounts] = useState({ decouverte: 15, alchimiste: 20, famille: 18 })

  const items       = useCartStore((s) => s.items)
  useEffect(() => {
    const supabase = createClient()
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (!data) return
      const map = {}
      data.forEach((s) => { map[s.key] = s.value })
      setDiscounts({
        decouverte: parseFloat(map.bundle_decouverte_pct || '15'),
        alchimiste: parseFloat(map.bundle_alchimiste_pct || '20'),
        famille:    parseFloat(map.bundle_famille_pct    || '18'),
      })
    })
  }, [])

  const pathname    = usePathname()
  const [toast, setToast] = useState(null)
  const prevBundles = useRef([])
  const prevSubtotal = useRef(0)
  const timerRef    = useRef(null)

  // Ne pas afficher sur panier/commander/admin
  const hidden = ['/panier', '/commander', '/merci'].some((p) => pathname?.startsWith(p)) || pathname?.startsWith('/admin')

  function showToast(msg, type = 'bundle') {
    clearTimeout(timerRef.current)
    setToast({ msg, type })
    timerRef.current = setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    if (hidden || !items.length) return

    const { activeBundles = [] } = computeBundle(items, discounts)
    const subtotal = items.reduce((s, i) => s + i.price_dt * i.qty, 0)

    // Nouveaux bundles activés
    const prevIds  = prevBundles.current.map((b) => b.type)
    const newBundles = activeBundles.filter((b) => !prevIds.includes(b.type))

    if (newBundles.length > 0) {
      const b = newBundles[0]
      showToast(`🎉 ${b.label} débloqué ! Tu économises ${b.savings.toFixed(3)} DT`, 'bundle')
    }

    // Livraison gratuite débloquée
    const wasBelow = prevSubtotal.current < FREE_THRESHOLD
    const isAbove  = subtotal >= FREE_THRESHOLD
    if (wasBelow && isAbove) {
      showToast('🚚 Livraison gratuite débloquée !', 'shipping')
    }

    prevBundles.current  = activeBundles
    prevSubtotal.current = subtotal
  }, [items, hidden, discounts])

  if (hidden || !toast) return null

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <span className={styles.msg}>{toast.msg}</span>
      <button className={styles.close} onClick={() => setToast(null)}>✕</button>
      <div className={styles.progress} />
    </div>
  )
}
