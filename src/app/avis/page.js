'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewForm from '@/components/ui/ReviewForm'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'
import Image from 'next/image'
import styles from './avis.module.css'

export default function AvisPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('testimonials')
      .select('id, customer_name, customer_city, rating, review_text, photo_url, created_at')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoading(false) })
  }, [])

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Avis de nos clients</h1>
            <p className={styles.subtitle}>{reviews.length} avis vérifiés · Partagez votre expérience</p>
            <button className={styles.writeBtn} onClick={() => setShowForm((v) => !v)} type="button">
              {showForm ? '✕ Fermer' : '✍️ Écrire un avis'}
            </button>
          </div>

          {showForm && (
            <div className={styles.formWrap}>
              <ReviewForm onSuccess={() => setShowForm(false)} />
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '64px' }}>Chargement...</p>
          ) : (
            <div className={styles.grid}>
              {reviews.map((r) => (
                <div key={r.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.name}>{r.customer_name}</p>
                      {r.customer_city && <p className={styles.city}>{r.customer_city}</p>}
                    </div>
                    <div className={styles.stars}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} style={{ color: i < r.rating ? 'var(--color-cta)' : 'var(--text-muted)', fill: i < r.rating ? 'var(--color-cta)' : 'none' }} />
                      ))}
                    </div>
                  </div>
                  <p className={styles.text}>{r.review_text}</p>
                  {r.photo_url && (
                    <Image src={r.photo_url} alt={`Avis de ${r.customer_name}`} width={200} height={200} className={styles.photo} />
                  )}
                  <p className={styles.date}>
                    {new Date(r.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
