'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Mail, MessageCircle, Search, MapPin, X, ChevronLeft, ChevronRight, Ban, Trash2, Building2, TrendingUp, Users, Target } from 'lucide-react'
import styles from './prospection.module.css'

const STAGES = [
  { id: 'a_contacter', label: 'À contacter' },
  { id: 'contacte',    label: 'Contacté' },
  { id: 'interesse',   label: 'Intéressé' },
  { id: 'catalogue',   label: 'Catalogue envoyé' },
  { id: 'devis',       label: 'Devis' },
  { id: 'client',      label: 'Client' },
  { id: 'inactif',     label: 'Inactif' },
]
const stageIndex = (id) => STAGES.findIndex((s) => s.id === id)

const SEGMENTS = [
  { id: 'grossiste', label: 'Grossiste' },
  { id: 'magasin',   label: 'Magasin' },
  { id: 'papeterie', label: 'Papeterie' },
  { id: 'e-shop',    label: 'E-shop' },
  { id: 'fete',      label: 'Articles de fête' },
  { id: 'autre',     label: 'Autre' },
]
const SOURCES = ['pages_maghreb', 'kompass', 'europages', 'goafrica', 'terrain', 'facebook', 'inbound_site']

const GOUVS = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja',
  'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
  'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili',
]

const EMAIL_SUBJECT = 'Slime premium fabriqué en Tunisie — pour vos rayons'
const emailBody = (w) =>
`Bonjour ${w.enseigne},

Je suis [Prénom] de HK Games, fabricant tunisien de slime premium (marque SLIMO).
Notre slime — épais, élastique, ultra satisfaisant — est un produit à forte rotation : les enfants adorent.

En tant que fabricant local, on vous offre :
- des marges revendeur intéressantes + un réassort rapide (pas d'import, pas de douane) ;
- une gamme complète (Unicolore, Bicolore, Slime Buddies) ;
- un support marketing : nos campagnes créent la demande, vous encaissez les ventes.

Offre grossistes : https://www.hap-p-kids.store/grossiste
Je peux vous envoyer le catalogue + tarifs gros, ou un échantillon. Vous préférez quoi ?

[Prénom] — HK Games
(Pour ne plus recevoir nos e-mails pro, répondez STOP.)`

const waMessage = (w) =>
`سلام ${w.enseigne} 👋 أنا [الإسم] من HK Games، مصنع سلايم تونسي بريميوم 🇹🇳
عندنا سلايم يتجبّد ويعمل الكيف، يمشي برشة مع الصغار 🔥 ونعطيو هامش ربح باهي للموزّعين + ريأسور سريع.
تحب نبعثلك الكتالوڭ والأسعار بالجملة، ولا عيّنة باش تجرّب؟`

const mailtoHref = (w) => `mailto:${w.email}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(emailBody(w))}`
const waHref = (w) => `https://wa.me/${(w.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(waMessage(w))}`

export default function ProspectionPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterGouv, setFilterGouv] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    function fetchRows() {
      supabase.from('wholesale_prospects').select('*').order('created_at', { ascending: false })
        .then(({ data }) => { setRows(data || []); setLoading(false) })
    }
    fetchRows()
    const channel = supabase.channel('admin-prospects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wholesale_prospects' }, fetchRows)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function patch(id, fields) {
    const supabase = createClient()
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...fields } : x)))
    await supabase.from('wholesale_prospects').update(fields).eq('id', id)
  }
  async function remove(id) {
    const supabase = createClient()
    setRows((prev) => prev.filter((x) => x.id !== id))
    await supabase.from('wholesale_prospects').delete().eq('id', id)
  }
  function moveStage(w, dir) {
    const i = Math.min(STAGES.length - 1, Math.max(0, stageIndex(w.stage) + dir))
    patch(w.id, { stage: STAGES[i].id })
  }
  function onContact(w) {
    const fields = { last_contact_at: new Date().toISOString() }
    if (w.stage === 'a_contacter') fields.stage = 'contacte'
    patch(w.id, fields)
  }

  const filtered = useMemo(() => rows.filter((w) => {
    const q = query.trim().toLowerCase()
    const okQ = !q || (w.enseigne || '').toLowerCase().includes(q) || (w.ville || '').toLowerCase().includes(q)
    const okG = !filterGouv || w.gouvernorat === filterGouv
    return okQ && okG
  }), [rows, query, filterGouv])

  const total = rows.length
  const clients = rows.filter((w) => w.stage === 'client').length
  const negociation = rows.filter((w) => ['interesse', 'catalogue', 'devis'].includes(w.stage)).length
  const gouvCouverts = new Set(rows.filter((w) => w.stage === 'client').map((w) => w.gouvernorat)).size

  const coverage = useMemo(() => {
    const m = {}
    GOUVS.forEach((g) => (m[g] = { contacts: 0, clients: 0 }))
    rows.forEach((w) => {
      if (!m[w.gouvernorat]) m[w.gouvernorat] = { contacts: 0, clients: 0 }
      m[w.gouvernorat].contacts += 1
      if (w.stage === 'client') m[w.gouvernorat].clients += 1
    })
    return m
  }, [rows])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>HK Games · B2B</p>
          <h1 className={styles.title}>Prospection grossistes</h1>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(true)} type="button">
          <Plus size={18} /> Ajouter un grossiste
        </button>
      </header>

      <section className={styles.kpis}>
        <Kpi icon={<Building2 size={18} />} label="Contacts" value={total} />
        <Kpi icon={<Target size={18} />} label="En négociation" value={negociation} />
        <Kpi icon={<Users size={18} />} label="Revendeurs actifs" value={clients} />
        <Kpi icon={<TrendingUp size={18} />} label="Gouvernorats" value={`${gouvCouverts}/24`} />
      </section>

      <div className={styles.notice}>
        <MessageCircle size={15} />
        <span>WhatsApp = <strong>envoi manuel (1 clic)</strong>, message pré-rempli. Pas de blast automatique → on protège les numéros du bannissement.</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher enseigne ou ville…" />
        </div>
        <select className={styles.select} value={filterGouv} onChange={(e) => setFilterGouv(e.target.value)}>
          <option value="">Tous les gouvernorats</option>
          {GOUVS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {loading ? <p className={styles.loading}>Chargement…</p> : (
        <section className={styles.board}>
          {STAGES.map((st) => {
            const cards = filtered.filter((w) => w.stage === st.id)
            return (
              <div key={st.id} className={styles.column}>
                <div className={styles.colHead}>
                  <span className={`${styles.dot} ${styles['dot_' + st.id]}`} /> {st.label}
                  <span className={styles.count}>{cards.length}</span>
                </div>
                <div className={styles.cards}>
                  {cards.map((w) => (
                    <Card key={w.id} w={w} onMove={moveStage} onPatch={patch} onRemove={remove} onContact={onContact} />
                  ))}
                  {cards.length === 0 && <div className={styles.emptyCol}>Aucun contact</div>}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <section className={styles.coverage}>
        <div className={styles.coverageHead}>
          <MapPin size={18} /> <h2>Couverture — Tunisie</h2>
          <span className={styles.hint}>intensité = revendeurs actifs</span>
        </div>
        <div className={styles.gouvGrid}>
          {GOUVS.map((g) => {
            const c = coverage[g] || { contacts: 0, clients: 0 }
            const lvl = c.clients >= 3 ? 3 : c.clients >= 1 ? 2 : c.contacts >= 1 ? 1 : 0
            return (
              <button key={g} type="button"
                className={`${styles.gouv} ${styles['lvl' + lvl]} ${filterGouv === g ? styles.gouvActive : ''}`}
                onClick={() => setFilterGouv(filterGouv === g ? '' : g)}>
                <span className={styles.gouvName}>{g}</span>
                <span className={styles.gouvMeta}>{c.contacts} contact{c.contacts > 1 ? 's' : ''} · {c.clients} client{c.clients > 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>
      </section>

      {showForm && <AddForm onClose={() => setShowForm(false)} onAdded={(row) => { setRows((r) => [row, ...r]); setShowForm(false) }} />}
    </div>
  )
}

function Kpi({ icon, label, value }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiTop}>{icon}<span>{label}</span></div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  )
}

function Card({ w, onMove, onPatch, onRemove, onContact }) {
  const i = stageIndex(w.stage)
  const disabled = w.opt_out
  return (
    <div className={`${styles.card} ${disabled ? styles.cardOut : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.cardInfo}>
          <p className={styles.enseigne}>{w.enseigne}</p>
          <p className={styles.sub}><span className={styles.seg}>{w.segment}</span> · {w.ville}{w.ville ? ', ' : ''}{w.gouvernorat}</p>
        </div>
        <button className={styles.del} onClick={() => onRemove(w.id)} title="Supprimer" type="button"><Trash2 size={14} /></button>
      </div>
      {w.notes && <p className={styles.notes}>{w.notes}</p>}
      <div className={styles.actions}>
        <a className={`${styles.act} ${styles.actMail} ${disabled ? styles.actOff : ''}`}
          href={disabled ? undefined : mailtoHref(w)} onClick={(e) => disabled ? e.preventDefault() : onContact(w)}>
          <Mail size={13} /> E-mail
        </a>
        <a className={`${styles.act} ${styles.actWa} ${disabled ? styles.actOff : ''}`}
          href={disabled ? undefined : waHref(w)} target="_blank" rel="noreferrer"
          onClick={(e) => disabled ? e.preventDefault() : onContact(w)}>
          <MessageCircle size={13} /> WhatsApp
        </a>
        <button className={`${styles.optBtn} ${disabled ? styles.optOn : ''}`} type="button"
          onClick={() => onPatch(w.id, { opt_out: !w.opt_out })} title="Opt-out"><Ban size={13} /></button>
      </div>
      <div className={styles.move}>
        <button onClick={() => onMove(w, -1)} disabled={i === 0} type="button"><ChevronLeft size={15} /></button>
        <span>déplacer</span>
        <button onClick={() => onMove(w, 1)} disabled={i === STAGES.length - 1} type="button"><ChevronRight size={15} /></button>
      </div>
    </div>
  )
}

function AddForm({ onClose, onAdded }) {
  const [f, setF] = useState({ enseigne: '', segment: 'grossiste', gouvernorat: 'Tunis', ville: '', email: '', whatsapp: '', source: 'terrain', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const valid = f.enseigne.trim() && (f.email.trim() || f.whatsapp.trim())

  async function save() {
    if (!valid || saving) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('wholesale_prospects').insert({ ...f, stage: 'a_contacter' }).select().single()
    setSaving(false)
    if (!error && data) onAdded(data)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>Nouveau grossiste</h3>
          <button onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.full}>Enseigne *<input value={f.enseigne} onChange={(e) => set('enseigne', e.target.value)} placeholder="Ex. Bazar El Amal" /></label>
          <label>Segment<select value={f.segment} onChange={(e) => set('segment', e.target.value)}>{SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label>Source<select value={f.source} onChange={(e) => set('source', e.target.value)}>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label>Gouvernorat<select value={f.gouvernorat} onChange={(e) => set('gouvernorat', e.target.value)}>{GOUVS.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
          <label>Ville<input value={f.ville} onChange={(e) => set('ville', e.target.value)} placeholder="Ex. Moncef Bey" /></label>
          <label>E-mail pro<input value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@…" /></label>
          <label>WhatsApp<input value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+216 …" /></label>
          <label className={styles.full}>Notes<textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancel} onClick={onClose} type="button">Annuler</button>
          <button className={styles.save} onClick={save} disabled={!valid || saving} type="button">{saving ? 'Ajout…' : 'Ajouter au pipeline'}</button>
        </div>
        {!valid && <p className={styles.req}>Enseigne + (e-mail ou WhatsApp) requis.</p>}
      </div>
    </div>
  )
}
