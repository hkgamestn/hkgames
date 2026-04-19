'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './ReviewForm.module.css'

export default function ReviewForm({ onSuccess }) {
  const [rating, setRating]       = useState(0)
  const [hover, setHover]         = useState(0)
  const [name, setName]           = useState('')
  const [city, setCity]           = useState('')
  const [text, setText]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Choisissez une note.'); return }
    if (!name.trim()) { setError('Entrez votre prénom.'); return }
    if (text.trim().length < 10) { setError('Votre avis est trop court (min 10 caractères).'); return }

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('testimonials').insert({
      customer_name: name.trim(),
      customer_city: city.trim(),
      rating,
      review_text: text.trim(),
      is_approved: false,
    })

    if (err) { setError('Erreur — réessayez.'); setLoading(false); return }

    setSubmitted(true)
    setLoading(false)
    if (onSuccess) onSuccess()
  }

  if (submitted) {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>✅</span>
        <h3>Merci pour votre avis !</h3>
        <p>Il sera affiché après validation par notre équipe.</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.formTitle}>Laisser un avis</h3>

      <div className={styles.starsRow}>
        <p className={styles.starsLabel}>Votre note *</p>
        <div className={styles.stars}>
          {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.star} ${star <= (hover || rating) ? styles.starFilled : ''}`}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              <Star size={28} />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Prénom *</label>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Amira" maxLength={40} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Ville</label>
          <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tunis" maxLength={40} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Votre avis *</label>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Partagez votre expérience avec nos slimes..."
          rows={4}
          maxLength={500}
        />
        <span className={styles.charCount}>{text.length}/500</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Publier mon avis'}
      </button>
      <p className={styles.hint}>Votre avis sera affiché après modération.</p>
    </form>
  )
}
