'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { CheckCircle, XCircle, Phone, Building2, FileText, Plus, Printer, Eye, Trash2, DollarSign, Edit3 } from 'lucide-react'
import InvoiceEditor from './InvoiceEditor'
import InvoicePrint from './InvoicePrint'
import styles from './grossiste.module.css'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const STATUS_TABS = [
  { id: null,        label: 'Toutes' },
  { id: 'new',       label: '🆕 Nouvelles' },
  { id: 'contacted', label: '📞 Contactées' },
  { id: 'confirmed', label: '✅ Confirmées' },
  { id: 'cancelled', label: '❌ Annulées' },
]

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
    const supabase = adminClient()
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
    const supabase = adminClient()
    await supabase.from('wholesale_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchData()
    setActionLoading(null)
  }

  async function updateInvoiceStatus(id, status) {
    setActionLoading(id)
    const supabase = adminClient()
    await supabase.from('wholesale_invoices').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchData()
    setActionLoading(null)
  }

  async function deleteRequest(id) {
    if (!confirm('Supprimer cette demande ?')) return
    const supabase = adminClient()
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
                <div key={req.id} className={styles.requestCard}>
                  <div className={styles.reqHeader}>
                    <div>
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
                      <button className={`${styles.actionBtn} ${styles.actionPurple}`}
                        onClick={() => openNewInvoice(req)}>
                        <Plus size={14} /> Créer facture
                      </button>
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
