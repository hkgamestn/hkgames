'use client'
import GiftCardPrint from '@/components/admin/GiftCardPrint'
import { envoyerNavex } from '@/app/actions/navex'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus, softDeleteOrder, restoreOrder, hardDeleteOrders, getUnseenCount, markOrdersSeen } from '@/lib/actions/orders'
import { unblockCustomer } from '@/lib/actions/customerReputation'
import { formatDT } from '@/lib/utils/formatDT'
import { CheckCircle, Phone, XCircle, Trash2, Pencil, RotateCcw, Send, ArchiveX, Plus, FileDown, Receipt, RefreshCw } from 'lucide-react'
import OrderTooltip from '@/components/admin/OrderTooltip'
import OrderEditPanel from '@/components/admin/OrderEditPanel'
import CreateOrderModal from '@/components/admin/CreateOrderModal'
import RetailInvoicePrint from '@/app/admin/grossiste/RetailInvoicePrint'
import BulkRetailInvoicePrint from '@/app/admin/grossiste/BulkRetailInvoicePrint'
import styles from './commandes.module.css'

const STATUS_TABS = [
  { id: null,        label: 'Toutes' },
  { id: 'pending',   label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'shipped',   label: 'Expédiées' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'returned',  label: 'Retours' },
  { id: 'cancelled', label: 'Annulées' },
  { id: 'deleted',   label: '🗑 Supprimées' },
]

// Téléphone tunisien -> 8 chiffres locaux (identique à hk_normalize_phone en SQL)
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-8)

// Couleur du badge d'etat Navex brut (granularite : En cours, Au depot, Livre, Retour...)
function navexEtatStyle(etat) {
  const s = String(etat || '').toLowerCase()
  if (s.includes('livr') || s.includes('paye') || s.includes('remis')) return '#34d399'
  if (s.includes('retour') || s.includes('refus') || s.includes('echec') || s.includes('\u00e9chec')) return '#ef4444'
  if (s.includes('annul')) return '#f87171'
  if (s.includes('depot') || s.includes('d\u00e9p')) return '#a78bfa'
  if (s.includes('cours') || s.includes('transit') || s.includes('ramass') || s.includes('exp')) return '#60a5fa'
  if (s.includes('attente')) return '#fbbf24'
  return '#9ca3af'
}

const STATUS_CONFIG = {
  pending:   { label: 'En attente',  color: '#fbbf24' },
  confirmed: { label: 'Confirmée',   color: '#10b981' },
  on_hold:   { label: 'En suspens',  color: '#fb923c' },
  shipped:   { label: 'Expédiée',    color: '#60a5fa' },
  delivered: { label: 'Livrée',      color: '#34d399' },
  returned:  { label: 'Retour',      color: '#ef4444' },
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
  const [orders, setOrders]               = useState([])
  const [unseenCount, setUnseenCount]     = useState(0)
  const [loyalPhones, setLoyalPhones]     = useState(new Set())
  const [blockedPhones, setBlockedPhones] = useState(new Set())
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState(null)
  const [search, setSearch]           = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [actionLoading, setActionLoading] = useState(null)
  const [navexLoading, setNavexLoading]   = useState(null)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [giftCardOrder, setGiftCardOrder] = useState(null)
  const [tooltip, setTooltip]             = useState({ order: null, pos: { x: 0, y: 0 } })
  const [editOrder, setEditOrder]         = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [syncing, setSyncing]             = useState(false)
  const [syncResult, setSyncResult]       = useState(null)

  async function handleSyncNavex(singleOrderId = null) {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res  = await fetch('/api/admin/sync-navex', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderIds: singleOrderId ? [singleOrderId] : [] }),
      })
      const data = await res.json()
      setSyncResult(data)
      if (data.updated > 0) fetchOrders() // Rafraîchir si des statuts ont changé
    } catch (err) {
      setSyncResult({ error: err.message })
    }
    setSyncing(false)
    setTimeout(() => setSyncResult(null), 5000)
  }
  const [retailInvoiceOrder, setRetailInvoiceOrder] = useState(null)
  const [bulkInvoiceOrders, setBulkInvoiceOrders]     = useState(null)
  const [invoiceSettings, setInvoiceSettings]         = useState({})

  function exportCSV() {
    if (!orders.length) return
    const headers = [
      'N° Commande', 'Date', 'Statut',
      'Nom client', 'Téléphone', 'Gouvernorat', 'Adresse', 'Notes',
      'Produits', 'Sous-total (DT)', 'Livraison (DT)', 'Remise (DT)', 'Total (DT)',
      'Tracking Navex',
    ]
    const rows = orders.map((o) => {
      const produits = (o.items || [])
        .map((i) => `${i.name}${i.color ? ' ' + i.color : ''} x${i.qty || 1}`)
        .join(' | ')
      return [
        o.order_number || '',
        o.created_at ? new Date(o.created_at).toLocaleString('fr-TN') : '',
        o.status || '',
        o.customer_name    || '',
        o.customer_phone   || '',
        o.customer_city    || '',
        o.customer_address || '',
        o.customer_notes   || '',
        produits,
        (o.subtotal_dt  || 0).toFixed(3),
        (o.shipping_dt  || 0).toFixed(3),
        (o.discount_dt  || 0).toFixed(3),
        (o.total_dt     || 0).toFixed(3),
        o.navex_tracking || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
    })

    const csv  = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href     = url
    a.download = `commandes-hkgames-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  const [multiNavexLoading, setMultiNavexLoading] = useState(false)
  const [navexDone, setNavexDone]         = useState({})
  const [navexStatus, setNavexStatus]     = useState({})

  const fetchInvoiceSettings = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('settings')
      .select('key, value')
      .like('key', 'invoice_%')
    const s = {}
    for (const row of (data || [])) s[row.key] = row.value
    setInvoiceSettings(s)
  }, [])

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from('orders')
      .select('id, order_number, status, customer_name, customer_phone, customer_city, customer_address, customer_notes, items, total_dt, subtotal_dt, discount_dt, shipping_dt, created_at, gift_message, gift_recipient, deleted_at, navex_tracking, navex_print_url, is_seen')
      .order('created_at', { ascending: false })

    if (activeTab === 'deleted') q = q.not('deleted_at', 'is', null)
    else { q = q.is('deleted_at', null); if (activeTab) q = q.eq('status', activeTab) }
    if (search)   q = q.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`)
    if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString())
    if (dateTo)   q = q.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())

      // Réputation client (fidèle = déjà livré / bloqué = « Retour reçu »)
      // Vue agrégée par téléphone normalisé — source unique partagée avec le checkout.
      const { data: repRows } = await supabase
        .from('hk_customer_reputation_view')
        .select('phone, is_loyal, is_blocked')
      const loyal = new Set()
      const blocked = new Set()
      ;(repRows || []).forEach((r) => {
        if (r.is_loyal)   loyal.add(r.phone)
        if (r.is_blocked) blocked.add(r.phone)
      })
      setLoyalPhones(loyal)
      setBlockedPhones(blocked)

    const { data } = await q
    let rows = data || []
    // Statut Navex granulaire — requete separee, resiliente si la colonne n'existe pas encore
    try {
      const ids = rows.map((o) => o.id)
      if (ids.length) {
        const { data: etats } = await supabase.from('orders').select('id, navex_etat').in('id', ids)
        if (etats) {
          const m = Object.fromEntries(etats.map((e) => [e.id, e.navex_etat]))
          rows = rows.map((o) => ({ ...o, navex_etat: m[o.id] }))
        }
      }
    } catch {}
    setOrders(rows)
    setLoading(false)
  }, [activeTab, search, dateFrom, dateTo])

  useEffect(() => {
    const init = async () => {
      const count = await getUnseenCount()
      setUnseenCount(count)
      await fetchOrders()
      await markOrdersSeen()
    }
    init()
  }, [fetchOrders])

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

  // Sync Navex de fond — garde les statuts colis quasi temps réel tant que la page est ouverte.
  // Non bloquant, silencieux (pas de bandeau) ; ne rafraîchit que si un statut a changé.
  useEffect(() => {
    let stopped = false
    const tick = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      try {
        const res  = await fetch('/api/admin/sync-navex', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ orderIds: [] }),
        })
        const data = await res.json().catch(() => ({}))
        if (!stopped && data.updated > 0) fetchOrdersRef.current()
      } catch {}
    }
    const first = setTimeout(tick, 4000)     // fraîcheur quasi immédiate à l'ouverture
    const iv    = setInterval(tick, 180000)  // puis toutes les 3 minutes
    return () => { stopped = true; clearTimeout(first); clearInterval(iv) }
  }, [])

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
    if (selectedOrders.length === orders.length) setSelectedOrders([])
    else setSelectedOrders(orders.map((o) => o.id))
  }

  async function handleNavex(order) {
    setNavexLoading(order.id)
    try {
      const result   = await envoyerNavex(order)
      const tracking = result.tracking_number || null
      const printUrl = result.print_url       || null
      setNavexDone((prev)   => ({ ...prev, [order.id]: true }))
      setNavexStatus((prev) => ({ ...prev, [order.id]: tracking || 'Expédié' }))
      setOrders((prev) => prev.map((o) =>
        o.id === order.id ? { ...o, status: 'shipped', navex_tracking: tracking, navex_print_url: printUrl } : o
      ))
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

  async function handleUnblock(phone) {
    if (!confirm('Débloquer ce client ? Il pourra de nouveau passer commande (paiement à la livraison).')) return
    const r = await unblockCustomer(phone, 'Débloqué depuis la liste des commandes')
    if (r?.error) { alert(r.error); return }
    setBlockedPhones((prev) => {
      const next = new Set(prev)
      next.delete(normPhone(phone))
      return next
    })
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

  function handleBulkInvoice() {
    const sel = orders.filter(o => selectedOrders.includes(o.id))
    if (!sel.length) return
    setBulkInvoiceOrders(sel)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Commandes
          {unseenCount > 0 && (
            <span className={styles.unseenBadge}>{unseenCount} nouvelle{unseenCount > 1 ? 's' : ''}</span>
          )}
        </h1>
        <div className={styles.headerActions}>
          <button
            className={styles.syncBtn}
            onClick={() => handleSyncNavex()}
            disabled={syncing}
            type="button"
            title="Synchroniser les statuts depuis Navex"
          >
            <RefreshCw size={14} className={syncing ? styles.spinning : ''} />
            {syncing ? 'Sync...' : 'Sync Navex'}
          </button>
          <button className={styles.exportBtn} onClick={exportCSV} type="button" title="Exporter en CSV">
            <FileDown size={15} /> Export CSV
          </button>
          <button className={styles.newOrderBtn} onClick={() => setShowCreateModal(true)} type="button">
            <Plus size={16} /> Nouvelle commande
          </button>
        </div>
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
              <button className={`${styles.bulkBtn} ${styles.bulkInvoiceBtn}`}
                onClick={handleBulkInvoice} type="button">
                <Receipt size={14} />
                Facturer ({selectedOrders.length})
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

            {/* Suppression définitive disponible sur TOUS les onglets */}
            <button className={`${styles.bulkBtn} ${styles.bulkHardDelete}`}
              onClick={handleBulkHardDelete} type="button">
              <ArchiveX size={14} />
              Suppr. définitive
            </button>
          </div>
        )}
        <input
          className={styles.search}
          placeholder="Rechercher par nom, téléphone, #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.dateFilters}>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Du"
          />
          <span className={styles.dateSep}>→</span>
          <input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Au"
          />
          {(dateFrom || dateTo) && (
            <button className={styles.clearDate} onClick={() => { setDateFrom(''); setDateTo('') }} type="button">✕</button>
          )}
        </div>
      </div>

      {syncResult && (
        <div className={syncResult.error ? styles.syncError : styles.syncSuccess}>
          {syncResult.error
            ? `❌ Erreur sync: ${syncResult.error}`
            : syncResult.updated > 0
              ? `✅ ${syncResult.updated} commande(s) mise(s) à jour sur ${syncResult.total}`
              : `ℹ️ ${syncResult.total} colis vérifiés — aucun changement`
          }
        </div>
      )}

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
              checked={selectedOrders.length > 0 && selectedOrders.length === orders.length}
              title="Tout sélectionner"
            />
            <span>#</span><span>Client</span><span>Téléphone</span>
            <span>Ville</span><span>Total</span><span>Statut</span>
            <span>Date</span><span>Actions</span>
          </div>
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || {}
            return (
              <div key={order.id} className={[styles.tableRow, selectedOrders.includes(order.id) ? styles.tableRowSelected : '', !order.is_seen ? styles.tableRowUnseen : ''].filter(Boolean).join(' ')} onMouseEnter={(e) => setTooltip({ order, pos: { x: e.clientX, y: e.clientY } })} onMouseMove={(e) => setTooltip(t => ({ ...t, pos: { x: e.clientX, y: e.clientY } }))} onMouseLeave={() => setTooltip({ order: null, pos: { x: 0, y: 0 } })}>
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => toggleSelect(order.id)}
                  className={styles.checkbox}
                />
                <span className={styles.orderNum}>{order.order_number || order.id.slice(0,8)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {order.customer_name || '—'}
                  {loyalPhones.has(normPhone(order.customer_phone)) && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)',
                      borderRadius: '99px', padding: '1px 7px', whiteSpace: 'nowrap', flexShrink: 0
                    }}>⭐ Fidèle</span>
                  )}
                  {blockedPhones.has(normPhone(order.customer_phone)) && (
                    <button
                      onClick={() => handleUnblock(order.customer_phone)}
                      title="Client bloqué (Retour reçu) — cliquer pour débloquer"
                      style={{
                        fontSize: '0.65rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)',
                        color: '#f87171', border: '1px solid rgba(239,68,68,0.45)',
                        borderRadius: '99px', padding: '1px 7px', whiteSpace: 'nowrap',
                        flexShrink: 0, cursor: 'pointer'
                      }}>⛔ Bloqué</button>
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
                  {order.navex_etat && (
                    <span className={styles.statusBadge}
                      style={{ '--status-color': navexEtatStyle(order.navex_etat), marginInlineStart: 6 }}>
                      🚚 {order.navex_etat}
                    </span>
                  )}
                </span>
                <span className={styles.date}>
                  {new Date(order.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={styles.actions}>
                  <button className={`${styles.actionBtn} ${styles.edit}`} onClick={() => setEditOrder(order)} title="Modifier" type="button">
                    <Pencil size={15} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.invoice}`} onClick={() => setRetailInvoiceOrder(order)} title="Générer facture" type="button">
                    <Receipt size={15} />
                  </button>
                  {order.status === 'pending' && (
                    <button className={`${styles.actionBtn} ${styles.confirm}`} onClick={() => handleAction(order.id, 'confirm')} disabled={actionLoading === order.id + 'confirm'} title="Confirmer" type="button">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {/* Navex — masqué si déjà expédié (status shipped) OU tracking en DB OU état local */}
                  {order.status === 'confirmed' && order.status !== 'shipped' && !order.navex_tracking && !navexDone[order.id] && (
                    <button
                      className={styles.actionBtn + ' ' + styles.navex}
                      onClick={() => handleNavex(order)}
                      disabled={navexLoading === order.id}
                      title="Envoyer à Navex"
                      type="button"
                    >
                      {navexLoading === order.id ? '...' : '🚚'}
                    </button>
                  )}
                  {/* Badge numéro colis — depuis DB (persiste après actualisation) */}
                  {(order.navex_tracking || navexDone[order.id]) && (
                    <span className={styles.navexStatusBadge}>
                      📦 {order.navex_tracking || navexStatus[order.id] || 'Expédié'}
                    </span>
                  )}
                  {/* Lien impression */}
                  {(order.navex_tracking || navexDone[order.id]) && (
                    <a
                      href={order.navex_print_url || `https://app.navex.tn/print/imprimer.php?code=${order.navex_tracking || navexStatus[order.id]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionBtn} ${styles.navex}`}
                      title="Imprimer bon de livraison"
                      style={{ textDecoration: 'none' }}
                    >
                      🖨️
                    </a>
                  )}
                  {/* Sync statut Navex — commandes expédiées */}
                  {order.navex_tracking && order.status === 'shipped' && (
                    <button
                      className={`${styles.actionBtn} ${styles.syncRowBtn}`}
                      onClick={() => handleSyncNavex(order.id)}
                      disabled={syncing}
                      title="Vérifier statut Navex"
                      type="button"
                    >
                      <RefreshCw size={13} className={syncing ? styles.spinning : ''} />
                    </button>
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
      {retailInvoiceOrder && (
        <RetailInvoicePrint order={retailInvoiceOrder} onClose={() => setRetailInvoiceOrder(null)} />
      )}
      {bulkInvoiceOrders && (
        <BulkRetailInvoicePrint orders={bulkInvoiceOrders} settings={invoiceSettings} onClose={() => setBulkInvoiceOrders(null)} />
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
