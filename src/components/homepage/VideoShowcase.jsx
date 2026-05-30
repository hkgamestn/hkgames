'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Play, ArrowRight, Volume2 } from 'lucide-react'
import styles from './VideoShowcase.module.css'

export default function VideoShowcase() {
  const [videos,    setVideos]    = useState([])
  const [active,    setActive]    = useState(0)
  const [dragging,  setDragging]  = useState(false)
  const [startX,    setStartX]    = useState(0)
  const [dragDelta, setDragDelta] = useState(0)
  const router = useRouter()

  useEffect(() => {
    createClient()
      .from('videos')
      .select('id, title, description, thumbnail_url, views')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .limit(7)
      .then(({ data }) => setVideos(data || []))
  }, [])

  function prev() { setActive(a => Math.max(0, a - 1)) }
  function next() { setActive(a => Math.min(videos.length - 1, a + 1)) }

  // Drag/swipe
  function onPointerDown(e) {
    setDragging(true)
    setStartX(e.clientX ?? e.touches?.[0]?.clientX ?? 0)
    setDragDelta(0)
  }
  function onPointerMove(e) {
    if (!dragging) return
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? startX
    setDragDelta(x - startX)
  }
  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    if (dragDelta < -60) next()
    else if (dragDelta > 60) prev()
    setDragDelta(0)
  }

  if (!videos.length) return null

  // How many cards to show
  const VISIBLE = Math.min(5, videos.length)

  return (
    <section className={styles.section}>
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

      {/* Stack scene */}
      <div className={styles.scene}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {videos.slice(0, VISIBLE).map((v, i) => {
          // position relative to active
          const offset = i - active
          const absOff = Math.abs(offset)
          const isActive = offset === 0
          const isVisible = absOff < 4

          if (!isVisible) return null

          // Stacking transform
          const translateX = offset * 54 + (dragging ? dragDelta * 0.3 : 0)
          const translateY = absOff * 8
          const scale      = 1 - absOff * 0.08
          const rotate     = offset * 4
          const zIndex     = VISIBLE - absOff
          const opacity    = 1 - absOff * 0.18

          return (
            <div key={v.id}
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                zIndex,
                opacity,
                transition: dragging ? 'none' : 'transform .4s cubic-bezier(.34,1.2,.64,1), opacity .3s',
                cursor: isActive ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (isActive) router.push(`/videos?v=${active}`)
                else if (offset < 0) prev()
                else next()
              }}
            >
              <div className={styles.cardInner}>
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt={v.title} className={styles.thumb}/>
                  : <div className={styles.thumbPlaceholder}>🎬</div>
                }
                <div className={styles.cardOverlay}/>

                {isActive && (
                  <>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardTitle}>{v.title}</div>
                      {v.description && <div className={styles.cardDesc}>{v.description}</div>}
                      {v.views > 0 && <div className={styles.cardViews}>👁 {v.views} vues</div>}
                    </div>
                    <div className={styles.playRing}>
                      <Play size={28} fill="white" strokeWidth={0}/>
                    </div>
                  </>
                )}
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
            onClick={() => setActive(i)}
          />
        ))}
      </div>

      {/* Nav arrows */}
      <div className={styles.navRow}>
        <button className={styles.navBtn} onClick={prev} disabled={active === 0}>←</button>
        <span className={styles.navCount}>{active + 1} / {videos.length}</span>
        <button className={styles.navBtn} onClick={next} disabled={active === videos.length - 1}>→</button>
      </div>

      <div className={styles.cta}>
        <a href="/videos" className={styles.ctaBtn}>
          <Volume2 size={16}/> Voir toutes les vidéos avec son
        </a>
      </div>
    </section>
  )
}
