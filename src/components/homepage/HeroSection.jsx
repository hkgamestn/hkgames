'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowRight, Truck, Shield, Star } from 'lucide-react'
import Link from 'next/link'
import ProductModal from '@/components/product/ProductModal'
import { createClient } from '@/lib/supabase/client'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './HeroSection.module.css'

const BASE = 'https://rsmebjtwmvwyeocvsowg.supabase.co/storage/v1/object/public/product-images'

const HERO_SLUGS = ['unicolore', 'bicolore-rose-bleu', 'buddies']

const CARD_META = {
  unicolore:        { label: 'Unicolore', cardColor: '#a855f7', cardImage: `${BASE}/unicolore-violet.jpg` },
  'bicolore-rose-bleu': { label: 'Bicolore',  cardColor: '#ec4899', cardImage: `${BASE}/bicolore-rose-bleu.jpg` },
  buddies:          { label: 'Buddy',     cardColor: '#22c55e', cardImage: `${BASE}/buddies-vert.jpg` },
}

export default function HeroSection() {
  const [products, setProducts]         = useState([])
  const [modalProduct, setModalProduct] = useState(null)
  const [modalColor, setModalColor]     = useState(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('id, slug, name, line, price_dt, images, colors')
      .in('slug', HERO_SLUGS)
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return
        // Trie dans l'ordre voulu
        const sorted = HERO_SLUGS.map((slug) => data.find((p) => p.slug === slug)).filter(Boolean)
        setProducts(sorted)
      })
  }, [])

  function openModal(product) {
    setModalProduct(product)
    setModalColor(product.colors?.[0] || null)
  }

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <div className={styles.badge}>
          <Star size={14} />
          <span>+800 Slimes vendus ce mois</span>
        </div>

        <h1 className={styles.title}>
          Le Slime le plus
          <span className={styles.titleGradient}> Magique </span>
          de Tunisie
        </h1>

        <p className={styles.subtitle}>
          Slimes artisanaux 100% non-toxiques · Livraison partout en Tunisie · Paiement à la réception
        </p>

        <div className={styles.trustRow}>
          <div className={styles.trustItem}><Truck size={16} className={styles.trustIcon} /><span>Livraison J+1 à Tunis</span></div>
          <div className={styles.trustItem}><Shield size={16} className={styles.trustIcon} /><span>Non-toxique certifié</span></div>
        </div>

        <div className={styles.ctaRow}>
          <Link href="/shop" className={styles.ctaBtn}>Découvrir la boutique<ArrowRight size={18} /></Link>
          <Link href="#labo" className={styles.secondaryBtn}>Créer mon Slime</Link>
        </div>
      </div>

      <div className={styles.stackWrapper}>
        {products.map((product, i) => {
          const meta = CARD_META[product.slug] || {}
          return (
            <button
              key={product.id}
              className={styles.stackCard}
              onClick={() => openModal(product)}
              type="button"
              aria-label={`Voir ${product.name}`}
            >
              <div className={styles.cardImageWrap}>
                <Image src={meta.cardImage || product.images?.[0]} alt={product.name} fill sizes="240px" className={styles.cardImage} priority={i === 0} />
                <div className={styles.cardOverlay} />
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel} style={{ background: `${meta.cardColor}22`, color: meta.cardColor }}>{meta.label}</span>
                <p className={styles.cardName}>{product.name}</p>
                <p className={styles.cardPrice}>{formatDT(product.price_dt)}</p>
              </div>
              <div className={styles.cardCta}>Découvrir →</div>
            </button>
          )
        })}
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          selectedColor={modalColor}
          onClose={() => { setModalProduct(null); setModalColor(null) }}
        />
      )}
    </section>
  )
}
