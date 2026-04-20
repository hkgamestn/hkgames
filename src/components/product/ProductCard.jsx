'use client'

import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { useState, useRef } from 'react'
// confetti chargé en lazy
import StockBadge from '@/components/ui/StockBadge'
import { useCartStore } from '@/lib/cart/store'
import { formatDT } from '@/lib/utils/formatDT'
import ProductModal from './ProductModal'
import styles from './ProductCard.module.css'

const LINE_LABELS = { unicolore: 'Unicolore', bicolore: 'Bicolore', buddies: 'Buddy' }

function useCardSound() {
  const ctx = useRef(null)
  function getCtx() {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }
  function playHover() {
    try {
      const c = getCtx(); const o = c.createOscillator(); const g = c.createGain()
      o.type = 'sine'; o.connect(g); g.connect(c.destination)
      o.frequency.setValueAtTime(500, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.06)
      g.gain.setValueAtTime(0.06, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
      o.start(); o.stop(c.currentTime + 0.08)
    } catch {}
  }
  function playAdd() {
    try {
      const c = getCtx()
      ;[523, 659, 784].forEach((freq, i) => {
        const o = c.createOscillator(); const g = c.createGain()
        o.type = 'sine'; o.connect(g); g.connect(c.destination)
        o.frequency.value = freq
        const t = c.currentTime + i * 0.08
        g.gain.setValueAtTime(0.15, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
        o.start(t); o.stop(t + 0.12)
      })
    } catch {}
  }
  function playColor() {
    try {
      const c = getCtx(); const o = c.createOscillator(); const g = c.createGain()
      o.type = 'sine'; o.connect(g); g.connect(c.destination)
      o.frequency.setValueAtTime(350, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(250, c.currentTime + 0.1)
      g.gain.setValueAtTime(0.08, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
      o.start(); o.stop(c.currentTime + 0.12)
    } catch {}
  }
  return { playHover, playAdd, playColor }
}

export default function ProductCard({ product }) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null)
  const [hoverStyle, setHoverStyle] = useState({})
  const [showModal, setShowModal]   = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const { playHover, playAdd, playColor } = useCardSound()

  const stock = selectedColor?.stock ?? null
  const currentImage = selectedColor?.image || product.images?.[0] || null
  const isBicolore = product.line === 'bicolore'

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    setHoverStyle({ transform: `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)` })
  }

  function handleMouseLeave() {
    setHoverStyle({ transform: 'perspective(600px) rotateY(0) rotateX(0) translateZ(0)' })
  }

  async function handleAddToCart(e) {
    e.stopPropagation()
    if (!selectedColor || selectedColor.stock === 0) return
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: `${product.name} ${selectedColor.name}`,
      price_dt: product.price_dt,
      color: selectedColor.name,
      color_hex: selectedColor.hex,
      line: product.line,
      qty: 1,
      image: currentImage,
    })
    playAdd()
    const confetti = (await import('canvas-confetti')).default
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#a855f7','#ec4899','#06b6d4','#fbbf24'] })
  }

  return (
    <>
      <div
        className={styles.card}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={playHover}
        onClick={() => setShowModal(true)}
        style={{ transition: 'transform var(--transition-base)', ...hoverStyle, cursor: 'pointer' }}
      >
        <div className={styles.imageWrap}>
          {currentImage ? (
            <Image src={currentImage} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className={styles.image} quality={80} />
          ) : (
            <div className={styles.imagePlaceholder} style={{ background: `radial-gradient(circle, ${selectedColor?.hex || '#a855f7'}88, transparent)` }}>
              <PotSVG color={selectedColor?.hex || '#a855f7'} />
            </div>
          )}
          <div className={styles.lineBadge}>{LINE_LABELS[product.line]}</div>
          <div className={styles.stockOverlay}><StockBadge stock={stock} /></div>

          {/* Overlay hover — "Voir les détails" */}
          <div className={styles.hoverOverlay} aria-hidden="true">
            <span className={styles.hoverText}>👁 Voir les détails</span>
          </div>

          {/* Icône œil permanente — hint cliquable */}
          <div className={styles.eyeHint} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.name}>{product.name}</p>
          <p className={styles.price}>{formatDT(product.price_dt)}</p>

          {product.colors && product.colors.length > 0 && (
            <div className={styles.colorRow}>
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  className={`${styles.colorDot} ${selectedColor?.name === c.name ? styles.colorDotSelected : ''} ${c.stock === 0 ? styles.colorDotEmpty : ''}`}
                  style={isBicolore
                    ? { background: `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2 || c.hex} 50%)` }
                    : { background: c.hex }
                  }
                  onClick={(e) => { e.stopPropagation(); playColor(); setSelectedColor(c) }}
                  title={c.name}
                  aria-label={c.name}
                  disabled={c.stock === 0}
                />
              ))}
            </div>
          )}

          <button
            className={styles.addBtn}
            onClick={handleAddToCart}
            disabled={!selectedColor || stock === 0}
            type="button"
          >
            <ShoppingCart size={16} />
            {stock === 0 ? 'Épuisé' : 'Ajouter'}
          </button>
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={product}
          selectedColor={selectedColor}
          onClose={() => setShowModal(false)}
          onAddToCart={() => setShowModal(false)}
        />
      )}
    </>
  )
}

function PotSVG({ color }) {
  return (
    <svg viewBox="0 0 80 80" width="70" height="70" fill="none" aria-hidden="true">
      <ellipse cx="40" cy="55" rx="28" ry="18" fill={color} opacity="0.9" />
      <rect x="12" y="30" width="56" height="28" rx="8" fill={color} />
      <ellipse cx="40" cy="30" rx="28" ry="10" fill={color} opacity="0.7" />
      <ellipse cx="40" cy="30" rx="22" ry="7" fill="white" opacity="0.15" />
    </svg>
  )
}
