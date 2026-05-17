'use client'
import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import styles from './invoice-print.module.css'

export default function InvoicePrint({ invoice, onClose }) {
  const TVA_RATE = invoice.tva_rate ?? 19
  const items    = invoice.items || []

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handlePrint() { window.print() }

  const date = new Date(invoice.created_at).toLocaleDateString('fr-TN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div className={styles.overlay}>
      {/* Toolbar (caché à l'impression) */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{invoice.invoice_number}</span>
        <div className={styles.toolbarActions}>
          <button className={styles.printBtn} onClick={handlePrint}>
            <Printer size={18} /> Imprimer / PDF
          </button>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
      </div>

      {/* Zone imprimable */}
      <div className={styles.printArea} id="invoice-print-area">

        {/* En-tête */}
        <div className={styles.invoiceHeader}>
          <div className={styles.companyBlock}>
            <div className={styles.companyName}>HK Games</div>
            <div className={styles.companyDetails}>
              <div>Vente de jouets et accessoires enfants</div>
              <div>Tunisie — hap-p-kids.store</div>
              <div>Tel : +216 XX XXX XXX</div>
            </div>
          </div>
          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceTitle}>FACTURE</div>
            <table className={styles.metaTable}>
              <tbody>
                <tr><td>N° Facture :</td><td><strong>{invoice.invoice_number}</strong></td></tr>
                <tr><td>Date :</td><td>{date}</td></tr>
                <tr><td>Statut :</td><td>{invoice.status === 'paid' ? '✅ Payée' : invoice.status === 'sent' ? '📤 Envoyée' : '📝 Brouillon'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Client */}
        <div className={styles.clientSection}>
          <div className={styles.clientLabel}>FACTURÉ À :</div>
          <div className={styles.clientName}>{invoice.company_name}</div>
          <div className={styles.clientDetail}>Responsable : {invoice.contact_name}</div>
          {invoice.phone && <div className={styles.clientDetail}>Tél : {invoice.phone}</div>}
          {invoice.email && <div className={styles.clientDetail}>Email : {invoice.email}</div>}
          <div className={styles.clientDetail}>{invoice.address}{invoice.city ? `, ${invoice.city}` : ''}</div>
          <div className={styles.clientMF}>Matricule Fiscal : <strong>{invoice.matricule_fiscal}</strong></div>
        </div>

        {/* Tableau des lignes */}
        <table className={styles.linesTable}>
          <thead>
            <tr>
              <th>N°</th>
              <th>Désignation</th>
              <th>Qté</th>
              <th>Prix unitaire HT</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.product}</td>
                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                <td style={{ textAlign: 'right' }}>{Number(item.unit_price_ht).toFixed(3)} DT</td>
                <td style={{ textAlign: 'right' }}>
                  {(Number(item.qty) * Number(item.unit_price_ht)).toFixed(3)} DT
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsRight}>
            <div className={styles.totalLine}>
              <span>Total HT</span>
              <span>{Number(invoice.total_ht).toFixed(3)} DT</span>
            </div>
            <div className={styles.totalLine}>
              <span>Droit de consommation (1%)</span>
              <span>{(Number(invoice.total_ht) * 0.01).toFixed(3)} DT</span>
            </div>
            <div className={styles.totalLine}>
              <span>TVA (19% sur HT+DC)</span>
              <span>{(Number(invoice.total_ht) * 1.01 * 0.19).toFixed(3)} DT</span>
            </div>
            <div className={styles.totalLine}>
              <span>Timbre fiscal</span>
              <span>{Number(invoice.timbre ?? 1).toFixed(3)} DT</span>
            </div>
            <div className={`${styles.totalLine} ${styles.grandTotal}`}>
              <span>TOTAL TTC</span>
              <span>{Number(invoice.total_ttc).toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className={styles.notesSection}>
            <div className={styles.notesLabel}>Notes :</div>
            <div className={styles.notesText}>{invoice.notes}</div>
          </div>
        )}

        {/* Pied de page */}
        <div className={styles.footer}>
          <div className={styles.footerPayment}>
            <strong>Mode de paiement :</strong> Virement bancaire / Espèces à la livraison
          </div>
          <div className={styles.footerThanks}>
            Merci pour votre confiance — HK Games
          </div>
          <div className={styles.footerLegal}>
            Document généré le {new Date().toLocaleDateString('fr-TN')} — hap-p-kids.store
          </div>
        </div>

      </div>
    </div>
  )
}
