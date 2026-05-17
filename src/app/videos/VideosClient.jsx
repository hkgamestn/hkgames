'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { Share2, MessageCircle, ChevronLeft, X, Send, Eye } from 'lucide-react'
import styles from './videos.module.css'

const EMOJIS = ['❤️','🔥','😍','😂','🤩']

function getSessionId() {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('hk_sid')
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now(); sessionStorage.setItem('hk_sid', sid) }
  return sid
}

function countReactions(reactions) {
  const counts = {}
  for (const emoji of EMOJIS) counts[emoji] = 0
  for (const r of (reactions || [])) counts[r.emoji] = (counts[r.emoji] || 0) + 1
  return counts
}

export default function VideosClient({ initialVideos }) {
  const [videos, setVideos]           = useState(initialVideos)
  const [activeIdx, setActiveIdx]     = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments]       = useState([])
  const [commentForm, setCommentForm] = useState({ author: '', content: '' })
  const [commentSent, setCommentSent] = useState(false)
  const [myReactions, setMyReactions] = useState({})   // videoId → Set of emojis
  const videoRef = useRef(null)
  const sid = typeof window !== 'undefined' ? getSessionId() : ''

  const active = videos[activeIdx]

  // Autoplay on index change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
    setShowComments(false)
    setCommentSent(false)
    setCommentForm({ author: '', content: '' })
  }, [activeIdx])

  // Load comments for active video
  useEffect(() => {
    if (!active) return
    const supabase = createClient()
    supabase.from('video_comments')
      .select('id, author, content, created_at')
      .eq('video_id', active.id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setComments(data || []))
  }, [active?.id, showComments])

  async function handleReact(emoji) {
    if (!active) return
    const supabase = createClient()
    const key = active.id
    const already = myReactions[key]?.has(emoji)
    if (already) return // no un-react for simplicity

    try {
      await supabase.from('video_reactions').insert([{ video_id: key, emoji, session_id: sid }])
      setMyReactions(r => ({
        ...r,
        [key]: new Set([...(r[key] || []), emoji])
      }))
      setVideos(vs => vs.map(v => v.id === key
        ? { ...v, video_reactions: [...(v.video_reactions || []), { emoji }] }
        : v
      ))
    } catch {}
  }

  async function submitComment(e) {
    e.preventDefault()
    const { author, content } = commentForm
    if (!author.trim() || !content.trim()) return
    const supabase = createClient()
    await supabase.from('video_comments').insert([{
      video_id: active.id,
      author:  author.trim().slice(0, 50),
      content: content.trim().slice(0, 500),
    }])
    setCommentSent(true)
  }

  function share(platform) {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Regarde cette vidéo de slime 🔥 ${active?.title}`)
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${text}%20${url}`)
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`)
    if (platform === 'copy') { navigator.clipboard?.writeText(window.location.href); alert('Lien copié !') }
  }

  if (!active) return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.empty}>
          <div style={{fontSize:'3rem'}}>🎬</div>
          <h2>Les vidéos arrivent bientôt !</h2>
          <p>Nos vidéos ASMR et unboxing de slime seront disponibles très prochainement.</p>
        </div>
      </main>
      <Footer />
    </>
  )

  const reactions = countReactions(active.video_reactions)

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.layout}>

          {/* Feed vertical gauche */}
          <div className={styles.feed}>
            <div className={styles.feedHeader}>
              <h1 className={styles.feedTitle}>🎬 Vidéos</h1>
            </div>
            {videos.map((v, i) => (
              <button key={v.id} onClick={() => setActiveIdx(i)}
                className={`${styles.feedItem} ${i === activeIdx ? styles.feedItemActive : ''}`}>
                <div className={styles.feedThumb}>
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} alt={v.title} className={styles.feedThumbImg} loading="lazy" />
                    : <div className={styles.feedThumbPlaceholder}>▶</div>}
                </div>
                <div className={styles.feedItemTitle}>{v.title}</div>
              </button>
            ))}
          </div>

          {/* Player principal */}
          <div className={styles.player}>
            <div className={styles.videoWrap}>
              <video
                ref={videoRef}
                key={active.id}
                className={styles.video}
                src={active.video_url}
                controls
                playsInline
                loop
                muted={false}
                poster={active.thumbnail_url || undefined}
              />
            </div>

            {/* Info + actions */}
            <div className={styles.playerInfo}>
              <div className={styles.playerMeta}>
                <h2 className={styles.playerTitle}>{active.title}</h2>
                {active.description && <p className={styles.playerDesc}>{active.description}</p>}
                {active.views > 0 && <div className={styles.playerViews}><Eye size={14}/> {active.views} vues</div>}
              </div>

              {/* Réactions */}
              <div className={styles.reactions}>
                {EMOJIS.map(emoji => (
                  <button key={emoji}
                    className={`${styles.reactionBtn} ${myReactions[active.id]?.has(emoji) ? styles.reactionActive : ''}`}
                    onClick={() => handleReact(emoji)}>
                    <span className={styles.reactionEmoji}>{emoji}</span>
                    <span className={styles.reactionCount}>{reactions[emoji] || ''}</span>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => setShowComments(v => !v)}>
                  <MessageCircle size={18} /> Commentaires
                  {comments.length > 0 && <span className={styles.actionCount}>{comments.length}</span>}
                </button>
                <button className={styles.actionBtn} onClick={() => share('whatsapp')}>
                  <Share2 size={18} /> WhatsApp
                </button>
                <button className={styles.actionBtn} onClick={() => share('facebook')}>
                  <Share2 size={18} /> Facebook
                </button>
              </div>

              {/* Tags */}
              {active.tags?.length > 0 && (
                <div className={styles.tags}>
                  {active.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              )}
            </div>

            {/* Panel commentaires */}
            {showComments && (
              <div className={styles.commentsPanel}>
                <div className={styles.commentsPanelHeader}>
                  <h3>Commentaires</h3>
                  <button onClick={() => setShowComments(false)}><X size={18}/></button>
                </div>
                <div className={styles.commentsList}>
                  {comments.length === 0 && <p className={styles.noComments}>Soyez le premier à commenter !</p>}
                  {comments.map(c => (
                    <div key={c.id} className={styles.comment}>
                      <div className={styles.commentAuthor}>{c.author}</div>
                      <div className={styles.commentContent}>{c.content}</div>
                      <div className={styles.commentDate}>{new Date(c.created_at).toLocaleDateString('fr-TN')}</div>
                    </div>
                  ))}
                </div>
                {!commentSent ? (
                  <form className={styles.commentForm} onSubmit={submitComment}>
                    <input className={styles.commentInput} placeholder="Votre prénom"
                      value={commentForm.author} onChange={e => setCommentForm(f => ({...f, author: e.target.value}))} maxLength={50} />
                    <div className={styles.commentTextRow}>
                      <textarea className={`${styles.commentInput} ${styles.commentTextarea}`}
                        placeholder="Votre commentaire…"
                        value={commentForm.content} onChange={e => setCommentForm(f => ({...f, content: e.target.value}))}
                        maxLength={500} rows={3} />
                      <button type="submit" className={styles.commentSend}><Send size={16}/></button>
                    </div>
                  </form>
                ) : (
                  <div className={styles.commentSuccess}>✅ Commentaire envoyé — en attente de modération</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
