'use client'

import { useEffect, useState } from 'react'
import { Flame, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './SocialProof.module.css'

const SOCIAL_EVENTS = [
  { name: 'Amira',   city: 'Sousse',   product: 'Slime Buddies Rose',    time: 3 },
  { name: 'Mohamed', city: 'Tunis',    product: 'Pack Alchimiste',        time: 7 },
  { name: 'Safa',    city: 'Sfax',     product: 'Unicolore Violet',       time: 12 },
  { name: 'Yassine', city: 'Monastir', product: 'Pack Découverte',        time: 2 },
  { name: 'Rim',     city: 'Bizerte',  product: 'Slime Buddies Bleu',     time: 5 },
  { name: 'Khalil',  city: 'Nabeul',   product: 'Unicolore Rouge x2',     time: 8 },
  { name: 'Nesrine', city: 'Ariana',   product: 'Pack Famille Monstre',   time: 1 },
  { name: 'Ines',    city: 'Gabès',    product: 'Bicolore Rose+Bleu',     time: 14 },
  { name: 'Walid',   city: 'Sousse',   product: 'Buddy Vert x2',          time: 6 },
  { name: 'Mariem',  city: 'Tunis',    product: 'Unicolore Jaune',        time: 9 },
]

export default function SocialProof() {
  const [salesCount, setSalesCount] = useState(1248)
  const [toast, setToast] = useState(null)
  const [toastIdx, setToastIdx] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'cancelled')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .then(({ count }) => { if (count) setSalesCount(count) })
  }, [])

  useEffect(() => {
    function showToast() {
      const evt = SOCIAL_EVENTS[toastIdx % SOCIAL_EVENTS.length]
      setToast(evt)
      setTimeout(() => setToast(null), 4000)
      setToastIdx((i) => i + 1)
    }

    const delay = Math.floor(Math.random() * 60000) + 30000
    const timer = setTimeout(showToast, delay)
    return () => clearTimeout(timer)
  }, [toast, toastIdx])

  return (
    <>
      <section className={styles.section}>
        <div className={styles.counter}>
          <Flame size={24} className={styles.flameIcon} />
          <span className={styles.count}>{salesCount.toLocaleString('fr-FR')}</span>
          <span className={styles.counterLabel}>slimes vendus ce mois</span>
        </div>
      </section>

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          <ShoppingBag size={18} className={styles.toastIcon} />
          <div>
            <p className={styles.toastMain}>{toast.name} de {toast.city}</p>
            <p className={styles.toastSub}>vient d'acheter {toast.product} — il y a {toast.time} min</p>
          </div>
        </div>
      )}
    </>
  )
}
