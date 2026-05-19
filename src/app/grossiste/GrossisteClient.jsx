'use client'
import { useState } from 'react'
import Image from 'next/image'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { Building2, Phone, MapPin, Package, CheckCircle, ChevronRight, Truck, ShieldCheck, TrendingUp, Minus, Plus } from 'lucide-react'
import styles from './grossiste.module.css'

const CITIES = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine',
  'Tataouine','Gafsa','Tozeur','Kébili',
]

const AVANTAGES = [
  { icon: TrendingUp,  title: 'Marges attractives', desc: 'Prix dégressifs dès 60 unités — plus vous commandez, plus vous gagnez.' },
  { icon: Truck,       title: 'Livraison Navex',    desc: 'Livraison rapide partout en Tunisie via notre partenaire Navex.' },
  { icon: ShieldCheck, title: 'Produit certifié',   desc: 'Slime 170g sans danger, certifié pour enfants dès 3 ans.' },
  { icon: Package,     title: 'Stock disponible',   desc: 'Stocks gérés en temps réel. Jamais de rupture sans préavis.' },
]

const PRODUCTS = [
  {
    id: 'unicolore',
    name: 'Slime Unicolore',
    desc: '170g — Texture lisse, couleur unie. Le classique.',
    emoji: '🟣',
    colors: ['Violet', 'Rose', 'Bleu', 'Vert', 'Rouge', 'Jaune'],
  },
  {
    id: 'bicolore',
    name: 'Slime Bicolore',
    desc: '170g — Deux couleurs mélangées, effet marbré unique.',
    emoji: '🌈',
    colors: ['Violet/Rose', 'Bleu/Vert', 'Orange/Jaune', 'Rose/Blanc'],
  },
  {
    id: 'buddies',
    name: 'Slime Buddy',
    desc: '170g — Avec personnage inclus. Idéal cadeau enfant.',
    emoji: '🧸',
    colors: ['Modèle aléatoire (assortis)'],
  },
]

const MIN_TOTAL = 60

function getPricePerUnit(total, tiers) {
  if (!tiers || !tiers.length) return null
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty)
  for (const t of sorted) {
    if (total >= t.min_qty) return { price: Number(t.price_ht), label: t.label }
  }
  return null
}

export default function GrossisteClient({ tiers, lineImages = {} }) {
  const [quantities, setQuantities] = useState({ unicolore: 0, bicolore: 0, buddies: 0 })
  const [form, setForm] = useState({
    company_name: '', contact_name: '', phone: '', email: '',
    city: '', address: '', matricule_fiscal: '', notes: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const totalQty = quantities.unicolore + quantities.bicolore + quantities.buddies
  const tierInfo = getPricePerUnit(totalQty, tiers)
  const totalHT  = tierInfo ? totalQty * tierInfo.price : null

  function setQty(id, val) {
    const n = Math.max(0, parseInt(val, 10) || 0)
    setQuantities(q => ({ ...q, [id]: n }))
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
    if (totalQty < MIN_TOTAL) e._qty = `Quantité minimale : ${MIN_TOTAL} pièces. Il vous manque ${MIN_TOTAL - totalQty} pièce(s).`
    if (!form.company_name.trim())     e.company_name     = 'Requis'
    if (!form.contact_name.trim())     e.contact_name     = 'Requis'
    if (!/^((\+216|00216|0)(2[0-9]|[3-9][0-9])[0-9]{6})$/.test(form.phone.trim()))
                                       e.phone            = 'Numéro tunisien invalide'
    if (!form.city)                    e.city             = 'Requis'
    if (!form.address.trim())          e.address          = 'Requis'
    if (!form.matricule_fiscal.trim()) e.matricule_fiscal = 'Requis'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const items = PRODUCTS
        .filter(p => quantities[p.id] > 0)
        .map(p => ({ product: p.name, qty: quantities[p.id], unit: '170g' }))

      const { error } = await supabase.from('wholesale_requests').insert([{
        company_name:     form.company_name.trim(),
        contact_name:     form.contact_name.trim(),
        phone:            form.phone.trim(),
        email:            form.email.trim() || null,
        city:             form.city,
        address:          form.address.trim(),
        matricule_fiscal: form.matricule_fiscal.trim().toUpperCase(),
        estimated_qty:    totalQty,
        products_wanted:  items.map(i => `${i.product} x${i.qty}`).join(', '),
        notes:            form.notes.trim() || null,
      }])
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      console.error('wholesale submit', err)
      setErrors({ _global: 'Erreur réseau — veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  const qtyBarPct = Math.min(100, (totalQty / MIN_TOTAL) * 100)
  const qtyReached = totalQty >= MIN_TOTAL

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
              Commandez notre slime en gros dès 60 pièces. Mélangez librement
              Unicolore, Bicolore et Buddy. Prix dégressifs, livraison nationale.
            </p>
            <a href="#commande" className={styles.heroCta}>
              Commander en gros <ChevronRight size={18} />
            </a>
          </div>
        </section>

        {/* Avantages */}
        <section className={styles.avantages}>
          <div className={styles.container}>
            <div className={styles.avantagesGrid}>
              {AVANTAGES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className={styles.avantageCard}>
                  <div className={styles.avantageIcon}><Icon size={22} /></div>
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

        {/* Sélection produits + formulaire */}
        <section className={styles.orderSection} id="commande">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Passer une commande en gros</h2>
            <p className={styles.sectionSub}>Minimum 60 pièces — mélange libre entre les 3 gammes</p>

            {success ? (
              <div className={styles.successBox}>
                <CheckCircle size={48} color="var(--color-success)" />
                <h3>Commande reçue !</h3>
                <p>Notre équipe vous contacte dans les 24h pour confirmer et établir la facture.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {errors._global && <div className={styles.globalError}>{errors._global}</div>}

                {/* Produits */}
                <div className={styles.productsGrid}>
                  {PRODUCTS.map(p => (
                    <div key={p.id} className={`${styles.productCard} ${quantities[p.id] > 0 ? styles.productCardActive : ''}`}>
                      <div className={styles.productImageWrap}>
                        {lineImages[p.id]
                          ? <Image src={lineImages[p.id]} alt={p.name} fill sizes="300px" style={{objectFit:'cover'}} priority={true}/>
                          : <span className={styles.productEmojiPlaceholder}>{p.emoji}</span>
                        }
                      </div>
                      <div className={styles.productInfo}>
                        <div className={styles.productName}>{p.name}</div>
                        <div className={styles.productDesc}>{p.desc}</div>
                        <div className={styles.productColors}>
                          {p.colors.map(c => <span key={c} className={styles.colorChip}>{c}</span>)}
                        </div>
                      </div>
                      <div className={styles.qtyControl}>
                        <button type="button" className={styles.qtyBtn} onClick={() => incQty(p.id, -1)}><Minus size={14} /></button>
                        <input
                          className={styles.qtyInput}
                          type="number" min="0"
                          value={quantities[p.id]}
                          onChange={e => setQty(p.id, e.target.value)}
                        />
                        <button type="button" className={styles.qtyBtn} onClick={() => incQty(p.id, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barre progression */}
                <div className={styles.progressBox}>
                  <div className={styles.progressTop}>
                    <span className={qtyReached ? styles.progressLabelOk : styles.progressLabel}>
                      {qtyReached
                        ? `✅ ${totalQty} pièces sélectionnées`
                        : `${totalQty} / ${MIN_TOTAL} pièces minimum`}
                    </span>
                    {tierInfo && (
                      <span className={styles.pricePreview}>
                        Palier <strong>{tierInfo.label}</strong> —&nbsp;
                        <strong>{(totalHT).toFixed(3)} DT HT</strong>
                        <span className={styles.priceHint}> ({(totalHT * 1.20).toFixed(3)} DT TTC)</span>
                      </span>
                    )}
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${qtyBarPct}%`, background: qtyReached ? 'var(--color-success)' : 'var(--color-primary)' }} />
                  </div>
                  {errors._qty && <div className={styles.error}>{errors._qty}</div>}
                </div>

                {/* Infos fiscales */}
                <div className={styles.formCard}>
                  <h3 className={styles.formGroupTitle}><Building2 size={17} /> Informations entreprise & fiscales</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Raison sociale *</label>
                      <input className={`${styles.input} ${errors.company_name ? styles.inputError : ''}`}
                        value={form.company_name} onChange={e => set('company_name', e.target.value)} maxLength={100} placeholder="Nom boutique / entreprise" />
                      {errors.company_name && <span className={styles.error}>{errors.company_name}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Matricule fiscal *</label>
                      <input className={`${styles.input} ${errors.matricule_fiscal ? styles.inputError : ''}`}
                        value={form.matricule_fiscal} onChange={e => set('matricule_fiscal', e.target.value)} maxLength={30} placeholder="1234567A/P/M/000" />
                      {errors.matricule_fiscal && <span className={styles.error}>{errors.matricule_fiscal}</span>}
                    </div>
                  </div>

                  <h3 className={styles.formGroupTitle} style={{marginTop:'var(--space-5)'}}><Phone size={17} /> Contact</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Responsable *</label>
                      <input className={`${styles.input} ${errors.contact_name ? styles.inputError : ''}`}
                        value={form.contact_name} onChange={e => set('contact_name', e.target.value)} maxLength={80} placeholder="Prénom Nom" />
                      {errors.contact_name && <span className={styles.error}>{errors.contact_name}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Téléphone *</label>
                      <input className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                        value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={15} placeholder="25123456" />
                      {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email <span className={styles.optional}>(optionnel)</span></label>
                    <input className={styles.input} type="email"
                      value={form.email} onChange={e => set('email', e.target.value)} maxLength={120} placeholder="contact@boutique.tn" />
                  </div>

                  <h3 className={styles.formGroupTitle} style={{marginTop:'var(--space-5)'}}><MapPin size={17} /> Adresse de livraison</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Gouvernorat *</label>
                      <select className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                        value={form.city} onChange={e => set('city', e.target.value)}>
                        <option value="">— Sélectionner —</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <span className={styles.error}>{errors.city}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Adresse *</label>
                      <input className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                        value={form.address} onChange={e => set('address', e.target.value)} maxLength={200} placeholder="Rue, numéro, ville" />
                      {errors.address && <span className={styles.error}>{errors.address}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Notes <span className={styles.optional}>(optionnel)</span></label>
                    <textarea className={`${styles.input} ${styles.textarea}`}
                      value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} maxLength={500} placeholder="Couleurs préférées, délai souhaité…" />
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
      <Footer />
    </>
  )
}
