'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markOrdersSeen, getUnseenCount } from '@/lib/actions/orders'
import styles from './commandes.module.css'

const STATUS_LABELS = {
  pending:   { label: 'En attente', color: '#fbbf24' },
  confirmed: { label: 'Confirmée',  color: '#06b6d4' },
  shipped:   { label: 'Expédiée',   color: '#a855f7' },
  delivered: { label: 'Livrée',     color: '#10b981' },
  cancelled: { label: 'Annulée',    color: '#ef4444' },
}

function clearAppBadge() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_BADGE' })
  }
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {})
  }
}

export default function CommandesPage() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [unseenCount, setUnseenCount] = useState(0)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setOrders(data ?? [])
    } catch (err) {
      console.error('[CommandesPage] fetchOrders:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      await fetchOrders()
      const count = await getUnseenCount()
      setUnseenCount(count)
      await markOrdersSeen()
      clearAppBadge()
    }
    init()
  }, [fetchOrders])

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
        setOrders((prev) => [payload.new, ...prev])
        await supabase.from('orders').update({ is_seen: true }).eq('id', payload.new.id)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function updateStatus(orderId, newStatus) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) console.error('[updateStatus]', error.message)
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Commandes
          {unseenCount > 0 && (
            <span className={styles.newBadge}>
              {unseenCount} nouvelle{unseenCount > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <p className={styles.subtitle}>{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
      </div>

      <div className={styles.filters}>
        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Toutes' : STATUS_LABELS[s]?.label ?? s}
            <span className={styles.filterCount}>
              {s === 'all' ? orders.length : orders.filter((o) => o.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loader}>Chargement des commandes...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Aucune commande{filter !== 'all' ? ' avec ce statut' : ''}.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onStatusChange }) {
  const s     = STATUS_LABELS[order.status] ?? { label: order.status, color: '#7c6fa8' }
  const total = typeof order.total_dt === 'number' ? order.total_dt.toFixed(2) : '—'
  const items = Array.isArray(order.items) ? order.items : []
  const date  = order.created_at
    ? new Date(order.created_at).toLocaleString('fr-TN', { dateStyle: 'short', timeStyle: 'short' })
    : '—'

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={styles.orderId}>#{order.id?.slice(0, 8).toUpperCase()}</span>
          <span className={styles.orderDate}>{date}</span>
        </div>
        <span className={styles.statusPill} style={{ background: s.color + '22', color: s.color, border: `1px solid ${s.color}44` }}>
          {s.label}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.customerInfo}>
          <p className={styles.customerName}>{order.customer_name || 'Client inconnu'}</p>
          <p className={styles.customerPhone}>{order.phone || '—'}</p>
          {order.address && <p className={styles.customerAddr}>{order.address}</p>}
        </div>

        <div className={styles.itemsList}>
          {items.map((item, i) => (
            <div key={i} className={styles.item}>
              <span className={styles.itemName}>{item.name || item.product_name || 'Produit'}</span>
              {item.color && <span className={styles.itemColor}>{item.color}</span>}
              <span className={styles.itemQty}>×{item.quantity ?? 1}</span>
            </div>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.total}>{total} DT</span>
          <select
            className={styles.statusSelect}
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
          >
            {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
