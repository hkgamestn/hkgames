'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Sparkles } from 'lucide-react'
// confetti lazy
import { useCartStore } from '@/lib/cart/store'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './ProductModal.module.css'

const COLOR_EFFECTS = {
  'Rose':   { soul: 'Amour & tendresse',    spirit: 'Apaise les émotions',     texture: 'Fondante et douce comme un nuage' },
  'Violet': { soul: 'Créativité & magie',   spirit: 'Stimule l\'imagination',  texture: 'Élastique et mystérieuse' },
  'Jaune':  { soul: 'Joie & optimisme',     spirit: 'Énergie et bonne humeur', texture: 'Légère et pétillante' },
  'Bleu':   { soul: 'Calme & sérénité',     spirit: 'Apaise le mental',        texture: 'Fluide et relaxante' },
  'Vert':   { soul: 'Équilibre & nature',   spirit: 'Recentre et apaise',      texture: 'Fraîche et revigorante' },
  'Orangé': { soul: 'Vitalité & créativité',spirit: 'Boost la concentration',  texture: 'Ferme et satisfaisante' },
  'Jaune+Bleu': { soul: 'Harmonie naturelle', spirit: 'Équilibre corps & esprit', texture: 'Surprenante — verte au toucher' },
  'Rose+Bleu':  { soul: 'Romantisme créatif', spirit: 'Libère la pensée',        texture: 'Douce et mystérieuse à la fois' },
  'Jaune+Rose': { soul: 'Chaleur & énergie',  spirit: 'Stimule la bonne humeur', texture: 'Pétillante et chaleureuse' },
}

const LINE_DESC = {
  unicolore: 'Un slime artisanal pur, intense et satisfaisant. Chaque couleur est soigneusement choisie pour son effet sensoriel unique.',
  bicolore:  'Deux couleurs fusionnent pour créer une teinte secrète. Malaxez et découvrez la magie du mélange !',
  buddies:   'Un slime unicolore avec des yeux mobiles. Votre compagnon de jeu personnel à adopter et personnaliser.',
}

export default function ProductModal({ product, selectedColor, onClose, onAddToCart }) {
  const overlayRef = useRef(null)
  const addItem = useCartStore((s) => s.addItem)

  const colorName = selectedColor?.name || ''
  const effects   = COLOR_EFFECTS[colorName] || { soul: 'Bien-être sensoriel', spirit: 'Relaxation profonde', texture: 'Unique et satisfaisante' }
  const image     = selectedColor?.image || product?.images?.[0] || null

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleAdd() {
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
      image,
    })
    const confetti = (await import('canvas-confetti')).default
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#a855f7','#ec4899','#06b6d4','#fbbf24','#10b981'] })
    onClose()
    if (onAddToCart) onAddToCart()
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Fermer">
          <X size={20} />
        </button>

        <div className={styles.grid}>
          {/* Image */}
          <div className={styles.imageSection}>
            <div
              className={styles.imageWrap}
              style={{ '--modal-color': selectedColor?.hex || '#a855f7' }}
            >
              {image ? (
                <Image src={image} alt={product.name} fill sizes="300px" className={styles.image} />
              ) : (
                <div className={styles.imagePlaceholder} style={{ background: `radial-gradient(circle, ${selectedColor?.hex || '#a855f7'}55, transparent)` }} />
              )}
              <div className={styles.imageGlow} />
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{formatDT(product?.price_dt || 0)}</span>
              <span className={styles.weightBadge}>170g</span>
            </div>
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <div className={styles.lineBadge}>{product?.line}</div>
            <h2 className={styles.title}>{product?.name}</h2>
            {colorName && (
              <div className={styles.colorBadge} style={{ background: `${selectedColor?.hex}22`, color: selectedColor?.hex, border: `1px solid ${selectedColor?.hex}44` }}>
                <span className={styles.colorDot} style={{ background: selectedColor?.hex }} />
                {colorName}
              </div>
            )}

            <p className={styles.lineDesc}>{LINE_DESC[product?.line]}</p>

            {/* Effets */}
            <div className={styles.effectsGrid}>
              <div className={styles.effectCard}>
                <span className={styles.effectIcon}>✨</span>
                <div>
                  <p className={styles.effectLabel}>Effet sur l'âme</p>
                  <p className={styles.effectValue}>{effects.soul}</p>
                </div>
              </div>
              <div className={styles.effectCard}>
                <span className={styles.effectIcon}>🧠</span>
                <div>
                  <p className={styles.effectLabel}>Effet sur l'esprit</p>
                  <p className={styles.effectValue}>{effects.spirit}</p>
                </div>
              </div>
              <div className={styles.effectCard}>
                <span className={styles.effectIcon}>🤲</span>
                <div>
                  <p className={styles.effectLabel}>Texture</p>
                  <p className={styles.effectValue}>{effects.texture}</p>
                </div>
              </div>
            </div>

            <div className={styles.badges}>
              <span className={styles.badge}>🧪 Non-toxique certifié</span>
              <span className={styles.badge}>✅ Paiement à la livraison</span>
              <span className={styles.badge}>🚀 Livraison 24–48h</span>
            </div>

            <div className={styles.actions}>
              <button className={styles.addBtn} onClick={handleAdd} disabled={selectedColor?.stock === 0} type="button">
                <ShoppingCart size={18} />
                {selectedColor?.stock === 0 ? 'Épuisé' : `Ajouter au panier — ${formatDT(product?.price_dt || 0)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
