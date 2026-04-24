'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Star } from 'lucide-react'
import styles from './avis.module.css'

export default function AvisPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('pending')

  useEffect(() => {
    const supabase = createClient()
    setLoading(true)

    function fetchReviews() {
      const q = supabase
        .from('testimonials')
        .select('id, customer_name, customer_city, rating, review_text, photo_url, is_approved, is_featured, created_at')
        .order('created_at', { ascending: false })

      if (tab === 'pending')  q.eq('is_approved', false)
      if (tab === 'approved') q.eq('is_approved', true)

      q.then(({ data }) => { setReviews(data || []); setLoading(false) })
    }

    fetchReviews()

    const channel = supabase
      .channel('admin-avis-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, fetchReviews)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tab])

  async function handleToggle(id, field, value) {
    const supabase = createClient()
    await supabase.from('testimonials').update({ [field]: value }).eq('id', id)
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Avis & UGC</h1>

      <div className={styles.tabs}>
        {['pending', 'approved'].map((t) => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)} type="button">
            {t === 'pending' ? 'En attente' : 'Approuvés'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.loading}>Chargement...</p>
      ) : reviews.length === 0 ? (
        <p className={styles.empty}>Aucun avis.</p>
      ) : (
        <div className={styles.grid}>
          {reviews.map((r) => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.name}>{r.customer_name}</p>
                  <p className={styles.city}>{r.customer_city}</p>
                </div>
                <div className={styles.stars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} style={{ color: i < r.rating ? 'var(--color-cta)' : 'var(--text-muted)', fill: i < r.rating ? 'var(--color-cta)' : 'none' }} />
                  ))}
                </div>
              </div>
              <p className={styles.text}>{r.review_text}</p>
              <div className={styles.actions}>
                {!r.is_approved && (
                  <button className={styles.approveBtn} onClick={() => handleToggle(r.id, 'is_approved', true)} type="button">
                    <CheckCircle size={14} /> Approuver
                  </button>
                )}
                {r.is_approved && (
                  <button
                    className={`${styles.featuredBtn} ${r.is_featured ? styles.featuredActive : ''}`}
                    onClick={() => handleToggle(r.id, 'is_featured', !r.is_featured)}
                    type="button"
                  >
                    <Star size={14} /> {r.is_featured ? 'Mis en avant' : 'Mettre en avant'}
                  </button>
                )}
                <button className={styles.rejectBtn} onClick={() => handleToggle(r.id, 'is_approved', false)} type="button">
                  <XCircle size={14} /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
