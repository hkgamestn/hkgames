'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload, Volume2, Check } from 'lucide-react'
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
      bundle_decouverte_pct:     { label: 'Remise Pack Découverte (%)',       type: 'number' },
      bundle_alchimiste_pct:     { label: 'Remise Pack Alchimiste (%)',       type: 'number' },
      bundle_famille_pct:        { label: 'Remise Pack Famille Monstre (%)',  type: 'number' },
      bundle_decouverte_enabled: { label: 'Bundle Découverte actif',          type: 'toggle' },
      bundle_alchimiste_enabled: { label: 'Bundle Alchimiste actif',          type: 'toggle' },
      bundle_famille_enabled:    { label: 'Bundle Famille Monstre actif',     type: 'toggle' },
    }
  },
  {
    title: '📊 Marketing & Tracking',
    keys: {
      fb_pixel_id:           { label: 'Facebook Pixel ID',           type: 'text'     },
      fb_conversion_api_key: { label: 'Facebook Conversion API Key', type: 'password' },
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

const SOUNDS = [
  { key: 'sound_new_order',  label: 'Son nouvelle commande',  default: '/sounds/new-order.mp3'  },
  { key: 'sound_confirmed',  label: 'Son commande confirmée', default: '/sounds/confirmed.mp3'  },
]

export default function ParametresPage() {
  const [settings, setSettings] = useState({})
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [soundUploading, setSoundUploading] = useState({})
  const [soundUploaded, setSoundUploaded]   = useState({})
  const fileRefs = useRef({})

  useEffect(() => {
    const supabase = createClient()
    supabase.from('settings').select('key, value').then(({ data }) => {
      const map = {}
      ;(data || []).forEach((s) => { map[s.key] = s.value })
      setSettings(map)
    })
  }, [])

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }))
    await supabase.from('settings').upsert(upserts, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSoundUpload(soundKey, file) {
    if (!file) return
    setSoundUploading((p) => ({ ...p, [soundKey]: true }))
    const supabase = createClient()
    const path = `sounds/${soundKey}.mp3`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true, contentType: 'audio/mpeg' })
    if (!error) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      await supabase.from('settings').upsert({ key: soundKey, value: urlData.publicUrl }, { onConflict: 'key' })
      setSettings((p) => ({ ...p, [soundKey]: urlData.publicUrl }))
      setSoundUploaded((p) => ({ ...p, [soundKey]: true }))
      setTimeout(() => setSoundUploaded((p) => ({ ...p, [soundKey]: false })), 2500)
    } else {
      alert('Erreur upload: ' + error.message)
    }
    setSoundUploading((p) => ({ ...p, [soundKey]: false }))
  }

  function previewSound(soundKey) {
    const url = settings[soundKey]
    if (!url) return
    new Audio(url).play().catch(() => {})
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Paramètres</h1>
        <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`} onClick={handleSave} disabled={saving} type="button">
          {saved ? <><Check size={15} /> Sauvegardé</> : saving ? 'Sauvegarde...' : <><Save size={15} /> Enregistrer</>}
        </button>
      </div>

      <div className={styles.groups}>
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title} className={styles.group}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <div className={styles.fields}>
              {Object.entries(group.keys).map(([key, { label, type }]) => (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  {type === 'toggle' ? (
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={settings[key] === 'true' || settings[key] === true}
                        onChange={(e) => handleChange(key, e.target.checked ? 'true' : 'false')}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  ) : (
                    <input
                      className={styles.input}
                      type={type === 'password' ? 'password' : type === 'number' ? 'number' : 'text'}
                      value={settings[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sons de notification */}
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>🔔 Sons de notification</h2>
          <div className={styles.fields}>
            {SOUNDS.map(({ key, label, default: defaultUrl }) => (
              <div key={key} className={styles.soundField}>
                <div className={styles.soundInfo}>
                  <label className={styles.label}>{label}</label>
                  <span className={styles.soundUrl}>
                    {settings[key] ? '✅ Son personnalisé' : `Par défaut: ${defaultUrl}`}
                  </span>
                </div>
                <div className={styles.soundActions}>
                  <button
                    type="button"
                    className={styles.previewBtn}
                    onClick={() => previewSound(key)}
                    title="Écouter"
                  >
                    <Volume2 size={14} />
                  </button>
                  <input
                    ref={(el) => { if (el) fileRefs.current[key] = el }}
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleSoundUpload(key, e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className={`${styles.uploadBtn} ${soundUploaded[key] ? styles.uploadedBtn : ''}`}
                    onClick={() => fileRefs.current[key]?.click()}
                    disabled={soundUploading[key]}
                  >
                    {soundUploaded[key]
                      ? <><Check size={14} /> Uploadé !</>
                      : soundUploading[key]
                        ? 'Upload...'
                        : <><Upload size={14} /> Upload MP3</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
