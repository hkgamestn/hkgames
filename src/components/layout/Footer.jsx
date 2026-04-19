import Link from 'next/link'
import { MapPin, Phone, Instagram, Facebook } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <h3 className={styles.brandName}>HK Games</h3>
          <p className={styles.brandTagline}>Le Slime N°1 de Tunisie</p>
          <div className={styles.trustBadges}>
            <span className={styles.badge}>✅ Paiement à la livraison</span>
            <span className={styles.badge}>🚀 Livraison 24–48h</span>
            <span className={styles.badge}>🧪 Non-toxique certifié</span>
          </div>
        </div>

        <div className={styles.links}>
          <h4 className={styles.linksTitle}>Boutique</h4>
          <nav>
            <Link href="/shop/unicolore" className={styles.link}>Slime Unicolore</Link>
            <Link href="/shop/bicolore"  className={styles.link}>Slime Bicolore</Link>
            <Link href="/shop/buddies"   className={styles.link}>Slime Buddies</Link>
            <Link href="/shop"           className={styles.link}>Tous les produits</Link>
            <Link href="/avis"           className={styles.link}>Avis clients</Link>
          </nav>
        </div>

        <div className={styles.contact}>
          <h4 className={styles.linksTitle}>Contact</h4>
          <div className={styles.contactItem}>
            <Phone size={14} />
            <a href="tel:+21621660303" className={styles.contactLink}>+216 21 660 303</a>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={14} />
            <span>Tunis, Tunisie</span>
          </div>
          <div className={styles.social}>
            <a href="https://www.facebook.com/happkidsgames/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.socialBtn}>
              <Facebook size={18} />
            </a>
            <a href="https://www.instagram.com/hapkidsgames/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialBtn}>
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} HK Games Slime Store. Tous droits réservés.</p>
      </div>
    </footer>
  )
}
