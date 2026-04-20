'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAdminOrder } from '@/lib/actions/orders'
import { Plus, Minus, Trash2, X, ShoppingBag } from 'lucide-react'
import styles from './CreateOrderModal.module.css'

const GOVERNORATS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili']

export default function CreateOrderModal({ onClose, onCreated }) {
  const [products, setProducts] = useState([])
  const [items, setItems]       = useState([])
  const [form, setForm]         = useState({
    customer_name: '', customer_phone: '', customer_address: '',
    customer_city: 'Tunis', customer_notes: '',
  })
  const [saving, setSaving]  = useState(false)
  const [error, setError]    = useState(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('products').select('id, name, line, price_dt, colors').eq('is_active', true)
      .then(({ data }) => {
        const prods = data || []
        setProducts(prods)
        // Pré-ajouter un item vide
        if (prods.length > 0) {
          const p = prods[0]
          const colors = Array.isArray(p.colors) ? p.colors : []
          setItems([{
            _key: Date.now(), product_id: p.id, name: p.name,
            line: p.line, price_dt: p.price_dt, qty: 1,
            color: colors[0]?.name || '', color_hex: colors[0]?.hex || '#a855f7',
          }])
        }
      })
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addItem() {
    if (!products.length) return
    const p = products[0]
    const colors = Array.isArray(p.colors) ? p.colors : []
    setItems(prev => [...prev, {
      _key: Date.now(), product_id: p.id, name: p.name,
      line: p.line, price_dt: p.price_dt, qty: 1,
      color: colors[0]?.name || '', color_hex: colors[0]?.hex || '#a855f7',
    }])
  }

  function removeItem(key) { setItems(prev => prev.filter(i => i._key !== key)) }

  function updateItem(key, field, value) {
    setItems(prev => prev.map(it => {
      if (it._key !== key) return it
      if (field === 'product_id') {
        const p = products.find(p => p.id === value)
        if (!p) return it
        const colors = Array.isArray(p.colors) ? p.colors : []
        return { ...it, product_id: p.id, name: p.name, line: p.line, price_dt: p.price_dt,
          color: colors[0]?.name || '', color_hex: colors[0]?.hex || '#a855f7' }
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

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price_dt) || 0) * (parseInt(i.qty) || 1), 0)
  const shipping = 8
  const total    = subtotal + shipping

  async function handleCreate() {
    setError(null)
    if (!form.customer_name.trim()) return setError('Nom client obligatoire')
    if (!form.customer_phone.trim()) return setError('Téléphone obligatoire')
    if (items.length === 0) return setError('Ajoute au moins un produit')

    setSaving(true)
    const cleanItems = items.map(({ _key, ...rest }) => ({
      ...rest, qty: parseInt(rest.qty) || 1, price_dt: parseFloat(rest.price_dt) || 0,
    }))

    const phone = form.customer_phone.trim().startsWith('+')
      ? form.customer_phone.trim()
      : '+216' + form.customer_phone.trim().replace(/^0+/, '')

    const result = await createAdminOrder({
      customer_name:    form.customer_name.trim(),
      customer_phone:   phone,
      customer_address: form.customer_address.trim(),
      customer_city:    form.customer_city,
      customer_notes:   form.customer_notes.trim(),
      items:            cleanItems,
      subtotal_dt:      subtotal,
      shipping_dt:      shipping,
      total_dt:         total,
    })

    setSaving(false)
    if (result?.error) return setError(result.error)
    onCreated()
    onClose()
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ShoppingBag size={20} className={styles.headerIcon} />
            <div>
              <div className={styles.title}>Nouvelle commande</div>
              <div className={styles.sub}>Commande créée manuellement par l&apos;admin</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button"><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* Client */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>👤 Client</div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Nom complet *</label>
                <input className={styles.input} value={form.customer_name}
                  onChange={e => set('customer_name', e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Téléphone *</label>
                <input className={styles.input} type="tel" value={form.customer_phone}
                  onChange={e => set('customer_phone', e.target.value)} placeholder="2X XXX XXX" />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Gouvernorat</label>
                <select className={styles.select} value={form.customer_city}
                  onChange={e => set('customer_city', e.target.value)}>
                  {GOVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Adresse</label>
                <input className={styles.input} value={form.customer_address}
                  onChange={e => set('customer_address', e.target.value)} placeholder="Rue, immeuble..." />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Notes livraison</label>
              <textarea className={styles.textarea} rows={2} value={form.customer_notes}
                onChange={e => set('customer_notes', e.target.value)} placeholder="Instructions spéciales..." />
            </div>
          </div>

          {/* Produits */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>🛍️ Produits</div>
              <button className={styles.addBtn} onClick={addItem} type="button">
                <Plus size={14} /> Ajouter un produit
              </button>
            </div>

            {items.map((item) => {
              const p = products.find(p => p.id === item.product_id)
              const colors = Array.isArray(p?.colors) ? p.colors : []
              return (
                <div key={item._key} className={styles.itemRow}>
                  <div className={styles.itemDot} style={{ background: item.color_hex || '#a855f7' }} />
                  <div className={styles.itemFields}>
                    <select className={styles.itemSelect} value={item.product_id || ''}
                      onChange={e => updateItem(item._key, 'product_id', e.target.value)}>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    {colors.length > 0 && (
                      <select className={styles.itemSelect} value={item.color || ''}
                        onChange={e => updateItem(item._key, 'color', e.target.value)}>
                        {colors.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    )}

                    <div className={styles.itemControls}>
                      <input className={styles.priceInput} type="number" min="0" step="0.5"
                        value={item.price_dt || ''} title="Prix DT"
                        onChange={e => updateItem(item._key, 'price_dt', e.target.value)} />
                      <span className={styles.dtLabel}>DT</span>
                      <button className={styles.qtyBtn} type="button"
                        onClick={() => updateItem(item._key, 'qty', Math.max(1, (item.qty||1)-1))}>
                        <Minus size={12} />
                      </button>
                      <span className={styles.qtyVal}>{item.qty || 1}</span>
                      <button className={styles.qtyBtn} type="button"
                        onClick={() => updateItem(item._key, 'qty', (item.qty||1)+1)}>
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

            {items.length > 0 && (
              <div className={styles.totals}>
                <div className={styles.totalRow}><span>Sous-total</span><span>{subtotal.toFixed(2)} DT</span></div>
                <div className={styles.totalRow}><span>Livraison</span><span>{shipping} DT</span></div>
                <div className={`${styles.totalRow} ${styles.totalFinal}`}><span>Total</span><span>{total.toFixed(2)} DT</span></div>
              </div>
            )}
          </div>

          {error && <div className={styles.error}>⚠️ {error}</div>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">Annuler</button>
          <button className={styles.createBtn} onClick={handleCreate} disabled={saving} type="button">
            {saving ? 'Création...' : '✓ Créer la commande'}
          </button>
        </div>
      </div>
    </>
  )
}
