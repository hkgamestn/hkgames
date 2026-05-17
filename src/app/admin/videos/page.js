'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Eye, EyeOff, MessageCircle, Check, X, ArrowUp, ArrowDown } from 'lucide-react'
import styles from './videos.module.css'

export default function AdminVideosPage() {
  const [videos, setVideos]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ title:'', description:'', tags:'', video_url:'', thumbnail_url:'' })
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [comments, setComments]     = useState([])
  const [showComments, setShowComments] = useState(null)
  const [saveError, setSaveError]   = useState(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/videos')
    const data = await res.json()
    setVideos(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  async function uploadVideo(file) {
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const name = `${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('videos').upload(name, file, { contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(name)
      setForm(f => ({ ...f, video_url: publicUrl }))
    } catch(err) { alert('Upload vidéo échoué: ' + err.message) }
    finally { setUploading(false) }
  }

  async function uploadThumb(file) {
    if (!file) return
    setUploadingThumb(true)
    try {
      const supabase = createClient()
      const name = `thumb_${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('video-thumbnails').upload(name, file, { contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('video-thumbnails').getPublicUrl(name)
      setForm(f => ({ ...f, thumbnail_url: publicUrl }))
    } catch(err) { alert('Upload thumbnail échoué: ' + err.message) }
    finally { setUploadingThumb(false) }
  }

  async function saveVideo() {
    setSaveError(null)
    if (!form.title.trim())     { setSaveError('Titre requis'); return }
    if (!form.video_url.trim()) { setSaveError('Uploadez une vidéo ou collez une URL'); return }
    setSaving(true)
    try {
      const payload = {
        title:         form.title.trim(),
        description:   form.description.trim() || null,
        video_url:     form.video_url.trim(),
        thumbnail_url: form.thumbnail_url.trim() || null,
        tags:          form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        published:     false,
        sort_order:    videos.length,
      }
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setShowForm(false)
      setForm({ title:'', description:'', tags:'', video_url:'', thumbnail_url:'' })
      await fetchVideos()
    } catch(err) { setSaveError('Erreur: ' + err.message) }
    finally { setSaving(false) }
  }

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
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= videos.length) return
    const a = videos[idx], b = videos[swapIdx]
    await Promise.all([
      fetch('/api/admin/videos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: a.id, sort_order: b.sort_order }) }),
      fetch('/api/admin/videos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: b.id, sort_order: a.sort_order }) }),
    ])
    fetchVideos()
  }

  async function loadComments(videoId) {
    const supabase = createClient()
    const { data } = await supabase.from('video_comments').select('*').eq('video_id', videoId).order('created_at', { ascending: false })
    setComments(data || [])
    setShowComments(videoId)
  }

  async function approveComment(id) {
    const supabase = createClient()
    await supabase.from('video_comments').update({ approved: true }).eq('id', id)
    setComments(c => c.map(x => x.id === id ? { ...x, approved: true } : x))
  }

  async function deleteComment(id) {
    const supabase = createClient()
    await supabase.from('video_comments').delete().eq('id', id)
    setComments(c => c.filter(x => x.id !== id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vidéos</h1>
          <p className={styles.sub}>{videos.length} vidéo(s)</p>
        </div>
        <button className={styles.newBtn} onClick={() => { setShowForm(s=>!s); setSaveError(null) }}>
          <Plus size={16} /> Ajouter vidéo
        </button>
      </div>

      {showForm && (
        <div className={styles.addForm}>
          <h3 className={styles.formTitle}>Nouvelle vidéo</h3>
          {saveError && <div className={styles.formError}>{saveError}</div>}
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Titre *</label>
              <input className={styles.input} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Slime ASMR 🔥" maxLength={100}/>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tags <span style={{fontWeight:400,color:'var(--text-muted)'}}>(séparés par virgule)</span></label>
              <input className={styles.input} value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="asmr, slime, tunisie" />
            </div>
            <div className={styles.field} style={{gridColumn:'1/-1'}}>
              <label className={styles.label}>Description</label>
              <textarea className={`${styles.input} ${styles.textarea}`} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} maxLength={300}/>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Fichier vidéo *</label>
              <input type="file" accept="video/mp4,video/webm,video/mov" onChange={e=>uploadVideo(e.target.files?.[0])} className={styles.fileInput}/>
              {uploading && <div className={styles.uploadStatus}>⏳ Upload vidéo en cours…</div>}
              {!uploading && form.video_url && <div className={styles.uploadOk}>✅ Vidéo prête</div>}
              <div style={{marginTop:6,fontSize:'.8rem',color:'var(--text-muted)'}}>Ou coller une URL directe :</div>
              <input className={styles.input} value={form.video_url} onChange={e=>setForm(f=>({...f,video_url:e.target.value}))} placeholder="https://…" style={{marginTop:4}}/>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Miniature (thumbnail)</label>
              <input type="file" accept="image/*" onChange={e=>uploadThumb(e.target.files?.[0])} className={styles.fileInput}/>
              {uploadingThumb && <div className={styles.uploadStatus}>⏳ Upload thumbnail…</div>}
              {form.thumbnail_url && !uploadingThumb && (
                <img src={form.thumbnail_url} alt="aperçu" className={styles.thumbPreview}/>
              )}
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={`${styles.actionBtn} ${styles.actionGhost}`} onClick={()=>{setShowForm(false);setSaveError(null)}}>Annuler</button>
            <button className={`${styles.actionBtn} ${styles.actionGreen}`}
              onClick={saveVideo} disabled={saving || uploading || uploadingThumb}>
              {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        </div>
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
                  {v.published ? '🟢 Publiée' : '⚫ Masquée — cliquez 👁 pour publier'}
                  {v.views > 0 && ` · 👁 ${v.views}`}
                  {v.tags?.length > 0 && ` · ${v.tags.join(', ')}`}
                </div>
              </div>
              <div className={styles.rowActions}>
                <button className={`${styles.actionBtn} ${styles.actionBlue}`} onClick={()=>loadComments(v.id)} title="Commentaires">
                  <MessageCircle size={14}/>
                </button>
                <button className={`${styles.actionBtn} ${v.published?styles.actionYellow:styles.actionGreen}`}
                  onClick={()=>togglePublish(v)} title={v.published?'Masquer':'Publier'}>
                  {v.published ? <EyeOff size={14}/> : <Eye size={14}/>}
                  <span style={{fontSize:'.78rem'}}>{v.published ? 'Masquer' : 'Publier'}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionRed}`} onClick={()=>deleteVideo(v.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showComments && (
        <div className={styles.commentsModal}>
          <div className={styles.commentsModalInner}>
            <div className={styles.commentsHeader}>
              <h3>Commentaires</h3>
              <button onClick={()=>setShowComments(null)}><X size={18}/></button>
            </div>
            {comments.length === 0 && <p style={{color:'var(--text-muted)',padding:'16px',textAlign:'center'}}>Aucun commentaire</p>}
            {comments.map(c => (
              <div key={c.id} className={`${styles.comment} ${c.approved?styles.commentApproved:''}`}>
                <div className={styles.commentMeta}>
                  <strong>{c.author}</strong> · {new Date(c.created_at).toLocaleDateString('fr-TN')}
                  {!c.approved && <span style={{color:'#fbbf24',marginLeft:8}}>En attente</span>}
                </div>
                <div className={styles.commentText}>{c.content}</div>
                <div className={styles.commentActions}>
                  {!c.approved && (
                    <button className={`${styles.actionBtn} ${styles.actionGreen}`} onClick={()=>approveComment(c.id)}>
                      <Check size={12}/> Approuver
                    </button>
                  )}
                  <button className={`${styles.actionBtn} ${styles.actionRed}`} onClick={()=>deleteComment(c.id)}>
                    <Trash2 size={12}/> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
