'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { RefreshCw, Share2 } from 'lucide-react'
import { generateBuddyName } from '@/lib/utils/buddyNames'
import styles from './BuddyBuilder.module.css'

const COLORS = [
  { name: 'Rouge',  hex: '#ef4444' },
  { name: 'Bleu',   hex: '#3b82f6' },
  { name: 'Jaune',  hex: '#eab308' },
  { name: 'Vert',   hex: '#22c55e' },
  { name: 'Rose',   hex: '#ec4899' },
  { name: 'Violet', hex: '#a855f7' },
]

export default function BuddyBuilder({ selectedColor, onColorChange, onNameChange }) {
  const canvasRef  = useRef(null)
  const eyesRef    = useRef({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } })
  const blinkRef   = useRef(false)
  const animRef    = useRef(null)
  const mouseRef   = useRef({ x: 0, y: 0 })
  const [buddyName, setBuddyName] = useState(() => generateBuddyName())

  const colorHex = selectedColor?.hex || '#a855f7'

  useEffect(() => { onNameChange?.(buddyName) }, [buddyName, onNameChange])

  const drawBuddy = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2 + 10

    // Body — blob shape
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx, cy - 60)
    ctx.bezierCurveTo(cx + 60, cy - 70, cx + 80, cy, cx + 70, cy + 50)
    ctx.bezierCurveTo(cx + 60, cy + 90, cx - 60, cy + 90, cx - 70, cy + 50)
    ctx.bezierCurveTo(cx - 80, cy, cx - 60, cy - 70, cx, cy - 60)
    ctx.closePath()

    const grad = ctx.createRadialGradient(cx - 15, cy - 20, 0, cx, cy, 80)
    grad.addColorStop(0, colorHex + 'ff')
    grad.addColorStop(0.5, colorHex + 'cc')
    grad.addColorStop(1, colorHex + '88')
    ctx.fillStyle = grad
    ctx.fill()

    // Shine
    ctx.beginPath()
    ctx.ellipse(cx - 20, cy - 35, 20, 12, -0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fill()
    ctx.restore()

    // Eyes
    const eyeOffsets = [
      { ox: -22, oy: -10 },
      { ox:  22, oy: -10 },
    ]

    eyeOffsets.forEach(({ ox, oy }, i) => {
      const eyeX = cx + ox
      const eyeY = cy + oy

      // Eye white
      ctx.beginPath()
      ctx.ellipse(eyeX, eyeY, 16, blinkRef.current ? 2 : 16, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()

      if (!blinkRef.current) {
        // Pupil follows mouse
        const dx = mouseRef.current.x - eyeX
        const dy = mouseRef.current.y - eyeY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const maxDist = 7
        const pupilX = eyeX + (dx / dist) * Math.min(dist, maxDist)
        const pupilY = eyeY + (dy / dist) * Math.min(dist, maxDist)

        ctx.beginPath()
        ctx.arc(pupilX, pupilY, 8, 0, Math.PI * 2)
        ctx.fillStyle = '#1a1030'
        ctx.fill()

        // Highlight
        ctx.beginPath()
        ctx.arc(pupilX - 2, pupilY - 3, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fill()
      }
    })

    // Mouth
    ctx.beginPath()
    ctx.arc(cx, cy + 28, 18, 0.15, Math.PI - 0.15)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
  }, [colorHex])

  useEffect(() => {
    let blinkTimeout

    function scheduleNextBlink() {
      const delay = 4000 + Math.random() * 2000
      blinkTimeout = setTimeout(() => {
        blinkRef.current = true
        setTimeout(() => {
          blinkRef.current = false
          scheduleNextBlink()
        }, 150)
      }, delay)
    }

    scheduleNextBlink()
    return () => clearTimeout(blinkTimeout)
  }, [])

  useEffect(() => {
    function loop() {
      drawBuddy()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [drawBuddy])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleMouse(e) {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height),
      }
    }

    function handleOrientation(e) {
      const gamma = e.gamma || 0
      const beta  = e.beta  || 0
      mouseRef.current = {
        x: canvas.width  / 2 + gamma * 4,
        y: canvas.height / 2 + beta  * 4,
      }
    }

    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('deviceorientation', handleOrientation)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  function regenerateName() {
    setBuddyName(generateBuddyName())
  }

  async function handleShare() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      const url = `https://wa.me/?text=${encodeURIComponent(`J'ai créé ${buddyName} ! Commande le tien sur hap-p-kids.store`)}`
      window.open(url, '_blank')
    })
  }

  return (
    <div className={styles.builder}>
      <div className={styles.nameRow}>
        <p className={styles.nameLabel}>Ton Buddy s'appelle</p>
        <div className={styles.nameDisplay}>
          <span className={styles.buddyName}>{buddyName}</span>
          <button onClick={regenerateName} type="button" className={styles.regenBtn} aria-label="Nouveau nom">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className={styles.colorRow}>
        {COLORS.map((c) => (
          <button
            key={c.name}
            className={`${styles.colorSwatch} ${selectedColor?.name === c.name ? styles.colorSelected : ''}`}
            style={{ background: c.hex }}
            onClick={() => onColorChange?.(c)}
            title={c.name}
            aria-label={c.name}
            type="button"
          />
        ))}
      </div>

      <canvas ref={canvasRef} width={200} height={200} className={styles.canvas} aria-label={`Buddy ${buddyName}`} />

      <button onClick={handleShare} type="button" className={styles.shareBtn}>
        <Share2 size={16} />
        Partager sur WhatsApp
      </button>
    </div>
  )
}
