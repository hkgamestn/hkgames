'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { confirmOrder, createPendingOrder } from '@/lib/actions/orders'
import { getFbIds } from '@/lib/fbBrowser'
import { ShoppingCart, Truck, Shield, Gift, Star, CheckCircle, MapPin, ArrowLeft } from 'lucide-react'
import styles from './packete.module.css'

const SocialToast = dynamic(() => import('@/components/homepage/SocialToast'), { ssr: false })

const IMG = 'https://rsmebjtwmvwyeocvsowg.supabase.co/storage/v1/object/public/product-images/slime%20unicolore.png'
const BANNER = '/pack-ete-banner.jpg'
const BASE = 'https://rsmebjtwmvwyeocvsowg.supabase.co/storage/v1/object/public/product-images'

// Les 6 pots du pack (images individuelles unicolore)
const GALLERY = [
  { src: `${BASE}/unicolore-rose.jpg`,   name: 'Rose',   hex: '#ec4899', emoji: '🩷' },
  { src: `${BASE}/unicolore-violet.jpg`, name: 'Violet', hex: '#a855f7', emoji: '💜' },
  { src: `${BASE}/unicolore-bleu.jpg`,   name: 'Bleu',   hex: '#3b82f6', emoji: '💙' },
  { src: `${BASE}/unicolore-vert.jpg`,   name: 'Vert',   hex: '#22c55e', emoji: '💚' },
  { src: `${BASE}/unicolore-jaune.jpg`,  name: 'Jaune',  hex: '#eab308', emoji: '💛' },
  { src: `${BASE}/unicolore-orange.jpg`, name: 'Orange', hex: '#f97316', emoji: '🧡' },
]

const COLORS = [
  { hex: '#ef4444', e: '❤️', n: 'Rouge' },
  { hex: '#f97316', e: '🧡', n: 'Orange' },
  { hex: '#ec4899', e: '🩷', n: 'Rose' },
  { hex: '#22c55e', e: '💚', n: 'Vert' },
  { hex: '#a855f7', e: '💜', n: 'Violet' },
  { hex: '#eab308', e: '💛', n: 'Jaune' },
]

const GOUVERNORATS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili']

const PRICE = 60

export default function PackEteLanding({ product }) {
  const routerHook = useRouter()
  const [formVisible, setFormVisible] = useState(false)
  const [form, setForm]       = useState({ firstName: '', phone: '', city: '', address: '' })
  const [errors, setErrors]   = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const pendingRef = useRef(false)
  const pendingIdRef = useRef(null)
  const formRef = useRef(null)

  const productId   = product?.id || null
  const productImg  = product?.images?.[0] || IMG

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  // Pré-commande dès que le téléphone est valide (anti-doublon géré côté serveur)
  useEffect(() => {
    const valid = /^[2-9][0-9]{7}$/.test(form.phone)
    if (!valid || pendingRef.current || pendingIdRef.current || !productId) return
    pendingRef.current = true
    const item = { product_id: productId, slug: 'pack-ete-6-slimes', name: 'Pack Été — 6 Slimes', price_dt: PRICE, color: '6 couleurs', line: 'pack_ete', qty: 1, image: productImg, free_shipping: true }
    createPendingOrder({ phone: '+216' + form.phone, items: [item], subtotalDt: PRICE })
      .then(r => { if (r.orderId) pendingIdRef.current = r.orderId })
      .finally(() => { pendingRef.current = false })
  }, [form.phone, productId, productImg])

  function validate() {
    const e = {}
    if (form.firstName.trim().length < 2)       e.firstName = 'Nom requis'
    if (!/^[2-9][0-9]{7}$/.test(form.phone))    e.phone     = 'Numéro tunisien à 8 chiffres'
    if (!form.city)                             e.city      = 'Gouvernorat requis'
    if (form.address.trim().length < 10)        e.address   = 'Adresse complète requise (rue, ville...)'
    return e
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // ── Coordination avec le toast social proof ──
  const inactivityRef = useRef(null)
  const formActiveRef = useRef(false)

  function resetInactivityTimer() {
    clearTimeout(inactivityRef.current)
    if (!formActiveRef.current) return
    // Après 15s sans saisie → relancer un toast Pack Été pour encourager
    inactivityRef.current = setTimeout(() => {
      window.dispatchEvent(new Event('toast-resume'))
      window.dispatchEvent(new Event('toast-force-ete'))
      // Re-pause après le toast pour ne pas gêner si toujours sur le formulaire
      setTimeout(() => {
        if (formActiveRef.current) window.dispatchEvent(new Event('toast-pause'))
      }, 6000)
    }, 15000)
  }

  function handleFormFocus() {
    formActiveRef.current = true
    window.dispatchEvent(new Event('toast-pause')) // stopper le toast pendant la saisie
    resetInactivityTimer()
  }

  function handleFormBlur(e) {
    // Vérifier si le focus quitte vraiment le formulaire
    if (e.currentTarget.contains(e.relatedTarget)) return
    formActiveRef.current = false
    clearTimeout(inactivityRef.current)
    window.dispatchEvent(new Event('toast-resume'))
  }

  useEffect(() => () => clearTimeout(inactivityRef.current), [])

  // ── Son de caisse "cha-ching" au premier contact (anti-autoplay block) ──
  useEffect(() => {
    let played = false
    function playCashSound() {
      if (played) return
      played = true
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return
        const ctx = new Ctx()
        // Deux "ding" rapides (effet cha-ching de caisse enregistreuse)
        const notes = [
          { freq: 1318, start: 0,    dur: 0.12 }, // Mi aigu
          { freq: 1760, start: 0.09, dur: 0.18 }, // La aigu
        ]
        notes.forEach(({ freq, start, dur }) => {
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
          gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + start + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
          osc.connect(gain); gain.connect(ctx.destination)
          osc.start(ctx.currentTime + start)
          osc.stop(ctx.currentTime + start + dur)
        })
        // Petit "scintillement" de pièces
        setTimeout(() => {
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(2200, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(2640, ctx.currentTime + 0.15)
          gain.gain.setValueAtTime(0.12, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
          osc.connect(gain); gain.connect(ctx.destination)
          osc.start(); osc.stop(ctx.currentTime + 0.25)
        }, 220)
      } catch {}
      cleanup()
    }
    function cleanup() {
      window.removeEventListener('pointerdown', playCashSound)
      window.removeEventListener('scroll', playCashSound)
      window.removeEventListener('touchstart', playCashSound)
      window.removeEventListener('keydown', playCashSound)
    }
    // Le son joue au tout premier contact (contrainte navigateur)
    window.addEventListener('pointerdown', playCashSound, { once: false })
    window.addEventListener('scroll', playCashSound, { once: false, passive: true })
    window.addEventListener('touchstart', playCashSound, { once: false, passive: true })
    window.addEventListener('keydown', playCashSound, { once: false })
    return cleanup
  }, [])

  // Masquer le CTA flottant quand le formulaire est visible
  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    setServerError(null)

    const item = { product_id: productId, slug: 'pack-ete-6-slimes', name: 'Pack Été — 6 Slimes', price_dt: PRICE, color: '6 couleurs', line: 'pack_ete', qty: 1, image: productImg, free_shipping: true }

    // Découper le nom complet en prénom + nom (OrderSchema exige les deux ≥ 2 car.)
    const parts = form.firstName.trim().split(/\s+/)
    const fName = parts[0] || 'Client'
    const lName = parts.slice(1).join(' ') || parts[0] || 'Client'

    const { fbp, fbc } = getFbIds()
    const result = await confirmOrder({
      firstName: fName,
      lastName:  lName,
      phone:     '+216' + form.phone,
      address:   form.address.trim(),
      city:      form.city,
      notes:     'Commande Pack Été (landing)',
      items:     [item],
      discounts: {},
      fbp,
      fbc,
      sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    }, pendingIdRef.current)

    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Veuillez vérifier vos informations.')
      setSubmitting(false)
      return
    }

    // Pixel Purchase (sauf test)
    const isTest = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('.vercel.app') || window.location.search.includes('test=1'))
    if (!isTest && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', { value: PRICE, currency: 'TND', order_id: result.orderId }, { eventID: result.eventId })
    }

    routerHook.push(`/merci?id=${result.orderId}`)
  }

  if (!product) {
    return (
      <div className={styles.fallback}>
        <p>Le Pack Été n&apos;est pas disponible pour le moment.</p>
        <a href="/shop" className={styles.fallbackBtn}>Voir la boutique</a>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Bannière promo */}
      <div className={styles.topBar}>
        🌞 OFFRE D&apos;ÉTÉ LIMITÉE · Livraison gratuite partout en Tunisie
      </div>

      {/* Bouton retour boutique */}
      <Link href="/shop" className={styles.backBtn}>
        <ArrowLeft size={16} /> Retour à la boutique
      </Link>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.sunGlow} aria-hidden="true" />

        <div className={styles.heroGrid}>
          {/* Image */}
          <div className={styles.heroImageCol}>
            <div className={styles.heroImageWrap}>
              <img src={BANNER} alt="Pack Été 6 Slimes HK Games — 5 + 1 gratuit, livraison offerte" className={styles.heroImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              <span className={styles.bubble} style={{'--x':'10%','--y':'15%','--s':'34px','--d':'3.2s'}} />
              <span className={styles.bubble} style={{'--x':'82%','--y':'12%','--s':'24px','--d':'4.1s'}} />
              <span className={styles.bubble} style={{'--x':'70%','--y':'78%','--s':'30px','--d':'3.6s'}} />
            </div>
          </div>

          {/* Texte + CTA */}
          <div className={styles.heroTextCol}>
            <div className={styles.badge}>🇹🇳 Fabriqué en Tunisie</div>
            <h1 className={styles.title}>Pack Été<br/><span className={styles.titleAccent}>6 Slimes Premium</span></h1>
            <p className={styles.subtitle}>5 slimes achetés = <strong>le 6ème offert 🎁</strong></p>

            <div className={styles.urgency}>
              🔥 Offre limitée — plus que quelques packs disponibles ce mois-ci
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{PRICE} DT</span>
              <span className={styles.priceOld}>72 DT</span>
              <span className={styles.priceSave}>−12 DT</span>
            </div>

            <div className={styles.colorsRow}>
              {COLORS.map(c => (
                <div key={c.hex} className={styles.colorDot} style={{ background: c.hex }} title={c.n}>
                  <span>{c.e}</span>
                </div>
              ))}
            </div>

            <button className={styles.ctaBtn} onClick={scrollToForm} type="button">
              <ShoppingCart size={20} /> Commander maintenant — {PRICE} DT
            </button>

            <div className={styles.trustRow}>
              <span><Truck size={15}/> Livraison offerte</span>
              <span><Shield size={15}/> Paiement à la livraison</span>
            </div>
          </div>
        </div>
      </section>

      {/* RÉASSURANCE */}
      <section className={styles.reassure}>
        <div className={styles.reassureCard}>
          <Gift size={22} className={styles.reassureIcon}/>
          <h3>6 couleurs incluses</h3>
          <p>Rouge, Orange, Rose, Vert, Violet & Jaune — la collection complète.</p>
        </div>
        <div className={styles.reassureCard}>
          <Shield size={22} className={styles.reassureIcon}/>
          <h3>Qualité premium</h3>
          <p>Texture ultra-satisfaisante, non-toxique, sans danger pour les enfants.</p>
        </div>
        <div className={styles.reassureCard}>
          <Truck size={22} className={styles.reassureIcon}/>
          <h3>Livraison gratuite</h3>
          <p>Partout en Tunisie, paiement en espèces à la réception.</p>
        </div>
      </section>

      {/* GALERIE DES 6 POTS */}
      <section className={styles.gallery}>
        <h2 className={styles.galleryTitle}>Les 6 pots de votre pack 🎨</h2>
        <p className={styles.gallerySub}>Chaque couleur, une texture unique et satisfaisante</p>
        <div className={styles.galleryGrid}>
          {GALLERY.map((g) => (
            <div key={g.name} className={styles.galleryItem}>
              <div className={styles.galleryImgWrap}>
                <Image src={g.src} alt={`Slime ${g.name}`} fill sizes="(max-width:768px) 45vw, 200px" className={styles.galleryImg} />
                <span className={styles.galleryColorTag} style={{ background: g.hex }}>{g.emoji}</span>
              </div>
              <span className={styles.galleryName}>{g.name}</span>
            </div>
          ))}
        </div>
        <button className={styles.galleryCta} onClick={scrollToForm} type="button">
          <ShoppingCart size={18}/> Je commande les 6 — {PRICE} DT
        </button>
      </section>

      {/* AVIS */}
      <section className={styles.reviews}>
        <div className={styles.stars}>
          {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#fbbf24" stroke="#fbbf24" />)}
        </div>
        <p className={styles.reviewsText}>Plus de 1000 familles tunisiennes ont déjà commandé chez HK Games</p>
        <div className={styles.reviewQuotes}>
          <div className={styles.quote}>« Mes enfants adorent, la qualité est top ! » — Amira, Tunis</div>
          <div className={styles.quote}>« Livraison rapide et produit conforme. » — Sami, Sousse</div>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section className={styles.orderSection} ref={formRef}>
        <div className={styles.orderCard}>
          <h2 className={styles.orderTitle}>Commander mon Pack Été 🌞</h2>
          <p className={styles.orderSub}>Remplissez vos coordonnées — paiement à la livraison</p>

          <div className={styles.recap}>
            <Image src={productImg} alt="" width={56} height={56} className={styles.recapImg}/>
            <div className={styles.recapInfo}>
              <span className={styles.recapName}>Pack Été — 6 Slimes</span>
              <span className={styles.recapMeta}>Livraison offerte incluse</span>
            </div>
            <span className={styles.recapPrice}>{PRICE} DT</span>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className={styles.form}
            onFocusCapture={handleFormFocus}
            onBlurCapture={handleFormBlur}
            onInput={resetInactivityTimer}
          >
            <div className={styles.field}>
              <label className={styles.label}>Nom complet *</label>
              <input className={`${styles.input} ${errors.firstName ? styles.err : ''}`} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Votre nom" />
              {errors.firstName && <span className={styles.errMsg}>{errors.firstName}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Téléphone *</label>
              <div className={styles.phoneWrap}>
                <span className={styles.phonePrefix}>+216</span>
                <input className={`${styles.input} ${styles.phoneInput} ${errors.phone ? styles.err : ''}`} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0,8))} placeholder="20 123 456" type="tel" inputMode="numeric" />
              </div>
              {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Gouvernorat *</label>
              <select className={`${styles.input} ${errors.city ? styles.err : ''}`} value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">-- Choisir --</option>
                {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.city && <span className={styles.errMsg}>{errors.city}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Adresse *</label>
              <input className={`${styles.input} ${errors.address ? styles.err : ''}`} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rue, immeuble, ville..." />
              {errors.address && <span className={styles.errMsg}>{errors.address}</span>}
            </div>

            {serverError && <div className={styles.serverErr}>⚠️ {serverError}</div>}

            <button className={styles.submitBtn} type="submit" disabled={submitting}>
              {submitting ? 'Traitement...' : <><CheckCircle size={18}/> Confirmer ma commande — {PRICE} DT</>}
            </button>

            <p className={styles.formNote}>
              <Shield size={13}/> Aucun paiement en ligne · Vous payez {PRICE} DT en espèces à la livraison
            </p>
          </form>
        </div>
      </section>

      {/* CTA flottant mobile — masqué quand le formulaire est visible */}
      {!formVisible && (
        <button className={styles.floatingCta} onClick={scrollToForm} type="button">
          <ShoppingCart size={18}/> Commander — {PRICE} DT
        </button>
      )}

      {/* Toast social proof — biais Pack Été pour encourager */}
      <SocialToast packEteBias />
    </div>
  )
}
