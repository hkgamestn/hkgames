'use client'
import { useState, useEffect } from 'react'
import { updateOrderItems } from '@/lib/actions/orders'
import { createClient } from '@/lib/supabase/client'
import { Plus, Minus, Trash2, X } from 'lucide-react'
import styles from './OrderEditPanel.module.css'

const GOVERNORATS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili']
const STATUSES    = ['pending','confirmed','on_hold','shipped','delivered','cancelled']

export default function OrderEditPanel({ order, onClose, onSaved }) {
  const [form, setForm]       = useState({})
  const [items, setItems]     = useState([])
  const [products, setProducts] = useState([])
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Charger les produits disponibles
  useEffect(() => {
    const supabase = createClient()
    supabase.from('products').select('id, name, line, price_dt, colors').eq('is_active', true)
      .then(({ data }) => setProducts(data || []))
  }, [])

  useEffect(() => {
    if (!order) return
    setForm({
      customer_name:    order.customer_name    || '',
      customer_phone:   order.customer_phone   || '',
      customer_address: order.customer_address || '',
      customer_city:    order.customer_city    || '',
      customer_notes:   order.customer_notes   || '',
      status:           order.status           || 'pending',
    })
    setItems((order.items || []).map((it, i) => ({ ...it, _key: i })))
    setSaved(false)
  }, [order])

  if (!order) return null

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  // ── Items CRUD ─────────────────────────────────────────────
  function addItem() {
    if (!products.length) return
    const p = products[0]
    const colors = Array.isArray(p.colors) ? p.colors : []
    setItems(prev => [...prev, {
      _key:      Date.now(),
      product_id: p.id,
      name:      p.name,
      line:      p.line,
      price_dt:  p.price_dt,
      qty:       1,
      color:     colors[0]?.name || '',
      color_hex: colors[0]?.hex  || '#a855f7',
    }])
  }

  function removeItem(key) {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  function updateItem(key, field, value) {
    setItems(prev => prev.map(it => {
      if (it._key !== key) return it
      if (field === 'product_id') {
        const p = products.find(p => p.id === value)
        if (!p) return it
        const colors = Array.isArray(p.colors) ? p.colors : []
        return {
          ...it,
          product_id: p.id,
          name:      p.name,
          line:      p.line,
          price_dt:  p.price_dt,
          color:     colors[0]?.name || '',
          color_hex: colors[0]?.hex  || '#a855f7',
        }
      }
      if (field === 'color') {
        const p = products.find(p => p.id === it.product_id)
        const colors = Array.isArray(p?.colors) ? p.colors : []
        const c = colors.find(c => c.name === value)
        return { ...it, color: value, color_hex: c?.hex || it.color_hex }
      }
      return { ...it, [field]: value }
    }))
  }

  // Calcul totaux
  // Lire les vraies valeurs depuis la commande originale (ne pas recalculer)
  const shipping    = parseFloat(order.shipping_dt ?? 8)
  const discountAmt = parseFloat(order.discount_dt ?? 0)
  const subtotal    = items.reduce((s, i) => s + (parseFloat(i.price_dt) || 0) * (parseInt(i.qty) || 1), 0)
  const total       = parseFloat((subtotal + shipping - discountAmt).toFixed(3))

  async function handleSave() {
    setSaving(true)
    const cleanItems = items.map(({ _key, ...rest }) => ({
      ...rest,
      qty:      parseInt(rest.qty) || 1,
      price_dt: parseFloat(rest.price_dt) || 0,
    }))
    await updateOrderItems(order.id, {
      customer_name:    form.customer_name.trim(),
      customer_phone:   form.customer_phone.trim(),
      customer_address: form.customer_address.trim(),
      customer_city:    form.customer_city,
      customer_notes:   form.customer_notes.trim(),
      status:           form.status,
      items:            cleanItems,
      subtotal_dt:      subtotal,
      shipping_dt:      shipping,
      discount_dt:      discountAmt,
      total_dt:         total,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved(); onClose() }, 700)
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Modifier la commande</div>
            <div className={styles.panelSub}>#{order.order_number || order.id.slice(0,8).toUpperCase()}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className={styles.panelBody}>
          {/* Infos client */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>👤 Informations client</div>
            {[
              { label: 'Nom complet', key: 'customer_name', type: 'text', placeholder: 'Prénom Nom' },
              { label: 'Téléphone',   key: 'customer_phone', type: 'tel', placeholder: '2X XXX XXX' },
              { label: 'Adresse',     key: 'customer_address', type: 'textarea', placeholder: 'Rue, immeuble, appartement...' },
              { label: 'Notes livraison', key: 'customer_notes', type: 'textarea', placeholder: 'Instructions spéciales...' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} className={styles.field}>
                <label className={styles.label}>{label}</label>
                {type === 'textarea'
                  ? <textarea className={styles.textarea} value={form[key] || ''} onChange={e => set(key, e.target.value)} rows={2} placeholder={placeholder} />
                  : <input className={styles.input} type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                }
              </div>
            ))}

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Gouvernorat</label>
                <select className={styles.select} value={form.customer_city || ''} onChange={e => set('customer_city', e.target.value)}>
                  <option value="">-- Choisir --</option>
                  {GOVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Statut</label>
                <select className={styles.select} value={form.status || ''} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>🛍️ Produits</div>
              <button className={styles.addItemBtn} onClick={addItem} type="button" disabled={!products.length}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {items.length === 0 && (
              <div className={styles.emptyItems}>Aucun produit — clique sur Ajouter</div>
            )}

            {items.map((item) => {
              const p = products.find(p => p.id === item.product_id)
              const colors = Array.isArray(p?.colors) ? p.colors : []
              return (
                <div key={item._key} className={styles.itemRow}>
                  <div className={styles.itemDot} style={{ background: item.color_hex || '#a855f7' }} />

                  <div className={styles.itemFields}>
                    {/* Produit */}
                    <select
                      className={styles.itemSelect}
                      value={item.product_id || ''}
                      onChange={e => updateItem(item._key, 'product_id', e.target.value)}
                    >
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    {/* Couleur */}
                    {colors.length > 0 && (
                      <select
                        className={styles.itemSelect}
                        value={item.color || ''}
                        onChange={e => updateItem(item._key, 'color', e.target.value)}
                      >
                        {colors.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    )}

                    {/* Prix + Qté */}
                    <div className={styles.itemControls}>
                      <input
                        className={styles.priceInput}
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.price_dt || ''}
                        onChange={e => updateItem(item._key, 'price_dt', e.target.value)}
                        title="Prix DT"
                      />
                      <span className={styles.dtLabel}>DT</span>

                      <button className={styles.qtyBtn} type="button"
                        onClick={() => updateItem(item._key, 'qty', Math.max(1, (item.qty || 1) - 1))}>
                        <Minus size={12} />
                      </button>
                      <span className={styles.qtyVal}>{item.qty || 1}</span>
                      <button className={styles.qtyBtn} type="button"
                        onClick={() => updateItem(item._key, 'qty', (item.qty || 1) + 1)}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <button className={styles.removeBtn} onClick={() => removeItem(item._key)} type="button">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}

            {/* Totaux */}
            {items.length > 0 && (
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Sous-total</span>
                  <span>{subtotal.toFixed(2)} DT</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Livraison</span>
                  <span>{shipping === 0 ? 'Gratuite' : `${shipping} DT`}</span>
                </div>
                {discountAmt > 0 && (
                  <div className={styles.totalRow}>
                    <span>Remise bundle</span>
                    <span style={{ color: '#10b981' }}>−{discountAmt.toFixed(2)} DT</span>
                  </div>
                )}
                <div className={styles.totalRow + ' ' + styles.totalFinal}>
                  <span>Total</span>
                  <span>{total.toFixed(2)} DT</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">Annuler</button>
          <button
            className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saved ? '✓ Sauvegardé !' : saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </>
  )
}
