'use client'

import { useState, useEffect } from 'react'
import { Zap, X } from 'lucide-react'
import { acceptOTO } from '@/lib/actions/orders'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './OTOWidget.module.css'

const OTO_PRICE_REDUCTION = 6
const BUDDY_PRICE         = 18
const OTO_FINAL_PRICE     = BUDDY_PRICE - OTO_PRICE_REDUCTION

const BUDDY_COLORS = [
  { name: 'Rouge',  hex: '#ef4444' },
  { name: 'Bleu',   hex: '#3b82f6' },
  { name: 'Rose',   hex: '#ec4899' },
  { name: 'Violet', hex: '#a855f7' },
  { name: 'Vert',   hex: '#22c55e' },
]

const COUNTDOWN = 300 // 5 minutes

export default function OTOWidget({ orderId }) {
  const [timeLeft, setTimeLeft]       = useState(COUNTDOWN)
  const [dismissed, setDismissed]     = useState(false)
  const [selectedColor, setSelected]  = useState(null)
  const [loading, setLoading]         = useState(false)
  const [accepted, setAccepted]       = useState(false)

  useEffect(() => {
    if (timeLeft <= 0 || dismissed) return
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, dismissed])

  async function handleAccept() {
    if (!selectedColor) return
    setLoading(true)
    const result = await acceptOTO(orderId, {
      product_id: 'oto-buddy',
      name: `Buddy ${selectedColor.name}`,
      line: 'buddies',
      color: selectedColor.name,
      color_hex: selectedColor.hex,
      price_dt: BUDDY_PRICE,
      qty: 1,
    })
    if (result.success) setAccepted(true)
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
        Ajoute 1 Buddy à ta commande pour seulement +{formatDT(OTO_FINAL_PRICE)} !
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
          {loading ? 'Ajout...' : `Ajouter pour +${formatDT(OTO_FINAL_PRICE)}`}
        </button>
        <button className={styles.declineBtn} onClick={() => setDismissed(true)} type="button">
          Non merci
        </button>
      </div>
    </div>
  )
}
