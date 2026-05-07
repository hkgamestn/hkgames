'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, Pause, Maximize, Minimize, TrendingUp, ShoppingBag, MapPin, Package } from 'lucide-react'
import styles from './live.module.css'

// ─── DATA ─────────────────────────────────────────────────────────────────────
const NOMS = ['Amira','Safa','Rim','Yasmine','Nesrine','Lina','Dorra','Mariem','Hana','Salma','Ines','Skander','Mohamed','Yassine','Rami','Khalil','Walid','Aziz','Malek','Tarek','Nour','Rania','Houda','Sana','Jihen','Farah','Leila','Sirine','Olfa','Wafa','Montassar','Bilel','Samer','Hamza','Chaima']
const VILLES = ['Tunis','Sousse','Sfax','Monastir','Nabeul','Bizerte','Ariana','Gabès','Mahdia','Kairouan','Béja','Kef','Siliana','Zaghouan','Manouba','Ben Arous','Gafsa','Tozeur','Medenine','Tataouine']
const PRODUITS = [
  { name: 'Unicolore Rose',     cat: 'unicolore', price: 12,   color: '#ec4899', emoji: '🩷' },
  { name: 'Unicolore Violet',   cat: 'unicolore', price: 12,   color: '#a855f7', emoji: '💜' },
  { name: 'Unicolore Bleu',     cat: 'unicolore', price: 12,   color: '#3b82f6', emoji: '💙' },
  { name: 'Unicolore Vert',     cat: 'unicolore', price: 12,   color: '#22c55e', emoji: '💚' },
  { name: 'Unicolore Jaune',    cat: 'unicolore', price: 12,   color: '#eab308', emoji: '💛' },
  { name: 'Unicolore Rouge',    cat: 'unicolore', price: 12,   color: '#ef4444', emoji: '❤️' },
  { name: 'Bicolore Rose+Bleu', cat: 'bicolore',  price: 13.5, color: '#a855f7', emoji: '🌈' },
  { name: 'Bicolore Violet+Rose',cat:'bicolore',  price: 13.5, color: '#ec4899', emoji: '🌈' },
  { name: 'Bicolore Vert+Jaune',cat: 'bicolore',  price: 13.5, color: '#22c55e', emoji: '🌈' },
  { name: 'Buddy Rouge',        cat: 'buddies',   price: 15,   color: '#ef4444', emoji: '👾' },
  { name: 'Buddy Violet',       cat: 'buddies',   price: 15,   color: '#a855f7', emoji: '👾' },
  { name: 'Buddy Bleu',         cat: 'buddies',   price: 15,   color: '#3b82f6', emoji: '👾' },
  { name: 'Pack Découverte ×3', cat: 'pack',      price: 32.4, color: '#f59e0b', emoji: '🎁' },
  { name: 'Pack Alchimiste ×3', cat: 'pack',      price: 36,   color: '#f59e0b', emoji: '🧪' },
  { name: 'Pack Famille ×3',    cat: 'pack',      price: 40.5, color: '#f59e0b', emoji: '👨‍👩‍👧' },
]
const CAT_LABELS = { unicolore: 'Unicolore', bicolore: 'Bicolore', buddies: 'Buddies', pack: 'Packs' }
const CAT_COLORS = { unicolore: '#a855f7', bicolore: '#06b6d4', buddies: '#ec4899', pack: '#f59e0b' }

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randDelay(min, max) { return Math.random() * (max - min) + min }

function generateOrder() {
  const qty = randInt(1, 3)
  const p   = rand(PRODUITS)
  return {
    id:       Date.now() + Math.random(),
    nom:      rand(NOMS),
    ville:    rand(VILLES),
    produit:  p.name,
    cat:      p.cat,
    color:    p.color,
    emoji:    p.emoji,
    qty,
    price:    p.price,
    total:    parseFloat((p.price * qty).toFixed(2)),
    ts:       Date.now(),
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LivePage() {
  const [running, setRunning]           = useState(false)
  const [allOrders, setAllOrders]       = useState([])
  const [toasts, setToasts]             = useState([])   // notifications flottantes
  const [soundUrl, setSoundUrl]         = useState('/sounds/order-alert.mp3')
  const [fullscreen, setFullscreen]     = useState(false)
  const audioRef     = useRef(null)
  const containerRef = useRef(null)
  const timerRef     = useRef(null)

  // Stats calculées
  const stats = useCallback(() => {
    const total   = allOrders.reduce((s, o) => s + o.total, 0)
    const byVille = {}
    const byCat   = {}
    allOrders.forEach((o) => {
      byVille[o.ville] = (byVille[o.ville] || 0) + 1
      byCat[o.cat]     = (byCat[o.cat]     || 0) + o.qty
    })
    const topVilles = Object.entries(byVille).sort((a,b) => b[1]-a[1]).slice(0, 6)
    const topCats   = Object.entries(byCat).sort((a,b) => b[1]-a[1])
    const maxVille  = topVilles[0]?.[1] || 1
    const maxCat    = topCats[0]?.[1]   || 1
    return { total, topVilles, topCats, maxVille, maxCat, count: allOrders.length }
  }, [allOrders])

  // Charger le son depuis DB
  useEffect(() => {
    const supabase = createClient()
    supabase.from('settings').select('value').eq('key', 'sound_new_order').maybeSingle()
      .then(({ data }) => { if (data?.value) setSoundUrl(data.value) })
  }, [])

  // Déverrouiller audio
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current) audioRef.current = new Audio(soundUrl)
      audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.currentTime = 0 }).catch(() => {})
    }
    document.addEventListener('click', unlock, { once: true })
  }, [soundUrl])

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new Audio(soundUrl)
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } catch {}
  }, [soundUrl])

  const fireOrder = useCallback(() => {
    const order = generateOrder()
    playSound()
    setAllOrders((prev) => [order, ...prev].slice(0, 200))
    // Toast flottant — disparaît après 4s
    const toast = { ...order, toastId: Date.now() + Math.random() }
    setToasts((prev) => [...prev, toast].slice(-5))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId))
    }, 4000)
  }, [playSound])

  // Scheduler aléatoire — burst possible
  const scheduleNext = useCallback(() => {
    if (!running) return
    const delay = randDelay(800, 10000) // 0.8s → 10s
    timerRef.current = setTimeout(() => {
      // 15% de chance de burst (2-3 commandes quasi-simultanées)
      const burst = Math.random() < 0.15 ? randInt(2, 3) : 1
      for (let i = 0; i < burst; i++) {
        setTimeout(fireOrder, i * randInt(200, 600))
      }
      scheduleNext()
    }, delay)
  }, [running, fireOrder])

  useEffect(() => {
    if (running) {
      fireOrder()
      scheduleNext()
    } else {
      clearTimeout(timerRef.current)
    }
    return () => clearTimeout(timerRef.current)
  }, [running]) // eslint-disable-line

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const s = stats()

  return (
    <div className={styles.page} ref={containerRef}>

      {/* ── Toasts flottants ────────────────────────────────────────────── */}
      <div className={styles.toastZone}>
        {toasts.map((t) => (
          <div key={t.toastId} className={styles.toast}>
            <span className={styles.toastEmoji}>{t.emoji}</span>
            <div className={styles.toastBody}>
              <span className={styles.toastName}>{t.nom}</span>
              <span className={styles.toastVille}>📍 {t.ville}</span>
              <span className={styles.toastProd}>{t.produit}</span>
            </div>
            <span className={styles.toastPrice}>{t.total} DT</span>
          </div>
        ))}
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.liveChip}>
            {running && <span className={styles.liveDot} />}
            <span>{running ? '🔴 LIVE' : 'Mode Live'}</span>
          </div>
          <span className={styles.headerStat}>{s.count} commandes · {s.total.toFixed(2)} DT</span>
        </div>
        <div className={styles.headerRight}>
          <button className={`${styles.playBtn} ${running ? styles.pauseBtn : ''}`}
            onClick={() => setRunning((r) => !r)} type="button">
            {running ? <><Pause size={15}/> Pause</> : <><Play size={15}/> Démarrer</>}
          </button>
          <button className={styles.iconBtn} onClick={() => { setAllOrders([]); setToasts([]) }} type="button" title="Vider">🗑</button>
          <button className={styles.iconBtn} onClick={toggleFullscreen} type="button">
            {fullscreen ? <Minimize size={15}/> : <Maximize size={15}/>}
          </button>
        </div>
      </div>

      {/* ── Dashboard ───────────────────────────────────────────────────── */}
      <div className={styles.dashboard}>

        {/* KPI Cards */}
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <ShoppingBag size={18} className={styles.kpiIcon} />
            <div className={styles.kpiNum}>{s.count}</div>
            <div className={styles.kpiLabel}>Commandes</div>
          </div>
          <div className={styles.kpi}>
            <TrendingUp size={18} className={styles.kpiIcon} />
            <div className={styles.kpiNum}>{s.total.toFixed(0)}</div>
            <div className={styles.kpiLabel}>DT générés</div>
          </div>
          <div className={styles.kpi}>
            <MapPin size={18} className={styles.kpiIcon} />
            <div className={styles.kpiNum}>{Object.keys(Object.fromEntries(s.topVilles)).length}</div>
            <div className={styles.kpiLabel}>Villes</div>
          </div>
          <div className={styles.kpi}>
            <Package size={18} className={styles.kpiIcon} />
            <div className={styles.kpiNum}>{allOrders.reduce((sum,o) => sum + o.qty, 0)}</div>
            <div className={styles.kpiLabel}>Articles</div>
          </div>
        </div>

        <div className={styles.cols}>
          {/* Top villes */}
          <div className={styles.card}>
            <div className={styles.cardTitle}><MapPin size={14}/> Top Villes</div>
            {s.topVilles.length === 0 && <div className={styles.cardEmpty}>En attente...</div>}
            {s.topVilles.map(([ville, cnt]) => (
              <div key={ville} className={styles.barRow}>
                <span className={styles.barLabel}>{ville}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(cnt/s.maxVille)*100}%`, background: '#a855f7' }}/>
                </div>
                <span className={styles.barCount}>{cnt}</span>
              </div>
            ))}
          </div>

          {/* Produits */}
          <div className={styles.card}>
            <div className={styles.cardTitle}><Package size={14}/> Produits</div>
            {s.topCats.length === 0 && <div className={styles.cardEmpty}>En attente...</div>}
            {s.topCats.map(([cat, cnt]) => (
              <div key={cat} className={styles.barRow}>
                <span className={styles.barLabel}>{CAT_LABELS[cat] || cat}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(cnt/s.maxCat)*100}%`, background: CAT_COLORS[cat] || '#a855f7' }}/>
                </div>
                <span className={styles.barCount}>{cnt}</span>
              </div>
            ))}
          </div>

          {/* Feed récent */}
          <div className={styles.card}>
            <div className={styles.cardTitle}><TrendingUp size={14}/> Dernières commandes</div>
            {allOrders.length === 0 && <div className={styles.cardEmpty}>En attente...</div>}
            <div className={styles.feedList}>
              {allOrders.slice(0, 12).map((o, i) => (
                <div key={o.id} className={`${styles.feedItem} ${i === 0 ? styles.feedItemNew : ''}`}>
                  <span className={styles.feedEmoji}>{o.emoji}</span>
                  <span className={styles.feedName}>{o.nom}</span>
                  <span className={styles.feedProd}>{o.produit}</span>
                  <span className={styles.feedPrice}>{o.total} DT</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barre de chaleur villes */}
        {s.topVilles.length > 0 && (
          <div className={styles.card} style={{ marginTop: 0 }}>
            <div className={styles.cardTitle}>🗺️ Carte de chaleur Tunisie</div>
            <div className={styles.heatRow}>
              {s.topVilles.map(([ville, cnt]) => (
                <div key={ville} className={styles.heatCell}
                  style={{ '--intensity': cnt / s.maxVille }}>
                  <span className={styles.heatVille}>{ville}</span>
                  <span className={styles.heatCount}>{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
