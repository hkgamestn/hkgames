'use client'

import { AlertTriangle, PhoneCall, MessageCircle, X } from 'lucide-react'
import styles from './BlockedCustomerModal.module.css'

// Numéro de régularisation (public — pas un secret)
const CONTACT_DISPLAY = '+216 21 660 303'
const CONTACT_TEL     = '+21621660303'
const CONTACT_WA      = 'https://wa.me/21621660303'

export default function BlockedCustomerModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="blocked-title">
      <div className={styles.card}>
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        )}

        <div className={styles.iconWrap}>
          <AlertTriangle size={34} strokeWidth={2.4} />
        </div>

        {/* ─── Français ─── */}
        <div className={styles.block} lang="fr" dir="ltr">
          <h2 id="blocked-title" className={styles.title}>Commandes momentanément bloquées</h2>
          <p className={styles.text}>
            Plusieurs de vos commandes n'ont pas pu être finalisées <strong>(colis non
            réceptionné, client injoignable ou commande annulée)</strong>. Le paiement à la
            livraison n'est donc plus disponible pour ce numéro de téléphone.
          </p>
          <p className={styles.text}>
            Pour régulariser votre situation et réactiver vos commandes, merci de nous contacter :
          </p>
        </div>

        <div className={styles.divider} />

        {/* ─── العربية ─── */}
        <div className={styles.block} lang="ar" dir="rtl">
          <h2 className={styles.title}>تم إيقاف الطلبات مؤقتًا</h2>
          <p className={styles.text}>
            تعذّر إتمام عدد من طلباتك <strong>(طرد لم يُستلَم، تعذّر الوصول إليك، أو طلب مُلغى)</strong>.
            لذلك لم يعد الدفع عند الاستلام متاحًا لهذا الرقم.
          </p>
          <p className={styles.text}>
            لإعادة تفعيل طلباتك وتسوية وضعيتك، يُرجى الاتصال بنا :
          </p>
        </div>

        {/* ─── Contact ─── */}
        <div className={styles.actions}>
          <a href={`tel:${CONTACT_TEL}`} className={`${styles.btn} ${styles.btnCall}`}>
            <PhoneCall size={18} />
            <span>{CONTACT_DISPLAY}</span>
          </a>
          <a href={CONTACT_WA} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnWa}`}>
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  )
}
