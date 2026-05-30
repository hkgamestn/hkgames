'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Play, ArrowRight } from 'lucide-react'
import styles from './VideoShowcase.module.css'

export default function VideoShowcase() {
  const [videos, setVideos] = useState([])
  const [active, setActive] = useState(0)
  const trackRef = useRef(null)
  const router   = useRouter()

  useEffect(() => {
    createClient()
      .from('videos')
      .select('id, title, description, thumbnail_url, views')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => setVideos(data || []))
  }, [])

  // Scroll spy — update active on scroll
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    function onScroll() {
      const itemW = el.firstChild?.offsetWidth || 280
      const idx = Math.round(el.scrollLeft / (itemW + 16))
      setActive(Math.max(0, Math.min(idx, videos.length - 1)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [videos])

  function goToVideo(idx) {
    router.push(`/videos?v=${idx}`)
  }

  if (!videos.length) return null

  return (
    <section className={styles.section}>
      {/* Glow bg */}
      <div className={styles.glow}/>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🎬 Nos Vidéos Slime</h2>
          <p className={styles.sub}>ASMR, unboxing et moments satisfaisants</p>
        </div>
        <a href="/videos" className={styles.seeAll}>
          Tout voir <ArrowRight size={16}/>
        </a>
      </div>

      {/* Stacked scroll track */}
      <div className={styles.trackWrap}>
        <div className={styles.track} ref={trackRef}>
          {videos.map((v, i) => {
            const offset   = i - active
            const absOff   = Math.abs(offset)
            const isActive = i === active
            return (
              <div key={v.id}
                className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                style={{
                  '--off':   offset,
                  '--abs':   absOff,
                  zIndex:    videos.length - absOff,
                }}
                onClick={() => goToVideo(i)}>

                {/* Thumbnail */}
                <div className={styles.thumb}>
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} alt={v.title} className={styles.thumbImg}/>
                    : <div className={styles.thumbPlaceholder}>🎬</div>
                  }
                  {/* Dark overlay */}
                  <div className={styles.thumbOverlay}/>

                  {/* Play button */}
                  <div className={`${styles.playBtn} ${isActive ? styles.playBtnActive : ''}`}>
                    <Play size={isActive ? 28 : 20} fill="white"/>
                  </div>

                  {/* Title on card */}
                  <div className={styles.cardInfo}>
                    <div className={styles.cardTitle}>{v.title}</div>
                    {v.views > 0 && <div className={styles.cardViews}>👁 {v.views}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dots */}
        <div className={styles.dots}>
          {videos.map((_, i) => (
            <button key={i}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              onClick={() => {
                const el  = trackRef.current
                const itemW = el?.firstChild?.offsetWidth || 280
                el?.scrollTo({ left: i * (itemW + 16), behavior: 'smooth' })
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.cta}>
        <a href="/videos" className={styles.ctaBtn}>
          <Play size={18} fill="currentColor"/> Voir toutes les vidéos
        </a>
      </div>
    </section>
  )
}
