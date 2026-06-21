'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { envoyerNavexGrossiste } from '@/app/actions/navex'
import { CheckCircle, XCircle, Phone, Building2, FileText, Plus, Printer, Eye, Trash2, DollarSign, Edit3 } from 'lucide-react'
import InvoiceEditor from './InvoiceEditor'
import InvoicePrint from './InvoicePrint'
import styles from './grossiste.module.css'

const STATUS_TABS = [
  { id: null,        label: 'Toutes' },
  { id: 'new',       label: '🆕 Nouvelles' },
  { id: 'contacted', label: '📞 Contactées' },
  { id: 'confirmed', label: '✅ Confirmées' },
  { id: 'cancelled', label: '❌ Annulées' },
]

const TYPE_CONFIG = {
  wholesale: { label: 'Commande gros', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  sample:    { label: '🧪 Échantillon', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
}

const STATUS_CONFIG = {
  new:       { label: 'Nouvelle',   color: '#fbbf24' },
  contacted: { label: 'Contactée',  color: '#60a5fa' },
  confirmed: { label: 'Confirmée',  color: '#10b981' },
  cancelled: { label: 'Annulée',    color: '#ef4444' },
}

const INV_STATUS_CONFIG = {
  draft:     { label: 'Brouillon', color: '#7c6fa8' },
  sent:      { label: 'Envoyée',   color: '#60a5fa' },
  paid:      { label: 'Payée',     color: '#10b981' },
  cancelled: { label: 'Annulée',   color: '#ef4444' },
}

export default function AdminGrossistePage() {
  const [tab, setTab]               = useState(null)
  const [requests, setRequests]     = useState([])
  const [invoices, setInvoices]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('requests') // 'requests' | 'invoices'
  const [editInvoice, setEditInvoice]   = useState(null)   // null | 'new:{req_id}' | invoice obj
  const [printInvoice, setPrintInvoice] = useState(null)
  const [tiers, setTiers]           = useState([])
  const [actionLoading, setActionLoading] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const reqQuery = supabase.from('wholesale_requests').select('*').order('created_at', { ascending: false })
    if (tab) reqQuery.eq('status', tab)
    const [{ data: reqs }, { data: invs }, { data: t }] = await Promise.all([
      reqQuery,
      supabase.from('wholesale_invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('wholesale_tiers').select('*').order('sort_order'),
    ])
    setRequests(reqs || [])
    setInvoices(invs || [])
    setTiers(t || [])
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateRequestStatus(id, status) {
    setActionLoading(id)
    const supabase = createClient()
    await supabase.from('wholesale_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchData()
    setActionLoading(null)
  }

  async function envoyerNavexRequest(req) {
    setActionLoading(req.id)
    try {
      let codAmount = 0
      if (req.request_type !== 'sample') {
        // Valeur de la commande gros = total de la facture liee, sinon saisie manuelle
        const inv = invoices.find((i) => i.request_id === req.id)
        const def = inv?.total_ttc ? Number(inv.total_ttc).toFixed(3) : ''
        const entered = window.prompt('Montant COD a encaisser (DT) pour cette commande gros :', def)
        if (entered === null) { setActionLoading(null); return }
        codAmount = parseFloat(entered) || 0
      }
      const r = await envoyerNavexGrossiste({ request: req, codAmount })
      alert('Envoye a Navex. Suivi : ' + (r.tracking_number || '—'))
      await fetchData()
    } catch (e) {
      alert('Erreur Navex : ' + e.message)
    }
    setActionLoading(null)
  }

  async function updateInvoiceStatus(id, status) {
    setActionLoading(id)
    const supabase = createClient()
    await supabase.from('wholesale_invoices').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchData()
    setActionLoading(null)
  }

  async function deleteRequest(id) {
    if (!confirm('Supprimer cette demande ?')) return
    const supabase = createClient()
    await supabase.from('wholesale_requests').delete().eq('id', id)
    setRequests(r => r.filter(x => x.id !== id))
  }

  function openNewInvoice(req) {
    setEditInvoice({ _new: true, request: req })
    setView('invoices')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vente en Gros</h1>
          <p className={styles.sub}>Gestion des demandes & facturation grossiste</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.tabBtn} ${view === 'requests' ? styles.tabBtnActive : ''}`}
            onClick={() => { setView('requests'); setEditInvoice(null) }}>
            <Building2 size={16} /> Demandes ({requests.length})
          </button>
          <button className={`${styles.tabBtn} ${view === 'invoices' ? styles.tabBtnActive : ''}`}
            onClick={() => { setView('invoices'); setEditInvoice(null) }}>
            <FileText size={16} /> Factures ({invoices.length})
          </button>
        </div>
      </div>

      {/* ─── DEMANDES ─── */}
      {view === 'requests' && (
        <>
          <div className={styles.tabs}>
            {STATUS_TABS.map(t => (
              <button key={String(t.id)} onClick={() => setTab(t.id)}
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles.loading}>Chargement…</div>
          ) : requests.length === 0 ? (
            <div className={styles.empty}>Aucune demande pour ce filtre.</div>
          ) : (
            <div className={styles.requestsList}>
              {requests.map(req => (
                <div key={req.id} className={`${styles.requestCard} ${req.request_type === 'sample' ? styles.requestCardSample : ''}`}>
                  <div className={styles.reqHeader}>
                    <div>
                      {/* Badge type */}
                      {req.request_type && (
                        <span style={{
                          display: 'inline-block', marginBottom: 4,
                          fontSize: '0.65rem', fontWeight: 800,
                          background: TYPE_CONFIG[req.request_type]?.bg || 'rgba(168,85,247,0.12)',
                          color: TYPE_CONFIG[req.request_type]?.color || '#a855f7',
                          border: `1px solid ${TYPE_CONFIG[req.request_type]?.color || '#a855f7'}33`,
                          borderRadius: '99px', padding: '2px 9px',
                        }}>
                          {TYPE_CONFIG[req.request_type]?.label || req.request_type}
                        </span>
                      )}
                      <div className={styles.reqCompany}>{req.company_name}</div>
                      <div className={styles.reqContact}>{req.contact_name} — {req.phone}</div>
                    </div>
                    <div className={styles.reqMeta}>
                      <span className={styles.reqDate}>
                        {new Date(req.created_at).toLocaleDateString('fr-TN')}
                      </span>
                      <span className={styles.statusBadge}
                        style={{ color: STATUS_CONFIG[req.status]?.color, borderColor: STATUS_CONFIG[req.status]?.color }}>
                        {STATUS_CONFIG[req.status]?.label}
                      </span>
                    </div>
                  </div>

                  <div className={styles.reqDetails}>
                    <div className={styles.reqDetail}><Building2 size={13} /> MF : {req.matricule_fiscal}</div>
                    <div className={styles.reqDetail}><Phone size={13} /> {req.phone}{req.email ? ` — ${req.email}` : ''}</div>
                    {req.city && <div className={styles.reqDetail}>📍 {req.city}{req.address ? `, ${req.address}` : ''}</div>}
                    {req.estimated_qty && <div className={styles.reqDetail}><DollarSign size={13} /> ~{req.estimated_qty} unités/mois</div>}
                    {req.products_wanted && <div className={styles.reqDetail}>🛍 {req.products_wanted}</div>}
                    {req.notes && <div className={styles.reqNote}>💬 {req.notes}</div>}
                  </div>

                  <div className={styles.reqActions}>
                    {req.status === 'new' && (
                      <button className={`${styles.actionBtn} ${styles.actionBlue}`}
                        disabled={actionLoading === req.id}
                        onClick={() => updateRequestStatus(req.id, 'contacted')}>
                        <Phone size={14} /> Marquer contacté
                      </button>
                    )}
                    {req.status === 'contacted' && (
                      <button className={`${styles.actionBtn} ${styles.actionGreen}`}
                        disabled={actionLoading === req.id}
                        onClick={() => updateRequestStatus(req.id, 'confirmed')}>
                        <CheckCircle size={14} /> Confirmer
                      </button>
                    )}
                    {(req.status === 'confirmed') && (
                      <>
                        <button className={`${styles.actionBtn} ${styles.actionPurple}`}
                          onClick={() => openNewInvoice(req)}>
                          <Plus size={14} /> Créer facture
                        </button>
                        {req.navex_tracking ? (
                          <a className={`${styles.actionBtn} ${styles.actionGhost}`}
                            href={req.navex_print_url || '#'} target="_blank" rel="noopener noreferrer">
                            <Printer size={14} /> {req.navex_tracking}
                          </a>
                        ) : (
                          <button className={`${styles.actionBtn} ${styles.actionGreen}`}
                            disabled={actionLoading === req.id}
                            onClick={() => envoyerNavexRequest(req)}>
                            <Building2 size={14} /> Navex {req.request_type === 'sample' ? '(0 DT)' : ''}
                          </button>
                        )}
                      </>
                    )}
                    {req.status !== 'cancelled' && (
                      <button className={`${styles.actionBtn} ${styles.actionRed}`}
                        disabled={actionLoading === req.id}
                        onClick={() => updateRequestStatus(req.id, 'cancelled')}>
                        <XCircle size={14} /> Annuler
                      </button>
                    )}
                    <button className={`${styles.actionBtn} ${styles.actionGhost}`}
                      onClick={() => deleteRequest(req.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── FACTURES ─── */}
      {view === 'invoices' && !editInvoice && (
        <>
          {loading ? (
            <div className={styles.loading}>Chargement…</div>
          ) : invoices.length === 0 ? (
            <div className={styles.empty}>Aucune facture. Créez-en une depuis une demande confirmée.</div>
          ) : (
            <div className={styles.invoicesList}>
              {invoices.map(inv => (
                <div key={inv.id} className={styles.invoiceCard}>
                  <div className={styles.invLeft}>
                    <div className={styles.invNumber}>{inv.invoice_number}</div>
                    <div className={styles.invCompany}>{inv.company_name}</div>
                    <div className={styles.invMF}>MF : {inv.matricule_fiscal}</div>
                  </div>
                  <div className={styles.invCenter}>
                    <div className={styles.invDate}>{new Date(inv.created_at).toLocaleDateString('fr-TN')}</div>
                    <div className={styles.invTotal}>{Number(inv.total_ttc).toFixed(3)} DT TTC</div>
                  </div>
                  <div className={styles.invRight}>
                    <span className={styles.statusBadge}
                      style={{ color: INV_STATUS_CONFIG[inv.status]?.color, borderColor: INV_STATUS_CONFIG[inv.status]?.color }}>
                      {INV_STATUS_CONFIG[inv.status]?.label}
                    </span>
                    <div className={styles.reqActions}>
                      {inv.status === 'draft' && (
                        <button className={`${styles.actionBtn} ${styles.actionBlue}`}
                          onClick={() => updateInvoiceStatus(inv.id, 'sent')}>
                          Marquer envoyée
                        </button>
                      )}
                      {inv.status === 'sent' && (
                        <button className={`${styles.actionBtn} ${styles.actionGreen}`}
                          onClick={() => updateInvoiceStatus(inv.id, 'paid')}>
                          <DollarSign size={14} /> Marquer payée
                        </button>
                      )}
                      <button className={`${styles.actionBtn} ${styles.actionPurple}`}
                        onClick={() => setEditInvoice(inv)}>
                        <Edit3 size={14} /> Modifier
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionGhost}`}
                        onClick={() => setPrintInvoice(inv)}>
                        <Printer size={14} /> Imprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── ÉDITEUR FACTURE ─── */}
      {view === 'invoices' && editInvoice && (
        <InvoiceEditor
          invoice={editInvoice}
          tiers={tiers}
          onClose={() => setEditInvoice(null)}
          onSaved={async (inv) => { setEditInvoice(null); await fetchData(); setPrintInvoice(inv) }}
        />
      )}

      {/* ─── IMPRESSION ─── */}
      {printInvoice && (
        <InvoicePrint invoice={printInvoice} onClose={() => setPrintInvoice(null)} />
      )}
    </div>
  )
}
