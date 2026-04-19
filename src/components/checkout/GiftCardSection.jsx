'use client'

import { useState } from 'react'
import styles from './GiftCardSection.module.css'

const MAX_RECIPIENT = 40
const MAX_MESSAGE   = 200

export default function GiftCardSection({ value, onChange }) {
  const [open, setOpen] = useState(false)

  function toggle() {
    const next = !open
    setOpen(next)
    if (!next) onChange({ enabled: false, recipient: '', message: '' })
    else onChange({ enabled: true, recipient: value.recipient || '', message: value.message || '' })
  }

  function set(field, raw) {
    const safe = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    const maxLen = field === 'recipient' ? MAX_RECIPIENT : MAX_MESSAGE
    onChange({ ...value, enabled: true, [field]: safe.slice(0, maxLen) })
  }

  const remaining = MAX_MESSAGE - (value.message?.length || 0)

  return (
    <div className={styles.wrapper}>
      <button type="button" className={`${styles.toggle} ${open ? styles.active : ''}`} onClick={toggle}>
        <span className={styles.toggleIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
            <line x1="12" y1="22" x2="12" y2="7"/>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
          </svg>
        </span>
        <div className={styles.toggleText}>
          <span className={styles.toggleTitle}>🎀 Glisse un mot dans le colis</span>
          <span className={styles.toggleSub}>Une surprise à l'ouverture — carte imprimée offerte</span>
        </div>
        <span className={`${styles.toggleBadge} ${open ? styles.badgeActive : ''}`}>
          {open ? 'Activée ✓' : 'Ajouter'}
        </span>
      </button>

      {open && (
        <div className={styles.form}>
          <div className={styles.previewBanner}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Une carte personnalisée sera imprimée et glissée dans le colis avant l'expédition.
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="gift-recipient">
              Pour qui ? <span className={styles.optional}>(optionnel)</span>
            </label>
            <input id="gift-recipient" className={styles.input} type="text"
              placeholder="Ex : Yasmine, Mon fils chéri, La petite princesse…"
              value={value.recipient || ''} onChange={(e) => set('recipient', e.target.value)}
              maxLength={MAX_RECIPIENT} autoComplete="off" spellCheck="true"/>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="gift-message">
              Ton message <span className={styles.required}>*</span>
            </label>
            <textarea id="gift-message" className={styles.textarea}
              placeholder="Ex : Bonne fête mon amour ! Tu mérites tous les slimes du monde 🌈"
              value={value.message || ''} onChange={(e) => set('message', e.target.value)}
              maxLength={MAX_MESSAGE} rows={4} spellCheck="true"/>
            <span className={`${styles.counter} ${remaining < 30 ? styles.counterWarn : ''}`}>
              {remaining} caractères restants
            </span>
          </div>

          {(value.recipient || value.message) && (
            <div className={styles.cardPreview}>
              <div className={styles.cardPreviewLabel}>Aperçu de ta carte :</div>
              <div className={styles.cardPreviewBox}>
                <div className={styles.cardPreviewDeco}>✨ HK Games ✨</div>
                {value.recipient && <div className={styles.cardPreviewTo}>Pour : {value.recipient}</div>}
                <div className={styles.cardPreviewMsg}>
                  {value.message || <span className={styles.cardPreviewPlaceholder}>Ton message apparaîtra ici…</span>}
                </div>
                <div className={styles.cardPreviewSig}>— Avec amour 💜</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
