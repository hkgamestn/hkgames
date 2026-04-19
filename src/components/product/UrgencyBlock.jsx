'use client'

import { useEffect, useState } from 'react'
import { Zap, Package, Truck } from 'lucide-react'
import styles from './UrgencyBlock.module.css'

function getShippingTimer() {
  const now = new Date()
  const cutoff = new Date()
  cutoff.setHours(18, 0, 0, 0)
  if (now > cutoff) cutoff.setDate(cutoff.getDate() + 1)
  const diff = cutoff - now
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h${m.toString().padStart(2, '0')}`
}

export default function UrgencyBlock({ stock }) {
  const [viewers, setViewers] = useState(() => Math.floor(Math.random() * 8) + 5)
  const [timer, setTimer] = useState(() => getShippingTimer())

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(Math.floor(Math.random() * 8) + 5)
      setTimer(getShippingTimer())
    }, 45000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.block}>
      <div className={styles.item}>
        <Zap size={15} className={styles.icon} />
        <span><strong>{viewers}</strong> personnes regardent ce produit</span>
      </div>

      {stock !== null && stock !== undefined && stock <= 10 && (
        <div className={`${styles.item} ${styles.stockAlert}`}>
          <Package size={15} className={styles.iconOrange} />
          <span>Plus que <strong>{stock}</strong> pot{stock > 1 ? 's' : ''} en stock !</span>
        </div>
      )}

      <div className={`${styles.item} ${styles.delivery}`}>
        <Truck size={15} className={styles.iconGreen} />
        <span>
          Commandez dans <strong>{timer}</strong> → Livraison demain à Tunis
        </span>
      </div>
    </div>
  )
}
