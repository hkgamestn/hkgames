'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './StockBadge.module.css'

// Cache en mémoire pour éviter N requêtes
let cachedThreshold = null

async function getThreshold() {
  if (cachedThreshold !== null) return cachedThreshold
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stock_alert_threshold')
      .maybeSingle()
    cachedThreshold = data?.value ? parseInt(data.value) : 5
  } catch {
    cachedThreshold = 5
  }
  return cachedThreshold
}

export default function StockBadge({ stock }) {
  const [threshold, setThreshold] = useState(5)

  useEffect(() => {
    getThreshold().then(setThreshold)
  }, [])

  if (stock === null || stock === undefined) return null
  if (stock === 0) return <span className={`${styles.badge} ${styles.outOfStock}`}>Épuisé</span>
  if (stock <= threshold) return <span className={`${styles.badge} ${styles.low}`}>Plus que {stock} !</span>
  return <span className={`${styles.badge} ${styles.available}`}>En stock</span>
}
