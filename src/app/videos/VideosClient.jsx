'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Heart, Flame, Star, Laugh, Sparkles,
  MessageCircle, Share2, X, Send,
  Volume2, VolumeX, ArrowLeft
} from 'lucide-react'
import styles from './videos.module.css'

const EMOJIS = [
  { key: '❤️',  icon: Heart,     label: 'J\'aime' },
  { key: '🔥',  icon: Flame,     label: 'Feu'     },
  { key: '😍',  icon: Star,      label: 'Wow'     },
  { key: '😂',  icon: Laugh,     label: 'Lol'     },
  { key: '🤩',  icon: Sparkles,  label: 'Super'   },
]

function sid() {
  if (typeof window === 'undefined') return ''
  let s = sessionStorage.getItem('hk_sid')
  if (!s) { s = Math.random().toString(36).slice(2)+Date.now(); sessionStorage.setItem('hk_sid', s) }
  return s
}

function countReactions(arr) {
  const c = {}
  EMOJIS.forEach(e => { c[e.key] = 0 })
  ;(arr||[]).forEach(r => { c[r.emoji] = (c[r.emoji]||0)+1 })
  return c
}

/* ───── Comments panel (shared) ───── */
function CommentsPanel({ video, onClose, isMobile }) {
  const [comments, setComments] = useState([])
  const [form, setForm]         = useState({ author:'', content:'' })
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!video) return
    createClient()
      .from('video_comments').select('id,author,content,created_at')
      .eq('video_id', video.id).eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setComments(data||[]); setLoading(false) })
  }, [video?.id])

  async function submit(e) {
    e.preventDefault()
    if (!form.author.trim() || !form.content.trim()) return
    await createClient().from('video_comments').insert([{
      video_id: video.id,
      author:   form.author.trim().slice(0,50),
      content:  form.content.trim().slice(0,500),
    }])
    setSent(true)
  }

  return (
    <div className={isMobile ? styles.commentsPanelMobile : styles.commentsPanelDesktop}>
      <div className={styles.cpHeader}>
        <span className={styles.cpTitle}>Commentaires</span>
        <button className={styles.cpClose} onClick={onClose}><X size={20}/></button>
      </div>
      <div className={styles.cpList}>
        {loading && <p className={styles.cpEmpty}>Chargement…</p>}
        {!loading && comments.length===0 && <p className={styles.cpEmpty}>Soyez le premier à commenter 💬</p>}
        {comments.map(c => (
          <div key={c.id} className={styles.cpComment}>
            <span className={styles.cpAuthor}>{c.author}</span>
            <span className={styles.cpContent}>{c.content}</span>
          </div>
        ))}
      </div>
      <div className={styles.cpForm}>
        {!sent ? (
          <form onSubmit={submit}>
            <input className={styles.cpInput} placeholder="Votre prénom"
              value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} maxLength={50}/>
            <div className={styles.cpRow}>
              <input className={styles.cpInput} placeholder="Votre commentaire…"
                value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} maxLength={300}/>
              <button type="submit" className={styles.cpSend}><Send size={15}/></button>
            </div>
          </form>
        ) : (
          <p className={styles.cpSent}>✅ Envoyé — en attente d'approbation</p>
        )}
      </div>
    </div>
  )
}

/* ───── Main ───── */
export default function VideosClient({ initialVideos }) {
  const [videos]       = useState(initialVideos)
  const [activeIdx, setActiveIdx]   = useState(0)
  const [isMuted, setIsMuted]       = useState(true)
  const [myReactions, setMyReactions] = useState({})
  const [reactionCounts, setReactionCounts] = useState(() => {
    const m = {}
    initialVideos.forEach(v => { m[v.id] = countReactions(v.video_reactions) })
    return m
  })
  const [showComments, setShowComments] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const containerRef = useRef(null)
  const slideRefs    = useRef([])
  const videoRefs    = useRef([])

  const active = videos[activeIdx]

  /* Detect mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* IntersectionObserver scroll snap */
  useEffect(() => {
    if (!videos.length) return
    const opts = { root: containerRef.current, threshold: 0.55 }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = slideRefs.current.indexOf(entry.target)
          if (idx !== -1) setActiveIdx(idx)
        }
      })
    }, opts)
    slideRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [videos])

  /* Play/pause video on activeIdx change */
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return
      if (i === activeIdx) {
        el.muted = isMuted
        el.currentTime = 0
        el.play().catch(()=>{})
      } else {
        el.pause()
      }
    })
  }, [activeIdx])

  /* Sync mute */
  useEffect(() => {
    const el = videoRefs.current[activeIdx]
    if (el) el.muted = isMuted
  }, [isMuted, activeIdx])

  async function handleReact(emoji) {
    if (!active) return
    const vid = active.id
    if (myReactions[vid]?.has(emoji)) return
    try {
      await createClient().from('video_reactions').insert([{ video_id: vid, emoji, session_id: sid() }])
      setMyReactions(r => ({ ...r, [vid]: new Set([...(r[vid]||[]), emoji]) }))
      setReactionCounts(c => ({ ...c, [vid]: { ...c[vid], [emoji]: (c[vid]?.[emoji]||0)+1 } }))
    } catch {}
  }

  function handleShare() {
    if (!active) return
    const url  = window.location.href
    const text = `🔥 ${active.title} — HK Games Slime Tunisie`
    if (navigator.share) {
      navigator.share({ title: active.title, text, url }).catch(()=>{})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text+' '+url)}`, '_blank')
    }
  }

  if (!videos.length) return (
    <div className={styles.emptyPage}>
      <Link href="/" className={styles.backBtn}><ArrowLeft size={18}/> Accueil</Link>
      <div className={styles.emptyInner}>
        <span style={{fontSize:'3rem'}}>🎬</span>
        <h2>Vidéos bientôt disponibles !</h2>
        <p>Nos vidéos ASMR et unboxing de slime arrivent très prochainement.</p>
      </div>
    </div>
  )

  const activeReactions = reactionCounts[active?.id] || {}

  return (
    <div className={styles.root}>

      {/* Bouton retour */}
      <Link href="/" className={styles.backBtn}><ArrowLeft size={18}/> Accueil</Link>

      {/* Mute toggle */}
      <button className={styles.muteBtn} onClick={() => setIsMuted(m=>!m)}>
        {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
      </button>

      {/* Layout: feed + sidebar */}
      <div className={`${styles.layout} ${showComments ? styles.layoutWithPanel : ''}`}>

        {/* Feed */}
        <div className={styles.feed} ref={containerRef}>
          {videos.map((video, i) => (
            <div key={video.id}
              ref={el => slideRefs.current[i] = el}
              className={styles.slide}>

              <video
                ref={el => videoRefs.current[i] = el}
                className={styles.video}
                src={video.video_url}
                loop playsInline preload="metadata"
                poster={video.thumbnail_url||undefined}
                onClick={() => setIsMuted(m=>!m)}
              />
              <div className={styles.overlay}/>

              {/* Info */}
              <div className={styles.info}>
                <div className={styles.infoTitle}>{video.title}</div>
                {video.description && <div className={styles.infoDesc}>{video.description}</div>}
                {video.tags?.length>0 && (
                  <div className={styles.infoTags}>
                    {video.tags.map(t=><span key={t} className={styles.infoTag}>#{t}</span>)}
                  </div>
                )}
              </div>

              {/* Actions — visible only on active slide */}
              {i === activeIdx && (
                <div className={styles.actions}>
                  {EMOJIS.map(({ key, icon: Icon }) => {
                    const reacted = myReactions[video.id]?.has(key)
                    const count   = reactionCounts[video.id]?.[key] || 0
                    return (
                      <button key={key}
                        className={`${styles.actionBtn} ${reacted ? styles.actionActive : ''}`}
                        onPointerUp={() => handleReact(key)}>
                        <Icon size={24}
                          fill={reacted ? 'currentColor' : 'none'}
                          strokeWidth={reacted ? 0 : 2}/>
                        {count > 0 && <span className={styles.actionCount}>{count}</span>}
                      </button>
                    )
                  })}

                  <button className={`${styles.actionBtn} ${showComments ? styles.actionActive : ''}`}
                    onPointerUp={() => setShowComments(v=>!v)}>
                    <MessageCircle size={24} fill={showComments?'currentColor':'none'} strokeWidth={showComments?0:2}/>
                  </button>

                  <button className={styles.actionBtn} onPointerUp={handleShare}>
                    <Share2 size={24}/>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comments panel */}
        {showComments && (
          <CommentsPanel
            video={active}
            isMobile={isMobile}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {/* Mobile comments bottom sheet */}
      {showComments && isMobile && (
        <CommentsPanel
          video={active}
          isMobile={true}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  )
}
