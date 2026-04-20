'use client'

import { useState, useEffect, useRef } from 'react'
import GiftCardSection from '@/components/checkout/GiftCardSection'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, Truck, Lock } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import { createPendingOrder, confirmOrder } from '@/lib/actions/orders'
import { computeBundle } from '@/lib/utils/bundleRules'
import { formatDT } from '@/lib/utils/formatDT'
import { createClient } from '@/lib/supabase/client'
import styles from './CheckoutForm.module.css'

const GOVERNORATS = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax',
  'Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine',
  'Gafsa','Tozeur','Kébili',
]

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName:  z.string().min(2, 'Nom requis'),
  phone:     z.string()
    .min(8, 'Numéro incomplet')
    .max(8, 'Numéro trop long')
    .regex(/^[2-9][0-9]{7}$/, 'Numéro tunisien invalide (8 chiffres)'),
  address:   z.string().min(10, 'Adresse trop courte'),
  city:      z.string().min(2, 'Gouvernorat requis'),
  notes:     z.string().optional(),
})

export default function CheckoutForm() {
  const router   = useRouter()
  const { items, clearCart } = useCartStore()
  const [mounted, setMounted]          = useState(false)
  const [pendingOrderId, setPendingId] = useState(null)
  const [submitting, setSubmitting]    = useState(false)
  const [serverError, setServerError]  = useState(null)
  const [freeThreshold, setFreeThreshold] = useState(50)
  const [shippingPrice, setShippingPrice] = useState(8)
  const [discounts, setDiscounts] = useState({ decouverte: 15, alchimiste: 20, famille: 18 })
  const phonePendingRef = useRef(false)
  const [giftCard, setGiftCard] = useState({ enabled: false, recipient: '', message: '' })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', { currency: 'TND' })
    }
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const phoneValue = watch('phone', '')

  async function handlePhoneBlur() {
    const valid = /^[2-9][0-9]{7}$/.test(phoneValue)
    if (!valid || phonePendingRef.current || pendingOrderId) return
    phonePendingRef.current = true
    const subtotal = items.reduce((s, i) => s + i.price_dt * i.qty, 0)
    const fullPhone = '+216' + phoneValue
    const result = await createPendingOrder({ phone: fullPhone, items, subtotalDt: subtotal, giftMessage: giftCard.enabled ? giftCard.message : null, giftRecipient: giftCard.enabled ? giftCard.recipient : null })
    if (result.orderId) setPendingId(result.orderId)
    phonePendingRef.current = false
  }

  async function onSubmit(data) {
    setSubmitting(true)
    setServerError(null)
    const fullPhone = '+216' + data.phone
    const result = await confirmOrder({ ...data, phone: fullPhone, items, discounts, giftMessage: giftCard.enabled ? giftCard.message : null, giftRecipient: giftCard.enabled ? giftCard.recipient : null }, pendingOrderId)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Veuillez vérifier vos informations.')
      setSubmitting(false)
      return
    }
    const isTest = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('.vercel.app') ||
      window.location.search.includes('test=1')
    )
    if (!isTest && typeof window !== 'undefined' && window.fbq) {
      const total = items.reduce((s, i) => s + i.price_dt * i.qty, 0)
      window.fbq('track', 'Purchase', { value: total, currency: 'TND', order_id: result.orderId })
    }
    // ⚠️ router.push AVANT clearCart — évite la redirection /panier
    router.push(`/merci?id=${result.orderId}`)
    clearCart()
  }

  if (!mounted) return null
  // Ne pas rediriger vers /panier si on vient de confirmer (navigation en cours)
  if (items.length === 0 && !submitting) { router.replace('/panier'); return null }

  const subtotal = items.reduce((s, i) => s + i.price_dt * i.qty, 0)
  const { savings, bundleType } = computeBundle(items, discounts)
  const shipping = subtotal >= freeThreshold ? 0 : shippingPrice
  const total    = subtotal - savings + shipping

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
            <h1 className={styles.title}>Finaliser ma commande</h1>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Vos informations</h2>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="firstName">Prénom *</label>
                  <input id="firstName" className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`} {...register('firstName')} placeholder="Amira" />
                  {errors.firstName && <p className={styles.error}>{errors.firstName.message}</p>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="lastName">Nom *</label>
                  <input id="lastName" className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`} {...register('lastName')} placeholder="Ben Ali" />
                  {errors.lastName && <p className={styles.error}>{errors.lastName.message}</p>}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">Téléphone *</label>
                <div className={styles.phoneWrap}>
                  <span className={styles.phonePrefix}>+216</span>
                  <input
                    id="phone"
                    type="tel"
                    className={`${styles.phoneInput} ${errors.phone ? styles.inputError : ''}`}
                    {...register('phone')}
                    onBlur={handlePhoneBlur}
                    placeholder="XX XXX XXX"
                    inputMode="numeric"
                    maxLength={8}
                  />
                </div>
                {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}
                {pendingOrderId && !errors.phone && (
                  <p className={styles.pendingNote}>✅ Commande enregistrée — continuez pour confirmer</p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="address">Adresse complète *</label>
                <textarea id="address" className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`} {...register('address')} placeholder="Rue, immeuble, appartement..." rows={3} />
                {errors.address && <p className={styles.error}>{errors.address.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="city">Gouvernorat *</label>
                <select id="city" className={`${styles.select} ${errors.city ? styles.inputError : ''}`} {...register('city')}>
                  <option value="">Sélectionner...</option>
                  {GOVERNORATS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.city && <p className={styles.error}>{errors.city.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="notes">Instructions livraison (optionnel)</label>
                <textarea id="notes" className={styles.textarea} {...register('notes')} placeholder="Code d'accès, étage, heure préférée..." rows={2} />
              </div>
            </div>

            {serverError && <div className={styles.serverError}>{serverError}</div>}

            {/* ─── Carte cadeau ─── */}
            <GiftCardSection value={giftCard} onChange={setGiftCard} />

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              <Lock size={18} />
              {submitting ? 'Confirmation en cours...' : 'Confirmer ma commande'}
            </button>

            <p className={styles.codNote}>
              <ShieldCheck size={14} />
              Paiement à la livraison · Vous payez le livreur à la réception
            </p>
          </form>

          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Votre commande</h2>
              <div className={styles.itemsList}>
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.color}`} className={styles.summaryItem}>
                    <div className={styles.itemDot} style={{ background: item.color_hex || '#a855f7' }} />
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemQty}>Qté : {item.qty}</p>
                    </div>
                    <p className={styles.itemPrice}>{formatDT(item.price_dt * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}><span>Sous-total</span><span>{formatDT(subtotal)}</span></div>
                {savings > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discount}`}>
                    <span>Réduction bundle</span><span>−{formatDT(savings)}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Livraison</span>
                  <span>{shipping === 0 ? '🎉 Gratuite !' : formatDT(shipping)}</span>
                </div>
              </div>
              <div className={styles.totalRow}>
                <span>Total à payer</span>
                <span className={styles.totalAmount}>{formatDT(total)}</span>
              </div>
              <div className={styles.codBadge}><ShieldCheck size={16} />Paiement à la livraison</div>
              <div className={styles.deliveryBadge}><Truck size={16} />Livraison 24–48h partout en Tunisie</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
