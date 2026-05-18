'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Heart, Flame, Star, Laugh, Sparkles, MessageCircle, Share2, X, Send, Volume2, VolumeX, ArrowLeft } from 'lucide-react'
import styles from './videos.module.css'

const EMOJIS = [
  { key: '❤️', icon: Heart,    label: 'Like'  },
  { key: '🔥', icon: Flame,    label: 'Feu'   },
  { key: '😍', icon: Star,     label: 'Wow'   },
  { key: '😂', icon: Laugh,    label: 'Lol'   },
  { key: '🤩', icon: Sparkles, label: 'Super' },
]

function getSid() {
  if (typeof window === 'undefined') return ''
  let s = sessionStorage.getItem('hk_sid')
  if (!s) { s = Math.random().toString(36).slice(2) + Date.now(); sessionStorage.setItem('hk_sid', s) }
  return s
}

/* ─── Comments Panel ─── */
function CommentsPanel({ videoId, isMobile, onClose }) {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ author: '', content: '' })
  const [sent,    setSent]    = useState(false)

  useEffect(() => {
    if (!videoId) return
    setList([]); setSent(false); setLoading(true)
    createClient()
      .from('video_comments').select('id,author,content,created_at')
      .eq('video_id', videoId).eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setList(data || []); setLoading(false) })
  }, [videoId])

  async function submit(e) {
    e.preventDefault()
    if (!form.author.trim() || !form.content.trim()) return
    await createClient().from('video_comments').insert([{
      video_id: videoId,
      author:   form.author.trim().slice(0, 50),
      content:  form.content.trim().slice(0, 500),
    }])
    setSent(true)
  }

  return (
    <div className={isMobile ? styles.cpMobile : styles.cpDesktop}>
      <div className={styles.cpHead}>
        <span className={styles.cpTitle}>Commentaires</span>
        <button className={styles.cpClose} onClick={onClose}><X size={20} /></button>
      </div>
      <div className={styles.cpList}>
        {loading && <p className={styles.cpEmpty}>Chargement…</p>}
        {!loading && list.length === 0 && <p className={styles.cpEmpty}>Soyez le premier à commenter 💬</p>}
        {list.map(c => (
          <div key={c.id} className={styles.cpItem}>
            <span className={styles.cpAuthor}>{c.author}</span>
            <span className={styles.cpContent}>{c.content}</span>
          </div>
        ))}
      </div>
      <div className={styles.cpForm}>
        {!sent ? (
          <form onSubmit={submit}>
            <input className={styles.cpInput} placeholder="Votre prénom"
              value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} maxLength={50} />
            <div className={styles.cpRow}>
              <input className={styles.cpInput} placeholder="Votre commentaire…"
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} maxLength={300} />
              <button type="submit" className={styles.cpSend}><Send size={15} /></button>
            </div>
          </form>
        ) : (
          <p className={styles.cpSent}>✅ Envoyé — en attente d'approbation</p>
        )}
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function VideosClient({ initialVideos }) {
  const [videos]      = useState(initialVideos)
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [playing,     setPlaying]     = useState(true)
  const [muted,       setMuted]       = useState(true)
  const [showComments,setShowComments] = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)
  const [reactions,   setReactions]   = useState(() => {
    const m = {}
    initialVideos.forEach(v => {
      const c = {}
      EMOJIS.forEach(e => { c[e.key] = 0 })
      ;(v.video_reactions || []).forEach(r => { c[r.emoji] = (c[r.emoji] || 0) + 1 })
      m[v.id] = c
    })
    return m
  })
  // my reactions per video: { videoId: Set<emoji> }
  const [myRx, setMyRx] = useState({})

  const feedRef    = useRef(null)
  const slideRefs  = useRef([])
  const videoRefs  = useRef([])
  const lastTap    = useRef(0)

  const active = videos[activeIdx]

  /* Detect mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* IntersectionObserver — which slide is centered */
  useEffect(() => {
    if (!videos.length) return
    const opts = { root: feedRef.current, threshold: 0.6 }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = slideRefs.current.indexOf(e.target)
          if (idx !== -1) {
            setActiveIdx(idx)
            setPlaying(true)
            setShowComments(false)
          }
        }
      })
    }, opts)
    slideRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [videos])

  /* Sync video play/pause */
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return
      if (i === activeIdx) {
        el.muted = muted
        if (playing) el.play().catch(() => {})
        else el.pause()
      } else {
        el.pause()
        el.currentTime = 0
      }
    })
  }, [activeIdx, playing])

  useEffect(() => {
    const el = videoRefs.current[activeIdx]
    if (el) el.muted = muted
  }, [muted, activeIdx])

  /* Toggle play/pause on video click */
  const handleVideoClick = useCallback((e) => {
    // Double tap detection (two-finger or double-click = like)
    const now = Date.now()
    const delta = now - lastTap.current
    lastTap.current = now
    if (delta < 300) {
      // Double tap = ❤️
      handleReact('❤️')
      return
    }
    setPlaying(p => !p)
  }, [])

  /* Reactions: toggle (add or remove) */
  async function handleReact(emoji) {
    if (!active) return
    const vid  = active.id
    const mine = myRx[vid]?.has(emoji)

    if (mine) {
      // Remove reaction (local only — can't delete from DB without auth, so just remove locally)
      setMyRx(r => {
        const s = new Set(r[vid] || [])
        s.delete(emoji)
        return { ...r, [vid]: s }
      })
      setReactions(rc => ({
        ...rc,
        [vid]: { ...rc[vid], [emoji]: Math.max(0, (rc[vid]?.[emoji] || 1) - 1) }
      }))
    } else {
      // Add reaction
      try {
        await createClient().from('video_reactions').insert([{
          video_id: vid, emoji, session_id: getSid(),
        }])
      } catch {}
      setMyRx(r => ({ ...r, [vid]: new Set([...(r[vid] || []), emoji]) }))
      setReactions(rc => ({
        ...rc,
        [vid]: { ...rc[vid], [emoji]: (rc[vid]?.[emoji] || 0) + 1 }
      }))
    }
  }

  function handleShare() {
    if (!active) return
    const url  = window.location.href
    const text = `🔥 ${active.title} — HK Games Slime Tunisie`
    if (navigator.share) {
      navigator.share({ title: active.title, text, url }).catch(() => {})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    }
  }

  if (!videos.length) return (
    <div className={styles.emptyPage}>
      <Link href="/" className={styles.backBtnFixed}><ArrowLeft size={16} /> Accueil</Link>
      <div className={styles.emptyInner}>
        <span style={{ fontSize: '3rem' }}>🎬</span>
        <h2>Vidéos bientôt disponibles</h2>
        <p>Nos vidéos ASMR et unboxing de slime arrivent très prochainement.</p>
        <Link href="/shop" className={styles.shopLink}>Voir la boutique →</Link>
      </div>
    </div>
  )

  const activeRx = reactions[active?.id] || {}

  return (
    <div className={styles.root}>

      {/* Fixed controls */}
      <Link href="/" className={styles.backBtnFixed}><ArrowLeft size={16} /> Accueil</Link>
      <button className={styles.muteBtnFixed} onClick={() => setMuted(m => !m)}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Main layout: feed always stays, comments slide in */}
      <div className={styles.wrapper}>

        {/* FEED */}
        <div className={styles.feed} ref={feedRef}>
          {videos.map((video, i) => {
            const rc = reactions[video.id] || {}
            const isActive = i === activeIdx
            return (
              <div
                key={video.id}
                ref={el => slideRefs.current[i] = el}
                className={styles.slide}
              >
                {/* 9:16 container */}
                <div className={styles.videoBox}>
                  <video
                    ref={el => videoRefs.current[i] = el}
                    className={styles.videoEl}
                    src={video.video_url}
                    loop playsInline preload="auto"
                    poster={video.thumbnail_url || undefined}
                    onClick={handleVideoClick}
                  />

                  {/* Overlay gradient */}
                  <div className={styles.grad} />

                  {/* Paused indicator */}
                  {isActive && !playing && (
                    <div className={styles.pausedIcon}>▶</div>
                  )}

                  {/* Info bottom-left */}
                  <div className={styles.info}>
                    <div className={styles.infoTitle}>{video.title}</div>
                    {video.description && <div className={styles.infoDesc}>{video.description}</div>}
                    {video.tags?.length > 0 && (
                      <div className={styles.infoTags}>
                        {video.tags.map(t => <span key={t} className={styles.infoTag}>#{t}</span>)}
                      </div>
                    )}
                  </div>

                  {/* Actions right side */}
                  {isActive && (
                    <div className={styles.actions}>
                      {EMOJIS.map(({ key, icon: Icon }) => {
                        const reacted = myRx[video.id]?.has(key)
                        const count   = rc[key] || 0
                        return (
                          <button
                            key={key}
                            className={`${styles.rxBtn} ${reacted ? styles.rxActive : ''}`}
                            onPointerUp={() => handleReact(key)}
                          >
                            <Icon
                              size={26}
                              fill={reacted ? 'currentColor' : 'none'}
                              strokeWidth={reacted ? 0 : 1.8}
                            />
                            {count > 0 && <span className={styles.rxCount}>{count}</span>}
                          </button>
                        )
                      })}

                      <button
                        className={`${styles.rxBtn} ${showComments ? styles.rxActive : ''}`}
                        onPointerUp={() => setShowComments(v => !v)}
                      >
                        <MessageCircle size={26} fill={showComments ? 'currentColor' : 'none'} strokeWidth={showComments ? 0 : 1.8} />
                      </button>

                      <button className={styles.rxBtn} onPointerUp={handleShare}>
                        <Share2 size={26} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop side panel — stays fixed, no layout shift */}
        {showComments && !isMobile && (
          <CommentsPanel
            videoId={active?.id}
            isMobile={false}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {/* Mobile bottom sheet — fixed overlay */}
      {showComments && isMobile && (
        <CommentsPanel
          videoId={active?.id}
          isMobile={true}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  )
}
