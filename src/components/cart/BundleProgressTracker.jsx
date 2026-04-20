'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getBundleProgress } from '@/lib/utils/bundleRules'
import styles from './BundleProgressTracker.module.css'

const COLOR_MAP = {
  rose: '#ec4899', violet: '#a855f7', jaune: '#eab308',
  bleu: '#3b82f6', vert: '#22c55e',  orange: '#f97316',
}

function getHex(colorName) {
  if (!colorName) return null
  const lower = colorName.toLowerCase()
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex
  }
  return '#a855f7'
}

function ConfettiBurst({ active }) {
  if (!active) return null
  return (
    <div className={styles.confetti} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className={styles.confettiDot} style={{ '--i': i }} />
      ))}
    </div>
  )
}

function ProgressCircle({ filled, color }) {
  const hex = color ? getHex(color) : null
  return (
    <span
      className={`${styles.circle} ${filled ? styles.circleFilled : styles.circleEmpty}`}
      style={filled && hex ? { background: hex, boxShadow: `0 0 8px ${hex}80` } : {}}
    />
  )
}

function LiquidBar({ current, target, done }) {
  const pct = Math.min((current / target) * 100, 100)
  return (
    <div className={styles.barTrack}>
      <div
        className={`${styles.barFill} ${done ? styles.barDone : current >= 2 ? styles.barAlmost : styles.barStart}`}
        style={{ width: pct + '%' }}
      />
    </div>
  )
}

function BundleCard({ bundle }) {
  const wasActive = useRef(false)
  const [burst, setBurst] = useState(false)
  const [justActivated, setJustActivated] = useState(false)

  useEffect(() => {
    if (bundle.done && !wasActive.current) {
      wasActive.current = true
      setBurst(true)
      setJustActivated(true)
      try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)()
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5)
      } catch (_) {}
      setTimeout(() => setBurst(false), 1200)
      setTimeout(() => setJustActivated(false), 3000)
    }
    if (!bundle.done) wasActive.current = false
  }, [bundle.done])

  return (
    <div className={`${styles.card} ${bundle.done ? styles.cardDone : ''} ${justActivated ? styles.cardPop : ''}`}>
      <ConfettiBurst active={burst} />
      <div className={styles.cardHeader}>
        <span className={styles.cardEmoji}>{bundle.emoji}</span>
        <div className={styles.cardTitle}>
          <span className={styles.cardLabel}>{bundle.label}</span>
          <span className={`${styles.cardPct} ${bundle.done ? styles.cardPctDone : ''}`}>-{bundle.pct}%</span>
        </div>
        {bundle.done && <span className={styles.activatedBadge}>Active</span>}
      </div>
      <div className={styles.circles}>
        {bundle.circles.map((c, i) => (
          <ProgressCircle key={i} filled={c.filled} color={c.color} />
        ))}
        <span className={styles.circleLabel}>
          {bundle.done ? 'Les ' + bundle.target + ' sont la !' : bundle.current + '/' + bundle.target + ' — Plus que ' + bundle.remaining}
        </span>
      </div>
      <LiquidBar current={bundle.current} target={bundle.target} done={bundle.done} />
      <p className={`${styles.message} ${bundle.done ? styles.messageDone : ''}`}>
        {bundle.getMessage()}
      </p>
      {!bundle.done && (
        <Link href={bundle.shopPath} className={styles.addBtn}>
          + {bundle.shopLabel}
        </Link>
      )}
      {bundle.done && bundle.estSavings > 0 && (
        <div className={styles.savingsChip}>
          Tu économises <strong>{bundle.estSavings.toFixed(1)} DT</strong>
        </div>
      )}
    </div>
  )
}

export default function BundleProgressTracker({ items, discounts = {} }) {
  const bundles = getBundleProgress(items, discounts)
  if (!bundles.length) return null
  return (
    <section className={styles.wrapper}>
      <h2 className={styles.sectionTitle}>Offres Bundles</h2>
      <div className={styles.grid}>
        {bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>
    </section>
  )
}
