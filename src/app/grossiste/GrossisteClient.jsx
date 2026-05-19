'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Phone, MapPin, Package, CheckCircle,
  ChevronRight, Truck, ShieldCheck, TrendingUp,
  Minus, Plus, X, Info
} from 'lucide-react'
import styles from './grossiste.module.css'

const CITIES = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine',
  'Tataouine','Gafsa','Tozeur','Kébili',
]

const AVANTAGES = [
  { icon: TrendingUp,  title: 'Marges attractives', desc: 'Prix dégressifs dès 19 unités — plus vous commandez, plus vous gagnez.' },
  { icon: Truck,       title: 'Livraison Navex',    desc: 'Livraison rapide partout en Tunisie via notre partenaire Navex.' },
  { icon: ShieldCheck, title: 'Produit certifié',   desc: 'Slime 170g sans danger, certifié pour enfants dès 3 ans.' },
  { icon: Package,     title: 'Stock disponible',   desc: 'Stocks gérés en temps réel. Jamais de rupture sans préavis.' },
]

const UNICOLORE_COLORS = [
  { id: 'rose',    name: 'Rose',    hex: '#ec4899' },
  { id: 'violet',  name: 'Violet',  hex: '#7c3aed' },
  { id: 'orange',  name: 'Orangé',  hex: '#f97316' },
  { id: 'bleu',    name: 'Bleu',    hex: '#3b82f6' },
  { id: 'jaune',   name: 'Jaune',   hex: '#eab308' },
  { id: 'vert',    name: 'Vert',    hex: '#22c55e' },
]

const BICOLORE_COLORS = [
  { id: 'bleu-rose',   name: 'Bleu / Rose',   hex1: '#3b82f6', hex2: '#ec4899' },
  { id: 'bleu-jaune',  name: 'Bleu / Jaune',  hex1: '#3b82f6', hex2: '#eab308' },
  { id: 'rose-jaune',  name: 'Rose / Jaune',  hex1: '#ec4899', hex2: '#eab308' },
]

const BUDDIES_COLORS = [
  { id: 'rose',    name: 'Rose + yeux',    hex: '#ec4899', eyes: true },
  { id: 'violet',  name: 'Violet + yeux',  hex: '#7c3aed', eyes: true },
  { id: 'orange',  name: 'Orangé + yeux',  hex: '#f97316', eyes: true },
  { id: 'bleu',    name: 'Bleu + yeux',    hex: '#3b82f6', eyes: true },
  { id: 'jaune',   name: 'Jaune + yeux',   hex: '#eab308', eyes: true },
  { id: 'vert',    name: 'Vert + yeux',    hex: '#22c55e', eyes: true },
]

const PRODUCTS = [
  {
    id: 'unicolore',
    name: 'Slime Unicolore',
    tagline: 'Le classique premium',
    desc: '170g — Texture lisse, couleur unie.',
    emoji: '🟣',
    badge: '⭐ Best-seller',
    badgeColor: '#a855f7',
    colors: UNICOLORE_COLORS,
    details: {
      poids: '170g',
      texture: 'Lisse, veloutée, brillante',
      age: 'Dès 3 ans',
      duree: '4 à 6 semaines bien conservé',
      usage: 'Jeu sensoriel, anti-stress, ASMR, découverte',
      public: 'Enfants & adultes',
      ingredients: 'Polymère non toxique, colorants alimentaires, sans borax',
      certificat: 'Conforme normes sécurité enfants CE',
      highlights: [
        'Texture veloutée qui ne colle pas aux mains',
        'Coloration profonde et uniforme',
        'Brillant naturel sans additif chimique',
        'Conserve son élasticité des semaines',
        'Idéal pour l\'ASMR et le jeu créatif',
        '6 coloris disponibles pour varier les commandes',
      ],
    },
  },
  {
    id: 'bicolore',
    name: 'Slime Bicolore',
    tagline: "L'effet marbré unique",
    desc: '170g — Deux couleurs, effet marbré unique.',
    emoji: '🌈',
    badge: '🎨 Créatif',
    badgeColor: '#0ea5e9',
    colors: BICOLORE_COLORS,
    details: {
      poids: '170g',
      texture: 'Marbré, extensible, souple',
      age: 'Dès 4 ans',
      duree: '4 à 6 semaines bien conservé',
      usage: 'Art sensoriel, personnalisation, collection',
      public: 'Enfants créatifs 4-12 ans',
      ingredients: 'Polymère non toxique, deux pigments distincts, sans borax',
      certificat: 'Conforme normes sécurité enfants CE',
      highlights: [
        'Chaque pot a un motif marbré 100% unique',
        'Deux couleurs qui se mélangent à la demande',
        'L\'enfant peut créer ses propres motifs',
        'Très populaire pour les collections',
        '3 combinaisons de couleurs disponibles',
        'Idéal pour les kiosques et points de vente créatifs',
      ],
    },
  },
  {
    id: 'buddies',
    name: 'Slime Buddy',
    tagline: 'La surprise incluse',
    desc: '170g — Slime + yeux mobiles inclus.',
    emoji: '🧸',
    badge: '🎁 Idéal cadeau',
    badgeColor: '#10b981',
    colors: BUDDIES_COLORS,
    details: {
      poids: '170g',
      texture: 'Ferme, dense, légèrement pétillante',
      age: 'Dès 4 ans',
      duree: '4 à 6 semaines bien conservé',
      usage: 'Cadeau, anniversaire, jeu narratif, surprise',
      public: 'Enfants 4-10 ans',
      ingredients: 'Polymère non toxique, colorants, yeux mobiles plastique sécurisé, sans borax',
      certificat: 'Conforme normes sécurité enfants CE',
      highlights: [
        'Yeux mobiles inclus dans la masse du slime',
        'Chaque pot est une découverte pour l\'enfant',
        'Couleur du slime assortie au personnage',
        'Idéal comme cadeau ou prix de tombola',
        '6 coloris disponibles avec yeux mobiles',
        'Le produit HK Games avec le meilleur taux de réachat',
      ],
    },
  },
]

const MIN_TOTAL = 19

function getPricePerUnit(total, tiers) {
  if (!tiers?.length) return null
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty)
  for (const t of sorted) {
    if (total >= t.min_qty) return { price: Number(t.price_ht), label: t.label }
  }
  return null
}

/* ─── Tier Progress Bar ─── */
function TierProgress({ totalQty, tiers, errors }) {
  const sorted = [...(tiers || [])].filter(t => t.active !== false).sort((a,b) => a.min_qty - b.min_qty)

  // Current tier
  const currentTier = [...sorted].reverse().find(t => totalQty >= t.min_qty) || null
  // Next tier
  const nextTierIdx = currentTier ? sorted.findIndex(t => t.id === currentTier.id) + 1 : 0
  const nextTier = sorted[nextTierIdx] || null

  // Progress within current segment
  const segStart = currentTier ? currentTier.min_qty : 0
  const segEnd   = nextTier    ? nextTier.min_qty     : (currentTier ? currentTier.min_qty + 50 : MIN_TOTAL)
  const pct      = Math.min(100, Math.max(0, ((totalQty - segStart) / (segEnd - segStart)) * 100))
  const toNext   = nextTier ? nextTier.min_qty - totalQty : 0

  const pricePerUnit = currentTier ? Number(currentTier.price_ht) : null
  const ttcPerUnit   = pricePerUnit ? (pricePerUnit * 1.20) : null
  const totalTTC     = ttcPerUnit && totalQty > 0 ? (ttcPerUnit * totalQty) : null
  const savings      = currentTier && sorted[0]
    ? (Number(sorted[0].price_ht) - Number(currentTier.price_ht)) * totalQty
    : 0

  return (
    <div className={styles.tierProgress}>
      {/* Tier pills */}
      <div className={styles.tierPills}>
        {sorted.map((t, i) => {
          const isActive  = currentTier?.id === t.id
          const isPast    = currentTier && sorted.indexOf(t) < sorted.indexOf(currentTier)
          const isReached = totalQty >= t.min_qty
          return (
            <div key={t.id} className={`${styles.tierPill} ${isActive ? styles.tierPillActive : ''} ${isReached && !isActive ? styles.tierPillDone : ''}`}>
              <span className={styles.tierPillName}>{t.label}</span>
              <span className={styles.tierPillQty}>dès {t.min_qty} u</span>
              <span className={styles.tierPillPrice}>{Number(t.price_ht).toFixed(3)} DT</span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className={styles.tpBarWrap}>
        <div className={styles.tpBar}>
          <div
            className={styles.tpFill}
            style={{
              width: `${pct}%`,
              background: currentTier
                ? 'linear-gradient(90deg, #7c3aed, #a855f7)'
                : 'rgba(168,85,247,.35)',
            }}
          />
        </div>
        <div className={styles.tpLabel}>
          {totalQty === 0 && (
            <span className={styles.tpHint}>Ajoutez au moins {MIN_TOTAL} pièces pour commencer</span>
          )}
          {totalQty > 0 && totalQty < MIN_TOTAL && (
            <span className={styles.tpHint}>⚠️ Minimum {MIN_TOTAL} pièces requis — il manque {MIN_TOTAL - totalQty}</span>
          )}
          {totalQty >= MIN_TOTAL && !nextTier && (
            <span className={styles.tpOk}>🏆 Meilleur palier atteint — {totalQty} pièces</span>
          )}
          {totalQty >= MIN_TOTAL && nextTier && (
            <span className={styles.tpNext}>
              ➕ {toNext} pièce{toNext > 1 ? "s" : ""} de plus pour passer au palier <strong>{nextTier.label}</strong> ({Number(nextTier.price_ht).toFixed(3)} DT/u)
            </span>
          )}
        </div>
      </div>

      {/* Current pricing summary */}
      {currentTier && totalQty > 0 && (
        <div className={styles.tpSummary}>
          <div className={styles.tpSummaryItem}>
            <span className={styles.tpSummaryLabel}>Palier actuel</span>
            <span className={styles.tpSummaryVal}>{currentTier.label}</span>
          </div>
          <div className={styles.tpSummaryItem}>
            <span className={styles.tpSummaryLabel}>Prix unitaire HT</span>
            <span className={styles.tpSummaryVal}>{Number(currentTier.price_ht).toFixed(3)} DT</span>
          </div>
          <div className={styles.tpSummaryItem}>
            <span className={styles.tpSummaryLabel}>Total TTC estimé</span>
            <span className={`${styles.tpSummaryVal} ${styles.tpSummaryHighlight}`}>{totalTTC?.toFixed(3)} DT</span>
          </div>
          {savings > 0 && (
            <div className={styles.tpSavings}>
              🎉 Vous économisez déjà <strong>{savings.toFixed(3)} DT</strong> par rapport au tarif de base
            </div>
          )}
        </div>
      )}
      {errors?._qty && <div className={styles.error} style={{marginTop:8}}>{errors._qty}</div>}
    </div>
  )
}

/* ─── Floating product detail modal ─── */
function ProductModal({ product, lineImages, onClose }) {
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const d = product.details

  return (
    <div className={styles.modalBackdrop}>
      <div ref={ref} className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <span className={styles.modalBadge}
              style={{ background: product.badgeColor+'22', color: product.badgeColor, borderColor: product.badgeColor+'55' }}>
              {product.badge}
            </span>
            <h2 className={styles.modalTitle}>{product.name}</h2>
            <p className={styles.modalTagline}>{product.tagline}</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={20}/></button>
        </div>

        <div className={styles.modalBody}>
          {/* Left: image + specs */}
          <div className={styles.modalLeft}>
            <div className={styles.modalImg}>
              {lineImages[product.id]
                ? <Image src={lineImages[product.id]} alt={product.name} fill sizes="280px" style={{objectFit:'cover'}}/>
                : <span style={{fontSize:'4rem'}}>{product.emoji}</span>
              }
            </div>

            {/* Specs grid */}
            <div className={styles.specsGrid}>
              {[
                ['⚖️', 'Poids', d.poids],
                ['🎭', 'Texture', d.texture],
                ['👶', 'Âge min.', d.age],
                ['📅', 'Durée', d.duree],
                ['✅', 'Certificat', d.certificat],
              ].map(([icon, label, val]) => (
                <div key={label} className={styles.specItem}>
                  <span className={styles.specIcon}>{icon}</span>
                  <div>
                    <div className={styles.specLabel}>{label}</div>
                    <div className={styles.specVal}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: details */}
          <div className={styles.modalRight}>
            {/* Highlights */}
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>✨ Points forts</div>
              <ul className={styles.highlightsList}>
                {d.highlights.map((h, i) => (
                  <li key={i} className={styles.highlightItem}>{h}</li>
                ))}
              </ul>
            </div>

            {/* Usage */}
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>🎯 Usage & public cible</div>
              <p className={styles.modalText}>{d.usage}</p>
              <p className={styles.modalTextMuted}>Public : {d.public}</p>
            </div>

            {/* Ingredients */}
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>🧪 Composition</div>
              <p className={styles.modalText}>{d.ingredients}</p>
            </div>

            {/* Colors */}
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>🎨 Couleurs disponibles</div>
              <div className={styles.modalColors}>
                {product.colors.map(col => (
                  <div key={col.id} className={styles.modalColorItem}>
                    {col.hex1
                      ? <div className={styles.modalSwatchDuo}
                          style={{ background: `linear-gradient(135deg, ${col.hex1} 50%, ${col.hex2} 50%)` }}/>
                      : <div className={styles.modalSwatch}
                          style={{ background: col.hex }}/>
                    }
                    <span className={styles.modalColorName}>
                      {col.name}
                      {col.eyes && <span className={styles.eyesBadge}>👁 yeux</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <p className={styles.modalFooterNote}>
            💡 Précisez vos couleurs souhaitées dans les notes de commande
          </p>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Color picker for a product ─── */
function ColorPicker({ product, selectedColors, onChange }) {
  return (
    <div className={styles.colorPicker}>
      <div className={styles.colorPickerLabel}>
        Couleurs souhaitées <span className={styles.colorOptional}>(optionnel)</span>
      </div>
      <div className={styles.colorPickerRow}>
        {product.colors.map(col => {
          const selected = selectedColors.includes(col.id)
          return (
            <button
              key={col.id}
              type="button"
              title={col.name}
              className={`${styles.colorPickerSwatch} ${selected ? styles.colorPickerSwatchActive : ''}`}
              onClick={() => {
                if (selected) onChange(selectedColors.filter(x => x !== col.id))
                else onChange([...selectedColors, col.id])
              }}
            >
              {col.hex1
                ? <span className={styles.cpSwatchInner}
                    style={{ background: `linear-gradient(135deg, ${col.hex1} 50%, ${col.hex2} 50%)` }}/>
                : <span className={styles.cpSwatchInner}
                    style={{ background: col.hex }}/>
              }
              {selected && <span className={styles.cpCheck}>✓</span>}
            </button>
          )
        })}
      </div>
      {selectedColors.length > 0 && (
        <div className={styles.colorSelected}>
          {product.colors.filter(c => selectedColors.includes(c.id)).map(c => c.name).join(', ')}
        </div>
      )}
    </div>
  )
}

export default function GrossisteClient({ tiers, lineImages = {} }) {
  const [quantities,     setQuantities]     = useState({ unicolore: 0, bicolore: 0, buddies: 0 })
  const [selectedColors, setSelectedColors] = useState({ unicolore: [], bicolore: [], buddies: [] })
  const [modalProduct,   setModalProduct]   = useState(null)
  const [form, setForm] = useState({
    company_name: '', contact_name: '', phone: '', email: '',
    city: '', address: '', matricule_fiscal: '', notes: '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const totalQty  = quantities.unicolore + quantities.bicolore + quantities.buddies
  const tierInfo  = getPricePerUnit(totalQty, tiers)
  const totalHT   = tierInfo ? totalQty * tierInfo.price : null
  const qtyReached = totalQty >= MIN_TOTAL

  function setQty(id, val) {
    setQuantities(q => ({ ...q, [id]: Math.max(0, parseInt(val, 10) || 0) }))
  }
  function incQty(id, delta) {
    setQuantities(q => ({ ...q, [id]: Math.max(0, q[id] + delta) }))
  }
  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (totalQty < MIN_TOTAL)              e._qty             = `Minimum ${MIN_TOTAL} pièces. Il manque ${MIN_TOTAL - totalQty} pièce(s).`
    if (!form.company_name.trim())         e.company_name     = 'Requis'
    if (!form.contact_name.trim())         e.contact_name     = 'Requis'
    if (!/^((\+216|00216|0)(2[0-9]|[3-9][0-9])[0-9]{6})$/.test(form.phone.trim()))
                                           e.phone            = 'Numéro tunisien invalide'
    if (!form.city)                        e.city             = 'Requis'
    if (!form.address.trim())              e.address          = 'Requis'
    if (!form.matricule_fiscal.trim())     e.matricule_fiscal = 'Requis'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const items = PRODUCTS
        .filter(p => quantities[p.id] > 0)
        .map(p => ({
          product: p.name,
          qty: quantities[p.id],
          colors: selectedColors[p.id].length
            ? p.colors.filter(c => selectedColors[p.id].includes(c.id)).map(c => c.name).join(', ')
            : 'Assortis',
        }))

      const colorNote = items.map(i => `${i.product} x${i.qty} (${i.colors})`).join(' | ')
      const supabase = createClient()
      const { error } = await supabase.from('wholesale_requests').insert([{
        company_name:     form.company_name.trim(),
        contact_name:     form.contact_name.trim(),
        phone:            form.phone.trim(),
        email:            form.email.trim() || null,
        city:             form.city,
        address:          form.address.trim(),
        matricule_fiscal: form.matricule_fiscal.trim().toUpperCase(),
        estimated_qty:    totalQty,
        products_wanted:  colorNote,
        notes:            form.notes.trim() || null,
      }])
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setErrors({ _global: 'Erreur réseau — veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  const qtyBarPct = Math.min(100, (totalQty / MIN_TOTAL) * 100)

  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.heroChip}>🏪 Vente en Gros</span>
            <h1 className={styles.heroTitle}>Revendez HK Games<br/>dans votre boutique</h1>
            <p className={styles.heroSub}>
              Commandez dès <strong>19 pièces</strong>. Mélangez librement
              Unicolore, Bicolore et Buddy. Prix dégressifs, livraison nationale.
            </p>
            <a href="#commande" className={styles.heroCta}>
              Commander en gros <ChevronRight size={18}/>
            </a>
          </div>
        </section>

        {/* Avantages */}
        <section className={styles.avantages}>
          <div className={styles.container}>
            <div className={styles.avantagesGrid}>
              {AVANTAGES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className={styles.avantageCard}>
                  <div className={styles.avantageIcon}><Icon size={22}/></div>
                  <h3 className={styles.avantageTitle}>{title}</h3>
                  <p className={styles.avantageDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Paliers */}
        {tiers.length > 0 && (
          <section className={styles.tiers}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>Grille tarifaire</h2>
              <p className={styles.sectionSub}>Prix HT / unité — TVA 19% + DC 1% applicables</p>
              <div className={styles.tiersGrid}>
                {tiers.map((t, i) => (
                  <div key={t.id} className={`${styles.tierCard} ${i === 1 ? styles.tierCardPop : ''}`}>
                    {i === 1 && <span className={styles.tierBadge}>⭐ Populaire</span>}
                    <div className={styles.tierLabel}>{t.label}</div>
                    <div className={styles.tierQty}>{t.min_qty}{t.max_qty ? `–${t.max_qty}` : '+'} pièces</div>
                    <div className={styles.tierPrice}>{Number(t.price_ht).toFixed(3)}<span className={styles.tierUnit}> DT/u HT</span></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Commande */}
        <section className={styles.orderSection} id="commande">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Passer une commande en gros</h2>
            <p className={styles.sectionSub}>Minimum {MIN_TOTAL} pièces — mélange libre entre les 3 gammes</p>

            {success ? (
              <div className={styles.successBox}>
                <CheckCircle size={48} color="var(--color-success)"/>
                <h3>Commande reçue !</h3>
                <p>Notre équipe vous contacte dans les 24h pour confirmer et établir la facture.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {errors._global && <div className={styles.globalError}>{errors._global}</div>}

                {/* Produits */}
                <div className={styles.productsGrid}>
                  {PRODUCTS.map(p => (
                    <div key={p.id}
                      className={`${styles.productCard} ${quantities[p.id] > 0 ? styles.productCardActive : ''}`}>

                      {/* Badge */}
                      <div className={styles.productBadge}
                        style={{ background: p.badgeColor+'22', color: p.badgeColor, borderColor: p.badgeColor+'55' }}>
                        {p.badge}
                      </div>

                      {/* Info button */}
                      <button type="button" className={styles.infoBtn}
                        onClick={() => setModalProduct(p)}
                        title="Plus d'informations">
                        <Info size={15}/>
                      </button>

                      {/* Image */}
                      <div className={styles.productImageWrap}>
                        {lineImages[p.id]
                          ? <Image src={lineImages[p.id]} alt={p.name} fill sizes="300px" style={{objectFit:'cover'}} priority/>
                          : <span className={styles.productEmojiPlaceholder}>{p.emoji}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className={styles.productInfo}>
                        <div className={styles.productName}>{p.name}</div>
                        <div className={styles.productDesc}>{p.desc}</div>
                      </div>

                      {/* Color picker */}
                      <ColorPicker
                        product={p}
                        selectedColors={selectedColors[p.id]}
                        onChange={cols => setSelectedColors(s => ({ ...s, [p.id]: cols }))}
                      />

                      {/* Qty */}
                      <div className={styles.qtyControl}>
                        <button type="button" className={styles.qtyBtn} onClick={() => incQty(p.id, -1)}><Minus size={14}/></button>
                        <input className={styles.qtyInput} type="number" min="0"
                          value={quantities[p.id]} onChange={e => setQty(p.id, e.target.value)}/>
                        <button type="button" className={styles.qtyBtn} onClick={() => incQty(p.id, 1)}><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress — tier aware */}
                <TierProgress totalQty={totalQty} tiers={tiers} errors={errors} />

                {/* Form fiscal */}
                <div className={styles.formCard}>
                  <h3 className={styles.formGroupTitle}><Building2 size={17}/> Informations entreprise & fiscales</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Raison sociale *</label>
                      <input className={`${styles.input} ${errors.company_name?styles.inputError:''}`}
                        value={form.company_name} onChange={e=>set('company_name',e.target.value)} maxLength={100} placeholder="Nom boutique / entreprise"/>
                      {errors.company_name && <span className={styles.error}>{errors.company_name}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Matricule fiscal *</label>
                      <input className={`${styles.input} ${errors.matricule_fiscal?styles.inputError:''}`}
                        value={form.matricule_fiscal} onChange={e=>set('matricule_fiscal',e.target.value)} maxLength={30} placeholder="1234567A/P/M/000"/>
                      {errors.matricule_fiscal && <span className={styles.error}>{errors.matricule_fiscal}</span>}
                    </div>
                  </div>
                  <h3 className={styles.formGroupTitle} style={{marginTop:'var(--space-5)'}}><Phone size={17}/> Contact</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Responsable *</label>
                      <input className={`${styles.input} ${errors.contact_name?styles.inputError:''}`}
                        value={form.contact_name} onChange={e=>set('contact_name',e.target.value)} maxLength={80} placeholder="Prénom Nom"/>
                      {errors.contact_name && <span className={styles.error}>{errors.contact_name}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Téléphone *</label>
                      <input className={`${styles.input} ${errors.phone?styles.inputError:''}`}
                        value={form.phone} onChange={e=>set('phone',e.target.value)} maxLength={15} placeholder="25123456"/>
                      {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email <span className={styles.optional}>(optionnel)</span></label>
                    <input className={styles.input} type="email"
                      value={form.email} onChange={e=>set('email',e.target.value)} maxLength={120} placeholder="contact@boutique.tn"/>
                  </div>
                  <h3 className={styles.formGroupTitle} style={{marginTop:'var(--space-5)'}}><MapPin size={17}/> Adresse de livraison</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Gouvernorat *</label>
                      <select className={`${styles.input} ${errors.city?styles.inputError:''}`}
                        value={form.city} onChange={e=>set('city',e.target.value)}>
                        <option value="">— Sélectionner —</option>
                        {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <span className={styles.error}>{errors.city}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Adresse *</label>
                      <input className={`${styles.input} ${errors.address?styles.inputError:''}`}
                        value={form.address} onChange={e=>set('address',e.target.value)} maxLength={200} placeholder="Rue, numéro, ville"/>
                      {errors.address && <span className={styles.error}>{errors.address}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Notes <span className={styles.optional}>(optionnel)</span></label>
                    <textarea className={`${styles.input} ${styles.textarea}`}
                      value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} maxLength={500}
                      placeholder="Couleurs supplémentaires, délai souhaité, instructions…"/>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading || !qtyReached}>
                  {loading ? 'Envoi…' : `Envoyer ma commande (${totalQty} pièces) →`}
                </button>
                <p className={styles.submitNote}>Notre équipe vous contacte sous 24h pour confirmer et établir la facture.</p>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer/>

      {/* Floating product modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          lineImages={lineImages}
          onClose={() => setModalProduct(null)}
        />
      )}
    </>
  )
}
