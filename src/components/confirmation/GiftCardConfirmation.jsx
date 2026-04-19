'use client'
import styles from './GiftCardConfirmation.module.css'

export default function GiftCardConfirmation({ message, recipient }) {
  if (!message) return null
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
            <line x1="12" y1="22" x2="12" y2="7"/>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
          </svg>
        </div>
        <div className={styles.headerText}>
          <span className={styles.headerTitle}>🎀 Ta carte cadeau est prête !</span>
          <span className={styles.headerSub}>Elle sera imprimée et glissée dans le colis avant l'expédition</span>
        </div>
        <div className={styles.headerCheck}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
      <div className={styles.cardPreview}>
        <div className={styles.cardDeco}>✨ HK Games ✨</div>
        {recipient && <div className={styles.cardTo}>Pour : <strong>{recipient}</strong></div>}
        <div className={styles.cardMessage}>"{message}"</div>
        <div className={styles.cardSig}>— Avec amour 💜</div>
      </div>
      <p className={styles.note}>Notre équipe prépare ta carte avec soin. Elle arrivera dans le colis, prête à faire des heureux 🌈</p>
    </div>
  )
}
