'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical } from 'lucide-react'
import styles from './tiers.module.css'

export default function WholesaleTiersPage() {
  const [tiers,   setTiers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchTiers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('wholesale_tiers').select('*').order('sort_order')
    setTiers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTiers() }, [fetchTiers])

  function setField(id, field, val) {
    setTiers(t => t.map(x => x.id === id ? { ...x, [field]: val } : x))
  }

  async function saveTier(tier) {
    setSaving(tier.id); setError(null); setSuccess(null)
    const supabase = createClient()
    const { error } = await supabase.from('wholesale_tiers').update({
      label:      tier.label,
      min_qty:    parseInt(tier.min_qty, 10),
      max_qty:    tier.max_qty ? parseInt(tier.max_qty, 10) : null,
      price_ht:   parseFloat(tier.price_ht),
      active:     tier.active,
    }).eq('id', tier.id)
    if (error) setError('Erreur: ' + error.message)
    else setSuccess(`Palier "${tier.label}" sauvegardé ✅`)
    setSaving(null)
    setTimeout(() => setSuccess(null), 2500)
  }

  async function toggleActive(tier) {
    const supabase = createClient()
    await supabase.from('wholesale_tiers').update({ active: !tier.active }).eq('id', tier.id)
    setTiers(t => t.map(x => x.id === tier.id ? { ...x, active: !x.active } : x))
  }

  async function deleteTier(id) {
    if (!confirm('Supprimer ce palier ?')) return
    const supabase = createClient()
    await supabase.from('wholesale_tiers').delete().eq('id', id)
    setTiers(t => t.filter(x => x.id !== id))
  }

  async function addTier() {
    const supabase = createClient()
    const maxOrder = Math.max(...tiers.map(t => t.sort_order || 0), 0)
    const { data } = await supabase.from('wholesale_tiers').insert([{
      label: 'Nouveau palier',
      min_qty: 10,
      max_qty: null,
      price_ht: 10.000,
      sort_order: maxOrder + 1,
      active: true,
    }]).select().single()
    if (data) setTiers(t => [...t, data])
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Grille tarifaire grossiste</h1>
          <p className={styles.sub}>Configurer les paliers de prix HT par quantité</p>
        </div>
        <button className={styles.addBtn} onClick={addTier}>
          <Plus size={16}/> Ajouter palier
        </button>
      </div>

      {error   && <div className={styles.errorMsg}>{error}</div>}
      {success && <div className={styles.successMsg}>{success}</div>}

      {loading ? (
        <div className={styles.loading}>Chargement…</div>
      ) : (
        <>
          {/* Header row */}
          <div className={styles.tableHeader}>
            <span>Nom palier</span>
            <span>Qté min</span>
            <span>Qté max</span>
            <span>Prix HT / unité (DT)</span>
            <span>État</span>
            <span>Actions</span>
          </div>

          <div className={styles.tiersList}>
            {tiers.map(tier => (
              <div key={tier.id} className={`${styles.tierRow} ${!tier.active ? styles.tierRowInactive : ''}`}>
                <div className={styles.field}>
                  <input
                    className={styles.input}
                    value={tier.label}
                    onChange={e => setField(tier.id, 'label', e.target.value)}
                    placeholder="Nom du palier"
                    maxLength={40}
                  />
                </div>

                <div className={styles.field}>
                  <input
                    className={styles.input}
                    type="number" min="1"
                    value={tier.min_qty}
                    onChange={e => setField(tier.id, 'min_qty', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <input
                    className={styles.input}
                    type="number" min="1"
                    value={tier.max_qty || ''}
                    onChange={e => setField(tier.id, 'max_qty', e.target.value)}
                    placeholder="∞"
                  />
                </div>

                <div className={styles.field}>
                  <div className={styles.priceField}>
                    <input
                      className={`${styles.input} ${styles.priceInput}`}
                      type="number" step="0.001" min="0"
                      value={tier.price_ht}
                      onChange={e => setField(tier.id, 'price_ht', e.target.value)}
                    />
                    <span className={styles.priceSuffix}>DT HT</span>
                  </div>
                  <div className={styles.priceTTC}>
                    TTC ≈ {(parseFloat(tier.price_ht||0) * 1.20).toFixed(3)} DT
                  </div>
                </div>

                <div className={styles.field}>
                  <button
                    className={`${styles.toggleBtn} ${tier.active ? styles.toggleActive : styles.toggleInactive}`}
                    onClick={() => toggleActive(tier)}>
                    {tier.active ? <><Eye size={14}/> Actif</> : <><EyeOff size={14}/> Masqué</>}
                  </button>
                </div>

                <div className={styles.actions}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionSave}`}
                    onClick={() => saveTier(tier)}
                    disabled={saving === tier.id}>
                    <Save size={14}/>
                    {saving === tier.id ? 'Sauvegarde…' : 'Sauvegarder'}
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={() => deleteTier(tier.id)}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className={styles.preview}>
            <h3 className={styles.previewTitle}>Aperçu affiché sur la page grossiste</h3>
            <div className={styles.previewGrid}>
              {tiers.filter(t => t.active).map(t => (
                <div key={t.id} className={styles.previewCard}>
                  <div className={styles.previewLabel}>{t.label}</div>
                  <div className={styles.previewQty}>
                    {t.min_qty}{t.max_qty ? `–${t.max_qty}` : '+'} unités
                  </div>
                  <div className={styles.previewPrice}>
                    {parseFloat(t.price_ht).toFixed(3)} <span>DT/u HT</span>
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.previewNote}>TVA 19% + DC 1% applicables sur les factures</p>
          </div>
        </>
      )}
    </div>
  )
}
