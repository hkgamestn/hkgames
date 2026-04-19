'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import { computeBundle, getBundleUpsell } from '@/lib/utils/bundleRules'
import { formatDT } from '@/lib/utils/formatDT'
import ShippingProgress from '@/components/cart/ShippingProgress'
import CrossSell from '@/components/cart/CrossSell'
import BundleProgressTracker from '@/components/cart/BundleProgressTracker'
import { createClient } from '@/lib/supabase/client'
import styles from './CartContent.module.css'

export default function CartContent() {
  const { items, removeItem, updateQty } = useCartStore()
  const [mounted, setMounted]           = useState(false)
  const [freeThreshold, setFreeThreshold] = useState(50)
  const [shippingPrice, setShippingPrice] = useState(8)
  const [discounts, setDiscounts]       = useState({ decouverte: 15, alchimiste: 20, famille: 18 })
  const [showThank, setShowThank]       = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (!data) return
      const map = {}
      data.forEach((s) => { map[s.key] = s.value })
      setFreeThreshold(parseFloat(map.free_shipping_threshold_dt || '50'))
      setShippingPrice(parseFloat(map.shipping_price_dt || '8'))
      setDiscounts({
        decouverte: parseFloat(map.bundle_decouverte_pct || '15'),
        alchimiste: parseFloat(map.bundle_alchimiste_pct || '20'),
        famille:    parseFloat(map.bundle_famille_pct    || '18'),
      })
    })
  }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <ShoppingBag size={56} className={styles.emptyIcon} />
        <h2>Ton panier est vide</h2>
        <p>Découvre nos slimes artisanaux !</p>
        <Link href="/shop" className={styles.shopBtn}>
          Voir la boutique <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  const subtotal = items.reduce((s, i) => s + i.price_dt * i.qty, 0)
  const { bundleType, savings, discount } = computeBundle(items, discounts)
  const upsell   = getBundleUpsell(items)
  const shipping = subtotal >= freeThreshold ? 0 : shippingPrice
  const total    = subtotal - savings + shipping

  const BUNDLE_LABELS = {
    decouverte:      `🎁 Pack Découverte activé ! (-${discounts.decouverte}%)`,
    alchimiste:      `⚗️ Pack Alchimiste activé ! (-${discounts.alchimiste}%)`,
    famille_monstre: `👨‍👩‍👧 Famille Monstre activé ! (-${discounts.famille}%)`,
  }

  const UPSELL_MSGS = {
    buddies:   `➕ Ajoute des Buddies → Pack Famille Monstre (-${discounts.famille}%) !`,
    bicolore:  `➕ Ajoute des Bicolores → Pack Alchimiste (-${discounts.alchimiste}%) !`,
    unicolore: `➕ Ajoute des Unicolores → Pack Découverte (-${discounts.decouverte}%) !`,
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mon Panier</h1>
      <div className={styles.layout}>

        {/* ── Colonne gauche ── */}
        <div className={styles.itemsList}>

          {bundleType && (
            <div className={styles.bundleBadge}>
              <span>{BUNDLE_LABELS[bundleType]}</span>
              <span className={styles.bundleSavings}>Tu économises {formatDT(savings)}</span>
            </div>
          )}

          {upsell && !bundleType && (
            <div className={styles.upsellBanner}>
              <span>{UPSELL_MSGS[upsell.type] || upsell.message}</span>
              <Link href={`/shop/${upsell.type}`} className={styles.upsellLink}>Voir →</Link>
            </div>
          )}

          <BundleProgressTracker items={items} discounts={discounts} />

          {items.map((item) => (
            <div key={`${item.product_id}-${item.color}`} className={styles.item}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="72px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: `${item.color_hex || '#a855f7'}44`, borderRadius: '8px' }} />
                )}
              </div>
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                {item.buddy_name && <p className={styles.itemSub}>{item.buddy_name}</p>}
                <p className={styles.itemPrice}>{formatDT(item.price_dt)}</p>
              </div>
              <div className={styles.itemActions}>
                <div className={styles.qtyControl}>
                  <button onClick={() => updateQty(item.product_id, item.color, item.qty - 1)} type="button">−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.product_id, item.color, item.qty + 1)} type="button">+</button>
                </div>
                <p className={styles.itemTotal}>{formatDT(item.price_dt * item.qty)}</p>
                <button className={styles.removeBtn} onClick={() => removeItem(item.product_id, item.color)} type="button">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          <CrossSell items={items} />
        </div>

        {/* ── Colonne droite ── */}
        <div className={styles.summary}>
          <div className={styles.summaryCard} style={{ padding: "24px" }}>
            <h2 className={styles.summaryTitle}>Résumé</h2>

            <ShippingProgress
              cartTotal={subtotal}
              threshold={freeThreshold}
              shippingPrice={shippingPrice}
            />

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Sous-total</span><span>{formatDT(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className={`${styles.summaryRow} ${styles.discount}`}>
                  <span>Réduction {discount}%</span>
                  <span>−{formatDT(savings)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Livraison</span>
                <span>{shipping === 0 ? '🎉 Gratuite !' : formatDT(shipping)}</span>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalAmount}>{formatDT(total)}</span>
            </div>

            <div className={styles.codBadge}>
              ✅ Paiement à la livraison — Vous payez à la réception
            </div>

            <Link
              href="/commander"
              className={styles.checkoutBtn}
              onClick={() => setShowThank(true)}
            >
              Commander <ArrowRight size={18} />
            </Link>
            {showThank && (
              <div className={styles.thankMsg}>
                Merci ! Vous allez etre redirige vers la confirmation de votre commande.
              </div>
            )}

            <Link href="/shop" className={styles.continueLink}>
              Continuer mes achats
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
