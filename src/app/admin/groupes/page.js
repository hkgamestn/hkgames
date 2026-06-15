'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Trash2, ExternalLink, CheckCircle2, Copy, Check, Flame, Users, Layers, Send, ShoppingBag, BookOpen, Ban } from 'lucide-react'
import styles from './groupes.module.css'
import { CAPTIONS, SHOP_URL } from './captions'

const CATEGORIES = [
  { id: 'parents', label: 'Parents / Mamans', icon: Users },
  { id: 'marketplace', label: 'Bons plans / Marketplace', icon: ShoppingBag },
  { id: 'b2b', label: 'Vente en gros (B2B)', icon: Layers },
  { id: 'autre', label: 'Autre', icon: Send },
]
const STATUS = [
  { id: 'a_rejoindre', label: 'À rejoindre' },
  { id: 'en_attente', label: 'Demande en attente' },
  { id: 'rejoint', label: 'Rejoint' },
  { id: 'refuse', label: 'Refusé' },
]
const DAY = 86400000
const isDue = (g) => g.active && g.status === 'rejoint' && (!g.last_post_at || Date.now() - new Date(g.last_post_at).getTime() >= (g.cadence_days || 4) * DAY)
const fmtAgo = (ts) => {
  if (!ts) return 'jamais publié'
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / DAY)
  return d <= 0 ? "aujourd'hui" : d === 1 ? 'il y a 1 jour' : `il y a ${d} jours`
}

export default function GroupesPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const fetchRows = () => supabase.from('fb_groups').select('*').order('category').order('name')
      .then(({ data }) => { setRows(data || []); setLoading(false) })
    fetchRows()
    const ch = supabase.channel('admin-fbgroups-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fb_groups' }, fetchRows).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function patch(id, fields) {
    const supabase = createClient()
    setRows((p) => p.map((x) => (x.id === id ? { ...x, ...fields } : x)))
    await supabase.from('fb_groups').update(fields).eq('id', id)
  }
  async function remove(id) {
    const supabase = createClient()
    setRows((p) => p.filter((x) => x.id !== id))
    await supabase.from('fb_groups').delete().eq('id', id)
  }
  // Ouvre le groupe + marque comme publié (incrémente le compteur, pose la date)
  function markPosted(g) {
    if (g.url) window.open(g.url, '_blank', 'noreferrer')
    patch(g.id, { post_count: (g.post_count || 0) + 1, last_post_at: new Date().toISOString() })
  }

  const due = useMemo(() => rows.filter(isDue), [rows])
  const joined = rows.filter((g) => g.status === 'rejoint').length
  const totalPosts = rows.reduce((s, g) => s + (g.post_count || 0), 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>HK Games · B2C organique</p><h1 className={styles.title}>Groupes Facebook</h1></div>
        <div className={styles.headerBtns}>
          <Link href="/admin/grossiste/prospection" className={styles.ghostBtn}><Send size={16} /> Prospection B2B</Link>
          <button className={styles.addBtn} onClick={() => setShowForm(true)} type="button"><Plus size={18} /> Ajouter</button>
        </div>
      </header>

      <div className={styles.notice}>
        <span>📌 Facebook interdit la publication automatique dans les groupes (risque de ban). Le dashboard te dit <strong>où</strong>, <strong>quoi</strong> et <strong>quand</strong> publier, ouvre le groupe en 1 clic et journalise — le copier-coller reste manuel (anti-ban).</span>
      </div>

      <section className={styles.kpis}>
        <Kpi icon={<Users size={18} />} label="Groupes" value={rows.length} />
        <Kpi icon={<CheckCircle2 size={18} />} label="Rejoints" value={joined} />
        <Kpi icon={<Flame size={18} />} label="À publier" value={due.length} />
        <Kpi icon={<Send size={18} />} label="Posts cumulés" value={totalPosts} />
      </section>

      {/* File de publication */}
      {due.length > 0 && (
        <section className={styles.today}>
          <div className={styles.todayHead}><Flame size={16} /> À publier aujourd'hui <span className={styles.count}>{due.length}</span></div>
          <div className={styles.todayList}>
            {due.map((g) => (
              <div key={g.id} className={styles.todayItem}>
                <span className={styles.todayName}>{g.name}</span>
                <span className={styles.todayMeta}>{fmtAgo(g.last_post_at)} · cadence {g.cadence_days}j</span>
                <button className={styles.miniPost} onClick={() => markPosted(g)} type="button"><ExternalLink size={13} /> Publier</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Légendes prêtes */}
      <CaptionsPanel />

      {loading ? <p className={styles.loading}>Chargement…</p> : (
        CATEGORIES.map((cat) => {
          const list = rows.filter((g) => g.category === cat.id)
          if (!list.length) return null
          const Icon = cat.icon
          return (
            <section key={cat.id} className={styles.catSection}>
              <h2 className={styles.catTitle}><Icon size={18} /> {cat.label} <span className={styles.count}>{list.length}</span></h2>
              <div className={styles.grid}>
                {list.map((g) => <GroupCard key={g.id} g={g} onPatch={patch} onRemove={remove} onPost={markPosted} />)}
              </div>
            </section>
          )
        })
      )}

      {showForm && <AddForm onClose={() => setShowForm(false)} onAdded={(r) => { setRows((p) => [...p, r]); setShowForm(false) }} />}
    </div>
  )
}

function Kpi({ icon, label, value }) {
  return <div className={styles.kpi}><div className={styles.kpiTop}>{icon}<span>{label}</span></div><div className={styles.kpiValue}>{value}</div></div>
}

function CaptionsPanel() {
  const [idx, setIdx] = useState(0)
  const [lang, setLang] = useState('fr')
  const [done, setDone] = useState(false)
  const cap = CAPTIONS[idx]
  const text = cap[lang]
  function copy() { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) }) }
  return (
    <section className={styles.captions}>
      <div className={styles.capHead}>
        <h2 className={styles.catTitle}><BookOpen size={18} /> Légendes prêtes</h2>
        <div className={styles.langTabs}>
          <button className={lang === 'fr' ? styles.langOn : ''} onClick={() => setLang('fr')} type="button">FR</button>
          <button className={lang === 'dj' ? styles.langOn : ''} onClick={() => setLang('dj')} type="button">Derja</button>
        </div>
      </div>
      <div className={styles.capTabs}>
        {CAPTIONS.map((c, i) => (
          <button key={c.key} className={`${styles.capTab} ${i === idx ? styles.capTabOn : ''}`} onClick={() => setIdx(i)} type="button">{c.label}</button>
        ))}
      </div>
      <pre className={`${styles.capBody} ${lang === 'dj' ? styles.rtl : ''}`}>{text}</pre>
      <div className={styles.capFoot}>
        <a className={styles.ghostBtn} href={SHOP_URL} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Boutique</a>
        <button className={styles.copyBtn} onClick={copy} type="button">{done ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier la légende</>}</button>
      </div>
    </section>
  )
}

function GroupCard({ g, onPatch, onRemove, onPost }) {
  const due = isDue(g)
  return (
    <div className={`${styles.card} ${!g.active ? styles.cardOff : ''} ${due ? styles.cardDue : ''}`}>
      <div className={styles.cardTop}>
        <p className={styles.gName}>{g.name}</p>
        <button className={styles.del} onClick={() => onRemove(g.id)} title="Supprimer" type="button"><Trash2 size={14} /></button>
      </div>
      {g.audience && <p className={styles.audience}>{g.audience}</p>}
      {g.rules_note && <p className={styles.rules}>⚠️ {g.rules_note}</p>}

      <div className={styles.metaRow}>
        <select className={styles.statusSel} value={g.status} onChange={(e) => onPatch(g.id, { status: e.target.value })}>
          {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <label className={styles.cadence} title="Jours mini entre 2 posts">
          cadence
          <input type="number" min={1} max={30} value={g.cadence_days} onChange={(e) => onPatch(g.id, { cadence_days: Math.max(1, parseInt(e.target.value) || 1) })} />j
        </label>
      </div>

      <p className={styles.lastPost}>{fmtAgo(g.last_post_at)} · {g.post_count || 0} post{(g.post_count || 0) > 1 ? 's' : ''}</p>

      <div className={styles.actions}>
        {g.url && <a className={styles.act} href={g.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Ouvrir</a>}
        <button className={`${styles.act} ${styles.actPost}`} onClick={() => onPost(g)} type="button" disabled={g.status !== 'rejoint'} title={g.status !== 'rejoint' ? 'Rejoindre le groupe d\'abord' : 'Ouvre + marque publié'}><CheckCircle2 size={13} /> Publié</button>
        <button className={`${styles.optBtn} ${!g.active ? styles.optOn : ''}`} onClick={() => onPatch(g.id, { active: !g.active })} type="button" title={g.active ? 'Mettre en pause' : 'Réactiver'}><Ban size={13} /></button>
      </div>
    </div>
  )
}

function AddForm({ onClose, onAdded }) {
  const [f, setF] = useState({ name: '', url: '', category: 'parents', audience: '', rules_note: '', cadence_days: 4 })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  async function save() {
    if (!f.name.trim() || saving) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('fb_groups').insert({ ...f, status: 'a_rejoindre' }).select().single()
    setSaving(false); if (!error && data) onAdded(data)
  }
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}><h3>Nouveau groupe</h3><button onClick={onClose} type="button"><X size={20} /></button></div>
        <div className={styles.formGrid}>
          <label className={styles.full}>Nom du groupe *<input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex. Mamans de Tunis" /></label>
          <label className={styles.full}>Lien Facebook<input value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="https://www.facebook.com/groups/…" /></label>
          <label>Catégorie<select value={f.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label>Cadence (jours)<input type="number" min={1} max={30} value={f.cadence_days} onChange={(e) => set('cadence_days', Math.max(1, parseInt(e.target.value) || 1))} /></label>
          <label className={styles.full}>Audience (note)<input value={f.audience} onChange={(e) => set('audience', e.target.value)} placeholder="Ex. ~30k mamans, très actif" /></label>
          <label className={styles.full}>Règles<input value={f.rules_note} onChange={(e) => set('rules_note', e.target.value)} placeholder="Ex. pub autorisée le vendredi seulement" /></label>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancel} onClick={onClose} type="button">Annuler</button>
          <button className={styles.save} onClick={save} disabled={!f.name.trim() || saving} type="button">{saving ? 'Ajout…' : 'Ajouter'}</button>
        </div>
      </div>
    </div>
  )
}
