'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import styles from './SocialToast.module.css'

// Commandes Pack Été — mises en avant (récompense conversion)
const PACK_ETE_EVENTS = [
  { name: 'Amira',   city: 'Sousse',   product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Mohamed', city: 'Tunis',    product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Safa',    city: 'Sfax',     product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Yassine', city: 'Monastir', product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Rim',     city: 'Bizerte',  product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Nesrine', city: 'Ariana',   product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Ines',    city: 'Gabès',    product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Mariem',  city: 'Nabeul',   product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Salma',   city: 'Kairouan', product: 'Pack Été 6 Slimes', qty: 1, ete: true },
  { name: 'Lina',    city: 'Bizerte',  product: 'Pack Été 6 Slimes', qty: 1, ete: true },
]

const OTHER_EVENTS = [
  { name: 'Rami',    city: 'Sousse',   product: 'Slime Buddies Rose',    qty: 2 },
  { name: 'Dorra',   city: 'Monastir', product: 'Pack Alchimiste',       qty: 3 },
  { name: 'Hana',    city: 'Nabeul',   product: 'Unicolore Violet',      qty: 1 },
  { name: 'Tarek',   city: 'Gabès',    product: 'Pack Découverte',       qty: 3 },
  { name: 'Yasmine', city: 'Sfax',     product: 'Bicolore Rose+Bleu',    qty: 1 },
  { name: 'Khalil',  city: 'Nabeul',   product: 'Unicolore Rouge',       qty: 2 },
  { name: 'Walid',   city: 'Sousse',   product: 'Buddy Vert',            qty: 2 },
  { name: 'Aziz',    city: 'Tunis',    product: 'Pack Famille Monstre',  qty: 3 },
]

// Biais Pack Été : 70% Pack Été, 30% autres
function pickEvent(packEteBias) {
  if (packEteBias && Math.random() < 0.7) {
    return PACK_ETE_EVENTS[Math.floor(Math.random() * PACK_ETE_EVENTS.length)]
  }
  const pool = packEteBias ? OTHER_EVENTS : [...PACK_ETE_EVENTS, ...OTHER_EVENTS]
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function SocialToast({ packEteBias = false }) {
  const pathname = usePathname()
  const [toast, setToast]     = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef              = useRef(null)
  const pausedRef             = useRef(false)

  if (pathname?.startsWith('/admin')) return null

  useEffect(() => {
    function scheduleNext(delay) {
      timerRef.current = setTimeout(showNext, delay)
    }

    function showNext() {
      // Si en pause (formulaire en cours), reporter
      if (pausedRef.current) {
        scheduleNext(3000)
        return
      }
      const evt  = pickEvent(packEteBias)
      const time = Math.floor(Math.random() * 14) + 1
      setToast({ ...evt, time })
      setVisible(true)

      setTimeout(() => {
        setVisible(false)
        setTimeout(() => {
          setToast(null)
          const delay = Math.floor(Math.random() * 25000) + 20000 // 20-45s
          scheduleNext(delay)
        }, 400)
      }, 5000)
    }

    const initial = Math.floor(Math.random() * 5000) + 3000
    scheduleNext(initial)

    // ── Pause / reprise via événements window (depuis le formulaire) ──
    function onPause() {
      pausedRef.current = true
      setVisible(false)
    }
    function onResume() { pausedRef.current = false }
    // Toast Pack Été forcé (relance après 15s d'inactivité formulaire)
    function onForceEte() {
      if (pausedRef.current) return
      const evt  = PACK_ETE_EVENTS[Math.floor(Math.random() * PACK_ETE_EVENTS.length)]
      const time = Math.floor(Math.random() * 9) + 1
      setToast({ ...evt, time })
      setVisible(true)
      setTimeout(() => setVisible(false), 5000)
    }

    window.addEventListener('toast-pause', onPause)
    window.addEventListener('toast-resume', onResume)
    window.addEventListener('toast-force-ete', onForceEte)

    return () => {
      clearTimeout(timerRef.current)
      window.removeEventListener('toast-pause', onPause)
      window.removeEventListener('toast-resume', onResume)
      window.removeEventListener('toast-force-ete', onForceEte)
    }
  }, [packEteBias])

  if (!toast) return null

  return (
    <div
      className={`${styles.toast} ${visible ? styles.show : styles.hide} ${toast.ete ? styles.toastEte : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.icon}>
        {toast.ete ? '☀️' : <ShoppingBag size={16} />}
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
