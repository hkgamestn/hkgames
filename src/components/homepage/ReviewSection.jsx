'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ReviewForm from '@/components/ui/ReviewForm'
import styles from './ReviewSection.module.css'

export default function ReviewSection() {
  const [reviews, setReviews] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('testimonials')
      .select('id, customer_name, customer_city, rating, review_text')
      .eq('is_approved', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setReviews(data || []))
  }, [])

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tag}>Avis clients</span>
          <h2 className={styles.title}>Ce que disent nos <span className={styles.highlight}>Slimeurs</span></h2>
          <p className={styles.subtitle}>Des centaines de familles tunisiennes font confiance à HK Games.</p>
        </div>

        {reviews.length > 0 && (
          <div className={styles.grid}>
            {reviews.map((r) => (
              <div key={r.id} className={styles.card}>
                <div className={styles.stars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={16} style={{ color: i < r.rating ? 'var(--color-cta)' : 'var(--text-muted)', fill: i < r.rating ? 'var(--color-cta)' : 'none' }} />
                  ))}
                </div>
                <p className={styles.text}>{r.review_text}</p>
                <div className={styles.author}>
                  <span className={styles.name}>{r.customer_name}</span>
                  {r.customer_city && <span className={styles.city}>· {r.customer_city}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.cta}>
          {!showForm ? (
            <button className={styles.writeBtn} onClick={() => setShowForm(true)} type="button">
              ✍️ Écrire un avis
            </button>
          ) : (
            <ReviewForm onSuccess={() => { setShowForm(false) }} />
          )}
        </div>
      </div>
    </section>
  )
}
