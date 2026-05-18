'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Globe } from 'lucide-react'
import BlogEditor from './BlogEditor'
import styles from './blog.module.css'

export default function AdminBlogPage() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/blog')
    const data = await res.json()
    setPosts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function togglePublish(post) {
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:           post.id,
        published:    !post.published,
        published_at: !post.published ? new Date().toISOString() : null,
        updated_at:   new Date().toISOString(),
      }),
    })
    fetchPosts()
  }

  async function deletePost(id) {
    if (!confirm('Supprimer cet article ?')) return
    await fetch('/api/admin/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPosts(p => p.filter(x => x.id !== id))
  }

  if (editing !== null) return (
    <BlogEditor
      post={editing === 'new' ? null : editing}
      onClose={() => setEditing(null)}
      onSaved={() => { setEditing(null); fetchPosts() }}
    />
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Blog</h1>
          <p className={styles.sub}>{posts.length} article(s)</p>
        </div>
        <button className={styles.newBtn} onClick={() => setEditing('new')}>
          <Plus size={16} /> Nouvel article
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement…</div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>Aucun article. Créez le premier ! 📝<br/><small style={{color:'var(--text-muted)'}}>Pensez à exécuter le SQL des 10 articles dans Supabase.</small></div>
      ) : (
        <div className={styles.list}>
          {posts.map(post => (
            <div key={post.id} className={styles.row}>
              <div className={styles.rowLeft}>
                {post.cover_image && (
                  <img src={post.cover_image} alt="" className={styles.rowThumb} />
                )}
                <div>
                  <div className={styles.rowTitle}>{post.title}</div>
                  <div className={styles.rowMeta}>
                    <span className={`${styles.statusDot} ${post.published ? styles.statusDotGreen : styles.statusDotGray}`} />
                    {post.published ? 'Publié' : 'Brouillon'}
                    {post.published_at && ` — ${new Date(post.published_at).toLocaleDateString('fr-TN')}`}
                    {post.views > 0 && ` · 👁 ${post.views}`}
                  </div>
                  {post.tags?.length > 0 && (
                    <div className={styles.rowTags}>
                      {post.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.rowActions}>
                {post.published && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className={styles.actionBtn}>
                    <Globe size={14} />
                  </a>
                )}
                <button className={`${styles.actionBtn} ${post.published ? styles.actionYellow : styles.actionGreen}`}
                  onClick={() => togglePublish(post)}>
                  {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{post.published ? 'Masquer' : 'Publier'}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionPurple}`} onClick={() => setEditing(post)}>
                  <Pencil size={14} />
                </button>
                <button className={`${styles.actionBtn} ${styles.actionRed}`} onClick={() => deletePost(post.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
