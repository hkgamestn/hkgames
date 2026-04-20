'use client'
import { trackCAPI } from '@/lib/capi-client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { ShoppingCart, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import { formatDT } from '@/lib/utils/formatDT'
import ColorPicker from '@/components/product/ColorPicker'
import MagicMixCanvas from '@/components/product/MagicMixCanvas'
import BuddyBuilder from '@/components/product/BuddyBuilder'
import UrgencyBlock from '@/components/product/UrgencyBlock'
import ProductCard from '@/components/product/ProductCard'
import StarRating from '@/components/ui/StarRating'
import StockBadge from '@/components/ui/StockBadge'
import styles from './ProductDetail.module.css'

export default function ProductDetail({ product, related, testimonials }) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null)
  const [selectedCombo, setSelectedCombo]  = useState(null)
  const [buddyName, setBuddyName]          = useState('')
  const [qty, setQty]     = useState(1)
  const [imgIdx, setImgIdx] = useState(0)
  const [pageColor, setPageColor] = useState(null)
  const addItem = useCartStore((s) => s.addItem)

  const images = product.images?.length > 0 ? product.images : [null]

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [product.slug],
        content_name: product.name,
        content_type: 'product',
        value: product.price_dt,
        currency: 'TND',
      })
    }
  }, [product.slug])
  const stock  = selectedColor?.stock ?? null

  function handleColorChange(color) {
    setSelectedColor(color)
    setPageColor(color.hex)
  }

  function handleAddToCart() {
    if (stock === 0) return
    const colorName = product.line === 'bicolore'
      ? (selectedCombo?.result || 'Mélange')
      : (selectedColor?.name || 'Violet')
    const colorHex = product.line === 'bicolore'
      ? (selectedCombo?.hexResult || '#a855f7')
      : (selectedColor?.hex || '#a855f7')

    addItem({
      product_id: product.id,
      slug:       product.slug,
      name:       `${product.name} ${colorName}`,
      price_dt:   product.price_dt,
      color:      colorName,
      color_hex:  colorHex,
      line:       product.line,
      buddy_name: product.line === 'buddies' ? buddyName : undefined,
      qty,
      image:      product.images?.[0] || null,
    })

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#06b6d4', '#fbbf24', '#10b981'],
    })

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: product.price_dt,
        currency: 'TND',
        content_name: product.name,
      })
    }
  }

  return (
    <div
      className={styles.page}
      style={pageColor ? { '--selected-product-color': pageColor } : {}}
    >
      {pageColor && <div className={styles.pageColorOverlay} />}

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              {images[imgIdx] ? (
                <Image
                  src={images[imgIdx]}
                  alt={`${product.name} — photo ${imgIdx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={styles.mainImg}
                  priority
                />
              ) : (
                <div
                  className={styles.imagePlaceholder}
                  style={{ background: `radial-gradient(circle, ${selectedColor?.hex || '#a855f7'}88, ${selectedColor?.hex || '#a855f7'}22)` }}
                >
                  <PotSVG color={selectedColor?.hex || '#a855f7'} size={120} />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={() => setImgIdx((i) => Math.max(0, i - 1))} aria-label="Photo précédente">
                    <ChevronLeft size={20} />
                  </button>
                  <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={() => setImgIdx((i) => Math.min(images.length - 1, i + 1))} aria-label="Photo suivante">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === imgIdx ? styles.thumbActive : ''}`}
                    onClick={() => setImgIdx(i)}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                  >
                    {src && <Image src={src} alt="" width={60} height={60} className={styles.thumbImg} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <div className={styles.lineTag}>{product.line}</div>
            <h1 className={styles.title}>{product.name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>{formatDT(product.price_dt)}</span>
              {stock !== null && <StockBadge stock={stock} />}
            </div>

            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            {/* Product interaction depending on line */}
            {product.line === 'unicolore' && (
              <ColorPicker
                colors={product.colors || []}
                productId={product.id}
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
              />
            )}

            {product.line === 'bicolore' && (
              <MagicMixCanvas
                selectedCombo={selectedCombo}
                onComboSelect={setSelectedCombo}
              />
            )}

            {product.line === 'buddies' && (
              <>
                <ColorPicker
                  colors={product.colors || []}
                  productId={product.id}
                  selectedColor={selectedColor}
                  onColorChange={handleColorChange}
                />
                <BuddyBuilder
                  selectedColor={selectedColor}
                  onColorChange={handleColorChange}
                  onNameChange={setBuddyName}
                />
              </>
            )}

            {/* Quantity */}
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Quantité</span>
              <div className={styles.qtyControl}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} type="button" aria-label="Diminuer">-</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} type="button" aria-label="Augmenter">+</button>
              </div>
            </div>

            {/* ATC */}
            <button
              className={styles.addBtn}
              onClick={handleAddToCart}
              disabled={stock === 0}
              type="button"
            >
              <ShoppingCart size={20} />
              {stock === 0 ? 'Épuisé' : `Ajouter au panier — ${formatDT(product.price_dt * qty)}`}
            </button>

            <UrgencyBlock stock={stock} />

            <div className={styles.certBadges}>
              <span>🧪 Non-toxique certifié</span>
              <span>✅ Paiement à la livraison</span>
              <span>🚀 Livraison 24–48h</span>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className={styles.reviews}>
            <h2 className={styles.sectionTitle}>Avis clients</h2>
            <div className={styles.reviewsGrid}>
              {testimonials.map((t) => (
                <div key={t.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <StarRating rating={t.rating} />
                    <span className={styles.reviewAuthor}>{t.customer_name} · {t.customer_city}</span>
                  </div>
                  <p className={styles.reviewText}>{t.review_text}</p>
                  {t.photo_url && (
                    <Image
                      src={t.photo_url}
                      alt={`Avis de ${t.customer_name}`}
                      width={120}
                      height={120}
                      className={styles.reviewPhoto}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.sectionTitle}>Tu pourrais aussi aimer</h2>
            <div className={styles.relatedGrid}>
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} index={99} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PotSVG({ color, size = 80 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" aria-hidden="true">
      <ellipse cx="40" cy="55" rx="28" ry="18" fill={color} opacity="0.9" />
      <rect x="12" y="30" width="56" height="28" rx="8" fill={color} />
      <ellipse cx="40" cy="30" rx="28" ry="10" fill={color} opacity="0.7" />
      <ellipse cx="40" cy="30" rx="22" ry="7" fill="white" opacity="0.18" />
      <ellipse cx="32" cy="28" rx="6" ry="3" fill="white" opacity="0.35" />
    </svg>
  )
}
