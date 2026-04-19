'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import StockBadge from '@/components/ui/StockBadge'
import { addToWaitlist } from '@/lib/actions/products'
import styles from './ColorPicker.module.css'

export default function ColorPicker({ colors = [], productId, selectedColor, onColorChange }) {
  const [waitlistPhone, setWaitlistPhone] = useState('')
  const [waitlistColor, setWaitlistColor] = useState(null)
  const [waitlistSent, setWaitlistSent] = useState(false)

  async function handleWaitlist(colorName) {
    if (!waitlistPhone || waitlistPhone.length < 8) return
    await addToWaitlist({ productId, color: colorName, phone: waitlistPhone })
    setWaitlistSent(true)
    setTimeout(() => { setWaitlistSent(false); setWaitlistColor(null); setWaitlistPhone('') }, 2000)
  }

  return (
    <div className={styles.picker}>
      <p className={styles.label}>Couleur</p>
      <div className={styles.swatches}>
        {colors.map((c) => (
          <div key={c.name} className={styles.swatchWrap}>
            <button
              className={`${styles.swatch} ${selectedColor?.name === c.name ? styles.selected : ''} ${c.stock === 0 ? styles.empty : ''}`}
              style={{ background: c.hex }}
              onClick={() => {
                if (c.stock === 0) { setWaitlistColor(c.name); return }
                onColorChange(c)
              }}
              title={c.name}
              aria-label={`${c.name}${c.stock === 0 ? ' — Épuisé' : c.stock <= 5 ? ` — Plus que ${c.stock}` : ''}`}
              aria-pressed={selectedColor?.name === c.name}
              type="button"
            />
            {c.stock === 0 && (
              <span className={styles.emptyLine} />
            )}
          </div>
        ))}
      </div>

      {selectedColor && (
        <div className={styles.selectedInfo}>
          <span className={styles.selectedName}>{selectedColor.name}</span>
          <StockBadge stock={selectedColor.stock} />
        </div>
      )}

      {waitlistColor && (
        <div className={styles.waitlistForm}>
          <p className={styles.waitlistMsg}>
            <Bell size={14} /> Épuisé — Laisse ton numéro pour être prévenu
          </p>
          {waitlistSent ? (
            <p className={styles.waitlistSuccess}>✅ Enregistré ! On te contacte dès le retour en stock.</p>
          ) : (
            <div className={styles.waitlistInputRow}>
              <input
                type="tel"
                placeholder="+216 XX XXX XXX"
                value={waitlistPhone}
                onChange={(e) => setWaitlistPhone(e.target.value)}
                className={styles.waitlistInput}
              />
              <button
                onClick={() => handleWaitlist(waitlistColor)}
                type="button"
                className={styles.waitlistBtn}
              >
                Prévenir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
