'use client'
import GiftCardPrint from '@/components/admin/GiftCardPrint'
import { envoyerNavex } from '@/app/actions/navex'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus, softDeleteOrder, restoreOrder, hardDeleteOrders } from '@/lib/actions/orders'
import { formatDT } from '@/lib/utils/formatDT'
import { CheckCircle, Phone, XCircle, Trash2, Pencil, RotateCcw, Send, ArchiveX, Plus } from 'lucide-react'
import OrderTooltip from '@/components/admin/OrderTooltip'
import OrderEditPanel from '@/components/admin/OrderEditPanel'
import CreateOrderModal from '@/components/admin/CreateOrderModal'
import styles from './commandes.module.css'

const STATUS_TABS = [
  { id: null,        label: 'Toutes' },
  { id: 'pending',   label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'shipped',   label: 'Expédiées' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
  { id: 'deleted',   label: '🗑 Supprimées' },
]

const STATUS_CONFIG = {
  pending:   { label: 'En attente',  color: '#fbbf24' },
  confirmed: { label: 'Confirmée',   color: '#10b981' },
  on_hold:   { label: 'En suspens',  color: '#fb923c' },
  shipped:   { label: 'Expédiée',    color: '#60a5fa' },
  delivered: { label: 'Livrée',      color: '#34d399' },
  cancelled: { label: 'Annulée',     color: '#ef4444' },
}

const CANCEL_REASONS = [
  'Client injoignable',
  'Client a refusé la livraison',
  'Stock insuffisant',
  'Double commande',
  'Autre',
]

export default function CommandesPage() {
  const [orders, setOrders]           = useState([])
  const [repeatBuyers, setRepeatBuyers] = useState(new Set())
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState(null)
  const [search, setSearch]           = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [actionLoading, setActionLoading] = useState(null)
  const [navexLoading, setNavexLoading]   = useState(null)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [giftCardOrder, setGiftCardOrder] = useState(null)
  const [tooltip, setTooltip]             = useState({ order: null, pos: { x: 0, y: 0 } })
  const [editOrder, setEditOrder]         = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [multiNavexLoading, setMultiNavexLoading] = useState(false)
  const [navexDone, setNavexDone]         = useState({})
  const [navexStatus, setNavexStatus]     = useState({})

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from('orders')
      .select('id, order_number, status, customer_name, customer_phone, customer_city, customer_address, customer_notes, items, total_dt, subtotal_dt, discount_dt, shipping_dt, created_at, gift_message, gift_recipient, deleted_at')
      .order('created_at', { ascending: false })

    if (activeTab === 'deleted') q = q.not('deleted_at', 'is', null)
    else { q = q.is('deleted_at', null); if (activeTab) q = q.eq('status', activeTab) }
    if (search)    q = q.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`)

      // Charger tous les téléphones pour détecter les repeat buyers
      const { data: allPhones } = await supabase
        .from('orders')
        .select('customer_phone')
        .not('deleted_at', 'is', null)

      const phoneCount = {}
      ;(allPhones || []).forEach(({ customer_phone }) => {
        if (customer_phone) phoneCount[customer_phone] = (phoneCount[customer_phone] || 0) + 1
      })
      const repeats = new Set(Object.keys(phoneCount).filter((p) => phoneCount[p] >= 2))
      setRepeatBuyers(repeats)

    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }, [activeTab, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Ref stable vers fetchOrders pour le channel realtime
  const fetchOrdersRef = useRef(fetchOrders)
  useEffect(() => { fetchOrdersRef.current = fetchOrders }, [fetchOrders])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('commandes-page-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrdersRef.current()
      })
      .subscribe((status) => {
        console.log('[HK Commandes] Realtime:', status)
      })

    return () => { supabase.removeChannel(channel) }
  }, []) // ← [] — se monte une seule fois, stable

  async function handleMultiNavex() {
    if (selectedOrders.length === 0) return
    setMultiNavexLoading(true)
    const confirmedOrders = orders.filter((o) => selectedOrders.includes(o.id) && o.status === 'confirmed')
    let success = 0, failed = 0
    for (const order of confirmedOrders) {
      try {
        const r = await envoyerNavex(order)
        setNavexDone((prev) => ({ ...prev, [order.id]: true }))
        setNavexStatus((prev) => ({ ...prev, [order.id]: r.status_message || 'Envoyé' }))
        success++
      } catch (err) {
        failed++
      }
    }
    setMultiNavexLoading(false)
    setSelectedOrders([])
    alert(success + ' colis envoyés avec succès' + (failed > 0 ? ', ' + failed + ' échoués' : '') + ' !')
  }

  async function handleBulkDelete() {
    if (!selectedOrders.length) return
    if (!confirm('Supprimer (soft) ' + selectedOrders.length + ' commande(s) ?')) return
    for (const id of selectedOrders) await softDeleteOrder(id)
    setSelectedOrders([])
    fetchOrders()
  }

  async function handleBulkRestore() {
    if (!selectedOrders.length) return
    for (const id of selectedOrders) await restoreOrder(id)
    setSelectedOrders([])
    fetchOrders()
  }

  async function handleBulkHardDelete() {
    if (!selectedOrders.length) return
    if (!confirm('⚠️ SUPPRESSION DÉFINITIVE de ' + selectedOrders.length + ' commande(s) ? Cette action est irréversible.')) return
    await hardDeleteOrders(selectedOrders)
    setSelectedOrders([])
    fetchOrders()
  }

  function toggleSelect(orderId) {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  function toggleSelectAll() {
    const confirmed = orders.filter((o) => o.status === 'confirmed').map((o) => o.id)
    if (selectedOrders.length === confirmed.length) setSelectedOrders([])
    else setSelectedOrders(confirmed)
  }

  async function handleNavex(order) {
    setNavexLoading(order.id)
    try {
      const result = await envoyerNavex(order)
      setNavexDone((prev) => ({ ...prev, [order.id]: true }))
      setNavexStatus((prev) => ({ ...prev, [order.id]: result.status_message || 'Envoyé' }))
      alert('Colis envoyé à Navex avec succès !')
    } catch (err) {
      alert('Erreur Navex : ' + err.message)
    }
    setNavexLoading(null)
  }

  async function handleRestore(orderId) {
    setActionLoading(orderId + 'restore')
    await restoreOrder(orderId)
    setActionLoading(null)
    fetchOrders()
  }

  async function handleAction(orderId, action, extra = {}) {
    setActionLoading(orderId + action)
    if (action === 'confirm')      await updateOrderStatus(orderId, 'confirmed', { navexTrigger: true })
    else if (action === 'on_hold') await updateOrderStatus(orderId, 'on_hold')
    else if (action === 'cancel')  await updateOrderStatus(orderId, 'cancelled', { reason: extra.reason })
    else if (action === 'delete')  await softDeleteOrder(orderId)
    setActionLoading(null)
    fetchOrders()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Commandes</h1>
        <button
          className={styles.newOrderBtn}
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          <Plus size={16} /> Nouvelle commande
        </button>
        {selectedOrders.length > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selectedOrders.length} sélectionnée(s)</span>

            {activeTab !== 'deleted' && (
              <button className={`${styles.bulkBtn} ${styles.bulkNavex}`}
                onClick={handleMultiNavex} disabled={multiNavexLoading} type="button">
                <Send size={14} />
                {multiNavexLoading ? 'Envoi...' : 'Navex'}
              </button>
            )}

            {activeTab !== 'deleted' && (
              <button className={`${styles.bulkBtn} ${styles.bulkDelete}`}
                onClick={handleBulkDelete} type="button">
                <Trash2 size={14} />
                Supprimer
              </button>
            )}

            {activeTab === 'deleted' && (
              <button className={`${styles.bulkBtn} ${styles.bulkRestore}`}
                onClick={handleBulkRestore} type="button">
                <RotateCcw size={14} />
                Restaurer
              </button>
            )}

            {activeTab === 'deleted' && (
              <button className={`${styles.bulkBtn} ${styles.bulkHardDelete}`}
                onClick={handleBulkHardDelete} type="button">
                <ArchiveX size={14} />
                Suppr. définitive
              </button>
            )}
          </div>
        )}
        <input
          className={styles.search}
          placeholder="Rechercher par nom, téléphone, #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <button
            key={String(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.loading}>Chargement...</p>
      ) : orders.length === 0 ? (
        <p className={styles.empty}>Aucune commande trouvée.</p>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <input
              type="checkbox"
              className={styles.checkbox}
              onChange={toggleSelectAll}
              checked={selectedOrders.length > 0 && selectedOrders.length === orders.filter(o => o.status === 'confirmed').length}
              title="Tout sélectionner"
            />
            <span>#</span><span>Client</span><span>Téléphone</span>
            <span>Ville</span><span>Total</span><span>Statut</span>
            <span>Date</span><span>Actions</span>
          </div>
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || {}
            return (
              <div key={order.id} className={styles.tableRow + (selectedOrders.includes(order.id) ? ' ' + styles.tableRowSelected : '')} onMouseEnter={(e) => setTooltip({ order, pos: { x: e.clientX, y: e.clientY } })} onMouseMove={(e) => setTooltip(t => ({ ...t, pos: { x: e.clientX, y: e.clientY } }))} onMouseLeave={() => setTooltip({ order: null, pos: { x: 0, y: 0 } })}>
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => toggleSelect(order.id)}
                  className={styles.checkbox}
                  disabled={order.status !== 'confirmed'}
                />
                <span className={styles.orderNum}>{order.order_number || order.id.slice(0,8)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {order.customer_name || '—'}
                  {repeatBuyers.has(order.customer_phone) && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)',
                      borderRadius: '99px', padding: '1px 7px', whiteSpace: 'nowrap', flexShrink: 0
                    }}>⭐ Fidèle</span>
                  )}
                  {order.gift_message && (
                    <button onClick={() => setGiftCardOrder(order)} style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      background: 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.14))',
                      color: '#a855f7', border: '1px solid rgba(168,85,247,0.4)',
                      borderRadius: '99px', padding: '1px 7px', whiteSpace: 'nowrap',
                      flexShrink: 0, cursor: 'pointer'
                    }}>🎁 Carte cadeau</button>
                  )}
                </span>
                <span>
                  <a href={`tel:${order.customer_phone}`} className={styles.phoneLink}>
                    {order.customer_phone}
                  </a>
                </span>
                <span>{order.customer_city || '—'}</span>
                <span className={styles.total}>{formatDT(order.total_dt || 0)}</span>
                <span>
                  <span className={styles.statusBadge} style={{ '--status-color': cfg.color }}>
                    {cfg.label || order.status}
                  </span>
                </span>
                <span className={styles.date}>
                  {new Date(order.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={styles.actions}>
                  <button className={`${styles.actionBtn} ${styles.edit}`} onClick={() => setEditOrder(order)} title="Modifier" type="button">
                    <Pencil size={15} />
                  </button>
                  {order.status === 'pending' && (
                    <button className={`${styles.actionBtn} ${styles.confirm}`} onClick={() => handleAction(order.id, 'confirm')} disabled={actionLoading === order.id + 'confirm'} title="Confirmer" type="button">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {order.status === 'confirmed' && !navexDone[order.id] && (
                    <button
                      className={styles.actionBtn + ' ' + styles.navex}
                      onClick={() => handleNavex(order)}
                      disabled={navexLoading === order.id}
                      title="Envoyer a Navex"
                      type="button"
                    >
                      {navexLoading === order.id ? '...' : '🚚'}
                    </button>
                  )}
                  {navexDone[order.id] && (
                    <span className={styles.navexStatusBadge}>
                      ✅ {navexStatus[order.id] || 'Navex'}
                    </span>
                  )}
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button className={styles.actionBtn + ' ' + styles.hold} onClick={() => handleAction(order.id, 'on_hold')} title="Injoignable" type="button">
                      <Phone size={15} />
                    </button>
                  )}
                  {order.status !== 'cancelled' && (
                    <button className={`${styles.actionBtn} ${styles.cancel}`} onClick={() => setCancelModal(order.id)} title="Annuler" type="button">
                      <XCircle size={15} />
                    </button>
                  )}
                  <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => { if (confirm('Supprimer ?')) handleAction(order.id, 'delete') }} title="Supprimer" type="button">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cancelModal && (
        <div className={styles.overlay} onClick={() => setCancelModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Raison d'annulation</h3>
            <select className={styles.select} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
              {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className={styles.modalActions}>
              <button className={styles.cancelConfirmBtn} type="button"
                onClick={async () => { await handleAction(cancelModal, 'cancel', { reason: cancelReason }); setCancelModal(null) }}>
                Confirmer l'annulation
              </button>
              <button className={styles.modalClose} type="button" onClick={() => setCancelModal(null)}>Retour</button>
            </div>
          </div>
        </div>
      )}
      {giftCardOrder && <GiftCardPrint order={giftCardOrder} onClose={() => setGiftCardOrder(null)} />}
      <OrderTooltip order={tooltip.order} pos={tooltip.pos} />
      <OrderEditPanel order={editOrder} onClose={() => setEditOrder(null)} onSaved={fetchOrders} />
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchOrders() }}
        />
      )}
    </div>
  )
}
