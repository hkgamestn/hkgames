'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Eye, EyeOff, MessageCircle,
  Check, X, ArrowUp, ArrowDown, Pencil, Save
} from 'lucide-react'
import styles from './videos.module.css'

/* ─── Video Edit Modal ─── */
function VideoEditModal({ video, onClose, onSaved }) {
  const [form, setForm]   = useState({
    title:         video.title         || '',
    description:   video.description   || '',
    tags:          video.tags?.join(', ') || '',
    video_url:     video.video_url     || '',
    thumbnail_url: video.thumbnail_url || '',
  })
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [upThumb,     setUpThumb]     = useState(false)
  const [error,       setError]       = useState(null)

  async function uploadFile(file, bucket) {
    const supabase = createClient()
    const name = `${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(bucket).upload(name, file, { contentType: file.type })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(name)
    return publicUrl
  }

  async function handleVideoFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setError(null)
    try {
      const url = await uploadFile(file, 'videos')
      setForm(f => ({ ...f, video_url: url }))
    } catch (err) { setError('Upload vidéo échoué: ' + err.message) }
    finally { setUploading(false) }
  }

  async function handleThumbFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUpThumb(true); setError(null)
    try {
      const url = await uploadFile(file, 'video-thumbnails')
      setForm(f => ({ ...f, thumbnail_url: url }))
    } catch (err) { setError('Upload thumbnail échoué: ' + err.message) }
    finally { setUpThumb(false) }
  }

  async function handleSave() {
    if (!form.title.trim())     { setError('Titre requis'); return }
    if (!form.video_url.trim()) { setError('URL vidéo requise'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        id:            video.id,
        title:         form.title.trim(),
        description:   form.description.trim() || null,
        video_url:     form.video_url.trim(),
        thumbnail_url: form.thumbnail_url.trim() || null,
        tags:          form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        updated_at:    new Date().toISOString(),
      }
      const res = await fetch('/api/admin/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      onSaved()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Modifier la vidéo</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={20}/></button>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>Titre *</label>
            <input className={styles.input} value={form.title}
              onChange={e=>setForm(f=>({...f,title:e.target.value}))} maxLength={100}/>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={`${styles.input} ${styles.textarea}`}
              value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              rows={2} maxLength={300}/>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tags <span style={{fontWeight:400,color:'var(--text-muted)'}}>séparés par virgule</span></label>
            <input className={styles.input} value={form.tags}
              onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="asmr, slime, tunisie"/>
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Fichier vidéo</label>
              <input type="file" accept="video/*" onChange={handleVideoFile} className={styles.fileInput}/>
              {uploading && <span className={styles.uploadStatus}>⏳ Upload…</span>}
              {!uploading && form.video_url && <span className={styles.uploadOk}>✅ Vidéo prête</span>}
              <label className={styles.label} style={{marginTop:6}}>Ou URL directe</label>
              <input className={styles.input} value={form.video_url}
                onChange={e=>setForm(f=>({...f,video_url:e.target.value}))} placeholder="https://…"/>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nouvelle miniature</label>
              <input type="file" accept="image/*" onChange={handleThumbFile} className={styles.fileInput}/>
              {upThumb && <span className={styles.uploadStatus}>⏳ Upload…</span>}
              {form.thumbnail_url && !upThumb && (
                <img src={form.thumbnail_url} alt="thumb" className={styles.thumbPreview}/>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={`${styles.actionBtn} ${styles.actionGhost}`} onClick={onClose}>Annuler</button>
          <button className={`${styles.actionBtn} ${styles.actionGreen}`}
            onClick={handleSave} disabled={saving||uploading||upThumb}>
            <Save size={14}/> {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Comments Modal ─── */
function CommentsModal({ videoId, onClose }) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/admin/video-comments?video_id=${videoId}`)
    const data = await res.json()
    setComments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [videoId])

  useEffect(() => { load() }, [load])

  async function approve(id) {
    await fetch('/api/admin/video-comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved: true }),
    })
    setComments(c => c.map(x => x.id === id ? { ...x, approved: true } : x))
  }

  async function remove(id) {
    await fetch('/api/admin/video-comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setComments(c => c.filter(x => x.id !== id))
  }

  const pending  = comments.filter(c => !c.approved)
  const approved = comments.filter(c =>  c.approved)

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Commentaires
            {pending.length > 0 && (
              <span className={styles.pendingBadge}>{pending.length} en attente</span>
            )}
          </h3>
          <button className={styles.modalClose} onClick={onClose}><X size={20}/></button>
        </div>
        <div className={styles.modalBody} style={{maxHeight:'60vh',overflowY:'auto'}}>
          {loading && <p style={{color:'var(--text-muted)',padding:'16px'}}>Chargement…</p>}
          {!loading && comments.length === 0 && (
            <p style={{color:'var(--text-muted)',padding:'16px',textAlign:'center'}}>Aucun commentaire</p>
          )}

          {pending.length > 0 && (
            <>
              <div className={styles.commentSection}>🕐 En attente d'approbation</div>
              {pending.map(c => (
                <div key={c.id} className={styles.commentRow}>
                  <div className={styles.commentInfo}>
                    <span className={styles.commentAuthor}>{c.author}</span>
                    <span className={styles.commentText}>{c.content}</span>
                    <span className={styles.commentDate}>{new Date(c.created_at).toLocaleDateString('fr-TN')}</span>
                  </div>
                  <div className={styles.commentActions}>
                    <button className={`${styles.actionBtn} ${styles.actionGreen}`} onClick={() => approve(c.id)}>
                      <Check size={13}/> Approuver
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionRed}`} onClick={() => remove(c.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {approved.length > 0 && (
            <>
              <div className={styles.commentSection}>✅ Approuvés ({approved.length})</div>
              {approved.map(c => (
                <div key={c.id} className={`${styles.commentRow} ${styles.commentRowApproved}`}>
                  <div className={styles.commentInfo}>
                    <span className={styles.commentAuthor}>{c.author}</span>
                    <span className={styles.commentText}>{c.content}</span>
                    <span className={styles.commentDate}>{new Date(c.created_at).toLocaleDateString('fr-TN')}</span>
                  </div>
                  <div className={styles.commentActions}>
                    <button className={`${styles.actionBtn} ${styles.actionRed}`} onClick={() => remove(c.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Add Video Form ─── */
function AddVideoForm({ onClose, onSaved, sortOrder }) {
  const [form,      setForm]      = useState({ title:'', description:'', tags:'', video_url:'', thumbnail_url:'' })
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [upThumb,   setUpThumb]   = useState(false)
  const [error,     setError]     = useState(null)

  async function uploadFile(file, bucket) {
    const supabase = createClient()
    const name = `${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(bucket).upload(name, file, { contentType: file.type })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl
  }

  async function save() {
    if (!form.title.trim())     { setError('Titre requis'); return }
    if (!form.video_url.trim()) { setError('Uploadez une vidéo ou collez une URL'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title.trim(),
          description:   form.description.trim() || null,
          video_url:     form.video_url.trim(),
          thumbnail_url: form.thumbnail_url.trim() || null,
          tags:          form.tags.split(',').map(t=>t.trim()).filter(Boolean),
          published:     false,
          sort_order:    sortOrder,
        }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      onSaved()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.addForm}>
      <div className={styles.addFormHeader}>
        <h3 className={styles.formTitle}>Nouvelle vidéo</h3>
        <button className={styles.modalClose} onClick={onClose}><X size={18}/></button>
      </div>
      {error && <div className={styles.formError}>{error}</div>}
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label}>Titre *</label>
          <input className={styles.input} value={form.title}
            onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Slime ASMR 🔥" maxLength={100}/>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Tags</label>
          <input className={styles.input} value={form.tags}
            onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="asmr, slime"/>
        </div>
        <div className={styles.field} style={{gridColumn:'1/-1'}}>
          <label className={styles.label}>Description</label>
          <textarea className={`${styles.input} ${styles.textarea}`} value={form.description}
            onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} maxLength={300}/>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Fichier vidéo</label>
          <input type="file" accept="video/*" className={styles.fileInput}
            onChange={async e => {
              const file = e.target.files?.[0]; if (!file) return
              setUploading(true); setError(null)
              try { setForm(f => ({...f, video_url: await uploadFile(file,'videos')})) }
              catch (err) { setError('Upload: '+err.message) }
              finally { setUploading(false) }
            }}/>
          {uploading && <span className={styles.uploadStatus}>⏳ Upload…</span>}
          {!uploading && form.video_url && <span className={styles.uploadOk}>✅ Prête</span>}
          <input className={styles.input} value={form.video_url} style={{marginTop:4}}
            onChange={e=>setForm(f=>({...f,video_url:e.target.value}))} placeholder="Ou URL directe…"/>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Miniature</label>
          <input type="file" accept="image/*" className={styles.fileInput}
            onChange={async e => {
              const file = e.target.files?.[0]; if (!file) return
              setUpThumb(true)
              try { setForm(f => ({...f, thumbnail_url: await uploadFile(file,'video-thumbnails')})) }
              catch {}
              finally { setUpThumb(false) }
            }}/>
          {upThumb && <span className={styles.uploadStatus}>⏳ Upload…</span>}
          {form.thumbnail_url && !upThumb && (
            <img src={form.thumbnail_url} alt="" className={styles.thumbPreview}/>
          )}
        </div>
      </div>
      <div className={styles.formActions}>
        <button className={`${styles.actionBtn} ${styles.actionGhost}`} onClick={onClose}>Annuler</button>
        <button className={`${styles.actionBtn} ${styles.actionGreen}`}
          onClick={save} disabled={saving||uploading||upThumb}>
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function AdminVideosPage() {
  const [videos,       setVideos]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editVideo,    setEditVideo]    = useState(null)
  const [commentsVideo,setCommentsVideo]= useState(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/videos')
    const data = await res.json()
    setVideos(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  async function togglePublish(v) {
    await fetch('/api/admin/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id, published: !v.published }),
    })
    fetchVideos()
  }

  async function deleteVideo(id) {
    if (!confirm('Supprimer cette vidéo ?')) return
    await fetch('/api/admin/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setVideos(vs => vs.filter(v => v.id !== id))
  }

  async function moveOrder(id, dir) {
    const idx = videos.findIndex(v => v.id === id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= videos.length) return
    const a = videos[idx], b = videos[swap]
    await Promise.all([
      fetch('/api/admin/videos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: a.id, sort_order: b.sort_order }) }),
      fetch('/api/admin/videos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: b.id, sort_order: a.sort_order }) }),
    ])
    fetchVideos()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vidéos</h1>
          <p className={styles.sub}>{videos.length} vidéo(s) — cliquez 👁 pour publier/masquer</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowAdd(s=>!s)}>
          <Plus size={16}/> Ajouter
        </button>
      </div>

      {showAdd && (
        <AddVideoForm
          sortOrder={videos.length}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchVideos() }}
        />
      )}

      {loading ? (
        <div className={styles.loading}>Chargement…</div>
      ) : videos.length === 0 ? (
        <div className={styles.loading}>Aucune vidéo. Ajoutez-en une !</div>
      ) : (
        <div className={styles.list}>
          {videos.map((v, i) => (
            <div key={v.id} className={styles.row}>
              <div className={styles.rowOrder}>
                <button className={styles.orderBtn} onClick={()=>moveOrder(v.id,'up')} disabled={i===0}><ArrowUp size={12}/></button>
                <span className={styles.orderNum}>{i+1}</span>
                <button className={styles.orderBtn} onClick={()=>moveOrder(v.id,'down')} disabled={i===videos.length-1}><ArrowDown size={12}/></button>
              </div>
              {v.thumbnail_url
                ? <img src={v.thumbnail_url} alt="" className={styles.rowThumb}/>
                : <div className={styles.rowThumbPlaceholder}>▶</div>}
              <div className={styles.rowInfo}>
                <div className={styles.rowTitle}>{v.title}</div>
                <div className={styles.rowMeta}>
                  <span className={`${styles.statusDot} ${v.published?styles.statusDotGreen:styles.statusDotGray}`}/>
                  {v.published ? '🟢 Publiée' : '⚫ Masquée'}
                  {v.views > 0 && ` · 👁 ${v.views}`}
                  {v.tags?.length > 0 && ` · ${v.tags.join(', ')}`}
                </div>
                {v.video_url && <div className={styles.rowUrl} title={v.video_url}>{v.video_url.length > 60 ? v.video_url.slice(0,60)+'…' : v.video_url}</div>}
              </div>
              <div className={styles.rowActions}>
                <button className={`${styles.actionBtn} ${styles.actionBlue}`}
                  onClick={() => setCommentsVideo(v)} title="Commentaires">
                  <MessageCircle size={14}/>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionPurple}`}
                  onClick={() => setEditVideo(v)} title="Modifier">
                  <Pencil size={14}/>
                </button>
                <button className={`${styles.actionBtn} ${v.published?styles.actionYellow:styles.actionGreen}`}
                  onClick={() => togglePublish(v)} title={v.published?'Masquer':'Publier'}>
                  {v.published ? <EyeOff size={14}/> : <Eye size={14}/>}
                  <span style={{fontSize:'.75rem'}}>{v.published ? 'Masquer' : 'Publier'}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionRed}`}
                  onClick={() => deleteVideo(v.id)} title="Supprimer">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editVideo && (
        <VideoEditModal
          video={editVideo}
          onClose={() => setEditVideo(null)}
          onSaved={() => { setEditVideo(null); fetchVideos() }}
        />
      )}

      {commentsVideo && (
        <CommentsModal
          videoId={commentsVideo.id}
          onClose={() => setCommentsVideo(null)}
        />
      )}
    </div>
  )
}
