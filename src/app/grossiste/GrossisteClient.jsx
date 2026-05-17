'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { Building2, Phone, MapPin, FileText, Package, CheckCircle, ChevronRight, Truck, ShieldCheck, TrendingUp } from 'lucide-react'
import styles from './grossiste.module.css'

const CITIES = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine',
  'Tataouine','Gafsa','Tozeur','Kébili',
]

const AVANTAGES = [
  { icon: TrendingUp, title: 'Marges attractives', desc: 'Prix dégressifs dès 10 unités — plus vous commandez, plus vous gagnez.' },
  { icon: Truck,      title: 'Livraison Navex',    desc: 'Livraison rapide partout en Tunisie via notre partenaire Navex.' },
  { icon: ShieldCheck,title: 'Produit certifié',   desc: 'Slime sans danger, certifié pour enfants dès 3 ans. Ingrédients conformes.' },
  { icon: Package,    title: 'Stock disponible',   desc: 'Stocks gérés en temps réel. Jamais de rupture sans préavis.' },
]

export default function GrossisteClient({ tiers }) {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', phone: '', email: '',
    city: '', address: '', matricule_fiscal: '',
    estimated_qty: '', products_wanted: '', notes: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
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
      const payload = {
        company_name:     form.company_name.trim(),
        contact_name:     form.contact_name.trim(),
        phone:            form.phone.trim(),
        email:            form.email.trim() || null,
        city:             form.city,
        address:          form.address.trim(),
        matricule_fiscal: form.matricule_fiscal.trim().toUpperCase(),
        estimated_qty:    form.estimated_qty ? parseInt(form.estimated_qty, 10) : null,
        products_wanted:  form.products_wanted.trim() || null,
        notes:            form.notes.trim() || null,
      }
      const { error } = await supabase.from('wholesale_requests').insert([payload])
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      console.error('wholesale submit error', err)
      setErrors({ _global: 'Erreur réseau — veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

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
              Devenez partenaire revendeur de slime en Tunisie. Prix de gros dégressifs,
              livraison nationale, produit certifié pour enfants.
            </p>
            <a href="#formulaire" className={styles.heroCta}>
              Demander les tarifs <ChevronRight size={18} />
            </a>
          </div>
        </section>

        {/* Avantages */}
        <section className={styles.avantages}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Pourquoi revendre HK Games ?</h2>
            <div className={styles.avantagesGrid}>
              {AVANTAGES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className={styles.avantageCard}>
                  <div className={styles.avantageIcon}><Icon size={24} /></div>
                  <h3 className={styles.avantageTitle}>{title}</h3>
                  <p className={styles.avantageDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Paliers de prix */}
        {tiers.length > 0 && (
          <section className={styles.tiers}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>Grille tarifaire grossiste</h2>
              <p className={styles.sectionSub}>Prix HT par unité — TVA 19% applicable</p>
              <div className={styles.tiersGrid}>
                {tiers.map((t, i) => (
                  <div key={t.id} className={`${styles.tierCard} ${i === tiers.length - 2 ? styles.tierCardPop : ''}`}>
                    <div className={styles.tierLabel}>{t.label}</div>
                    <div className={styles.tierQty}>
                      {t.min_qty}{t.max_qty ? `–${t.max_qty}` : '+'} unités
                    </div>
                    <div className={styles.tierPrice}>
                      {Number(t.price_ht).toFixed(3)}
                      <span className={styles.tierUnit}> DT/u HT</span>
                    </div>
                    {i === tiers.length - 2 && (
                      <span className={styles.tierBadge}>⭐ Populaire</span>
                    )}
                  </div>
                ))}
              </div>
              <p className={styles.tiersNote}>
                * Prix indicatifs — des tarifs personnalisés sont disponibles pour les grandes quantités.
              </p>
            </div>
          </section>
        )}

        {/* Formulaire */}
        <section className={styles.formSection} id="formulaire">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Demande de partenariat grossiste</h2>
            <p className={styles.sectionSub}>Remplissez ce formulaire — notre équipe vous contacte sous 24h</p>

            {success ? (
              <div className={styles.successBox}>
                <CheckCircle size={48} color="var(--color-success)" />
                <h3>Demande envoyée avec succès !</h3>
                <p>Notre équipe vous contactera dans les 24 heures ouvrables pour confirmer votre partenariat.</p>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {errors._global && <div className={styles.globalError}>{errors._global}</div>}

                <div className={styles.formSection2}>
                  <h3 className={styles.formGroupTitle}><Building2 size={18} /> Informations entreprise</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Raison sociale *</label>
                      <input className={`${styles.input} ${errors.company_name ? styles.inputError : ''}`}
                        value={form.company_name} onChange={e => set('company_name', e.target.value)}
                        placeholder="Nom de votre entreprise / boutique" maxLength={100} />
                      {errors.company_name && <span className={styles.error}>{errors.company_name}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Matricule fiscal *</label>
                      <input className={`${styles.input} ${errors.matricule_fiscal ? styles.inputError : ''}`}
                        value={form.matricule_fiscal} onChange={e => set('matricule_fiscal', e.target.value)}
                        placeholder="Ex: 1234567A/P/M/000" maxLength={30} />
                      {errors.matricule_fiscal && <span className={styles.error}>{errors.matricule_fiscal}</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.formSection2}>
                  <h3 className={styles.formGroupTitle}><Phone size={18} /> Contact</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Nom du responsable *</label>
                      <input className={`${styles.input} ${errors.contact_name ? styles.inputError : ''}`}
                        value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                        placeholder="Prénom et Nom" maxLength={80} />
                      {errors.contact_name && <span className={styles.error}>{errors.contact_name}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Téléphone *</label>
                      <input className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                        value={form.phone} onChange={e => set('phone', e.target.value)}
                        placeholder="Ex: 25123456" maxLength={15} />
                      {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email <span className={styles.optional}>(optionnel)</span></label>
                    <input className={styles.input} type="email"
                      value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="contact@monentreprise.tn" maxLength={120} />
                  </div>
                </div>

                <div className={styles.formSection2}>
                  <h3 className={styles.formGroupTitle}><MapPin size={18} /> Adresse</h3>
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
                      <label className={styles.label}>Adresse complète *</label>
                      <input className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                        value={form.address} onChange={e => set('address', e.target.value)}
                        placeholder="Rue, numéro, ville" maxLength={200} />
                      {errors.address && <span className={styles.error}>{errors.address}</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.formSection2}>
                  <h3 className={styles.formGroupTitle}><Package size={18} /> Votre besoin</h3>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Quantité estimée / mois</label>
                      <input className={styles.input} type="number" min="10" max="9999"
                        value={form.estimated_qty} onChange={e => set('estimated_qty', e.target.value)}
                        placeholder="Ex: 50" />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Produits souhaités</label>
                      <input className={styles.input}
                        value={form.products_wanted} onChange={e => set('products_wanted', e.target.value)}
                        placeholder="Ex: Unicolore, Bicolore, Buddies…" maxLength={200} />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Notes <span className={styles.optional}>(optionnel)</span></label>
                    <textarea className={`${styles.input} ${styles.textarea}`}
                      value={form.notes} onChange={e => set('notes', e.target.value)}
                      placeholder="Questions, besoins spéciaux, délais…" maxLength={500} rows={3} />
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Envoi en cours…' : 'Envoyer ma demande de partenariat →'}
                </button>
              </form>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
