#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  HK Games — Bundle Progress Tracker — Script d'installation
#  Lance avec : bash apply_bundle_tracker.sh
# ═══════════════════════════════════════════════════════════════

set -e  # Stop si erreur

PROJECT_DIR="$HOME/hkgames-fresh"

# Couleurs terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   HK Games — Bundle Progress Tracker Setup      ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Vérification du dossier projet ─────────────────────────────
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}❌ Dossier $PROJECT_DIR introuvable.${NC}"
  echo "   Modifie PROJECT_DIR en haut du script."
  exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✅ Dossier projet trouvé : $PROJECT_DIR${NC}"

# ── Création des dossiers nécessaires ──────────────────────────
mkdir -p src/lib/utils
mkdir -p src/components/cart
mkdir -p src/app/panier

echo -e "${GREEN}✅ Dossiers créés${NC}"

# ══════════════════════════════════════════════════════════════
# FICHIER 1 — src/lib/utils/bundleRules.js
# ══════════════════════════════════════════════════════════════
echo -e "${YELLOW}📝 Écriture de bundleRules.js...${NC}"

cat > src/lib/utils/bundleRules.js << 'ENDOFFILE'
export function computeBundle(items, discounts = {}) {
  if (!items || items.length === 0) return { discount: 0, bundleType: null, savings: 0 }

  const unicolores = items.filter((i) => i.line === 'unicolore')
  const bicolores  = items.filter((i) => i.line === 'bicolore')
  const buddies    = items.filter((i) => i.line === 'buddies')

  const uniqueU = new Set(unicolores.map((i) => i.color))
  const uniqueB = new Set(buddies.map((i) => i.color))

  const subtotal = items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)

  if (uniqueB.size >= 3) {
    const pct = parseFloat(discounts.famille || 18)
    return { discount: pct, bundleType: 'famille_monstre', savings: parseFloat((subtotal * pct / 100).toFixed(3)) }
  }
  if (bicolores.length >= 3) {
    const pct = parseFloat(discounts.alchimiste || 20)
    return { discount: pct, bundleType: 'alchimiste', savings: parseFloat((subtotal * pct / 100).toFixed(3)) }
  }
  if (uniqueU.size >= 3) {
    const pct = parseFloat(discounts.decouverte || 15)
    return { discount: pct, bundleType: 'decouverte', savings: parseFloat((subtotal * pct / 100).toFixed(3)) }
  }

  return { discount: 0, bundleType: null, savings: 0 }
}

export function getBundleUpsell(items) {
  if (!items || items.length === 0) return null

  const unicolores = items.filter((i) => i.line === 'unicolore')
  const bicolores  = items.filter((i) => i.line === 'bicolore')
  const buddies    = items.filter((i) => i.line === 'buddies')

  const uniqueU = new Set(unicolores.map((i) => i.color))
  const uniqueB = new Set(buddies.map((i) => i.color))

  if (uniqueB.size === 2)
    return { message: "➕ Ajoute 1 Buddy d'une autre couleur → Pack Famille Monstre (-18%) !", type: 'buddies' }
  if (uniqueB.size === 1)
    return { message: "➕ Ajoute 2 Buddies de couleurs différentes → Pack Famille Monstre (-18%) !", type: 'buddies' }
  if (bicolores.length === 2)
    return { message: "➕ Ajoute le 3ème Bicolore → Pack Alchimiste (-20%) !", type: 'bicolore' }
  if (bicolores.length === 1)
    return { message: "➕ Ajoute 2 Bicolores → Pack Alchimiste (-20%) !", type: 'bicolore' }
  if (uniqueU.size === 2)
    return { message: "➕ Ajoute 1 Unicolore d'une autre couleur → Pack Découverte (-15%) !", type: 'unicolore' }
  if (uniqueU.size === 1)
    return { message: "➕ Ajoute 2 Unicolores de couleurs différentes → Pack Découverte (-15%) !", type: 'unicolore' }

  return null
}

export const BUNDLE_LABELS = {
  decouverte:      '🎁 Pack Découverte activé !',
  alchimiste:      '⚗️ Pack Alchimiste activé !',
  famille_monstre: '👨‍👩‍👧 Famille Monstre activé !',
}

/**
 * getBundleProgress — retourne la progression vers chaque bundle
 * Utilisé par BundleProgressTracker dans le panier
 */
export function getBundleProgress(items, discounts = {}) {
  if (!items || items.length === 0) return []

  const unicolores = items.filter((i) => i.line === 'unicolore')
  const bicolores  = items.filter((i) => i.line === 'bicolore')
  const buddies    = items.filter((i) => i.line === 'buddies')

  const uniqueU = new Set(unicolores.map((i) => i.color))
  const uniqueB = new Set(buddies.map((i) => i.color))

  const subtotal = items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)

  const TARGET = 3

  const famillePct    = parseFloat(discounts.famille    || 18)
  const alchimistePct = parseFloat(discounts.alchimiste || 20)
  const decouvPct     = parseFloat(discounts.decouverte || 15)

  const estSavingsFamille    = parseFloat((subtotal * famillePct    / 100).toFixed(3))
  const estSavingsAlchimiste = parseFloat((subtotal * alchimistePct / 100).toFixed(3))
  const estSavingsDecouverte = parseFloat((subtotal * decouvPct     / 100).toFixed(3))

  const bundles = []

  // ── Pack Famille Monstre (Buddies) ─────────────────────────
  if (buddies.length > 0 || uniqueB.size > 0) {
    const current = Math.min(uniqueB.size, TARGET)
    const done    = current >= TARGET
    bundles.push({
      id:        'famille_monstre',
      emoji:     '👨‍👩‍👧',
      label:     'Pack Famille Monstre',
      pct:       famillePct,
      shopPath:  '/shop/buddies',
      shopLabel: 'Ajouter un Buddy',
      current,
      target:    TARGET,
      done,
      remaining: Math.max(0, TARGET - current),
      estSavings: estSavingsFamille,
      circles: Array.from({ length: TARGET }, (_, i) => ({
        filled: i < current,
        color:  Array.from(uniqueB)[i] || null,
      })),
      getMessage: () => {
        if (done) return `🟢 Pack Famille Monstre activé ! Tu économises ~${estSavingsFamille.toFixed(1)} DT 🎉`
        if (current === 2) return `🟡 Plus que 1 Buddy d'une autre couleur !`
        if (current === 1) return `🟡 Plus que 2 Buddies de couleurs différentes`
        return `🟠 Ajoute 3 Buddies de couleurs différentes → -${famillePct}%`
      },
    })
  }

  // ── Pack Alchimiste (Bicolores) ─────────────────────────────
  if (bicolores.length > 0) {
    const current = Math.min(bicolores.length, TARGET)
    const done    = current >= TARGET
    bundles.push({
      id:        'alchimiste',
      emoji:     '⚗️',
      label:     'Pack Alchimiste',
      pct:       alchimistePct,
      shopPath:  '/shop/bicolore',
      shopLabel: 'Ajouter un Bicolore',
      current,
      target:    TARGET,
      done,
      remaining: Math.max(0, TARGET - current),
      estSavings: estSavingsAlchimiste,
      circles: Array.from({ length: TARGET }, (_, i) => ({
        filled: i < current,
        color:  bicolores[i]?.color || null,
      })),
      getMessage: () => {
        if (done) return `🟢 Pack Alchimiste activé ! Tu économises ~${estSavingsAlchimiste.toFixed(1)} DT 🎉`
        if (current === 2) return `🟡 Plus que 1 Bicolore !`
        if (current === 1) return `🟡 Plus que 2 Bicolores`
        return `🟠 Ajoute 3 Bicolores → -${alchimistePct}%`
      },
    })
  }

  // ── Pack Découverte (Unicolores) ────────────────────────────
  if (unicolores.length > 0) {
    const current = Math.min(uniqueU.size, TARGET)
    const done    = current >= TARGET
    bundles.push({
      id:        'decouverte',
      emoji:     '🎁',
      label:     'Pack Découverte',
      pct:       decouvPct,
      shopPath:  '/shop/unicolore',
      shopLabel: 'Ajouter un Unicolore',
      current,
      target:    TARGET,
      done,
      remaining: Math.max(0, TARGET - current),
      estSavings: estSavingsDecouverte,
      circles: Array.from({ length: TARGET }, (_, i) => ({
        filled: i < current,
        color:  Array.from(uniqueU)[i] || null,
      })),
      getMessage: () => {
        if (done) return `🟢 Pack Découverte activé ! Tu économises ~${estSavingsDecouverte.toFixed(1)} DT 🎉`
        if (current === 2) return `🟡 Plus que 1 Unicolore d'une autre couleur !`
        if (current === 1) return `🟡 Plus que 2 Unicolores de couleurs différentes`
        return `🟠 Ajoute 3 Unicolores différents → -${decouvPct}%`
      },
    })
  }

  // Trier : activés en premier, puis par progression décroissante
  bundles.sort((a, b) => {
    if (a.done && !b.done) return -1
    if (!a.done && b.done) return 1
    return b.current - a.current
  })

  return bundles
}
ENDOFFILE

echo -e "${GREEN}✅ bundleRules.js écrit${NC}"

# ══════════════════════════════════════════════════════════════
# FICHIER 2 — src/components/cart/BundleProgressTracker.jsx
# ══════════════════════════════════════════════════════════════
echo -e "${YELLOW}📝 Écriture de BundleProgressTracker.jsx...${NC}"

cat > src/components/cart/BundleProgressTracker.jsx << 'ENDOFFILE'
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getBundleProgress } from '@/lib/utils/bundleRules'
import styles from './BundleProgressTracker.module.css'

const COLOR_MAP = {
  rose:   '#ec4899',
  violet: '#a855f7',
  jaune:  '#eab308',
  bleu:   '#3b82f6',
  vert:   '#22c55e',
  orange: '#f97316',
}

function getHex(colorName) {
  if (!colorName) return null
  const lower = colorName?.toLowerCase()
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower?.includes(key)) return hex
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
      aria-label={filled ? 'complété' : 'manquant'}
    />
  )
}

function LiquidBar({ current, target, done }) {
  const pct = Math.min((current / target) * 100, 100)
  return (
    <div className={styles.barTrack} role="progressbar" aria-valuenow={current} aria-valuemax={target}>
      <div
        className={`${styles.barFill} ${done ? styles.barDone : current >= 2 ? styles.barAlmost : styles.barStart}`}
        style={{ width: `${pct}%` }}
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
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
      } catch (_) {}
      setTimeout(() => setBurst(false), 1200)
      setTimeout(() => setJustActivated(false), 3000)
    }
    if (!bundle.done) wasActive.current = false
  }, [bundle.done])

  const message = bundle.getMessage()

  return (
    <div className={`${styles.card} ${bundle.done ? styles.cardDone : ''} ${justActivated ? styles.cardPop : ''}`}>
      <ConfettiBurst active={burst} />

      <div className={styles.cardHeader}>
        <span className={styles.cardEmoji}>{bundle.emoji}</span>
        <div className={styles.cardTitle}>
          <span className={styles.cardLabel}>{bundle.label}</span>
          <span className={`${styles.cardPct} ${bundle.done ? styles.cardPctDone : ''}`}>
            -{bundle.pct}%
          </span>
        </div>
        {bundle.done && <span className={styles.activatedBadge}>✓ Activé</span>}
      </div>

      <div className={styles.circles}>
        {bundle.circles.map((c, i) => (
          <ProgressCircle key={i} filled={c.filled} color={c.color} />
        ))}
        <span className={styles.circleLabel}>
          {bundle.done
            ? `🎉 Les ${bundle.target} sont là !`
            : `${bundle.current}/${bundle.target} — Plus que ${bundle.remaining}`}
        </span>
      </div>

      <LiquidBar current={bundle.current} target={bundle.target} done={bundle.done} />

      <p className={`${styles.message} ${bundle.done ? styles.messageDone : ''}`}>
        {message}
      </p>

      {!bundle.done && (
        <Link href={bundle.shopPath} className={styles.addBtn}>
          <span>+</span> {bundle.shopLabel}
        </Link>
      )}

      {bundle.done && bundle.estSavings > 0 && (
        <div className={styles.savingsChip}>
          💰 Tu économises <strong>{bundle.estSavings.toFixed(1)} DT</strong>
        </div>
      )}
    </div>
  )
}

export default function BundleProgressTracker({ items, discounts = {} }) {
  const bundles = getBundleProgress(items, discounts)
  if (!bundles.length) return null

  return (
    <section className={styles.wrapper} aria-label="Progression des offres bundles">
      <h2 className={styles.sectionTitle}>
        <span className={styles.titleIcon}>🎯</span>
        Offres Bundles
      </h2>
      <div className={styles.grid}>
        {bundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>
    </section>
  )
}
ENDOFFILE

echo -e "${GREEN}✅ BundleProgressTracker.jsx écrit${NC}"

# ══════════════════════════════════════════════════════════════
# FICHIER 3 — src/components/cart/BundleProgressTracker.module.css
# ══════════════════════════════════════════════════════════════
echo -e "${YELLOW}📝 Écriture de BundleProgressTracker.module.css...${NC}"

cat > src/components/cart/BundleProgressTracker.module.css << 'ENDOFFILE'
.wrapper {
  margin: 1.5rem 0;
}

.sectionTitle {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--text-primary, #f8f9ff);
  margin: 0 0 0.85rem 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.titleIcon {
  font-size: 1.2rem;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.card {
  position: relative;
  overflow: hidden;
  background: rgba(26, 16, 48, 0.88);
  border: 1.5px solid rgba(168, 85, 247, 0.22);
  border-radius: 16px;
  padding: 1rem 1.1rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(168, 85, 247, 0.12);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease;
}

.card:hover {
  border-color: rgba(168, 85, 247, 0.45);
  box-shadow: 0 6px 32px rgba(168, 85, 247, 0.2);
  transform: translateY(-1px);
}

.cardDone {
  border-color: rgba(16, 185, 129, 0.55) !important;
  box-shadow: 0 4px 28px rgba(16, 185, 129, 0.22) !important;
  background: rgba(16, 185, 129, 0.07) !important;
}

.cardPop {
  animation: cardPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes cardPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.035); }
  100% { transform: scale(1); }
}

.cardHeader {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
}

.cardEmoji {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.cardTitle {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  flex: 1;
}

.cardLabel {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-primary, #f8f9ff);
  line-height: 1.2;
}

.cardPct {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-cta, #fbbf24);
}

.cardPctDone {
  color: #10b981;
}

.activatedBadge {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 20px;
  padding: 0.2rem 0.55rem;
  white-space: nowrap;
}

.circles {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}

.circle {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.circleFilled {
  transform: scale(1.1);
}

.circleEmpty {
  background: rgba(255, 255, 255, 0.08);
  border: 2px dashed rgba(168, 85, 247, 0.35);
}

.circleLabel {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--text-secondary, #c4b5fd);
  margin-left: 0.2rem;
}

.barTrack {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 0.7rem;
}

.barFill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.barStart {
  background: linear-gradient(90deg, #f97316, #fbbf24);
}

.barAlmost {
  background: linear-gradient(90deg, #fbbf24, #a855f7);
}

.barDone {
  background: linear-gradient(90deg, #10b981, #22c55e);
}

.message {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: var(--text-secondary, #c4b5fd);
  margin: 0 0 0.7rem 0;
  line-height: 1.45;
}

.messageDone {
  color: #10b981;
  font-weight: 600;
}

.addBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f0a1e;
  background: var(--color-cta, #fbbf24);
  border-radius: 20px;
  padding: 0.35rem 0.85rem;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 10px rgba(251, 191, 36, 0.35);
}

.addBtn:hover {
  background: var(--color-cta-hover, #f59e0b);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.5);
}

.addBtn span {
  font-size: 1rem;
  line-height: 1;
}

.savingsChip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  padding: 0.3rem 0.75rem;
}

.savingsChip strong {
  font-weight: 700;
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  z-index: 10;
}

.confettiDot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: hsl(calc(var(--i) * 30), 80%, 60%);
  animation: confettiBurst 0.9s ease-out forwards;
  animation-delay: calc(var(--i) * 0.04s);
}

@keyframes confettiBurst {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  60%  { opacity: 1; transform: translate(calc(-50% + (var(--i) - 6) * 8px), calc(-50% - 35px)) scale(1.2); }
  100% { opacity: 0; transform: translate(calc(-50% + (var(--i) - 6) * 13px), calc(-50% - 60px)) scale(0); }
}

@media (max-width: 480px) {
  .card {
    padding: 0.85rem 0.9rem;
  }
  .cardLabel {
    font-size: 0.88rem;
  }
  .circle {
    width: 18px;
    height: 18px;
  }
  .addBtn {
    font-size: 0.73rem;
    padding: 0.3rem 0.7rem;
  }
}
ENDOFFILE

echo -e "${GREEN}✅ BundleProgressTracker.module.css écrit${NC}"

# ══════════════════════════════════════════════════════════════
# FICHIER 4 — src/app/panier/CartContent.jsx
# ══════════════════════════════════════════════════════════════
echo -e "${YELLOW}📝 Écriture de CartContent.jsx...${NC}"

cat > src/app/panier/CartContent.jsx << 'ENDOFFILE'
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { computeBundle, getBundleUpsell } from '@/lib/utils/bundleRules'
import BundleProgressTracker from '@/components/cart/BundleProgressTracker'
import { createClient } from '@/lib/supabase/client'
import styles from './CartContent.module.css'

function formatDT(val) {
  const num = parseFloat(val || 0)
  return `${num.toFixed(3)} DT`
}

export default function CartContent() {
  const { items, removeItem, updateQty, clearCart } = useCartStore()
  const [discounts, setDiscounts] = useState({ famille: 18, alchimiste: 20, decouverte: 15 })
  const [shippingPrice, setShippingPrice] = useState(7)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['bundle_famille_pct', 'bundle_alchimiste_pct', 'bundle_decouverte_pct', 'shipping_price_dt'])
      .then(({ data }) => {
        if (!data) return
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
        setDiscounts({
          famille:    parseFloat(map.bundle_famille_pct    || 18),
          alchimiste: parseFloat(map.bundle_alchimiste_pct || 20),
          decouverte: parseFloat(map.bundle_decouverte_pct || 15),
        })
        if (map.shipping_price_dt) setShippingPrice(parseFloat(map.shipping_price_dt))
      })
  }, [])

  if (!items || items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>Ton panier est vide 🛒</p>
        <Link href="/shop" className={styles.shopBtn}>Découvrir les Slimes</Link>
      </div>
    )
  }

  const { discount, bundleType, savings } = computeBundle(items, discounts)
  const upsell = getBundleUpsell(items)

  const subtotal = items.reduce((s, i) => s + (i.price_dt || 0) * (i.qty || 1), 0)
  const shipping  = subtotal > 0 ? shippingPrice : 0
  const total     = subtotal - savings + shipping

  const BUNDLE_LABELS = {
    decouverte:      `🎁 Pack Découverte activé ! (-${discounts.decouverte}%)`,
    alchimiste:      `⚗️ Pack Alchimiste activé ! (-${discounts.alchimiste}%)`,
    famille_monstre: `👨‍👩‍👧 Famille Monstre activé ! (-${discounts.famille}%)`,
  }

  const UPSELL_MSGS = {
    buddies:   `➕ Ajoute des Buddies → Pack Famille Monstre (-${discounts.famille}%) !`,
    bicolore:  `➕ Ajoute des Bicolores → Pack Alchimiste (-${discounts.alchimiste}%) !`,
    unicolore: `➕ Ajoute des Unicolores → Pack Découverte (-${discounts.decouverte}%) !`,
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mon Panier</h1>

      <div className={styles.layout}>
        <div className={styles.itemsList}>

          {bundleType && (
            <div className={styles.bundleBadge}>
              <span>{BUNDLE_LABELS[bundleType]}</span>
              <span className={styles.bundleSavings}>Tu économises {formatDT(savings)}</span>
            </div>
          )}

          {upsell && !bundleType && (
            <div className={styles.upsellBanner}>
              <span>{UPSELL_MSGS[upsell.type] || upsell.message}</span>
              <Link href={`/shop/${upsell.type}`} className={styles.upsellLink}>Voir →</Link>
            </div>
          )}

          {/* ── BUNDLE PROGRESS TRACKER ── */}
          <BundleProgressTracker items={items} discounts={discounts} />

          {items.map((item) => (
            <div key={`${item.product_id}-${item.color}`} className={styles.item}>
              <div className={styles.itemImage}>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} width={72} height={72} />
                ) : (
                  <div
                    className={styles.itemColorDot}
                    style={{ background: item.color_hex || '#a855f7' }}
                  />
                )}
              </div>

              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                {item.color && (
                  <p className={styles.itemColor}>
                    <span
                      className={styles.colorDot}
                      style={{ background: item.color_hex || '#a855f7' }}
                    />
                    {item.color}
                  </p>
                )}
                <p className={styles.itemPrice}>{formatDT((item.price_dt || 0) * (item.qty || 1))}</p>
              </div>

              <div className={styles.itemActions}>
                <div className={styles.qtyControls}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.product_id, item.color, Math.max(1, (item.qty || 1) - 1))}
                    aria-label="Diminuer quantité"
                  >−</button>
                  <span className={styles.qty}>{item.qty || 1}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.product_id, item.color, (item.qty || 1) + 1)}
                    aria-label="Augmenter quantité"
                  >+</button>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.product_id, item.color)}
                  aria-label="Supprimer"
                >✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>

          <div className={styles.summaryRow}>
            <span>Sous-total</span>
            <span>{formatDT(subtotal)}</span>
          </div>

          {savings > 0 && (
            <div className={`${styles.summaryRow} ${styles.summaryDiscount}`}>
              <span>Réduction bundle</span>
              <span>−{formatDT(savings)}</span>
            </div>
          )}

          <div className={styles.summaryRow}>
            <span>Livraison</span>
            <span>{shipping === 0 ? 'Gratuite 🎉' : formatDT(shipping)}</span>
          </div>

          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>{formatDT(total)}</span>
          </div>

          <p className={styles.codNotice}>
            ✅ Paiement à la livraison — Vous payez à la réception
          </p>

          <Link href="/commander" className={styles.checkoutBtn}>
            Commander maintenant →
          </Link>

          <button className={styles.clearBtn} onClick={clearCart}>
            Vider le panier
          </button>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

echo -e "${GREEN}✅ CartContent.jsx écrit${NC}"

# ══════════════════════════════════════════════════════════════
# BUILD + GIT
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}🔨 Vérification du build Next.js...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build échoué — corrige les erreurs ci-dessus puis relance.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Build réussi !${NC}"
echo ""
echo -e "${CYAN}📦 Commit et push Git...${NC}"

git add .
git commit -m "feat: Bundle Progress Tracker — barres ●●○ + confetti + son + bouton rapide"

git push || (git pull origin main --rebase && git push)

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Tout est déployé avec succès !              ║"
echo "║                                                  ║"
echo "║   Test local : npm run dev                       ║"
echo "║   → http://localhost:3000/panier                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
