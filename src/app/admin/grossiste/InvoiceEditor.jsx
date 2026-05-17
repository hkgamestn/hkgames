'use client'
import { useState } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Plus, Trash2, Save, X } from 'lucide-react'
import styles from './grossiste.module.css'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const TVA_RATE = 19

function calcTotals(items, timbre) {
  const total_ht   = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unit_price_ht) || 0), 0)
  const dc         = total_ht * 0.01                    // Droit de consommation 1%
  const tva_base   = total_ht + dc                      // TVA appliquée sur HT+DC
  const tva_amount = tva_base * TVA_RATE / 100
  const total_ttc  = total_ht + dc + tva_amount + parseFloat(timbre || 1)
  return { total_ht, dc, tva_amount, total_ttc }
}

export default function InvoiceEditor({ invoice, tiers, onClose, onSaved }) {
  const isNew = !!invoice._new
  const req   = invoice.request || {}

  const [client, setClient] = useState({
    company_name:     isNew ? (req.company_name     || '') : invoice.company_name,
    contact_name:     isNew ? (req.contact_name     || '') : invoice.contact_name,
    phone:            isNew ? (req.phone             || '') : invoice.phone,
    email:            isNew ? (req.email             || '') : (invoice.email || ''),
    address:          isNew ? (req.address           || '') : invoice.address,
    city:             isNew ? (req.city              || '') : invoice.city,
    matricule_fiscal: isNew ? (req.matricule_fiscal  || '') : invoice.matricule_fiscal,
  })

  const [items, setItems] = useState(
    isNew ? [{ product: '', qty: 1, unit_price_ht: '' }]
          : (invoice.items || [])
  )
  const [timbre, setTimbre] = useState(isNew ? 1 : (invoice.timbre ?? 1))
  const [notes, setNotes]   = useState(isNew ? '' : (invoice.notes || ''))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const { total_ht, dc, tva_amount, total_ttc } = calcTotals(items, timbre)

  function addItem() { setItems(i => [...i, { product: '', qty: 1, unit_price_ht: '' }]) }
  function removeItem(idx) { setItems(i => i.filter((_, j) => j !== idx)) }
  function setItem(idx, field, val) {
    setItems(i => i.map((it, j) => j === idx ? { ...it, [field]: val } : it))
  }
  function setClientField(f, v) { setClient(c => ({ ...c, [f]: v })) }

  function validate() {
    const e = {}
    if (!client.company_name.trim()) e.company_name = 'Requis'
    if (!client.matricule_fiscal.trim()) e.matricule_fiscal = 'Requis'
    if (items.length === 0) e.items = 'Ajoutez au moins une ligne'
    items.forEach((it, i) => {
      if (!it.product.trim()) e[`item_${i}_product`] = 'Requis'
      if (!it.qty || it.qty <= 0) e[`item_${i}_qty`] = 'Invalide'
      if (!it.unit_price_ht || it.unit_price_ht <= 0) e[`item_${i}_price`] = 'Invalide'
    })
    return e
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const supabase = adminClient()
      const payload = {
        ...client,
        items: items.map(it => ({
          product:      it.product.trim(),
          qty:          parseFloat(it.qty),
          unit_price_ht: parseFloat(it.unit_price_ht),
          line_ht:      parseFloat(it.qty) * parseFloat(it.unit_price_ht),
        })),
        tva_rate: TVA_RATE,
        total_ht:   Math.round(total_ht * 1000) / 1000,
        dc_amount:  Math.round(dc * 1000) / 1000,
        tva_amount: Math.round(tva_amount * 1000) / 1000,
        timbre:     parseFloat(timbre),
        total_ttc:  Math.round(total_ttc * 1000) / 1000,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      }
      let saved
      if (isNew) {
        if (req.id) payload.request_id = req.id
        const { data, error } = await supabase.from('wholesale_invoices').insert([payload]).select().single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase.from('wholesale_invoices').update(payload).eq('id', invoice.id).select().single()
        if (error) throw error
        saved = data
      }
      onSaved(saved)
    } catch (err) {
      console.error('save invoice error', err)
      setErrors({ _global: 'Erreur lors de la sauvegarde: ' + (err.message || '') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.editorWrap}>
      <div className={styles.editorHeader}>
        <h2>{isNew ? 'Nouvelle facture' : `Modifier ${invoice.invoice_number || 'facture'}`}</h2>
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
      </div>

      {errors._global && <div className={styles.globalError}>{errors._global}</div>}

      {/* Client */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Informations client</h3>
        <div className={styles.editorGrid}>
          {[
            ['company_name',     'Raison sociale *'],
            ['matricule_fiscal', 'Matricule Fiscal *'],
            ['contact_name',     'Nom responsable'],
            ['phone',            'Téléphone'],
            ['email',            'Email'],
            ['city',             'Ville'],
            ['address',         'Adresse'],
          ].map(([field, label]) => (
            <div key={field} className={styles.editorField}>
              <label className={styles.label}>{label}</label>
              <input className={`${styles.input} ${errors[field] ? styles.inputError : ''}`}
                value={client[field]} onChange={e => setClientField(field, e.target.value)}
                maxLength={200} />
              {errors[field] && <span className={styles.error}>{errors[field]}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Lignes */}
      <div className={styles.editorSection}>
        <div className={styles.editorSectionHeader}>
          <h3 className={styles.editorSectionTitle}>Lignes de facturation</h3>
          <button className={`${styles.actionBtn} ${styles.actionPurple}`} onClick={addItem}>
            <Plus size={14} /> Ajouter ligne
          </button>
        </div>
        {errors.items && <span className={styles.error}>{errors.items}</span>}

        {/* Suggestions paliers */}
        {tiers.length > 0 && (
          <div className={styles.tiersSuggestion}>
            {tiers.map(t => (
              <button key={t.id} className={styles.tierSuggestBtn}
                onClick={() => setItems(i => [...i, { product: `Slime — Palier ${t.label}`, qty: t.min_qty, unit_price_ht: t.price_ht }])}>
                + {t.label} ({t.min_qty}u @ {Number(t.price_ht).toFixed(3)} DT)
              </button>
            ))}
          </div>
        )}

        <div className={styles.itemsTable}>
          <div className={styles.itemsHeader}>
            <span>Désignation</span><span>Qté</span><span>Prix unitaire HT (DT)</span><span>Total HT (DT)</span><span></span>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className={styles.itemRow}>
              <input className={`${styles.input} ${errors[`item_${idx}_product`] ? styles.inputError : ''}`}
                value={it.product} onChange={e => setItem(idx, 'product', e.target.value)}
                placeholder="Description produit" />
              <input className={`${styles.input} ${errors[`item_${idx}_qty`] ? styles.inputError : ''}`}
                type="number" min="1" value={it.qty}
                onChange={e => setItem(idx, 'qty', e.target.value)} />
              <input className={`${styles.input} ${errors[`item_${idx}_price`] ? styles.inputError : ''}`}
                type="number" step="0.001" min="0" value={it.unit_price_ht}
                onChange={e => setItem(idx, 'unit_price_ht', e.target.value)} />
              <div className={styles.itemLineTotal}>
                {((parseFloat(it.qty) || 0) * (parseFloat(it.unit_price_ht) || 0)).toFixed(3)}
              </div>
              <button className={styles.removeItemBtn} onClick={() => removeItem(idx)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className={styles.totalsBox}>
          <div className={styles.totalRow}><span>Total HT</span><span>{total_ht.toFixed(3)} DT</span></div>
          <div className={styles.totalRow}><span>Droit de consommation (1%)</span><span>{dc.toFixed(3)} DT</span></div>
          <div className={styles.totalRow}><span>TVA {TVA_RATE}% (sur HT+DC)</span><span>{tva_amount.toFixed(3)} DT</span></div>
          <div className={styles.totalRow}>
            <span>Timbre fiscal</span>
            <input className={styles.timbreInput} type="number" step="0.001" min="0"
              value={timbre} onChange={e => setTimbre(e.target.value)} />
          </div>
          <div className={`${styles.totalRow} ${styles.totalTTC}`}>
            <span>TOTAL TTC</span><span>{total_ttc.toFixed(3)} DT</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Notes internes</h3>
        <textarea className={`${styles.input} ${styles.textarea}`}
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Notes visibles uniquement en admin…" rows={3} maxLength={500} />
      </div>

      <div className={styles.editorFooter}>
        <button className={`${styles.actionBtn} ${styles.actionGhost}`} onClick={onClose}>Annuler</button>
        <button className={`${styles.actionBtn} ${styles.actionGreen}`} onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Sauvegarde…' : 'Enregistrer & imprimer'}
        </button>
      </div>
    </div>
  )
}
