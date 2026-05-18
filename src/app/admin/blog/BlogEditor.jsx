'use client'
import { useState } from 'react'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import styles from './blog.module.css'

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,80)
}

export default function BlogEditor({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       post?.title       || '',
    slug:        post?.slug        || '',
    excerpt:     post?.excerpt     || '',
    content:     post?.content     || '',
    cover_image: post?.cover_image || '',
    tags:        post?.tags?.join(', ') || '',
  })
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})
  const [preview, setPreview] = useState(false)

  function set(f, v) { setForm(x => ({ ...x, [f]: v })); if (errors[f]) setErrors(e => ({...e, [f]: null})) }
  function handleTitleChange(v) { set('title', v); if (!post) set('slug', slugify(v)) }

  function validate() {
    const e = {}
    if (!form.title.trim())   e.title   = 'Requis'
    if (!form.slug.trim())    e.slug    = 'Requis'
    if (!form.content.trim()) e.content = 'Requis'
    return e
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        title:       form.title.trim(),
        slug:        slugify(form.slug),
        excerpt:     form.excerpt.trim() || null,
        content:     form.content.trim(),
        cover_image: form.cover_image.trim() || null,
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
        updated_at:  new Date().toISOString(),
      }
      let res
      if (post) {
        res = await fetch('/api/admin/blog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: post.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, published: false }),
        })
      }
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      onSaved()
    } catch (err) {
      setErrors({ _global: err.message || 'Erreur sauvegarde' })
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.editorPage}>
      <div className={styles.editorToolbar}>
        <button className={styles.backBtn} onClick={onClose}><ArrowLeft size={18} /> Retour</button>
        <span className={styles.editorToolbarTitle}>{post ? `Modifier : ${post.title}` : 'Nouvel article'}</span>
        <div style={{display:'flex',gap:8}}>
          <button className={`${styles.actionBtn} ${styles.actionGhost}`} onClick={() => setPreview(p=>!p)}>
            <Eye size={14}/> {preview ? 'Éditer' : 'Aperçu'}
          </button>
          <button className={`${styles.actionBtn} ${styles.actionGreen}`} onClick={handleSave} disabled={saving}>
            <Save size={14}/> {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {errors._global && <div className={styles.globalError}>{errors._global}</div>}

      {preview ? (
        <div className={styles.previewWrap}>
          <h1 style={{fontFamily:'var(--font-title)',fontSize:'2rem',fontWeight:900,color:'var(--text-primary)',marginBottom:16}}>{form.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: form.content }} style={{color:'var(--text-secondary)',lineHeight:1.8}} />
        </div>
      ) : (
        <div className={styles.editorForm}>
          <div className={styles.editorMain}>
            <div className={styles.field}>
              <label className={styles.label}>Titre *</label>
              <input className={`${styles.input} ${errors.title?styles.inputError:''}`}
                value={form.title} onChange={e => handleTitleChange(e.target.value)} maxLength={200}
                placeholder="Titre de l'article" />
              {errors.title && <span className={styles.error}>{errors.title}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Résumé (excerpt)</label>
              <input className={styles.input} value={form.excerpt}
                onChange={e => set('excerpt', e.target.value)} maxLength={300}
                placeholder="Une phrase qui donne envie de lire…" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contenu HTML *</label>
              <textarea className={`${styles.input} ${styles.contentArea} ${errors.content?styles.inputError:''}`}
                value={form.content} onChange={e => set('content', e.target.value)}
                placeholder={'<h2>Introduction</h2>\n<p>Votre contenu…</p>'}
                rows={22} />
              {errors.content && <span className={styles.error}>{errors.content}</span>}
              <span className={styles.hint}>HTML : h2, h3, p, ul, li, strong, em, a, img, blockquote</span>
            </div>
          </div>
          <div className={styles.editorSidebar}>
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>SEO & Slug</div>
              <div className={styles.field}>
                <label className={styles.label}>Slug URL *</label>
                <input className={`${styles.input} ${errors.slug?styles.inputError:''}`}
                  value={form.slug} onChange={e => set('slug', slugify(e.target.value))} maxLength={100}
                  placeholder="mon-article-slime" />
                {errors.slug && <span className={styles.error}>{errors.slug}</span>}
                <span className={styles.hint}>hap-p-kids.store/blog/{form.slug||'...'}</span>
              </div>
            </div>
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>Image de couverture</div>
              <div className={styles.field}>
                <label className={styles.label}>URL image</label>
                <input className={styles.input} value={form.cover_image}
                  onChange={e => set('cover_image', e.target.value)} placeholder="https://…" />
                {form.cover_image && (
                  <img src={form.cover_image} alt="aperçu" className={styles.coverPreview}
                    onError={e => e.target.style.display='none'} />
                )}
              </div>
            </div>
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>Tags</div>
              <div className={styles.field}>
                <input className={styles.input} value={form.tags}
                  onChange={e => set('tags', e.target.value)} placeholder="slime, tunisie, enfant" />
                <span className={styles.hint}>Séparés par des virgules</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
