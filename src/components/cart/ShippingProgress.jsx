'use client'

import styles from './ShippingProgress.module.css'

export default function ShippingProgress({ cartTotal, threshold, shippingPrice }) {
  const pct  = Math.min((cartTotal / threshold) * 100, 100)
  const free = cartTotal >= threshold
  const remaining = threshold - cartTotal

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>
        {free
          ? '🎉 Livraison gratuite débloquée !'
          : 'Plus que ' + remaining.toFixed(3) + ' DT pour la livraison gratuite'}
      </p>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${free ? styles.fillDone : ''}`}
          style={{ width: pct + '%' }}
        />
        <div className={styles.dot} style={{ left: pct + '%' }} />
      </div>
      {!free && (
        <p className={styles.sub}>Livraison : {shippingPrice} DT</p>
      )}
    </div>
  )
}
