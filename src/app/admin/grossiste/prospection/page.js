'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Mail, MessageCircle, Search, MapPin, X, ChevronLeft, ChevronRight, Ban, Trash2, Building2, TrendingUp, Users, Target, Sparkles, Play, Pause, Copy, Flame, Upload, Download, BookOpen, Send } from 'lucide-react'
import styles from './prospection.module.css'
import { EMAIL_SEQUENCE, EMAIL_BULK, WA_SEQUENCE, WA_COUNT, EMAIL_COUNT, emailAt, waAt, fillVars } from './messages'

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
  { id: 'grossiste', label: 'Grossiste' }, { id: 'magasin', label: 'Magasin' },
  { id: 'papeterie', label: 'Papeterie' }, { id: 'e-shop', label: 'E-shop' },
  { id: 'fete', label: 'Articles de fête' }, { id: 'autre', label: 'Autre' },
]
const SOURCES = ['pages_maghreb', 'kompass', 'europages', 'goafrica', 'terrain', 'facebook', 'inbound_site']
const GOUVS = ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili']

// --- Scoring heuristique (priorité) ---
const SEG_W = { grossiste: 40, magasin: 25, papeterie: 20, 'e-shop': 20, fete: 12, autre: 8 }
const SRC_W = { inbound_site: 30, terrain: 15, facebook: 10, pages_maghreb: 8, kompass: 8, europages: 8, goafrica: 6 }
function scoreOf(w) {
  if (w.score && w.score > 0) return w.score
  let s = (SEG_W[w.segment] || 8) + (SRC_W[w.source] || 5)
  if (['interesse', 'catalogue', 'devis'].includes(w.stage)) s += 25
  return Math.min(100, s)
}
const tier = (s) => (s >= 60 ? { label: 'Hot', cls: 'hot' } : s >= 35 ? { label: 'Warm', cls: 'warm' } : { label: 'Cold', cls: 'cold' })

// E-mail (FR) — pioche le bon message selon email_step (0 = jamais contacté)
const mailtoHref = (w, body) => {
  const m = emailAt(w.email_step || 0)
  const subject = fillVars(m.subject, w)
  return `mailto:${w.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body || fillVars(m.body, w))}`
}
// WhatsApp (derja) — pioche le bon message selon wa_step (0 = jamais contacté)
const waHref = (w, body) => {
  const m = waAt(w.wa_step || 0)
  return `https://wa.me/${(w.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(body || fillVars(m.body, w))}`
}

// --- Import CSV ---
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim().length)
  if (!lines.length) return []
  const parseLine = (line) => {
    const out = []; let cur = ''; let q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
      else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = '' } else cur += c }
    }
    out.push(cur); return out
  }
  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((l) => { const cells = parseLine(l); const o = {}; headers.forEach((h, i) => (o[h] = (cells[i] ?? '').trim())); return o })
}
const CSV_TEMPLATE = 'enseigne,segment,gouvernorat,ville,email,whatsapp,source,notes\nBazar Exemple,grossiste,Tunis,Moncef Bey,contact@exemple.tn,+216 20 000 000,terrain,Note libre\n'

export default function ProspectionPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterGouv, setFilterGouv] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [ai, setAi] = useState(null) // { w }
  const fileRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  async function importCSV(file) {
    if (!file) return
    setImportMsg('Import en cours…')
    const records = parseCSV(await file.text())
    const valid = []; let skipped = 0
    for (const r of records) {
      const enseigne = (r.enseigne || '').trim()
      const email = (r.email || '').trim()
      const whatsapp = (r.whatsapp || '').trim()
      if (!enseigne) { skipped++; continue }
      valid.push({
        enseigne,
        segment: SEGMENTS.find((s) => s.id === (r.segment || '').trim().toLowerCase())?.id || 'autre',
        gouvernorat: (r.gouvernorat || '').trim() || null,
        ville: (r.ville || '').trim() || null,
        email: email || null,
        whatsapp: whatsapp || null,
        source: SOURCES.includes((r.source || '').trim()) ? r.source.trim() : 'terrain',
        notes: (r.notes || '').trim() || null,
        stage: 'a_contacter',
      })
    }
    if (valid.length) {
      const supabase = createClient()
      const { data, error } = await supabase.from('wholesale_prospects').insert(valid).select()
      if (error) { setImportMsg('Erreur import : ' + error.message); return }
      if (data) setRows((prev) => [...data, ...prev])
    }
    setImportMsg(`Import terminé : ${valid.length} ajoutés, ${skipped} ignorés (enseigne requise). Enrichis les contacts manquants dans les cartes.`)
    if (fileRef.current) fileRef.current.value = ''
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'modele_prospects_hkgames.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const supabase = createClient()
    function fetchRows() {
      supabase.from('wholesale_prospects').select('*').order('created_at', { ascending: false })
        .then(({ data }) => { setRows(data || []); setLoading(false) })
    }
    fetchRows()
    const ch = supabase.channel('admin-prospects-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wholesale_prospects' }, fetchRows).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function patch(id, fields) {
    const supabase = createClient()
    setRows((p) => p.map((x) => (x.id === id ? { ...x, ...fields } : x)))
    await supabase.from('wholesale_prospects').update(fields).eq('id', id)
  }
  async function remove(id) {
    const supabase = createClient()
    setRows((p) => p.filter((x) => x.id !== id))
    await supabase.from('wholesale_prospects').delete().eq('id', id)
  }
  const moveStage = (w, d) => patch(w.id, { stage: STAGES[Math.min(STAGES.length - 1, Math.max(0, stageIndex(w.stage) + d))].id })
  const onContact = (w) => patch(w.id, { last_contact_at: new Date().toISOString(), ...(w.stage === 'a_contacter' ? { stage: 'contacte' } : {}) })

  // Journalise un message envoyé manuellement (best-effort, n'interrompt jamais l'UX)
  async function logMessage(w, channel, step, subject, body) {
    try {
      const supabase = createClient()
      await supabase.from('prospect_messages').insert({
        prospect_id: w.id, channel, step, subject: subject || null, body: body || null, status: 'sent', sent_at: new Date().toISOString(),
      })
    } catch { /* table optionnelle : on ignore */ }
  }

  // Clic e-mail (par prospect) → avance email_step + journal
  function onEmail(w) {
    const step = w.email_step || 0
    const m = emailAt(step)
    patch(w.id, { email_step: step + 1, last_contact_at: new Date().toISOString(), ...(w.stage === 'a_contacter' ? { stage: 'contacte' } : {}) })
    logMessage(w, 'email', step, fillVars(m.subject, w), fillVars(m.body, w))
  }
  // Clic WhatsApp (par prospect) → avance wa_step + journal
  function onWhatsApp(w) {
    const step = w.wa_step || 0
    const m = waAt(step)
    patch(w.id, { wa_step: step + 1, last_contact_at: new Date().toISOString(), ...(w.stage === 'a_contacter' ? { stage: 'contacte' } : {}) })
    logMessage(w, 'whatsapp', step, null, fillVars(m.body, w))
  }

  // Envoi e-mail GROUPÉ : tous les non-contactés par e-mail (email_step = 0), en copie cachée, template FR #1.
  const BULK_MAX = 40
  function bulkEmail() {
    const eligible = rows.filter((w) => w.email && !w.opt_out && (w.email_step || 0) === 0)
    if (!eligible.length) { setImportMsg('Aucun contact à e-mailer (tous déjà contactés par e-mail, en opt-out, ou sans adresse).'); return }
    const batch = eligible.slice(0, BULK_MAX)
    const remaining = eligible.length - batch.length
    if (!window.confirm(`Ouvrir un e-mail vers ${batch.length} prospect(s) en copie cachée (template FR #1), et les marquer comme contactés ?${remaining ? `\n\n${remaining} autre(s) suivront : reclique sur « Envoyer e-mails » après cet envoi.` : ''}`)) return
    const bcc = batch.map((w) => w.email).join(',')
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(EMAIL_BULK.subject)}&body=${encodeURIComponent(EMAIL_BULK.body)}`
    // marque le lot comme contacté
    const ids = batch.map((w) => w.id); const ts = new Date().toISOString()
    setRows((p) => p.map((x) => ids.includes(x.id) ? { ...x, email_step: 1, last_contact_at: ts, stage: x.stage === 'a_contacter' ? 'contacte' : x.stage } : x))
    ;(async () => {
      const supabase = createClient()
      await supabase.from('wholesale_prospects').update({ email_step: 1, last_contact_at: ts }).in('id', ids)
      const toBump = batch.filter((w) => w.stage === 'a_contacter').map((w) => w.id)
      if (toBump.length) await supabase.from('wholesale_prospects').update({ stage: 'contacte' }).in('id', toBump)
      batch.forEach((w) => logMessage(w, 'email', 0, EMAIL_BULK.subject, EMAIL_BULK.body))
    })()
    setImportMsg(`E-mail groupé ouvert pour ${batch.length} prospect(s).${remaining ? ` Reclique pour les ${remaining} suivants.` : ''} Lot ajouté en copie cachée (BCC) pour la confidentialité.`)
  }

  const toggleSeq = (w) => patch(w.id, w.sequence_active
    ? { sequence_active: false }
    : { sequence_active: true, sequence_step: 0, next_action_at: new Date().toISOString() })

  const filtered = useMemo(() => rows.filter((w) => {
    const q = query.trim().toLowerCase()
    const okQ = !q || (w.enseigne || '').toLowerCase().includes(q) || (w.ville || '').toLowerCase().includes(q)
    return okQ && (!filterGouv || w.gouvernorat === filterGouv)
  }), [rows, query, filterGouv])

  const total = rows.length
  const clients = rows.filter((w) => w.stage === 'client').length
  const negociation = rows.filter((w) => ['interesse', 'catalogue', 'devis'].includes(w.stage)).length
  const gouvCouverts = new Set(rows.filter((w) => w.stage === 'client').map((w) => w.gouvernorat)).size

  const today = useMemo(() => {
    const now = Date.now()
    return rows.filter((w) => w.sequence_active && !w.opt_out && w.next_action_at && new Date(w.next_action_at).getTime() <= now)
  }, [rows])

  const coverage = useMemo(() => {
    const m = {}; GOUVS.forEach((g) => (m[g] = { contacts: 0, clients: 0 }))
    rows.forEach((w) => { if (!m[w.gouvernorat]) m[w.gouvernorat] = { contacts: 0, clients: 0 }; m[w.gouvernorat].contacts++; if (w.stage === 'client') m[w.gouvernorat].clients++ })
    return m
  }, [rows])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>HK Games · B2B</p><h1 className={styles.title}>Prospection grossistes</h1></div>
        <div className={styles.headerBtns}>
          <Link href="/admin/grossiste/prospection/strategie" className={styles.ghostBtn}><BookOpen size={16} /> Stratégie</Link>
          <button className={styles.addBtn} onClick={bulkEmail} type="button" title="E-mail groupé aux non-contactés (template FR #1)"><Send size={16} /> Envoyer e-mails</button>
          <button className={styles.ghostBtn} onClick={downloadTemplate} type="button"><Download size={16} /> Modèle CSV</button>
          <button className={styles.ghostBtn} onClick={() => fileRef.current?.click()} type="button"><Upload size={16} /> Importer CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => importCSV(e.target.files?.[0])} />
          <button className={styles.addBtn} onClick={() => setShowForm(true)} type="button"><Plus size={18} /> Ajouter</button>
        </div>
      </header>
      {importMsg && <div className={styles.importMsg}>{importMsg}</div>}

      <section className={styles.kpis}>
        <Kpi icon={<Building2 size={18} />} label="Contacts" value={total} />
        <Kpi icon={<Target size={18} />} label="En négociation" value={negociation} />
        <Kpi icon={<Users size={18} />} label="Revendeurs actifs" value={clients} />
        <Kpi icon={<TrendingUp size={18} />} label="Gouvernorats" value={`${gouvCouverts}/24`} />
      </section>

      {today.length > 0 && (
        <section className={styles.today}>
          <div className={styles.todayHead}><Flame size={16} /> À faire aujourd'hui <span className={styles.count}>{today.length}</span></div>
          <div className={styles.todayList}>
            {today.slice(0, 8).map((w) => (
              <div key={w.id} className={styles.todayItem}>
                <span className={styles.todayName}>{w.enseigne}</span>
                <span className={styles.todayMeta}>{w.ville || w.gouvernorat}</span>
                <button className={styles.miniAi} onClick={() => setAi({ w })} type="button"><Sparkles size={13} /> Message</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={styles.notice}><MessageCircle size={15} /><span>WhatsApp = <strong>envoi manuel (1 clic)</strong>. L'automatisation envoie les e-mails (si provider configuré) et met les WhatsApp en file manuelle → anti-ban.</span></div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}><Search size={16} className={styles.searchIcon} />
          <input className={styles.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher enseigne ou ville…" /></div>
        <select className={styles.select} value={filterGouv} onChange={(e) => setFilterGouv(e.target.value)}>
          <option value="">Tous les gouvernorats</option>{GOUVS.map((g) => <option key={g} value={g}>{g}</option>)}</select>
      </div>

      {loading ? <p className={styles.loading}>Chargement…</p> : (
        <section className={styles.board}>
          {STAGES.map((st) => {
            const cards = filtered.filter((w) => w.stage === st.id)
            return (
              <div key={st.id} className={styles.column}>
                <div className={styles.colHead}><span className={`${styles.dot} ${styles['dot_' + st.id]}`} /> {st.label}<span className={styles.count}>{cards.length}</span></div>
                <div className={styles.cards}>
                  {cards.map((w) => <Card key={w.id} w={w} onMove={moveStage} onPatch={patch} onRemove={remove} onEmail={onEmail} onWhatsApp={onWhatsApp} onAi={() => setAi({ w })} onSeq={() => toggleSeq(w)} />)}
                  {cards.length === 0 && <div className={styles.emptyCol}>Aucun contact</div>}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <section className={styles.coverage}>
        <div className={styles.coverageHead}><MapPin size={18} /> <h2>Couverture — Tunisie</h2><span className={styles.hint}>intensité = revendeurs actifs</span></div>
        <div className={styles.gouvGrid}>
          {GOUVS.map((g) => {
            const c = coverage[g] || { contacts: 0, clients: 0 }
            const lvl = c.clients >= 3 ? 3 : c.clients >= 1 ? 2 : c.contacts >= 1 ? 1 : 0
            return (
              <button key={g} type="button" className={`${styles.gouv} ${styles['lvl' + lvl]} ${filterGouv === g ? styles.gouvActive : ''}`} onClick={() => setFilterGouv(filterGouv === g ? '' : g)}>
                <span className={styles.gouvName}>{g}</span><span className={styles.gouvMeta}>{c.contacts} contact{c.contacts > 1 ? 's' : ''} · {c.clients} client{c.clients > 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>
      </section>

      {showForm && <AddForm onClose={() => setShowForm(false)} onAdded={(r) => { setRows((p) => [r, ...p]); setShowForm(false) }} />}
      {ai && <AiModal w={ai.w} onClose={() => setAi(null)} onContact={onContact} />}
    </div>
  )
}

function Kpi({ icon, label, value }) {
  return <div className={styles.kpi}><div className={styles.kpiTop}>{icon}<span>{label}</span></div><div className={styles.kpiValue}>{value}</div></div>
}

function Card({ w, onMove, onPatch, onRemove, onEmail, onWhatsApp, onAi, onSeq }) {
  const i = stageIndex(w.stage)
  const off = w.opt_out
  const s = scoreOf(w); const t = tier(s)
  const eStep = Math.min((w.email_step || 0) + 1, EMAIL_COUNT)
  const wStep = Math.min((w.wa_step || 0) + 1, WA_COUNT)
  return (
    <div className={`${styles.card} ${off ? styles.cardOut : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.cardInfo}>
          <div className={styles.nameRow}>
            <p className={styles.enseigne}>{w.enseigne}</p>
            <span className={`${styles.badge} ${styles['badge_' + t.cls]}`} title={`Score ${s}`}>{t.label}</span>
          </div>
          <p className={styles.sub}><span className={styles.seg}>{w.segment}</span> · {w.ville}{w.ville ? ', ' : ''}{w.gouvernorat}</p>
        </div>
        <button className={styles.del} onClick={() => onRemove(w.id)} title="Supprimer" type="button"><Trash2 size={14} /></button>
      </div>
      {w.notes && <p className={styles.notes}>{w.notes}</p>}

      <div className={styles.actions}>
        <a className={`${styles.act} ${styles.actMail} ${(off || !w.email) ? styles.actOff : ''}`} href={(off || !w.email) ? undefined : mailtoHref(w)}
           title={w.email ? `E-mail FR #${eStep}/${EMAIL_COUNT}` : 'Pas d\'e-mail'}
           onClick={(e) => (off || !w.email) ? e.preventDefault() : onEmail(w)}><Mail size={13} /> E-mail <span className={styles.stepTag}>{eStep}/{EMAIL_COUNT}</span></a>
        <a className={`${styles.act} ${styles.actWa} ${(off || !w.whatsapp) ? styles.actOff : ''}`} href={(off || !w.whatsapp) ? undefined : waHref(w)} target="_blank" rel="noreferrer"
           title={w.whatsapp ? `WhatsApp derja #${wStep}/${WA_COUNT}` : 'Pas de WhatsApp'}
           onClick={(e) => (off || !w.whatsapp) ? e.preventDefault() : onWhatsApp(w)}><MessageCircle size={13} /> WhatsApp <span className={styles.stepTag}>{wStep}/{WA_COUNT}</span></a>
        <button className={`${styles.optBtn} ${off ? styles.optOn : ''}`} type="button" onClick={() => onPatch(w.id, { opt_out: !w.opt_out })} title="Opt-out"><Ban size={13} /></button>
      </div>

      <div className={styles.autoRow}>
        <button className={styles.aiBtn} onClick={onAi} type="button" disabled={off}><Sparkles size={13} /> IA</button>
        <button className={`${styles.seqBtn} ${w.sequence_active ? styles.seqOn : ''}`} onClick={onSeq} type="button" disabled={off}>
          {w.sequence_active ? <><Pause size={13} /> Séquence ON</> : <><Play size={13} /> Séquence</>}
        </button>
      </div>

      <div className={styles.move}>
        <button onClick={() => onMove(w, -1)} disabled={i === 0} type="button"><ChevronLeft size={15} /></button>
        <span>déplacer</span>
        <button onClick={() => onMove(w, 1)} disabled={i === STAGES.length - 1} type="button"><ChevronRight size={15} /></button>
      </div>
    </div>
  )
}

function AiModal({ w, onClose, onContact }) {
  const [channel, setChannel] = useState('email')
  const [lang, setLang] = useState('fr')
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')

  async function gen() {
    setLoading(true); setErr(''); setRes(null)
    try {
      const r = await fetch('/api/prospects/ai-message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enseigne: w.enseigne, segment: w.segment, ville: w.ville, gouvernorat: w.gouvernorat, channel, lang }),
      })
      const d = await r.json()
      if (!r.ok) setErr(d.error || 'Erreur IA')
      else setRes(d)
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const copy = () => res && navigator.clipboard?.writeText([res.subject, res.body].filter(Boolean).join('\n\n'))

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}><h3><Sparkles size={16} /> Message IA — {w.enseigne}</h3><button onClick={onClose} type="button"><X size={20} /></button></div>
        <div className={styles.aiControls}>
          <div className={styles.seg2}>
            <button className={channel === 'email' ? styles.seg2On : ''} onClick={() => setChannel('email')} type="button">E-mail</button>
            <button className={channel === 'whatsapp' ? styles.seg2On : ''} onClick={() => setChannel('whatsapp')} type="button">WhatsApp</button>
          </div>
          <div className={styles.seg2}>
            <button className={lang === 'fr' ? styles.seg2On : ''} onClick={() => setLang('fr')} type="button">Français</button>
            <button className={lang === 'derja' ? styles.seg2On : ''} onClick={() => setLang('derja')} type="button">Derja</button>
          </div>
          <button className={styles.genBtn} onClick={gen} disabled={loading} type="button">{loading ? 'Génération…' : 'Générer'}</button>
        </div>
        {err && <p className={styles.aiErr}>{err}</p>}
        {res && (
          <div className={styles.aiResult}>
            {res.subject && <p className={styles.aiSubject}><strong>Objet :</strong> {res.subject}</p>}
            <pre className={styles.aiBody}>{res.body}</pre>
            <div className={styles.aiActions}>
              <button className={styles.cancel} onClick={copy} type="button"><Copy size={14} /> Copier</button>
              {channel === 'email'
                ? <a className={styles.save} href={mailtoHref(w, res.body)} onClick={() => onContact(w)}>Ouvrir e-mail</a>
                : <a className={styles.save} href={waHref(w, res.body)} target="_blank" rel="noreferrer" onClick={() => onContact(w)}>Ouvrir WhatsApp</a>}
            </div>
          </div>
        )}
        {!res && !err && <p className={styles.req}>Choisis le canal + la langue, puis « Générer ». (Nécessite ANTHROPIC_API_KEY.)</p>}
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
    setSaving(false); if (!error && data) onAdded(data)
  }
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}><h3>Nouveau grossiste</h3><button onClick={onClose} type="button"><X size={20} /></button></div>
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
        <div className={styles.modalActions}><button className={styles.cancel} onClick={onClose} type="button">Annuler</button>
          <button className={styles.save} onClick={save} disabled={!valid || saving} type="button">{saving ? 'Ajout…' : 'Ajouter au pipeline'}</button></div>
        {!valid && <p className={styles.req}>Enseigne + (e-mail ou WhatsApp) requis.</p>}
      </div>
    </div>
  )
}
