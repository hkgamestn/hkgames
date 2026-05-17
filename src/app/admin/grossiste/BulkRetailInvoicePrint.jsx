'use client'
import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import styles from './invoice-print.module.css'

export default function BulkRetailInvoicePrint({ orders, settings, onClose }) {
  const tva_rate = parseFloat(settings.invoice_tva_rate  ?? 19)
  const dc_rate  = parseFloat(settings.invoice_dc_rate   ?? 1)
  const timbre   = parseFloat(settings.invoice_timbre    ?? 0.6)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Flatten all items across orders
  const allLines = orders.flatMap(o =>
    (o.items || []).map(it => ({
      ...it,
      order_ref: o.order_number || o.id?.slice(0, 8),
      order_date: new Date(o.created_at).toLocaleDateString('fr-TN'),
    }))
  )

  const grand_ttc  = orders.reduce((s, o) => s + (o.total ?? 0), 0)
  const grand_ht   = grand_ttc / (1 + dc_rate / 100 + tva_rate / 100 * (1 + dc_rate / 100))
  const grand_dc   = grand_ht * dc_rate / 100
  const grand_tva  = (grand_ht + grand_dc) * tva_rate / 100

  const invDate = new Date().toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>
          Facture groupée — {orders.length} commandes
        </span>
        <div className={styles.toolbarActions}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={18} /> Imprimer / PDF
          </button>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
      </div>

      <div className={styles.printArea}>
        {/* En-tête */}
        <div className={styles.invoiceHeader}>
          <div className={styles.companyBlock}>
            <div className={styles.companyName}>{settings.invoice_company_name || 'HK Games'}</div>
            <div className={styles.companyDetails}>
              {settings.invoice_address && <div>{settings.invoice_address}</div>}
              {settings.invoice_phone   && <div>Tél : {settings.invoice_phone}</div>}
              {settings.invoice_email   && <div>{settings.invoice_email}</div>}
              {settings.invoice_matricule_fiscal && <div>MF : {settings.invoice_matricule_fiscal}</div>}
            </div>
          </div>
          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceTitle}>FACTURE GROUPÉE</div>
            <table className={styles.metaTable}>
              <tbody>
                <tr><td>Date :</td><td><strong>{invDate}</strong></td></tr>
                <tr><td>Nb commandes :</td><td><strong>{orders.length}</strong></td></tr>
                <tr><td>Total TTC :</td><td><strong>{grand_ttc.toFixed(3)} DT</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Tableau commandes */}
        <table className={styles.linesTable}>
          <thead>
            <tr>
              <th>N° Cde</th>
              <th>Date</th>
              <th>Client</th>
              <th>Ville</th>
              <th>Produits</th>
              <th style={{textAlign:'right'}}>Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id}>
                <td><strong>#{o.order_number || o.id?.slice(0,8)}</strong></td>
                <td>{new Date(o.created_at).toLocaleDateString('fr-TN')}</td>
                <td>{o.customer_name}</td>
                <td>{o.customer_city || '—'}</td>
                <td style={{fontSize:'11px'}}>
                  {(o.items || []).map(it => `${it.name}${it.color?' '+it.color:''} x${it.qty||1}`).join(', ')}
                </td>
                <td style={{textAlign:'right', fontWeight:700}}>{Number(o.total||0).toFixed(3)} DT</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsRight}>
            <div className={styles.totalLine}><span>Base HT</span><span>{grand_ht.toFixed(3)} DT</span></div>
            <div className={styles.totalLine}><span>Droit de consommation ({dc_rate}%)</span><span>{grand_dc.toFixed(3)} DT</span></div>
            <div className={styles.totalLine}><span>TVA ({tva_rate}% sur HT+DC)</span><span>{grand_tva.toFixed(3)} DT</span></div>
            <div className={styles.totalLine}><span>Timbre fiscal</span><span>{timbre.toFixed(3)} DT</span></div>
            <div className={`${styles.totalLine} ${styles.grandTotal}`}>
              <span>TOTAL TTC</span><span>{(grand_ht + grand_dc + grand_tva + timbre).toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        {settings.invoice_footer_note && (
          <div className={styles.notesSection}>
            <div className={styles.notesText}>{settings.invoice_footer_note}</div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerPayment}><strong>Mode de règlement :</strong> Espèces à la livraison (COD)</div>
          <div className={styles.footerThanks}>Merci pour votre confiance — {settings.invoice_company_name || 'HK Games'}</div>
          <div className={styles.footerLegal}>
            Document généré le {new Date().toLocaleDateString('fr-TN')} — hap-p-kids.store
          </div>
        </div>
      </div>
    </div>
  )
}
