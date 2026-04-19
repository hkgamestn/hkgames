'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'
import styles from './parametres.module.css'

const SETTINGS_GROUPS = [
  {
    title: '📦 Livraison',
    keys: {
      free_shipping_threshold_dt: { label: 'Seuil livraison gratuite (DT)', type: 'number' },
      shipping_price_dt:          { label: 'Prix livraison standard (DT)',   type: 'number' },
      shipping_timer_cutoff:      { label: 'Heure limite livraison J+1',     type: 'text'   },
      navex_api_key:              { label: 'Navex API Key',                  type: 'password' },
    }
  },
  {
    title: '🎁 Remises Bundles (%)',
    keys: {
      bundle_decouverte_pct: { label: 'Remise Pack Découverte (%)',      type: 'number' },
      bundle_alchimiste_pct: { label: 'Remise Pack Alchimiste (%)',      type: 'number' },
      bundle_famille_pct:    { label: 'Remise Pack Famille Monstre (%)', type: 'number' },
      bundle_decouverte_enabled: { label: 'Bundle Découverte actif',     type: 'toggle' },
      bundle_alchimiste_enabled: { label: 'Bundle Alchimiste actif',     type: 'toggle' },
      bundle_famille_enabled:    { label: 'Bundle Famille Monstre actif',type: 'toggle' },
    }
  },
  {
    title: '📊 Marketing & Tracking',
    keys: {
      fb_pixel_id:           { label: 'Facebook Pixel ID',               type: 'text'     },
      fb_conversion_api_key: { label: 'Facebook Conversion API Key',     type: 'password' },
    }
  },
  {
    title: '🛍️ Boutique',
    keys: {
      stock_alert_threshold: { label: 'Seuil stock badge orange', type: 'number' },
      oto_discount_dt:       { label: 'Réduction OTO (DT)',        type: 'number' },
      oto_enabled:           { label: 'Activer OTO',               type: 'toggle' },
    }
  },
]

export default function ParametresPage() {
  const [settings, setSettings] = useState({})
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('settings').select('key, value').then(({ data }) => {
      const map = {}
      ;(data || []).forEach((s) => { map[s.key] = s.value })
      setSettings(map)
    })
  }, [])

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: String(value) }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
      )
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Paramètres</h1>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving} type="button">
          <Save size={16} />
          {saving ? 'Enregistrement...' : saved ? '✅ Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} className={styles.group}>
          <h2 className={styles.groupTitle}>{group.title}</h2>
          <div className={styles.grid}>
            {Object.entries(group.keys).map(([key, meta]) => (
              <div key={key} className={styles.field}>
                <label className={styles.label}>{meta.label}</label>
                {meta.type === 'toggle' ? (
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={settings[key] === 'true'} onChange={(e) => handleChange(key, e.target.checked ? 'true' : 'false')} />
                    <span className={styles.toggleSlider} />
                  </label>
                ) : (
                  <input
                    type={meta.type === 'password' ? 'password' : meta.type}
                    className={styles.input}
                    value={settings[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={meta.type === 'password' ? '••••••••' : ''}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
