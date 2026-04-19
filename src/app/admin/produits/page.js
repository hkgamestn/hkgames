'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { upsertProduct } from '@/lib/actions/products'
import { formatDT } from '@/lib/utils/formatDT'
import { Plus, Edit3, Archive } from 'lucide-react'
import styles from './produits.module.css'

export default function ProduitsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving]     = useState(false)

  async function fetchProducts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, slug, name, line, price_dt, is_active, position, colors')
      .order('position', { ascending: true })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  async function handleToggleActive(product) {
    const supabase = createClient()
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    fetchProducts()
  }

  async function handleSave() {
    setSaving(true)
    await upsertProduct(editProduct)
    setSaving(false)
    setEditProduct(null)
    fetchProducts()
  }

  const LINE_LABELS = { unicolore: 'Unicolore', bicolore: 'Bicolore', buddies: 'Buddies' }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Produits</h1>
        <button
          className={styles.addBtn}
          onClick={() => setEditProduct({ name: '', slug: '', line: 'unicolore', price_dt: 12, description: '', is_active: true, position: 0, colors: [], images: [] })}
          type="button"
        >
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Chargement...</p>
      ) : (
        <div className={styles.table}>
          {products.map((p) => (
            <div key={p.id} className={`${styles.row} ${!p.is_active ? styles.inactive : ''}`}>
              <div>
                <p className={styles.productName}>{p.name}</p>
                <p className={styles.productSlug}>{p.slug}</p>
              </div>
              <span className={styles.lineBadge}>{LINE_LABELS[p.line]}</span>
              <span className={styles.price}>{formatDT(p.price_dt)}</span>
              <span className={`${styles.statusDot} ${p.is_active ? styles.active : styles.archived}`}>
                {p.is_active ? 'Actif' : 'Archivé'}
              </span>
              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => setEditProduct({ ...p })} type="button" title="Modifier">
                  <Edit3 size={15} />
                </button>
                <button className={styles.archiveBtn} onClick={() => handleToggleActive(p)} type="button" title={p.is_active ? 'Archiver' : 'Activer'}>
                  <Archive size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editProduct && (
        <div className={styles.overlay} onClick={() => setEditProduct(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editProduct.id ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <div className={styles.formGrid}>
              {[
                { key: 'name', label: 'Nom', type: 'text' },
                { key: 'slug', label: 'Slug (URL)', type: 'text' },
                { key: 'price_dt', label: 'Prix (DT)', type: 'number' },
                { key: 'position', label: 'Position', type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  <input
                    type={type}
                    className={styles.input}
                    value={editProduct[key] || ''}
                    onChange={(e) => setEditProduct((p) => ({ ...p, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                  />
                </div>
              ))}
              <div className={styles.field}>
                <label className={styles.label}>Ligne</label>
                <select className={styles.input} value={editProduct.line} onChange={(e) => setEditProduct((p) => ({ ...p, line: e.target.value }))}>
                  <option value="unicolore">Unicolore</option>
                  <option value="bicolore">Bicolore</option>
                  <option value="buddies">Buddies</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} rows={3} value={editProduct.description || ''} onChange={(e) => setEditProduct((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving} type="button">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button className={styles.cancelBtn} onClick={() => setEditProduct(null)} type="button">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
