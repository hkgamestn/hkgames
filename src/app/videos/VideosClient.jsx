'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Heart, Flame, Star, Laugh, Sparkles,
  MessageCircle, Share2, X, Send,
  Volume2, VolumeX, ArrowLeft, ShoppingBag,
  ThumbsUp, Reply, ChevronRight
} from 'lucide-react'
import styles from './videos.module.css'

function getYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/v\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function isDirectVideo(url) {
  if (!url) return false
  const ytId = getYouTubeId(url)
  if (ytId) return false
  // Supabase storage URLs or direct MP4
  return true
}

const RX_EMOJIS   = ['❤️','🔥','😍','😂','🤩']
const RX_ICONS    = [Heart, Flame, Star, Laugh, Sparkles]
const CMT_RX      = ['👍','❤️','😂','🔥']

function getSid() {
  if (typeof window === 'undefined') return ''
  let s = sessionStorage.getItem('hk_sid')
  if (!s) { s = Math.random().toString(36).slice(2)+Date.now(); sessionStorage.setItem('hk_sid', s) }
  return s
}

/* ─── Product Panel ─── */
function ProductPanel({ products, onClose }) {
  return (
    <div className={styles.productPanel}>
      <div className={styles.ppHead}>
        <span className={styles.ppTitle}><ShoppingBag size={16}/> Nos Slimes</span>
        <button className={styles.ppClose} onClick={onClose}><X size={18}/></button>
      </div>
      <div className={styles.ppList}>
        {products.map(p => (
          <a key={p.id} href={`/shop`} className={styles.ppItem}>
            <div className={styles.ppImg}>
              {p.images?.[0]
                ? <Image src={p.images[0]} alt={p.name} fill sizes="64px" style={{objectFit:'cover'}}/>
                : <div className={styles.ppImgPlaceholder}>🧪</div>}
            </div>
            <div className={styles.ppInfo}>
              <div className={styles.ppName}>{p.name}</div>
              <div className={styles.ppPrice}>{Number(p.price_dt).toFixed(3)} DT</div>
            </div>
            <ChevronRight size={14} className={styles.ppArrow}/>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ─── Comment Item (with replies + reactions) ─── */
function CommentItem({ comment, allComments, onReply, sid }) {
  const [rxCounts,    setRxCounts]    = useState({})
  const [myRx,        setMyRx]        = useState(new Set())
  const [showReply,   setShowReply]   = useState(false)
  const [replyText,   setReplyText]   = useState('')
  const [localReplies,setLocalReplies]= useState([])
  const replies = [...allComments.filter(c => c.reply_to === comment.id), ...localReplies]

  useEffect(() => {
    createClient()
      .from('comment_reactions').select('emoji,session_id')
      .eq('comment_id', comment.id)
      .then(({ data }) => {
        const c = {}; CMT_RX.forEach(e => c[e]=0)
        ;(data||[]).forEach(r => { c[r.emoji]=(c[r.emoji]||0)+1; if (r.session_id===sid) setMyRx(s=>new Set([...s,r.emoji])) })
        setRxCounts(c)
      })
  }, [comment.id, sid])

  async function reactComment(emoji) {
    const has = myRx.has(emoji)
    try {
      if (has) {
        await createClient().from('comment_reactions').delete().match({ comment_id: comment.id, session_id: sid, emoji })
        setMyRx(s => { const n=new Set(s); n.delete(emoji); return n })
        setRxCounts(c => ({...c,[emoji]:Math.max(0,(c[emoji]||1)-1)}))
      } else {
        await createClient().from('comment_reactions').insert([{ comment_id: comment.id, emoji, session_id: sid }])
        setMyRx(s => new Set([...s, emoji]))
        setRxCounts(c => ({...c,[emoji]:(c[emoji]||0)+1}))
      }
    } catch {}
  }

  async function submitReply(e) {
    e.preventDefault()
    if (!replyText.trim()) return
    const { data } = await createClient().from('video_comments').insert([{
      video_id: comment.video_id,
      author:   'Visiteur',
      content:  replyText.trim().slice(0,300),
      reply_to: comment.id,
      approved: true,
    }]).select().single()
    if (data) {
      setLocalReplies(r => [...r, data])
      setShowReply(false)
    }
    setReplyText('')
  }

  return (
    <div className={styles.cmtItem}>
      <div className={styles.cmtHeader}>
        <span className={styles.cmtAuthor}>{comment.author}</span>
        <span className={styles.cmtTime}>{new Date(comment.created_at).toLocaleDateString('fr-TN')}</span>
      </div>
      <div className={styles.cmtContent}>{comment.content}</div>

      {/* Reactions row */}
      <div className={styles.cmtRxRow}>
        {CMT_RX.map(e => (
          <button key={e} className={`${styles.cmtRxBtn} ${myRx.has(e)?styles.cmtRxActive:''}`}
            onPointerUp={() => reactComment(e)}>
            <span>{e}</span>
            {rxCounts[e]>0 && <span className={styles.cmtRxCount}>{rxCounts[e]}</span>}
          </button>
        ))}
        <button className={styles.cmtReplyBtn} onPointerUp={()=>setShowReply(v=>!v)}>
          <Reply size={13}/> Répondre
        </button>
      </div>

      {/* Replies */}
      {replies.length>0 && (
        <div className={styles.repliesList}>
          {replies.map(r => (
            <div key={r.id} className={styles.replyItem}>
              <span className={styles.replyAuthor}>{r.author}</span>
              <span className={styles.replyContent}>{r.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReply && !replySent && (
        <form className={styles.replyForm} onSubmit={submitReply}>
          <input className={styles.replyInput} placeholder="Votre réponse…"
            value={replyText} onChange={e=>setReplyText(e.target.value)} maxLength={300}/>
          <button type="submit" className={styles.replySend}><Send size={13}/></button>
        </form>
      )}

    </div>
  )
}

/* ─── Comments Panel ─── */

/* ─── Video Info collapsible ─── */
function VideoInfo({ video, isActive }) {
  const [expanded, setExpanded] = useState(false)
  const hasDesc = !!video.description

  useEffect(() => { setExpanded(false) }, [video.id])

  if (!isActive) return null

  return (
    <div className={styles.info}>
      <div className={styles.infoTitle}>{video.title}</div>
      {hasDesc && (
        <>
          <div className={expanded ? styles.infoDescExpanded : styles.infoDescCollapsed}>
            {video.description}
          </div>
          <button className={styles.infoMore} onPointerUp={() => setExpanded(e => !e)}>
            {expanded ? 'Afficher moins ▲' : 'Afficher plus ▼'}
          </button>
        </>
      )}
      {video.tags?.length > 0 && (
        <div className={styles.infoTags}>
          {video.tags.map(t => <span key={t} className={styles.infoTag}>#{t}</span>)}
        </div>
      )}
    </div>
  )
}

function CommentsPanel({ videoId, onClose }) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState({ author:'', content:'' })
  const [sent,     setSent]     = useState(false)
  const sid = getSid()

  const topComments = comments.filter(c => !c.reply_to)

  useEffect(() => {
    if (!videoId) return
    setLoading(true); setSent(false)
    createClient()
      .from('video_comments').select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setComments(data||[]); setLoading(false) })
  }, [videoId])

  async function submit(e) {
    e.preventDefault()
    if (!form.author.trim() || !form.content.trim()) return
    const { data } = await createClient().from('video_comments').insert([{
      video_id: videoId,
      author:   form.author.trim().slice(0,50),
      content:  form.content.trim().slice(0,500),
      approved: true,
    }]).select().single()
    if (data) setComments(c => [data, ...c])
    setSent(true)
    setTimeout(() => setSent(false), 2000)
    setForm({ author:'', content:'' })
  }

  return (
    <div className={styles.cpBottom}>
      <div className={styles.cpHead}>
        <span className={styles.cpTitle}>
          Commentaires
          {topComments.length > 0 && <span className={styles.cpBadge}>{topComments.length}</span>}
        </span>
        <button className={styles.cpClose} onClick={onClose}><X size={20}/></button>
      </div>

      <div className={styles.cpList}>
        {loading && <p className={styles.cpEmpty}>Chargement…</p>}
        {!loading && topComments.length===0 && <p className={styles.cpEmpty}>Soyez le premier 💬</p>}
        {topComments.map(c => (
          <CommentItem key={c.id} comment={c} allComments={comments} sid={sid}
            onReply={() => {}} />
        ))}
      </div>

      <div className={styles.cpForm}>
        {sent && <p className={styles.cpSent}>✅ Commentaire publié !</p>}
        <form onSubmit={submit}>
          <input className={styles.cpInput} placeholder="Votre prénom"
            value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} maxLength={50}/>
          <div className={styles.cpRow}>
            <input className={styles.cpInput} placeholder="Votre commentaire…"
              value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} maxLength={300}/>
            <button type="submit" className={styles.cpSend}><Send size={15}/></button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function VideosClient({ initialVideos, products = [], initialIndex = 0 }) {
  const [videos]     = useState(initialVideos)
  const [activeIdx,  setActiveIdx]   = useState(initialIndex)
  const [playing,    setPlaying]     = useState(true)
  const [showCmt,    setShowCmt]     = useState(false)
  const [showShop,   setShowShop]    = useState(false)
  const [isMobile,   setIsMobile]    = useState(false)
  const [reactions,  setReactions]   = useState(() => {
    const m = {}
    initialVideos.forEach(v => {
      const c = {}; RX_EMOJIS.forEach(e => { c[e]=0 })
      ;(v.video_reactions||[]).forEach(r => { c[r.emoji]=(c[r.emoji]||0)+1 })
      m[v.id] = c
    })
    return m
  })
  const [myRx,       setMyRx]        = useState({})
  const [cmtCounts,  setCmtCounts]   = useState({})

  const feedRef   = useRef(null)
  const slideRefs = useRef([])
  const videoRefs = useRef([])
  const lastTap   = useRef(0)

  const active = videos[activeIdx]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* Load comment counts for all videos */
  useEffect(() => {
    if (!videos.length) return
    const supabase = createClient()
    videos.forEach(v => {
      supabase.from('video_comments').select('id', { count: 'exact', head: true })
        .eq('video_id', v.id).eq('reply_to', null)
        .then(({ count }) => setCmtCounts(c => ({...c,[v.id]: count||0})))
    })
  }, [videos])

  /* IntersectionObserver */
  useEffect(() => {
    if (!videos.length) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = slideRefs.current.indexOf(e.target)
          if (idx !== -1) { setActiveIdx(idx); setPlaying(true); setShowCmt(false); setShowShop(false) }
        }
      })
    }, { root: feedRef.current, threshold: 0.6 })
    slideRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [videos])

  /* Play/pause — start muted → play → unmute immediately (browser policy) */
  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return
      const vid = videos[i]
      if (!vid || getYouTubeId(vid.video_url)) return
      if (i === activeIdx) {
        el.muted = true           // must start muted for autoplay
        if (el.readyState === 0) el.load()
        if (playing) {
          el.play().then(() => {
            el.muted = false      // unmute immediately after play starts
          }).catch(() => {})
        } else {
          el.pause()
        }
      } else {
        el.muted = true
        el.pause()
        el.currentTime = 0
      }
    })
  }, [activeIdx, playing, videos])

  /* For YouTube videos, clicking the video area = pause YouTube (via iframe postMessage) */
  const activeVideo = videos[activeIdx]
  const isActiveYT  = activeVideo ? !!getYouTubeId(activeVideo.video_url) : false

  const handleVideoClick = useCallback(() => {
    const now = Date.now()
    if (now - lastTap.current < 300) { handleReact('❤️'); return }
    lastTap.current = now
    setPlaying(p => !p)
  }, [])

  async function handleReact(emoji) {
    if (!active) return
    const vid  = active.id
    const mine = myRx[vid]?.has(emoji)
    if (mine) {
      setMyRx(r => { const s=new Set(r[vid]||[]); s.delete(emoji); return {...r,[vid]:s} })
      setReactions(rc => ({...rc,[vid]:{...rc[vid],[emoji]:Math.max(0,(rc[vid]?.[emoji]||1)-1)}}))
    } else {
      try { await createClient().from('video_reactions').insert([{video_id:vid,emoji,session_id:getSid()}]) } catch {}
      setMyRx(r => ({...r,[vid]:new Set([...(r[vid]||[]),emoji])}))
      setReactions(rc => ({...rc,[vid]:{...rc[vid],[emoji]:(rc[vid]?.[emoji]||0)+1}}))
    }
  }

  if (!videos.length) return (
    <div className={styles.emptyPage}>
      <Link href="/" className={styles.backBtnFixed}><ArrowLeft size={16}/> Accueil</Link>
      <div className={styles.emptyInner}>
        <span style={{fontSize:'3rem'}}>🎬</span>
        <h2>Vidéos bientôt disponibles</h2>
        <p>Nos vidéos ASMR de slime arrivent très prochainement.</p>
        <Link href="/shop" className={styles.shopLink}>Voir la boutique →</Link>
      </div>
    </div>
  )

  const activeRx  = reactions[active?.id] || {}
  const cmtCount  = cmtCounts[active?.id] || 0

  return (
    <div className={styles.root}>
      <Link href="/" className={styles.backBtnFixed}><ArrowLeft size={16}/> Accueil</Link>

      <div className={styles.wrapper}>
        {/* LEFT: Products panel */}
        {showShop && (
          <ProductPanel products={products} onClose={() => setShowShop(false)}/>
        )}

        {/* CENTER: Feed */}
        <div className={styles.feed} ref={feedRef}>
          {videos.map((video, i) => {
            const isActive = i === activeIdx
            const rx = reactions[video.id] || {}
            return (
              <div key={video.id} ref={el => slideRefs.current[i]=el} className={styles.slide}>
                <div className={styles.videoBox}>
                  {/* Thumbnail fade overlay */}
                  {video.thumbnail_url && (
                    <img src={video.thumbnail_url} alt="" className={`${styles.thumbOverlay} ${isActive?styles.thumbFade:''}`}/>
                  )}

                  {/* VIDEO — YouTube iframe or direct MP4 */}
                  {getYouTubeId(video.video_url) ? (
                    <iframe
                      key={`yt-${video.id}-${isActive}`}
                      className={styles.videoEl}
                      src={`https://www.youtube.com/embed/${getYouTubeId(video.video_url)}?autoplay=${isActive?1:0}&mute=0&loop=1&playlist=${getYouTubeId(video.video_url)}&playsinline=1&rel=0&controls=0&modestbranding=1`}
                      allow="autoplay; fullscreen; encrypted-media"
                      allowFullScreen
                      frameBorder="0"
                      style={{pointerEvents: showCmt || showShop ? 'none' : 'auto'}}
                    />
                  ) : (
                    <video
                      key={video.id}
                      ref={el => videoRefs.current[i]=el}
                      className={styles.videoEl}
                      loop playsInline
                      preload={isActive ? 'auto' : 'none'}
                      onClick={handleVideoClick}
                    >
                      <source src={video.video_url} type="video/mp4"/>
                      <source src={video.video_url} type="video/webm"/>
                    </video>
                  )}

                  <div className={styles.grad}/>

                  {/* Paused indicator */}
                  {isActive && !playing && <div className={styles.pausedIcon}>▶</div>}

                  {/* Info — collapsible description */}
                  <VideoInfo video={video} isActive={isActive}/>

                  {/* SHOP icon — left side */}
                  {isActive && products.length > 0 && (
                    <button
                      className={`${styles.shopIconBtn} ${showShop?styles.shopIconActive:''}`}
                      onPointerUp={() => { setShowShop(v=>!v); setShowCmt(false) }}
                      title="Voir nos produits">
                      <ShoppingBag size={22}/>
                      <span className={styles.shopIconLabel}>Produits</span>
                    </button>
                  )}

                  {/* Actions — right side */}
                  {isActive && (
                    <div className={styles.actions}>
                      {RX_EMOJIS.map((key, idx) => {
                        const Icon    = RX_ICONS[idx]
                        const reacted = myRx[video.id]?.has(key)
                        const count   = rx[key]||0
                        return (
                          <button key={key}
                            className={`${styles.rxBtn} ${reacted?styles.rxActive:''}`}
                            onPointerUp={() => handleReact(key)}>
                            <Icon size={24} fill={reacted?'currentColor':'none'} strokeWidth={reacted?0:1.8}/>
                            {count>0 && <span className={styles.rxCount}>{count}</span>}
                          </button>
                        )
                      })}
                      <button
                        className={`${styles.rxBtn} ${showCmt?styles.rxActive:''}`}
                        onPointerUp={() => { setShowCmt(v=>!v); setShowShop(false) }}>
                        <MessageCircle size={24} fill={showCmt?'currentColor':'none'} strokeWidth={showCmt?0:1.8}/>
                        {cmtCount>0 && <span className={styles.rxCount}>{cmtCount}</span>}
                      </button>
                      <button className={styles.rxBtn}
                        onPointerUp={() => {
                          if (navigator.share) navigator.share({ title: video.title, url: window.location.href }).catch(()=>{})
                          else window.open(`https://wa.me/?text=${encodeURIComponent(video.title+' '+window.location.href)}`, '_blank')
                        }}>
                        <Share2 size={24}/>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* Comments — always bottom sheet */}
      {showCmt && (
        <CommentsPanel videoId={active?.id} onClose={()=>setShowCmt(false)}/>
      )}
    </div>
  )
}
