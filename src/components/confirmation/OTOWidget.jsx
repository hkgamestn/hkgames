'use client'

import { useState, useEffect } from 'react'
import { Zap, X } from 'lucide-react'
import { acceptOTO } from '@/lib/actions/orders'
import { createClient } from '@/lib/supabase/client'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './OTOWidget.module.css'

const OTO_PRICE_REDUCTION = 6
const BUDDY_PRICE_DEFAULT = 18

const BUDDY_COLORS = [
  { name: 'Rouge',  hex: '#ef4444' },
  { name: 'Bleu',   hex: '#3b82f6' },
  { name: 'Rose',   hex: '#ec4899' },
  { name: 'Violet', hex: '#a855f7' },
  { name: 'Vert',   hex: '#22c55e' },
]

const COUNTDOWN = 300

export default function OTOWidget({ orderId, onAccepted }) {
  const [timeLeft, setTimeLeft]      = useState(COUNTDOWN)
  const [dismissed, setDismissed]    = useState(false)
  const [selectedColor, setSelected] = useState(null)
  const [loading, setLoading]        = useState(false)
  const [accepted, setAccepted]      = useState(false)
  const [buddyPrice, setBuddyPrice]  = useState(BUDDY_PRICE_DEFAULT)
  const [buddyProductId, setBuddyProductId] = useState(null)

  // Récupérer le vrai prix du Buddy depuis la DB
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('id, price_dt')
      .eq('line', 'buddies')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.price_dt) setBuddyPrice(data.price_dt)
        if (data?.id)       setBuddyProductId(data.id)
      })
  }, [])

  useEffect(() => {
    if (timeLeft <= 0 || dismissed) return
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, dismissed])

  const otaFinalPrice = buddyPrice - OTO_PRICE_REDUCTION

  async function handleAccept() {
    if (!selectedColor) return
    setLoading(true)
    const result = await acceptOTO(orderId, {
      product_id: buddyProductId || 'oto-buddy',
      name: `Buddy ${selectedColor.name}`,
      line: 'buddies',
      color: selectedColor.name,
      color_hex: selectedColor.hex,
      price_dt: buddyPrice,
      qty: 1,
    })
    if (result.success) {
      setAccepted(true)
      if (onAccepted) onAccepted()
    }
    setLoading(false)
  }

  if (dismissed || timeLeft <= 0) return null
  if (accepted) {
    return (
      <div className={styles.acceptedMsg}>
        ✅ Buddy ajouté à votre commande ! On vous livrera ensemble.
      </div>
    )
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className={styles.widget}>
      <button className={styles.dismiss} onClick={() => setDismissed(true)} aria-label="Fermer" type="button">
        <X size={16} />
      </button>

      <div className={styles.timer}>
        <Zap size={14} />
        Offre limitée — expire dans {mins}:{secs}
      </div>

      <h3 className={styles.title}>
        Ajoute 1 Buddy à ta commande pour seulement +{formatDT(otaFinalPrice)} !
      </h3>
      <p className={styles.subtitle}>Livré avec ton colis, sans frais supplémentaires.</p>

      <div className={styles.colorRow}>
        {BUDDY_COLORS.map((c) => (
          <button
            key={c.name}
            className={`${styles.colorBtn} ${selectedColor?.name === c.name ? styles.colorSelected : ''}`}
            style={{ background: c.hex }}
            onClick={() => setSelected(c)}
            title={c.name}
            aria-label={c.name}
            aria-pressed={selectedColor?.name === c.name}
            type="button"
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.acceptBtn}
          onClick={handleAccept}
          disabled={!selectedColor || loading}
          type="button"
        >
          {loading ? 'Ajout...' : `Ajouter pour +${formatDT(otaFinalPrice)}`}
        </button>
        <button className={styles.declineBtn} onClick={() => setDismissed(true)} type="button">
          Non merci
        </button>
      </div>
    </div>
  )
}
