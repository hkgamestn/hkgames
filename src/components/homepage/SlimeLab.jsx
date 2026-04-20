'use client'

import { useState, useEffect, useRef } from 'react'
// confetti chargé en lazy
import { FlaskConical, ShoppingCart, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart/store'
import { formatDT } from '@/lib/utils/formatDT'
import { generateBuddyName } from '@/lib/utils/buddyNames'
import styles from './SlimeLab.module.css'

// Détection appareil bas de gamme (< 4 CPU cores ou mémoire < 4GB)
function isLowEndDevice() {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency || 4
  const mem   = navigator.deviceMemory || 4
  return cores <= 4 || mem <= 2
}

const BASE = 'https://rsmebjtwmvwyeocvsowg.supabase.co/storage/v1/object/public/product-images'

// Prix chargés depuis Supabase via useEffect
const PRODUCT_TYPES = [
  { id: 'unicolore', label: 'Unicolore', price: 12, line: 'unicolore', image: `${BASE}/unicolore-violet.jpg`, desc: 'Une couleur pure, intense' },
  { id: 'bicolore',  label: 'Bicolore',  price: 13.5, line: 'bicolore',  image: `${BASE}/bicolore-rose-bleu.jpg`, desc: 'Mélange magique de 2 couleurs' },
  { id: 'buddies',   label: 'Buddy',     price: 15, line: 'buddies',   image: `${BASE}/buddies-violet.jpg`, desc: 'Mon monstre, mon ami', hasBuddyEyes: true },
]

const COLORS = [
  { name: 'Rose',   hex: '#ec4899', image: { unicolore: `${BASE}/unicolore-rose.jpg`,   buddies: `${BASE}/buddies-rose.jpg`   } },
  { name: 'Violet', hex: '#a855f7', image: { unicolore: `${BASE}/unicolore-violet.jpg`, buddies: `${BASE}/buddies-violet.jpg` } },
  { name: 'Jaune',  hex: '#eab308', image: { unicolore: `${BASE}/unicolore-jaune.jpg`,  buddies: `${BASE}/buddies-jaune.jpg`  } },
  { name: 'Bleu',   hex: '#3b82f6', image: { unicolore: `${BASE}/unicolore-bleu.jpg`,   buddies: `${BASE}/buddies-bleu.jpg`   } },
  { name: 'Vert',   hex: '#22c55e', image: { unicolore: `${BASE}/unicolore-vert.jpg`,   buddies: `${BASE}/buddies-vert.jpg`   } },
  { name: 'Orangé', hex: '#f97316', image: { unicolore: `${BASE}/unicolore-orange.jpg`, buddies: `${BASE}/buddies-orange.jpg` } },
]

const BICOLOR_COMBOS = [
  { name: 'Jaune+Bleu', hex: '#eab308', hex2: '#3b82f6', result: 'Vert',   image: `${BASE}/bicolore-jaune-bleu.jpg`, slug: 'bicolore-jaune-bleu' },
  { name: 'Rose+Bleu',  hex: '#ec4899', hex2: '#3b82f6', result: 'Violet', image: `${BASE}/bicolore-rose-bleu.jpg`,  slug: 'bicolore-rose-bleu'  },
  { name: 'Jaune+Rose', hex: '#eab308', hex2: '#ec4899', result: 'Orangé', image: `${BASE}/bicolore-jaune-rose.jpg`, slug: 'bicolore-jaune-rose' },
]

function useSound() {
  const ctx = useRef(null)
  function getCtx() {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }
  function playPop() {
    try {
      const c = getCtx(); const o = c.createOscillator(); const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.frequency.setValueAtTime(400, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1)
      g.gain.setValueAtTime(0.3, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
      o.start(); o.stop(c.currentTime + 0.15)
    } catch {}
  }
  function playSquish() {
    try {
      const c = getCtx(); const o = c.createOscillator(); const g = c.createGain()
      o.type = 'sine'; o.connect(g); g.connect(c.destination)
      o.frequency.setValueAtTime(150, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.2)
      g.gain.setValueAtTime(0.2, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
      o.start(); o.stop(c.currentTime + 0.25)
    } catch {}
  }
  function playSuccess() {
    try {
      const c = getCtx()
      ;[523, 659, 784, 1047].forEach((freq, i) => {
        const o = c.createOscillator(); const g = c.createGain()
        o.type = 'sine'; o.connect(g); g.connect(c.destination)
        o.frequency.value = freq
        const t = c.currentTime + i * 0.1
        g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
        o.start(t); o.stop(t + 0.15)
      })
    } catch {}
  }
  function playWobble() {
    try {
      const c = getCtx(); const o = c.createOscillator(); const g = c.createGain()
      o.type = 'sine'; o.connect(g); g.connect(c.destination)
      o.frequency.setValueAtTime(300, c.currentTime)
      o.frequency.setValueAtTime(350, c.currentTime + 0.05)
      o.frequency.setValueAtTime(280, c.currentTime + 0.1)
      g.gain.setValueAtTime(0.15, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
      o.start(); o.stop(c.currentTime + 0.25)
    } catch {}
  }
  return { playPop, playSquish, playSuccess, playWobble }
}


function BuddyEyesFlash({ size = 'sm' }) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)
  const canvasRef = useRef(null)
  const mouseRef  = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const blinkRef  = useRef(false)
  const animRef   = useRef(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2400)
    const hideTimer = setTimeout(() => setVisible(false), 3000)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  useEffect(() => {
    function handleMouse(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    function handleTouch(e) {
      const t = e.touches[0]
      if (t) mouseRef.current = { x: t.clientX, y: t.clientY }
    }
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('touchmove', handleTouch)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('touchmove', handleTouch)
    }
  }, [])

  useEffect(() => {
    let t
    function sched() {
      t = setTimeout(() => {
        blinkRef.current = true
        setTimeout(() => { blinkRef.current = false; sched() }, 120)
      }, 800 + Math.random() * 1200)
    }
    sched()
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current; if (!canvas) return
      const ctx    = canvas.getContext('2d')
      const W      = canvas.width
      const H      = canvas.height
      ctx.clearRect(0, 0, W, H)

      const R  = Math.min(W, H) * 0.22
      const PR = R * 0.45
      const HR = R * 0.12
      const maxMove = R * 0.28
      const eyes = [{ x: W * 0.30, y: H * 0.5 }, { x: W * 0.70, y: H * 0.5 }]

      eyes.forEach(({ x, y }) => {
        // Glow
        const grd = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 1.6)
        grd.addColorStop(0, 'rgba(168,85,247,0.18)')
        grd.addColorStop(1, 'rgba(168,85,247,0)')
        ctx.beginPath(); ctx.arc(x, y, R * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = grd; ctx.fill()

        // White eye
        ctx.beginPath()
        ctx.ellipse(x, y, R, blinkRef.current ? R * 0.08 : R, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'; ctx.fill()
        ctx.strokeStyle = 'rgba(168,85,247,0.3)'; ctx.lineWidth = 3; ctx.stroke()

        if (!blinkRef.current) {
          const dx   = mouseRef.current.x - x
          const dy   = mouseRef.current.y - y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const px   = x + (dx / dist) * Math.min(dist, maxMove)
          const py   = y + (dy / dist) * Math.min(dist, maxMove)

          // Pupil
          ctx.beginPath(); ctx.arc(px, py, PR, 0, Math.PI * 2)
          ctx.fillStyle = '#0f0a1e'; ctx.fill()

          // Iris ring
          ctx.beginPath(); ctx.arc(px, py, PR, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(168,85,247,0.5)'; ctx.lineWidth = 2; ctx.stroke()

          // Highlight
          ctx.beginPath(); ctx.arc(px - HR, py - HR, HR, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill()

          // Small highlight
          ctx.beginPath(); ctx.arc(px + HR * 0.6, py + HR * 0.6, HR * 0.4, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill()
        }
      })
      // Throttle à 30fps sur appareils faibles, 60fps sinon
      if (isLowEndDevice()) {
        animRef.current = setTimeout(() => { animRef.current = requestAnimationFrame(draw) }, 33)
      } else {
        animRef.current = requestAnimationFrame(draw)
      }
    }
    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); clearTimeout(animRef.current) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      zIndex:         99999,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      background:     'rgba(15,10,30,0.75)',
      opacity:        fading ? 0 : 1,
      transition:     'opacity 0.6s ease',
    }}>
      <canvas
        ref={canvasRef}
        width={Math.min(window.innerWidth, 700)}
        height={Math.min(window.innerHeight * 0.6, 400)}
        style={{ width: '100%', maxWidth: 700, height: 'auto' }}
      />
    </div>
  )
}

function BuddyEyes({ size = 'sm' }) {
  const canvasRef = useRef(null)
  const mouseRef  = useRef({ x: 0, y: 0 })
  const blinkRef  = useRef(false)
  const animRef   = useRef(null)

  const eyeRadius  = size === 'lg' ? 18 : 12
  const pupilR     = size === 'lg' ? 9  : 6
  const highlightR = size === 'lg' ? 3  : 2
  const maxPupilMove = size === 'lg' ? 7 : 5

  useEffect(() => {
    function handleMouse(e) {
      const canvas = canvasRef.current; if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height),
      }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useEffect(() => {
    let t
    function sched() {
      t = setTimeout(() => {
        blinkRef.current = true
        setTimeout(() => { blinkRef.current = false; sched() }, 120)
      }, 3000 + Math.random() * 2000)
    }
    sched(); return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d')
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const eyes = [{ x: W * 0.33, y: H * 0.45 }, { x: W * 0.67, y: H * 0.45 }]
      eyes.forEach(({ x, y }) => {
        ctx.beginPath()
        ctx.ellipse(x, y, eyeRadius, blinkRef.current ? 2 : eyeRadius, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'white'; ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.stroke()
        if (!blinkRef.current) {
          const dx = mouseRef.current.x - x, dy = mouseRef.current.y - y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const px = x + (dx / dist) * Math.min(dist, maxPupilMove)
          const py = y + (dy / dist) * Math.min(dist, maxPupilMove)
          ctx.beginPath(); ctx.arc(px, py, pupilR, 0, Math.PI * 2)
          ctx.fillStyle = '#1a1030'; ctx.fill()
          ctx.beginPath(); ctx.arc(px - highlightR, py - highlightR, highlightR, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill()
        }
      })
      animRef.current = isLowEndDevice()
        ? setTimeout(() => { animRef.current = requestAnimationFrame(draw) }, 33)
        : requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); clearTimeout(animRef.current) }
  }, [eyeRadius, pupilR, highlightR, maxPupilMove])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '48%', pointerEvents: 'none', zIndex: 2 }}
    />
  )
}

export default function SlimeLab() {
  const [prices, setPrices] = useState({ unicolore: 12, bicolore: 13.5, buddies: 15 })

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.from('products').select('line, price_dt').then(({ data }) => {
        const map = {}
        setPrices((prev) => ({ ...prev, ...map }))
      })
    })
  }, [])
  const [step, setStep] = useState(1)
  const [type, setType] = useState(null)
  const [color, setColor] = useState(null)
  const [buddyName, setBuddyName] = useState(() => generateBuddyName())
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const { playPop, playSquish, playSuccess, playWobble } = useSound()

  const selectedType = PRODUCT_TYPES.find((t) => t.id === type)

  function getCurrentImage() {
    if (type === 'bicolore' && color) return color.image
    if (type === 'unicolore' && color) return color.image.unicolore
    if (type === 'buddies'   && color) return color.image.buddies
    return selectedType?.image || null
  }

  function handleTypeSelect(t) {
    playPop(); setType(t); setColor(null); setStep(2)
  }

  function handleColorSelect(c) {
    playSquish(); setColor(c); setStep(3)
  }

  async function handleAddToCart() {
    if (!selectedType) return
    const colorName = color?.name || 'Violet'
    const colorHex  = color?.hex  || '#a855f7'
    addItem({
      product_id: `lab-${type}-${colorName}`,
      slug: type === 'bicolore' ? (color?.slug || 'bicolore-rose-bleu') : type,
      name: type === 'buddies' ? `Buddy ${colorName}` : `Slime ${selectedType.label} ${colorName}`,
      price_dt: selectedType.price,
      color: colorName, color_hex: colorHex, line: type,
      buddy_name: type === 'buddies' ? buddyName : undefined,
      qty: 1, image: getCurrentImage(),
    })
    playSuccess()
    const confetti = (await import('canvas-confetti')).default
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#a855f7','#ec4899','#06b6d4','#fbbf24','#10b981'] })
    setAdded(true)
    setTimeout(() => { setStep(1); setType(null); setColor(null); setAdded(false) }, 1800)
  }

  return (
    <section className={styles.lab} id="labo">
      <div className={styles.container}>
        <div className={styles.header}>
          <FlaskConical size={28} className={styles.headerIcon} />
          <h2 className={styles.title}>Le Laboratoire du Slimeur</h2>
          <p className={styles.subtitle}>Chaque slime est unique — trouve celui qui lui fera les yeux brillants 🌈</p>
        </div>

        <div className={styles.steps}>
          {[1,2,3].map((s) => (
            <div key={s} className={`${styles.step} ${step >= s ? styles.stepActive : ''}`}>
              <div className={styles.stepDot}>{s}</div>
              <span className={styles.stepLabel}>{s===1?'Type':s===2?'Couleur':'Résultat'}</span>
            </div>
          ))}
        </div>

        {/* STEP 1 — Type cards avec image */}
        {step === 1 && (
          <div className={styles.typeGrid}>
            {PRODUCT_TYPES.map((t) => (
              <button key={t.id} className={styles.typeCard} onClick={() => handleTypeSelect(t.id)} type="button">
                <div className={styles.typeImgWrap}>
                  <Image src={t.image} alt={t.label} fill sizes="160px" className={styles.typeImg} quality={75} loading="lazy" />
                  <div className={styles.typeImgOverlay} />
                </div>
                <div className={styles.typeInfo}>
                  <span className={styles.typeName}>{t.label}</span>
                  <span className={styles.typeDesc}>{t.desc}</span>
                  <span className={styles.typePrice}>{formatDT(t.price)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 — Couleurs unicolore / buddies */}
        {step === 2 && type !== 'bicolore' && (
          <div className={styles.colorStep}>
            <h3 className={styles.stepTitle}>Choisis ta couleur</h3>
            <div className={styles.colorPreviewGrid}>
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  className={`${styles.colorPreviewCard} ${color?.name === c.name ? styles.colorPreviewSelected : ''}`}
                  onClick={() => handleColorSelect(c)}
                  type="button"
                >
                  <div className={styles.colorPreviewImgWrap}>
                    <Image
                      src={type === 'buddies' ? c.image.buddies : c.image.unicolore}
                      alt={c.name}
                      fill
                      sizes="110px"
                      className={styles.colorPreviewImg}
                    />
                    {type === 'buddies' && <BuddyEyesFlash size="sm" />}
                  </div>
                  <span className={styles.colorPreviewName}>{c.name}</span>
                  <span className={styles.colorPreviewDot} style={{ background: c.hex }} />
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => { playPop(); setStep(1) }} type="button">Retour</button>
          </div>
        )}

        {/* STEP 2 — Bicolore combos */}
        {step === 2 && type === 'bicolore' && (
          <div className={styles.colorStep}>
            <h3 className={styles.stepTitle}>Choisis ta combinaison</h3>
            <div className={styles.comboGrid}>
              {BICOLOR_COMBOS.map((combo) => (
                <button
                  key={combo.name}
                  className={`${styles.comboCard} ${color?.name === combo.name ? styles.comboSelected : ''}`}
                  onClick={() => handleColorSelect({ ...combo, image: combo.image })}
                  type="button"
                >
                  <div className={styles.comboImgWrap}>
                    <Image src={combo.image} alt={combo.name} fill sizes="140px" className={styles.comboImg} quality={75} loading="lazy" />
                    <div className={styles.comboImgOverlay} />
                  </div>
                  <div className={styles.comboInfo}>
                    <div className={styles.comboDots}>
                      <span style={{ background: combo.hex }} />
                      <span className={styles.comboPlus}>+</span>
                      <span style={{ background: combo.hex2 }} />
                      <span className={styles.comboArrow}>→</span>
                      <span style={{ background: combo.hex === '#eab308' && combo.hex2 === '#3b82f6' ? '#22c55e' : combo.hex === '#ec4899' && combo.hex2 === '#3b82f6' ? '#a855f7' : '#f97316' }} />
                    </div>
                    <span className={styles.comboName}>{combo.name} → {combo.result}</span>
                  </div>
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => { playPop(); setStep(1) }} type="button">Retour</button>
          </div>
        )}

        {/* STEP 3 — Résultat */}
        {step === 3 && (
          <div className={styles.result}>
            {added ? (
              <div className={styles.addedMsg}>
                <ShoppingCart size={32} className={styles.addedIcon} />
                <p>Ajouté au panier !</p>
              </div>
            ) : (
              <>
                <div className={styles.resultImgWrap}>
                  {getCurrentImage() && (
                    <Image src={getCurrentImage()} alt="ton slime" fill sizes="220px" className={styles.resultImg} quality={80} />
                  )}
                  {type === 'buddies' && <BuddyEyesFlash size="lg" />}
                </div>

                {type === 'buddies' && (
                  <div className={styles.buddyName}>
                    <span>{buddyName}</span>
                    <button onClick={() => { playWobble(); setBuddyName(generateBuddyName()) }} type="button" className={styles.regenBtn}>
                      <RefreshCw size={14} />
                    </button>
                  </div>
                )}

                <p className={styles.resultLabel}>
                  {type === 'buddies'
                    ? buddyName
                    : `Slime ${selectedType?.label} ${color?.name || ''}`}
                </p>
                <p className={styles.resultPrice}>{formatDT(selectedType?.price || 0)}</p>

                <button className={styles.addBtn} onClick={handleAddToCart} type="button">
                  <ShoppingCart size={18} />
                  Ajouter au panier
                </button>
                <button className={styles.backBtn} onClick={() => { playPop(); setStep(2) }} type="button">Retour</button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
