'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, Pause, Settings, Maximize, Minimize } from 'lucide-react'
import styles from './live.module.css'

const NOMS = ['Amira','Safa','Rim','Yasmine','Nesrine','Lina','Dorra','Mariem','Hana','Salma','Ines','Skander','Mohamed','Yassine','Rami','Khalil','Walid','Aziz','Malek','Tarek','Nour','Rania','Houda','Sana','Jihen']
const VILLES = ['Tunis','Sousse','Sfax','Monastir','Nabeul','Bizerte','Ariana','Gabès','Mahdia','Kairouan','Béja','Kef','Siliana','Zaghouan']
const PRODUITS = [
  { name: 'Slime Unicolore Rose',     price: 12, emoji: '🩷' },
  { name: 'Slime Unicolore Violet',   price: 12, emoji: '💜' },
  { name: 'Slime Unicolore Bleu',     price: 12, emoji: '💙' },
  { name: 'Slime Unicolore Vert',     price: 12, emoji: '💚' },
  { name: 'Slime Unicolore Jaune',    price: 12, emoji: '💛' },
  { name: 'Slime Unicolore Rouge',    price: 12, emoji: '❤️' },
  { name: 'Slime Bicolore Rose+Bleu', price: 13.5, emoji: '🌈' },
  { name: 'Slime Bicolore Violet+Rose', price: 13.5, emoji: '🌈' },
  { name: 'Slime Bicolore Vert+Jaune', price: 13.5, emoji: '🌈' },
  { name: 'Slime Buddy Rouge',        price: 15, emoji: '👾' },
  { name: 'Slime Buddy Violet',       price: 15, emoji: '👾' },
  { name: 'Slime Buddy Bleu',         price: 15, emoji: '👾' },
  { name: 'Pack Découverte (×3)',     price: 32.4, emoji: '🎁' },
  { name: 'Pack Alchimiste (×3)',     price: 36, emoji: '🧪' },
  { name: 'Pack Famille Monstre (×3)',price: 40.5, emoji: '👨‍👩‍👧' },
]

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function generateOrder() {
  const qty     = randInt(1, 3)
  const produit = rand(PRODUITS)
  const mins    = randInt(1, 12)
  return {
    id:      Date.now() + Math.random(),
    nom:     rand(NOMS),
    ville:   rand(VILLES),
    produit: produit.name,
    emoji:   produit.emoji,
    qty,
    total:   (produit.price * qty).toFixed(2),
    time:    mins === 1 ? 'à l\'instant' : `il y a ${mins} min`,
  }
}

export default function LivePage() {
  const [running, setRunning]     = useState(false)
  const [orders, setOrders]       = useState([])
  const [interval, setIntervalMs] = useState(8000)
  const [fullscreen, setFullscreen] = useState(false)
  const [soundUrl, setSoundUrl]   = useState('/sounds/order-alert.mp3')
  const audioRef   = useRef(null)
  const timerRef   = useRef(null)
  const containerRef = useRef(null)

  // Charger le son depuis DB
  useEffect(() => {
    const supabase = createClient()
    supabase.from('settings').select('value').eq('key', 'sound_new_order').maybeSingle()
      .then(({ data }) => { if (data?.value) setSoundUrl(data.value) })
  }, [])

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current || audioRef.current.src !== soundUrl) {
        audioRef.current = new Audio(soundUrl)
      }
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } catch {}
  }, [soundUrl])

  const addOrder = useCallback(() => {
    const order = generateOrder()
    playSound()
    setOrders((prev) => [order, ...prev].slice(0, 50))
  }, [playSound])

  // Démarrer / arrêter
  useEffect(() => {
    if (running) {
      addOrder() // Première commande immédiate
      timerRef.current = setInterval(addOrder, interval)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running, interval, addOrder])

  // Déverrouiller audio
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current) audioRef.current = new Audio(soundUrl)
      audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.currentTime = 0 }).catch(() => {})
    }
    document.addEventListener('click', unlock, { once: true })
    return () => document.removeEventListener('click', unlock)
  }, [soundUrl])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  return (
    <div className={styles.page} ref={containerRef}>
      {/* Header controls */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.liveIndicator}>
            {running && <span className={styles.liveDot} />}
            <span className={styles.liveLabel}>{running ? '🔴 LIVE EN COURS' : 'Mode Live'}</span>
          </div>
          <span className={styles.counter}>{orders.length} commandes simulées</span>
        </div>

        <div className={styles.controls}>
          <div className={styles.speedControl}>
            <span className={styles.speedLabel}>Fréquence</span>
            <select
              className={styles.speedSelect}
              value={interval}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
            >
              <option value={4000}>Rapide (4s)</option>
              <option value={8000}>Normal (8s)</option>
              <option value={15000}>Lent (15s)</option>
              <option value={30000}>Très lent (30s)</option>
            </select>
          </div>

          <button
            className={`${styles.playBtn} ${running ? styles.pauseBtn : ''}`}
            onClick={() => setRunning((r) => !r)}
            type="button"
          >
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Démarrer</>}
          </button>

          <button className={styles.iconBtn} onClick={() => setOrders([])} type="button" title="Vider">
            🗑
          </button>

          <button className={styles.iconBtn} onClick={toggleFullscreen} type="button" title="Plein écran">
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Feed commandes */}
      <div className={styles.feed}>
        {orders.length === 0 && !running && (
          <div className={styles.empty}>
            <span className={styles.emptyEmoji}>📦</span>
            <p>Clique sur <strong>Démarrer</strong> pour lancer le simulateur</p>
            <p className={styles.emptyHint}>Les commandes s&apos;affichent avec son et animation</p>
          </div>
        )}

        {orders.map((order, i) => (
          <div
            key={order.id}
            className={`${styles.orderCard} ${i === 0 ? styles.orderCardNew : ''}`}
            style={{ '--delay': `${Math.min(i * 0.05, 0.5)}s` }}
          >
            <div className={styles.orderEmoji}>{order.emoji}</div>
            <div className={styles.orderBody}>
              <div className={styles.orderTop}>
                <span className={styles.orderName}>{order.nom}</span>
                <span className={styles.orderVille}>📍 {order.ville}</span>
                <span className={styles.orderTime}>{order.time}</span>
              </div>
              <div className={styles.orderProduct}>
                {order.produit}
                {order.qty > 1 && <span className={styles.orderQty}> ×{order.qty}</span>}
              </div>
            </div>
            <div className={styles.orderPrice}>{order.total} DT</div>
            <div className={styles.newBadge}>Nouveau !</div>
          </div>
        ))}
      </div>
    </div>
  )
}
