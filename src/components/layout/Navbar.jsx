'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '/shop',           label: 'Boutique'  },
  { href: '/shop/unicolore', label: 'Unicolore' },
  { href: '/shop/bicolore',  label: 'Bicolore'  },
  { href: '/shop/buddies',   label: 'Buddies'   },
  { href: '/avis',           label: 'Avis'      },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname  = usePathname()
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.qty, 0))

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>HK Games</span>
        </Link>

        <div className={styles.codBadge}>
          <span className={styles.codDot} />
          Paiement à la livraison
        </div>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ''}`}
              onClick={() => setMenuOpen(false)}
              prefetch={true}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/panier" className={styles.cartBtn} aria-label={`Panier — ${itemCount} articles`}>
            <ShoppingCart size={22} />
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </Link>
          <button className={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Fermer' : 'Menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
