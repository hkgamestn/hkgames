'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import styles from './SocialToast.module.css'

const EVENTS = [
  { name: 'Amira',   city: 'Sousse',   product: 'Slime Buddies Rose',    qty: 2 },
  { name: 'Mohamed', city: 'Tunis',    product: 'Pack Alchimiste',        qty: 3 },
  { name: 'Safa',    city: 'Sfax',     product: 'Unicolore Violet',       qty: 1 },
  { name: 'Yassine', city: 'Monastir', product: 'Pack Découverte',        qty: 3 },
  { name: 'Rim',     city: 'Bizerte',  product: 'Slime Buddies Bleu',     qty: 2 },
  { name: 'Nesrine', city: 'Ariana',   product: 'Pack Famille Monstre',   qty: 3 },
  { name: 'Ines',    city: 'Gabès',    product: 'Bicolore Rose+Bleu',     qty: 1 },
  { name: 'Mariem',  city: 'Tunis',    product: 'Unicolore Jaune',        qty: 1 },
  { name: 'Salma',   city: 'Sfax',     product: 'Slime Buddies Violet',   qty: 2 },
  { name: 'Rami',    city: 'Sousse',   product: 'Unicolore Vert',         qty: 2 },
  { name: 'Dorra',   city: 'Monastir', product: 'Slime Buddies Orange',   qty: 1 },
  { name: 'Lina',    city: 'Bizerte',  product: 'Unicolore Rose',         qty: 2 },
  { name: 'Skander', city: 'Ariana',   product: 'Pack Découverte',        qty: 3 },
  { name: 'Hana',    city: 'Nabeul',   product: 'Bicolore Jaune+Bleu',   qty: 1 },
  { name: 'Tarek',   city: 'Gabès',    product: 'Pack Famille Monstre',   qty: 3 },
  { name: 'Yasmine', city: 'Sfax',     product: 'Bicolore Rose+Bleu',     qty: 1 },
  { name: 'Khalil',  city: 'Nabeul',   product: 'Unicolore Rouge',        qty: 2 },
  { name: 'Walid',   city: 'Sousse',   product: 'Buddy Vert',             qty: 2 },
  { name: 'Aziz',    city: 'Tunis',    product: 'Pack Alchimiste',        qty: 3 },
  { name: 'Malek',   city: 'Tunis',    product: 'Buddy Bleu',             qty: 2 },
]

export default function SocialToast() {
  const pathname = usePathname()
  const [toast, setToast]     = useState(null)
  const [visible, setVisible] = useState(false)
  const idxRef                = useRef(Math.floor(Math.random() * EVENTS.length))
  const timerRef              = useRef(null)

  // Ne rien afficher sur les pages admin
  if (pathname?.startsWith('/admin')) return null

  useEffect(() => {
    function showNext() {
      const evt = EVENTS[idxRef.current % EVENTS.length]
      idxRef.current++
      const time = Math.floor(Math.random() * 14) + 1

      setToast({ ...evt, time })
      setVisible(true)

      // Cacher après 5s
      setTimeout(() => {
        setVisible(false)
        // Attendre la transition de sortie avant de planifier le suivant
        setTimeout(() => {
          setToast(null)
          const delay = Math.floor(Math.random() * 25000) + 20000 // 20-45s
          timerRef.current = setTimeout(showNext, delay)
        }, 400)
      }, 5000)
    }

    // Premier toast entre 3s et 8s après chargement
    const initial = Math.floor(Math.random() * 5000) + 3000
    timerRef.current = setTimeout(showNext, initial)

    return () => clearTimeout(timerRef.current)
  }, [])

  if (!toast) return null

  return (
    <div
      className={`${styles.toast} ${visible ? styles.show : styles.hide}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.icon}>
        <ShoppingBag size={16} />
      </div>
      <div className={styles.body}>
        <p className={styles.main}>
          <strong>{toast.name}</strong> de {toast.city}
        </p>
        <p className={styles.sub}>
          vient d&apos;acheter {toast.product}
          {toast.qty > 1 ? ` ×${toast.qty}` : ''} · il y a {toast.time} min
        </p>
      </div>
    </div>
  )
}
