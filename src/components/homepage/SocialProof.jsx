'use client'
import { useEffect, useState, useRef } from 'react'
import { Flame, ShoppingBag } from 'lucide-react'
import styles from './SocialProof.module.css'

const SOCIAL_EVENTS = [
  { name: 'Amira',    city: 'Sousse',   product: 'Slime Buddies Rose',     qty: 2 },
  { name: 'Mohamed',  city: 'Tunis',    product: 'Pack Alchimiste',         qty: 3 },
  { name: 'Safa',     city: 'Sfax',     product: 'Unicolore Violet',        qty: 1 },
  { name: 'Yassine',  city: 'Monastir', product: 'Pack Découverte',         qty: 3 },
  { name: 'Rim',      city: 'Bizerte',  product: 'Slime Buddies Bleu',      qty: 2 },
  { name: 'Khalil',   city: 'Nabeul',   product: 'Unicolore Rouge',         qty: 2 },
  { name: 'Nesrine',  city: 'Ariana',   product: 'Pack Famille Monstre',    qty: 3 },
  { name: 'Ines',     city: 'Gabès',    product: 'Bicolore Rose+Bleu',      qty: 1 },
  { name: 'Walid',    city: 'Sousse',   product: 'Buddy Vert',              qty: 2 },
  { name: 'Mariem',   city: 'Tunis',    product: 'Unicolore Jaune',         qty: 1 },
  { name: 'Salma',    city: 'Sfax',     product: 'Slime Buddies Violet',    qty: 2 },
  { name: 'Aziz',     city: 'Tunis',    product: 'Pack Alchimiste',         qty: 3 },
  { name: 'Hana',     city: 'Nabeul',   product: 'Bicolore Jaune+Bleu',    qty: 1 },
  { name: 'Rami',     city: 'Sousse',   product: 'Unicolore Vert',          qty: 2 },
  { name: 'Dorra',    city: 'Monastir', product: 'Slime Buddies Orange',    qty: 1 },
  { name: 'Skander',  city: 'Ariana',   product: 'Pack Découverte',         qty: 3 },
  { name: 'Lina',     city: 'Bizerte',  product: 'Unicolore Rose',          qty: 2 },
  { name: 'Malek',    city: 'Tunis',    product: 'Buddy Bleu x2',           qty: 2 },
  { name: 'Yasmine',  city: 'Sfax',     product: 'Bicolore Rose+Bleu',      qty: 1 },
  { name: 'Tarek',    city: 'Gabès',    product: 'Pack Famille Monstre',    qty: 3 },
]

// Calcul déterministe basé sur la date — même valeur pour tous les visiteurs
function computeSalesCount() {
  const now      = new Date()
  const year     = now.getFullYear()
  const month    = now.getMonth()
  const dayOfMonth = now.getDate() // 1..31

  // Seed basé sur année+mois pour variation mensuelle cohérente
  const seed = year * 100 + month

  // Base de départ du mois (entre 0 et 20 pour variation naturelle)
  const rng = (s) => ((s * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff
  const startOffset = Math.floor(rng(seed) * 20)

  // Cumul des jours passés (jour 1 à dayOfMonth-1 déjà complets + aujourd'hui partiel)
  let total = startOffset
  for (let d = 1; d < dayOfMonth; d++) {
    const daySeed = seed * 31 + d
    total += Math.floor(40 + rng(daySeed) * 20) // 40-60 par jour complet
  }

  // Aujourd'hui : proportionnel à l'heure (0h → 0%, 23h → ~100%)
  const hourFraction = (now.getHours() * 60 + now.getMinutes()) / (24 * 60)
  const todaySeed    = seed * 31 + dayOfMonth
  const todayTotal   = Math.floor(40 + rng(todaySeed) * 20)
  total += Math.floor(todayTotal * hourFraction)

  return total
}

export default function SocialProof() {
  const [salesCount, setSalesCount] = useState(() => computeSalesCount())
  const [toast, setToast]           = useState(null)
  const idxRef                      = useRef(Math.floor(Math.random() * SOCIAL_EVENTS.length))
  const timerRef                    = useRef(null)

  // Incrémenter le compteur chaque minute (simulation temps réel)
  useEffect(() => {
    const interval = setInterval(() => {
      setSalesCount(computeSalesCount())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Toasts — premier après 2s, puis intervalle aléatoire 25-55s
  useEffect(() => {
    function showNext() {
      const evt = SOCIAL_EVENTS[idxRef.current % SOCIAL_EVENTS.length]
      idxRef.current++

      // Ajouter les pots vendus au compteur visible
      setSalesCount((prev) => prev + evt.qty)

      // Temps aléatoire "il y a X min" entre 1 et 15
      const time = Math.floor(Math.random() * 14) + 1
      setToast({ ...evt, time })

      setTimeout(() => {
        setToast(null)
        // Prochain toast dans 25-55 secondes
        const delay = Math.floor(Math.random() * 30000) + 25000
        timerRef.current = setTimeout(showNext, delay)
      }, 5000)
    }

    // Premier toast après 2 secondes
    timerRef.current = setTimeout(showNext, 2000)
    return () => clearTimeout(timerRef.current)
  }, [])

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
            <p className={styles.toastSub}>
              vient d'acheter {toast.product}
              {toast.qty > 1 ? ` (×${toast.qty})` : ''} — il y a {toast.time} min
            </p>
          </div>
        </div>
      )}
    </>
  )
}
