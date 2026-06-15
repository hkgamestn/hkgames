'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Sun, Truck, Gift } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './PackEteModal.module.css'

const COLORS_ETE = [
  { name: 'Rouge',  hex: '#ef4444', emoji: '❤️' },
  { name: 'Orange', hex: '#f97316', emoji: '🧡' },
  { name: 'Rose',   hex: '#ec4899', emoji: '🩷' },
  { name: 'Vert',   hex: '#22c55e', emoji: '💚' },
  { name: 'Violet', hex: '#a855f7', emoji: '💜' },
  { name: 'Jaune',  hex: '#eab308', emoji: '💛' },
]

const IMG = 'https://rsmebjtwmvwyeocvsowg.supabase.co/storage/v1/object/public/product-images/slime%20unicolore.png'

export default function PackEteModal({ product, onClose }) {
  const overlayRef = useRef(null)
  const addItem    = useCartStore((s) => s.addItem)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleAdd() {
    addItem({
      product_id:    product.id,
      slug:          product.slug,
      name:          'Pack Été — 6 Slimes',
      price_dt:      product.price_dt,
      color:         '6 couleurs',
      color_hex:     '#f59e0b',
      line:          'pack_ete',
      qty:           1,
      image:         product.images?.[0] || IMG,
      free_shipping: true,
    })
    const confetti = (await import('canvas-confetti')).default
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 }, colors: ['#ef4444','#f97316','#ec4899','#22c55e','#a855f7','#eab308'] })
    onClose()
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Fermer">
          <X size={20} />
        </button>

        {/* ── Soleil décoratif ─── */}
        <div className={styles.sunBg} aria-hidden="true">
          <div className={styles.sunRays} />
        </div>

        <div className={styles.grid}>
          {/* ── Colonne image ── */}
          <div className={styles.imageCol}>
            <div className={styles.imageWrap}>
              <Image
                src={product.images?.[0] || IMG}
                alt="Pack Été 6 Slimes"
                fill sizes="340px"
                className={styles.image}
                priority
              />
              {/* Bulles d'été */}
              <div className={styles.bubble} style={{ '--x':'15%','--y':'20%','--size':'40px','--d':'3s' }} />
              <div className={styles.bubble} style={{ '--x':'80%','--y':'15%','--size':'28px','--d':'4.5s' }} />
              <div className={styles.bubble} style={{ '--x':'60%','--y':'75%','--size':'34px','--d':'3.8s' }} />
              <div className={styles.bubble} style={{ '--x':'10%','--y':'70%','--size':'22px','--d':'5s' }} />
            </div>

            {/* Prix */}
            <div className={styles.priceBlock}>
              <span className={styles.priceFinal}>{formatDT(product.price_dt)}</span>
              <span className={styles.priceOriginal}>72 DT</span>
              <span className={styles.saveBadge}>−12 DT</span>
            </div>

            {/* Badges */}
            <div className={styles.badgeRow}>
              <div className={styles.infoBadge}><Truck size={13}/> Livraison offerte</div>
              <div className={styles.infoBadge}><Gift size={13}/> 1 offert</div>
            </div>
          </div>

          {/* ── Colonne infos ── */}
          <div className={styles.infoCol}>
            <div className={styles.seasonBadge}>
              <Sun size={14}/> Offre d&apos;Été Exclusive
            </div>

            <h2 className={styles.title}>Pack Été<br/><span className={styles.titleAccent}>6 Slimes Premium</span></h2>

            <p className={styles.tagline}>
              5 slimes achetés = <strong>6ème offert !</strong><br/>
              Profite de la collection complète pour cet été 🌊
            </p>

            {/* Les 6 couleurs */}
            <div className={styles.colorsSection}>
              <p className={styles.colorsTitle}>Les 6 couleurs incluses</p>
              <div className={styles.colorsGrid}>
                {COLORS_ETE.map((c) => (
                  <div key={c.name} className={styles.colorItem}>
                    <div className={styles.colorBall} style={{ background: c.hex }}>
                      <span className={styles.colorEmoji}>{c.emoji}</span>
                    </div>
                    <span className={styles.colorName}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pourquoi ce pack */}
            <div className={styles.whyGrid}>
              <div className={styles.whyCard}>
                <span className={styles.whyIcon}>🎨</span>
                <div>
                  <p className={styles.whyTitle}>6 expériences sensorielles</p>
                  <p className={styles.whySub}>Chaque couleur = une texture unique</p>
                </div>
              </div>
              <div className={styles.whyCard}>
                <span className={styles.whyIcon}>👧</span>
                <div>
                  <p className={styles.whyTitle}>Parfait pour les enfants</p>
                  <p className={styles.whySub}>Non-toxique, certifié premium</p>
                </div>
              </div>
              <div className={styles.whyCard}>
                <span className={styles.whyIcon}>☀️</span>
                <div>
                  <p className={styles.whyTitle}>Occupation estivale</p>
                  <p className={styles.whySub}>Des heures de créativité garanties</p>
                </div>
              </div>
            </div>

            <button className={styles.addBtn} onClick={handleAdd} type="button">
              <ShoppingCart size={18} />
              Ajouter au panier — {formatDT(product.price_dt)}
            </button>

            <p className={styles.delivNote}>✅ Paiement à la livraison · 🚚 Livraison 24–48h offerte</p>
          </div>
        </div>
      </div>
    </div>
  )
}
