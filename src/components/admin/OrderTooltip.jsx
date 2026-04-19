'use client'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './OrderTooltip.module.css'

export default function OrderTooltip({ order, pos }) {
  if (!order) return null
  const x = pos.x + 16
  const y = Math.min(pos.y - 10, window.innerHeight - 360)

  return (
    <div className={styles.tooltip} style={{ left: x, top: y }}>
      <div className={styles.header}>
        <span className={styles.orderNum}>#{order.order_number || order.id.slice(0,8)}</span>
        <span className={styles.city}>{order.customer_city || '—'}</span>
      </div>

      <div className={styles.section}>
        <div className={styles.row}><span className={styles.key}>Client</span><span className={styles.val}>{order.customer_name || '—'}</span></div>
        <div className={styles.row}><span className={styles.key}>Tél</span><span className={styles.val}>{order.customer_phone}</span></div>
        {order.customer_address && <div className={styles.row}><span className={styles.key}>Adresse</span><span className={styles.val}>{order.customer_address}</span></div>}
        {order.customer_notes && <div className={styles.row}><span className={styles.key}>Notes</span><span className={styles.val}>{order.customer_notes}</span></div>}
      </div>

      {order.items?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Produits</div>
          {order.items.map((item, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemDot} style={{ background: item.color_hex || '#a855f7' }} />
              <span className={styles.itemName}>{item.name} {item.color ? `(${item.color})` : ''} ×{item.qty}</span>
              <span className={styles.itemPrice}>{formatDT(item.price_dt * item.qty)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.totals}>
        {order.subtotal_dt != null && <div className={styles.totalRow}><span>Sous-total</span><span>{formatDT(order.subtotal_dt)}</span></div>}
        {order.discount_dt > 0 && <div className={styles.totalRow}><span>Réduction</span><span className={styles.discount}>−{formatDT(order.discount_dt)}</span></div>}
        {order.shipping_dt != null && <div className={styles.totalRow}><span>Livraison</span><span>{order.shipping_dt === 0 ? 'Gratuite' : formatDT(order.shipping_dt)}</span></div>}
        <div className={`${styles.totalRow} ${styles.totalFinal}`}><span>Total</span><span>{formatDT(order.total_dt)}</span></div>
      </div>

      {order.gift_message && (
        <div className={styles.gift}>
          <span className={styles.giftIcon}>🎁</span>
          <span>{order.gift_message}</span>
        </div>
      )}
    </div>
  )
}
