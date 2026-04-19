'use client'
import styles from './GiftCardPrint.module.css'

export default function GiftCardPrint({ order, onClose }) {
  if (!order?.gift_message) return null
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.adminHeader}>
          <span>🎁 Carte cadeau — Commande #{order.id?.slice(-6).toUpperCase()}</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.printPreview} id="gift-card-print">
          <div className={styles.card}>
            <div className={styles.cornerTL}/><div className={styles.cornerTR}/>
            <div className={styles.cornerBL}/><div className={styles.cornerBR}/>
            <div className={styles.cardHeader}>
              <div className={styles.cardLogo}>✨ HK Games ✨</div>
              <div className={styles.cardTagline}>Slime Artisanal · Fait avec amour</div>
            </div>
            <div className={styles.divider}>{'~ · ~ · ~ · ~ · ~ · ~ · ~ · ~ · ~'}</div>
            {order.gift_recipient && (
              <div className={styles.cardTo}>
                <span className={styles.cardToLabel}>Pour :</span>
                <span className={styles.cardToName}>{order.gift_recipient}</span>
              </div>
            )}
            <div className={styles.cardMessage}>"{order.gift_message}"</div>
            <div className={styles.divider}>{'~ · ~ · ~ · ~ · ~ · ~ · ~ · ~ · ~'}</div>
            <div className={styles.cardFooter}>
              <div className={styles.cardFooterLine}>Avec tout notre amour 💜</div>
              <div className={styles.cardFooterSocial}>@hapkidsgames · HK Games Tunisia</div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.orderInfo}>
            <span className={styles.orderInfoItem}>{order.customer_name}</span>
            <span className={styles.orderInfoItem}>{order.phone}</span>
          </div>
          <div className={styles.actionBtns}>
            <button className={styles.btnSecondary} onClick={onClose}>Fermer</button>
            <button className={styles.btnPrint} onClick={() => window.print()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer la carte
            </button>
          </div>
        </div>
      </div>
      <style>{`@media print{body *{visibility:hidden!important}#gift-card-print,#gift-card-print *{visibility:visible!important}#gift-card-print{position:fixed!important;top:0;left:0;right:0;bottom:0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:white!important}}`}</style>
    </div>
  )
}
