'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { Heart, Flame, Star, Laugh, Sparkles, MessageCircle, Share2, X, Send, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'
import styles from './videos.module.css'

const EMOJIS = [
  { key: '❤️',  icon: Heart,    label: 'J\'aime'   },
  { key: '🔥',  icon: Flame,    label: 'Feu'       },
  { key: '😍',  icon: Star,     label: 'Wow'       },
  { key: '😂',  icon: Laugh,    label: 'Lol'       },
  { key: '🤩',  icon: Sparkles, label: 'Super'     },
]

function getSessionId() {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('hk_sid')
  if (!sid) { sid = Math.random().toString(36).slice(2)+Date.now(); sessionStorage.setItem('hk_sid', sid) }
  return sid
}

function countReactions(reactions) {
  const c = {}
  for (const e of EMOJIS) c[e.key] = 0
  for (const r of (reactions||[])) c[r.emoji] = (c[r.emoji]||0)+1
  return c
}

/* ── Single video slide ── */
function VideoSlide({ video, isActive, isMuted, onMuteToggle, myReactions, onReact, onShare }) {
  const ref = useRef(null)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [commentForm,  setCommentForm]  = useState({ author:'', content:'' })
  const [commentSent,  setCommentSent]  = useState(false)
  const reactions = countReactions(video.video_reactions)

  // Play / pause based on visibility
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isActive) {
      el.currentTime = 0
      el.muted = isMuted
      el.play().catch(()=>{})
    } else {
      el.pause()
    }
  }, [isActive])

  useEffect(() => {
    if (ref.current) ref.current.muted = isMuted
  }, [isMuted])

  useEffect(() => {
    if (!showComments) return
    createClient()
      .from('video_comments').select('id,author,content,created_at')
      .eq('video_id', video.id).eq('approved', true).order('created_at', { ascending: false })
      .then(({ data }) => setComments(data||[]))
  }, [showComments, video.id])

  async function submitComment(e) {
    e.preventDefault()
    if (!commentForm.author.trim() || !commentForm.content.trim()) return
    await createClient().from('video_comments').insert([{
      video_id: video.id,
      author:  commentForm.author.trim().slice(0,50),
      content: commentForm.content.trim().slice(0,500),
    }])
    setCommentSent(true)
  }

  return (
    <div className={styles.slide}>
      {/* VIDEO */}
      <video
        ref={ref}
        className={styles.video}
        src={video.video_url}
        loop playsInline preload="metadata"
        poster={video.thumbnail_url || undefined}
        onClick={onMuteToggle}
      />

      {/* Overlay gradient */}
      <div className={styles.overlay} />

      {/* Info bas gauche */}
      <div className={styles.info}>
        <div className={styles.infoTitle}>{video.title}</div>
        {video.description && <div className={styles.infoDesc}>{video.description}</div>}
        {video.tags?.length>0 && (
          <div className={styles.infoTags}>
            {video.tags.map(t=><span key={t} className={styles.infoTag}>#{t}</span>)}
          </div>
        )}
      </div>

      {/* Actions droite */}
      <div className={styles.actions}>
        {/* Mute */}
        <button className={styles.actionBtn} onClick={onMuteToggle}>
          {isMuted ? <VolumeX size={22}/> : <Volume2 size={22}/>}
          <span className={styles.actionLabel}>{isMuted ? 'Son' : 'Muet'}</span>
        </button>

        {/* Réactions */}
        {EMOJIS.map(({ key, icon: Icon, label }) => (
          <button key={key}
            className={`${styles.actionBtn} ${myReactions?.has(key) ? styles.actionActive : ''}`}
            onClick={() => onReact(video.id, key)}>
            <Icon size={22} fill={myReactions?.has(key) ? 'currentColor' : 'none'} strokeWidth={myReactions?.has(key)?0:2}/>
            <span className={styles.actionCount}>{reactions[key]||''}</span>
          </button>
        ))}

        {/* Commentaires */}
        <button className={styles.actionBtn} onClick={() => setShowComments(v=>!v)}>
          <MessageCircle size={22}/>
          <span className={styles.actionCount}>{comments.length||''}</span>
        </button>

        {/* Partage */}
        <button className={styles.actionBtn} onClick={() => onShare(video)}>
          <Share2 size={22}/>
        </button>
      </div>

      {/* Panel commentaires */}
      {showComments && (
        <div className={styles.commentsPanel}>
          <div className={styles.commentsPanelHeader}>
            <span>Commentaires</span>
            <button onClick={()=>setShowComments(false)}><X size={18}/></button>
          </div>
          <div className={styles.commentsList}>
            {comments.length===0 && <p className={styles.noComments}>Soyez le premier ! 💬</p>}
            {comments.map(c=>(
              <div key={c.id} className={styles.comment}>
                <span className={styles.commentAuthor}>{c.author}</span>
                <span className={styles.commentContent}>{c.content}</span>
              </div>
            ))}
          </div>
          {!commentSent ? (
            <form className={styles.commentForm} onSubmit={submitComment}>
              <input className={styles.commentInput} placeholder="Votre prénom"
                value={commentForm.author} onChange={e=>setCommentForm(f=>({...f,author:e.target.value}))} maxLength={50}/>
              <div className={styles.commentRow}>
                <input className={styles.commentInput} placeholder="Votre commentaire…"
                  value={commentForm.content} onChange={e=>setCommentForm(f=>({...f,content:e.target.value}))} maxLength={300}/>
                <button type="submit" className={styles.commentSend}><Send size={15}/></button>
              </div>
            </form>
          ) : (
            <p className={styles.commentSuccess}>✅ Envoyé — en attente d'approbation</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main feed ── */
export default function VideosClient({ initialVideos }) {
  const [videos]      = useState(initialVideos)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isMuted, setIsMuted]     = useState(true)  // start muted for autoplay
  const [myReactions, setMyReactions] = useState({}) // { videoId: Set<emoji> }
  const containerRef  = useRef(null)
  const slideRefs     = useRef([])
  const observerRef   = useRef(null)
  const sid = typeof window !== 'undefined' ? getSessionId() : ''

  // IntersectionObserver — detect which slide is in view
  useEffect(() => {
    if (!videos.length) return
    const options = { root: containerRef.current, threshold: 0.6 }
    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = slideRefs.current.indexOf(entry.target)
          if (idx !== -1) setActiveIdx(idx)
        }
      }
    }, options)
    slideRefs.current.forEach(el => { if (el) observerRef.current.observe(el) })
    return () => observerRef.current?.disconnect()
  }, [videos])

  // Scroll to video by index
  function scrollTo(idx) {
    slideRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleReact(videoId, emoji) {
    const already = myReactions[videoId]?.has(emoji)
    if (already) return
    await createClient().from('video_reactions').insert([{ video_id: videoId, emoji, session_id: sid }]).catch(()=>{})
    setMyReactions(r => ({ ...r, [videoId]: new Set([...(r[videoId]||[]), emoji]) }))
  }

  function handleShare(video) {
    const url  = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`🔥 ${video.title} — HK Games Slime Tunisie`)
    // WhatsApp sheet
    const wa = `https://wa.me/?text=${text}%20${url}`
    const fb = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    if (navigator.share) {
      navigator.share({ title: video.title, url: window.location.href }).catch(()=>{})
    } else {
      window.open(wa, '_blank')
    }
  }

  if (!videos.length) return (
    <div className={styles.empty}>
      <div style={{fontSize:'3rem'}}>🎬</div>
      <h2>Les vidéos arrivent bientôt !</h2>
      <p>Nos vidéos ASMR et unboxing de slime seront disponibles très prochainement.</p>
    </div>
  )

  return (
    <div className={styles.root}>
      {/* Feed TikTok */}
      <div className={styles.feed} ref={containerRef}>
        {videos.map((video, i) => (
          <div key={video.id} ref={el => slideRefs.current[i] = el} className={styles.slideWrap}>
            <VideoSlide
              video={video}
              isActive={i === activeIdx}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(m=>!m)}
              myReactions={myReactions[video.id]}
              onReact={handleReact}
              onShare={handleShare}
            />
          </div>
        ))}
      </div>

      {/* Nav arrows desktop */}
      <div className={styles.navArrows}>
        <button className={styles.navArrow} onClick={()=>scrollTo(activeIdx-1)} disabled={activeIdx===0}>
          <ChevronUp size={22}/>
        </button>
        <span className={styles.navCounter}>{activeIdx+1}/{videos.length}</span>
        <button className={styles.navArrow} onClick={()=>scrollTo(activeIdx+1)} disabled={activeIdx===videos.length-1}>
          <ChevronDown size={22}/>
        </button>
      </div>

      {/* Dots indicator */}
      <div className={styles.dots}>
        {videos.map((_,i)=>(
          <button key={i} className={`${styles.dot} ${i===activeIdx?styles.dotActive:''}`} onClick={()=>scrollTo(i)}/>
        ))}
      </div>
    </div>
  )
}
