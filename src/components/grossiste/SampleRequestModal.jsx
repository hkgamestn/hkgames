'use client'

import { useState, useRef } from 'react'
import { X, FlaskConical, Send, CheckCircle } from 'lucide-react'
import styles from './SampleRequestModal.module.css'

const GOUVERNORATS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili']
const BUSINESS_TYPES = ['Boutique jouets / papeterie','Boutique cadeaux / déco','Supermarché / épicerie','Revendeur en ligne','Grossiste distributeur','École / centre de loisirs','Autre']

export default function SampleRequestModal({ onClose }) {
  const [form, setForm]       = useState({ contact_name:'', phone:'', email:'', city:'', business_name:'', business_type:'', address:'', notes:'' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const overlayRef            = useRef(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

  function validate() {
    const e = {}
    if (!form.contact_name.trim()) e.contact_name  = 'Requis'
    if (!form.phone.trim())        e.phone          = 'Requis'
    if (!form.city)                e.city           = 'Requis'
    if (!form.business_name.trim())e.business_name  = 'Requis'
    if (!form.business_type)       e.business_type  = 'Requis'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await fetch('/api/grossiste', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name:    form.contact_name.trim(),
          phone:           form.phone.trim(),
          email:           form.email.trim() || null,
          city:            form.city,
          company_name:    form.business_name.trim(),
          address:         form.address.trim() || null,
          notes:           `Type activité: ${form.business_type}${form.notes ? ' | ' + form.notes.trim() : ''}`,
          request_type:    'sample',
          estimated_qty:   0,
          products_wanted: "Demande d'échantillon",
        }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Erreur serveur')
      setSuccess(true)
    } catch (err) {
      setErrors({ _global: err.message || 'Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} type="button"><X size={18}/></button>

        {success ? (
          <div className={styles.successState}>
            <CheckCircle size={52} className={styles.successIcon} />
            <h2 className={styles.successTitle}>Demande envoyée !</h2>
            <p className={styles.successText}>Notre équipe va préparer votre échantillon et vous contacter sous <strong>24–48h</strong>.</p>
            <button className={styles.closeSuccess} onClick={onClose} type="button">Fermer</button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}><FlaskConical size={22}/></div>
              <div>
                <h2 className={styles.title}>Demande d&apos;échantillon gratuit</h2>
                <p className={styles.subtitle}>Testez nos slimes avant de passer commande en gros</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Nom complet *</label>
                  <input className={`${styles.input} ${errors.contact_name ? styles.err : ''}`} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Prénom Nom" maxLength={80} />
                  {errors.contact_name && <span className={styles.errMsg}>{errors.contact_name}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Téléphone *</label>
                  <input className={`${styles.input} ${errors.phone ? styles.err : ''}`} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="2X XXX XXX" type="tel" />
                  {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Nom de la boutique / société *</label>
                  <input className={`${styles.input} ${errors.business_name ? styles.err : ''}`} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Ex: Jouets Ben Salem" maxLength={100} />
                  {errors.business_name && <span className={styles.errMsg}>{errors.business_name}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email (optionnel)</label>
                  <input className={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="votre@email.com" />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Gouvernorat *</label>
                  <select className={`${styles.select} ${errors.city ? styles.err : ''}`} value={form.city} onChange={e => set('city', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.city && <span className={styles.errMsg}>{errors.city}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Type d&apos;activité *</label>
                  <select className={`${styles.select} ${errors.business_type ? styles.err : ''}`} value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.business_type && <span className={styles.errMsg}>{errors.business_type}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Adresse</label>
                <input className={styles.input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rue, immeuble, ville..." maxLength={200} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Message (optionnel)</label>
                <textarea className={styles.textarea} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Précisez vos attentes, le type de produits qui vous intéresse..." maxLength={500} />
              </div>

              <div className={styles.infoBox}>
                <span>🎁</span>
                <p>L&apos;échantillon contient <strong>3 pots assortis</strong> (Unicolore, Bicolore, Buddy). Notre équipe vous contacte pour confirmer la livraison.</p>
              </div>

              {errors._global && <div className={styles.globalErr}>⚠️ {errors._global}</div>}

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                <Send size={16} />
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
