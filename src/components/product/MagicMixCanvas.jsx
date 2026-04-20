'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import styles from './MagicMixCanvas.module.css'

function isLowEndDevice() {
  if (typeof navigator === 'undefined') return false
  return (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2
}
const COMBOS = [
  { color1: 'Rose',  hex1: '#ec4899', color2: 'Bleu',  hex2: '#3b82f6', result: 'Violet',  hexResult: '#a855f7' },
  { color1: 'Rose',  hex1: '#ec4899', color2: 'Jaune', hex2: '#eab308', result: 'Orangé',  hexResult: '#f97316' },
  { color1: 'Bleu',  hex1: '#3b82f6', color2: 'Jaune', hex2: '#eab308', result: 'Vert',    hexResult: '#22c55e' },
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export default function MagicMixCanvas({ onComboSelect, selectedCombo }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const [phase, setPhase] = useState('select') // select | mix | reveal
  const [revealed, setRevealed] = useState(null)

  const runMixAnimation = useCallback((combo) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    setPhase('mix')
    setRevealed(null)

    const rgb1 = hexToRgb(combo.hex1)
    const rgb2 = hexToRgb(combo.hex2)
    const rgbR = hexToRgb(combo.hexResult)

    let t = 0
    const DURATION = 72 // ~1.2s at 60fps

    function lerp(a, b, x) { return a + (b - a) * x }

    function frame() {
      ctx.clearRect(0, 0, W, H)
      t++
      const progress = t / DURATION

      if (progress < 0.7) {
        // Two blobs spinning towards each other
        const p = progress / 0.7
        const angle = p * Math.PI * 4

        const cx1 = W * 0.5 + Math.cos(angle)      * W * 0.22 * (1 - p)
        const cy1 = H * 0.5 + Math.sin(angle)      * H * 0.2  * (1 - p)
        const cx2 = W * 0.5 + Math.cos(angle + Math.PI) * W * 0.22 * (1 - p)
        const cy2 = H * 0.5 + Math.sin(angle + Math.PI) * H * 0.2  * (1 - p)

        const r = 35 + p * 15

        // Blob 1
        const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r)
        g1.addColorStop(0, `rgba(${rgb1.join(',')},0.95)`)
        g1.addColorStop(1, `rgba(${rgb1.join(',')},0)`)
        ctx.beginPath(); ctx.arc(cx1, cy1, r, 0, Math.PI * 2)
        ctx.fillStyle = g1; ctx.fill()

        // Blob 2
        const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r)
        g2.addColorStop(0, `rgba(${rgb2.join(',')},0.95)`)
        g2.addColorStop(1, `rgba(${rgb2.join(',')},0)`)
        ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2)
        ctx.fillStyle = g2; ctx.fill()

      } else {
        // Merge and reveal result
        const p = (progress - 0.7) / 0.3
        const r = 50 + p * 40

        const eased = p * p * (3 - 2 * p)
        const cR = Math.floor(lerp(rgb1[0], rgbR[0], eased))
        const cG = Math.floor(lerp(rgb1[1], rgbR[1], eased))
        const cB = Math.floor(lerp(rgb1[2], rgbR[2], eased))

        const gR = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, r)
        gR.addColorStop(0, `rgba(${cR},${cG},${cB},0.95)`)
        gR.addColorStop(0.6, `rgba(${cR},${cG},${cB},0.6)`)
        gR.addColorStop(1, `rgba(${cR},${cG},${cB},0)`)

        ctx.beginPath(); ctx.arc(W/2, H/2, r, 0, Math.PI * 2)
        ctx.fillStyle = gR; ctx.fill()

        // Particles
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + p * Math.PI
          const pr = 60 + p * 40
          const px = W/2 + Math.cos(angle) * pr
          const py = H/2 + Math.sin(angle) * pr
          ctx.beginPath(); ctx.arc(px, py, 4 * (1 - p), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${cR},${cG},${cB},${0.8 * (1 - p)})`;
          ctx.fill()
        }
      }

      if (t < DURATION) {
        animRef.current = isLowEndDevice()
          ? setTimeout(() => { animRef.current = requestAnimationFrame(frame) }, 33)
          : requestAnimationFrame(frame)
      } else {
        setPhase('reveal')
        setRevealed(combo)
      }
    }

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(frame)
  }, [])

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  function handleSelect(combo) {
    onComboSelect?.(combo)
    runMixAnimation(combo)
  }

  function handleReset() {
    setPhase('select')
    setRevealed(null)
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className={styles.wrap}>
      {phase === 'select' && (
        <div className={styles.combos}>
          <p className={styles.label}>Choisis ta combinaison magique</p>
          {COMBOS.map((combo) => (
            <button
              key={`${combo.color1}-${combo.color2}`}
              className={`${styles.comboBtn} ${selectedCombo?.result === combo.result ? styles.comboBtnSelected : ''}`}
              onClick={() => handleSelect(combo)}
              type="button"
            >
              <span className={styles.comboDot} style={{ background: combo.hex1 }} />
              <span className={styles.comboPlus}>+</span>
              <span className={styles.comboDot} style={{ background: combo.hex2 }} />
              <span className={styles.comboArrow}>→</span>
              <span className={styles.comboResult}>
                <span className={styles.comboDot} style={{ background: combo.hexResult }} />
                {combo.result}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.canvasWrap} style={{ display: phase !== 'select' ? 'flex' : 'none' }}>
        <canvas ref={canvasRef} width={240} height={240} className={styles.canvas} />

        {phase === 'reveal' && revealed && (
          <div className={styles.revealText}>
            <p className={styles.revealTitle}>Tu as créé le {revealed.result} !</p>
            <button onClick={handleReset} type="button" className={styles.resetBtn}>
              Changer de combinaison
            </button>
          </div>
        )}
      </div>

      {phase === 'mix' && (
        <p className={styles.mixingMsg}>Mélange en cours...</p>
      )}
    </div>
  )
}
