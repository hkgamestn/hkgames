'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { upsertProduct } from '@/lib/actions/products'
import { formatDT } from '@/lib/utils/formatDT'
import { Plus, Edit3, Archive, ArchiveRestore, X, Save, Package, Tag, Percent } from 'lucide-react'
import styles from './produits.module.css'

const LINE_LABELS = {
  unicolore: { label: 'Unicolore', color: '#ec4899' },
  bicolore:  { label: 'Bicolore',  color: '#06b6d4' },
  buddies:   { label: 'Buddies',   color: '#a855f7' },
}

const EMPTY_PRODUCT = {
  name: '', slug: '', line: 'unicolore',
  price_dt: 12, description: '',
  is_active: true, position: 0,
  colors: [], images: [],
}

export default function ProduitsPage() {
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [editData, setEditData]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  async function fetchProducts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, slug, name, line, price_dt, is_active, position, colors, description')
      .order('position', { ascending: true })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  function openProduct(p) {
    setSelected(p)
    setEditData({ ...p })
    setSaved(false)
  }

  function openNew() {
    setSelected('new')
    setEditData({ ...EMPTY_PRODUCT })
    setSaved(false)
  }

  function closePanel() {
    setSelected(null)
    setEditData(null)
  }

  function set(k, v) {
    setEditData((prev) => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    setSaving(true)
    await upsertProduct(editData)
    setSaving(false)
    setSaved(true)
    fetchProducts()
    setTimeout(() => { setSaved(false); closePanel() }, 800)
  }

  async function handleToggleActive() {
    const supabase = createClient()
    await supabase.from('products').update({ is_active: !editData.is_active }).eq('id', editData.id)
    set('is_active', !editData.is_active)
    fetchProducts()
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Produits</h1>
        <button className={styles.addBtn} onClick={openNew} type="button">
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <p className={styles.loading}>Chargement...</p>
      ) : (
        <div className={styles.table}>
          {/* Head */}
          <div className={styles.tableHead}>
            <span>Produit</span>
            <span>Ligne</span>
            <span>Prix</span>
            <span>Couleurs</span>
            <span>Statut</span>
          </div>

          {products.map((p) => {
            const lineInfo = LINE_LABELS[p.line] || {}
            const colors   = p.colors || []
            return (
              <div
                key={p.id}
                className={`${styles.row} ${!p.is_active ? styles.inactive : ''} ${selected?.id === p.id ? styles.rowSelected : ''}`}
                onClick={() => openProduct(p)}
              >
                {/* Produit */}
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productSlug}>{p.slug}</span>
                </div>

                {/* Ligne */}
                <span className={styles.lineBadge} style={{ borderColor: lineInfo.color + '55', color: lineInfo.color, background: lineInfo.color + '18' }}>
                  {lineInfo.label}
                </span>

                {/* Prix */}
                <span className={styles.price}>{formatDT(p.price_dt)}</span>

                {/* Couleurs */}
                <div className={styles.colorDots}>
                  {colors.slice(0, 5).map((c, i) => (
                    <span key={i} className={styles.colorDot} style={{ background: c.hex || c.hex2 || '#a855f7' }} title={c.name} />
                  ))}
                  {colors.length > 5 && <span className={styles.colorMore}>+{colors.length - 5}</span>}
                </div>

                {/* Statut */}
                <span className={`${styles.statusBadge} ${!p.is_active ? styles.statusInactive : ''}`}>
                  {p.is_active ? 'Actif' : 'Archivé'}
                </span>

                {/* Arrow */}
                <span className={styles.rowArrow}>›</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Panel slide droit */}
      {selected && editData && (
        <>
          <div className={styles.backdrop} onClick={closePanel} />
          <div className={styles.panel}>
            {/* Panel Header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <Package size={18} className={styles.panelIcon} />
                <div>
                  <div className={styles.panelTitle}>
                    {selected === 'new' ? 'Nouveau produit' : editData.name}
                  </div>
                  {selected !== 'new' && (
                    <div className={styles.panelSub}>{editData.slug}</div>
                  )}
                </div>
              </div>
              <button className={styles.panelClose} onClick={closePanel} type="button">
                <X size={18} />
              </button>
            </div>

            {/* Panel Body */}
            <div className={styles.panelBody}>
              {/* Statut toggle */}
              {selected !== 'new' && (
                <div className={styles.statusToggleRow}>
                  <span className={styles.statusToggleLabel}>Statut du produit</span>
                  <button
                    className={`${styles.statusToggleBtn} ${editData.is_active ? styles.statusActive : styles.statusArchived}`}
                    onClick={handleToggleActive}
                    type="button"
                  >
                    {editData.is_active ? <><ArchiveRestore size={14} /> Actif</> : <><Archive size={14} /> Archivé</>}
                  </button>
                </div>
              )}

              {/* Champs */}
              {[
                { key: 'name',        label: 'Nom du produit',  type: 'text'   },
                { key: 'slug',        label: 'Slug (URL)',       type: 'text'   },
                { key: 'price_dt',    label: 'Prix (DT)',        type: 'number' },
                { key: 'position',    label: 'Position',         type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  <input
                    type={type}
                    className={styles.input}
                    value={editData[key] ?? ''}
                    onChange={(e) => set(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                  />
                </div>
              ))}

              <div className={styles.field}>
                <label className={styles.label}>Ligne</label>
                <select className={styles.input} value={editData.line || 'unicolore'} onChange={(e) => set('line', e.target.value)}>
                  <option value="unicolore">Unicolore</option>
                  <option value="bicolore">Bicolore</option>
                  <option value="buddies">Buddies</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={editData.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              {/* ── Section Promo ── */}
              <div className={styles.promoSection}>
                <div className={styles.promoHeader}>
                  <Tag size={14} />
                  <span>Promotion / Réduction</span>
                </div>

                <div className={styles.promoGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Prix promo (DT) <span className={styles.optional}>— vide = pas de promo</span></label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="Ex: 9.500"
                      step="0.001"
                      value={editData.promo_price_dt ?? ''}
                      onChange={(e) => set('promo_price_dt', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Label promo</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: -20%, Offre spéciale..."
                      maxLength={50}
                      value={editData.promo_label || ''}
                      onChange={(e) => set('promo_label', e.target.value || null)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Fin de promo</label>
                    <input
                      type="datetime-local"
                      className={styles.input}
                      value={editData.promo_ends_at ? editData.promo_ends_at.slice(0,16) : ''}
                      onChange={(e) => set('promo_ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                  </div>
                </div>

                {editData.promo_price_dt && editData.price_dt && (
                  <div className={styles.promoPreview}>
                    <Percent size={13} />
                    Réduction de {Math.round((1 - editData.promo_price_dt / editData.price_dt) * 100)}%
                    — {formatDT(editData.price_dt)} → <strong>{formatDT(editData.promo_price_dt)}</strong>
                    {editData.promo_label && <span className={styles.promoPreviewLabel}>{editData.promo_label}</span>}
                  </div>
                )}
              </div>

              {/* Couleurs preview */}
              {(editData.colors || []).length > 0 && (
                <div className={styles.colorsPreview}>
                  <div className={styles.colorsTitle}>Stock par couleur</div>
                  <div className={styles.colorsList}>
                    {editData.colors.map((c, i) => (
                      <div key={i} className={styles.colorItem}>
                        <span className={styles.colorItemDot} style={{ background: c.hex || '#a855f7' }} />
                        <span className={styles.colorItemName}>{c.name}</span>
                        <div className={styles.stockControl}>
                          <button type="button" className={styles.stockBtn}
                            onClick={() => { const u = editData.colors.map((col,idx) => idx===i ? {...col, stock: Math.max(0,(col.stock||0)-1)} : col); set('colors',u) }}>−</button>
                          <input type="number" min="0" className={styles.stockInput}
                            value={c.stock ?? 0}
                            onChange={(e) => { const u = editData.colors.map((col,idx) => idx===i ? {...col, stock: Math.max(0,parseInt(e.target.value)||0)} : col); set('colors',u) }} />
                          <button type="button" className={styles.stockBtn}
                            onClick={() => { const u = editData.colors.map((col,idx) => idx===i ? {...col, stock: (col.stock||0)+1} : col); set('colors',u) }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Panel Footer */}
            <div className={styles.panelFooter}>
              <button className={styles.cancelBtn} onClick={closePanel} type="button">Annuler</button>
              <button
                className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                <Save size={15} />
                {saved ? 'Sauvegardé !' : saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
