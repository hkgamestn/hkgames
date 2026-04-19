'use client'
import { useState, useEffect } from 'react'
import { updateOrderItems } from '@/lib/actions/orders'
import styles from './OrderEditPanel.module.css'

const GOVERNORATS = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili']
const STATUSES = ['pending','confirmed','on_hold','shipped','delivered','cancelled']

export default function OrderEditPanel({ order, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (order) setForm({
      customer_name:    order.customer_name    || '',
      customer_phone:   order.customer_phone   || '',
      customer_address: order.customer_address || '',
      customer_city:    order.customer_city    || '',
      customer_notes:   order.customer_notes   || '',
      status:           order.status           || 'pending',
    })
  }, [order])

  if (!order) return null

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    await updateOrderItems(order.id, {
      customer_name:    form.customer_name.trim(),
      customer_phone:   form.customer_phone.trim(),
      customer_address: form.customer_address.trim(),
      customer_city:    form.customer_city,
      customer_notes:   form.customer_notes.trim(),
      status:           form.status,
      items:            order.items || [],
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved(); onClose() }, 800)
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Modifier la commande</div>
            <div className={styles.panelSub}>#{order.order_number || order.id.slice(0,8)}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.panelBody}>
          {[
            { label: 'Nom client', key: 'customer_name', type: 'text' },
            { label: 'Téléphone', key: 'customer_phone', type: 'tel' },
            { label: 'Adresse', key: 'customer_address', type: 'textarea' },
            { label: 'Notes livraison', key: 'customer_notes', type: 'textarea' },
          ].map(({ label, key, type }) => (
            <div key={key} className={styles.field}>
              <label className={styles.label}>{label}</label>
              {type === 'textarea'
                ? <textarea className={styles.textarea} value={form[key] || ''} onChange={e => set(key, e.target.value)} rows={2} />
                : <input className={styles.input} type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)} />
              }
            </div>
          ))}

          <div className={styles.field}>
            <label className={styles.label}>Gouvernorat</label>
            <select className={styles.select} value={form.customer_city || ''} onChange={e => set('customer_city', e.target.value)}>
              {GOVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Statut</label>
            <select className={styles.select} value={form.status || ''} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {order.items?.length > 0 && (
            <div className={styles.itemsPreview}>
              <div className={styles.itemsTitle}>Produits (lecture seule)</div>
              {order.items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <div className={styles.itemDot} style={{ background: item.color_hex || '#a855f7' }} />
                  <span>{item.name} {item.color ? `(${item.color})` : ''} ×{item.qty}</span>
                  <span className={styles.itemPrice}>{item.price_dt} DT</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Annuler</button>
          <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`} onClick={handleSave} disabled={saving}>
            {saved ? '✓ Sauvegardé !' : saving ? 'Sauvegarde...' : 'Confirmer les modifications'}
          </button>
        </div>
      </div>
    </>
  )
}
