'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import styles from './BlogCarousel.module.css'

export default function BlogCarousel() {
  const [posts, setPosts] = useState([])
  const trackRef = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  useEffect(() => {
    createClient()
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image, tags, published_at, views')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setPosts(data || []))
  }, [])

  function scroll(dir) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  function updateArrows() {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  if (!posts.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>📝 Notre Blog Slime</h2>
          <p className={styles.sub}>Conseils, astuces et idées pour parents tunisiens</p>
        </div>
        <Link href="/blog" className={styles.seeAll}>
          Tous les articles <ArrowRight size={16}/>
        </Link>
      </div>

      <div className={styles.trackWrap}>
        {canLeft && (
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => scroll(-1)}>
            <ChevronLeft size={20}/>
          </button>
        )}
        <div className={styles.track} ref={trackRef} onScroll={updateArrows}>
          {posts.map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className={styles.card}
              style={{ '--delay': `${i * 60}ms` }}>
              <div className={styles.cardImg}>
                {post.cover_image
                  ? <Image src={post.cover_image} alt={post.title} fill sizes="280px" style={{objectFit:'cover'}}/>
                  : <div className={styles.cardImgPlaceholder}>🧪</div>
                }
                {post.tags?.[0] && (
                  <span className={styles.cardTag}>{post.tags[0]}</span>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                {post.excerpt && (
                  <p className={styles.cardExcerpt}>{post.excerpt}</p>
                )}
                <div className={styles.cardMeta}>
                  {post.published_at && (
                    <span>{new Date(post.published_at).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                  )}
                  {post.views > 0 && <span>👁 {post.views}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {canRight && (
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => scroll(1)}>
            <ChevronRightIcon size={20}/>
          </button>
        )}
      </div>
    </section>
  )
}
