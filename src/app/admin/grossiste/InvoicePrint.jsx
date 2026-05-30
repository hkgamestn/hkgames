'use client'
import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import styles from './invoice-print.module.css'

const STATUS_MAP = {
  draft:     { label: 'Brouillon', cls: 'statusDraft'     },
  sent:      { label: 'Envoyée',   cls: 'statusSent'      },
  paid:      { label: 'Payée',     cls: 'statusPaid'      },
  cancelled: { label: 'Annulée',   cls: 'statusCancelled' },
}

export default function InvoicePrint({ invoice, onClose }) {
  const items   = invoice.items || []
  const status  = STATUS_MAP[invoice.status] || STATUS_MAP.draft
  const date    = new Date(invoice.created_at || Date.now()).toLocaleDateString('fr-TN', { day:'2-digit', month:'long', year:'numeric' })
  const DC_AMT  = (Number(invoice.total_ht) * 0.01)
  const TVA_AMT = (Number(invoice.total_ht) * 1.01 * 0.19)

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  return (
    <div className={styles.overlay}>

      {/* Admin toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{invoice.invoice_number}</span>
        <div className={styles.toolbarActions}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={16}/> Imprimer / PDF
          </button>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
      </div>

      {/* Scrollable preview */}
      <div className={styles.printScroll}>
        <div className={styles.invoice}>

          {/* ── HEADER ── */}
          <header className={styles.invHeader}>
            <div className={styles.companyBlock}>
              <div className={styles.companyLogo}>HK<span>Games</span></div>
              <div className={styles.companyTagline}>Jouets & Slime Premium — Tunisie</div>
              <div className={styles.companyContact}>
                <span>🌐 hap-p-kids.store</span>
                <span>📍 Tunisie</span>
              </div>
            </div>
            <div className={styles.invMeta}>
              <div className={styles.invTypeLabel}>Facture</div>
              <div className={styles.invNumber}>{invoice.invoice_number}</div>
              <div className={styles.invDateRow}>
                <span>📅 {date}</span>
              </div>
              <span className={`${styles.invStatus} ${styles[status.cls]}`}>{status.label}</span>
            </div>
          </header>

          {/* ── BODY ── */}
          <main className={styles.invBody}>

            {/* Billing info */}
            <div className={styles.billingRow}>
              <div className={styles.billingBlock}>
                <div className={styles.billingLabel}>Facturé à</div>
                <div className={styles.billingName}>{invoice.company_name}</div>
                <div className={styles.billingDetail}>
                  {invoice.contact_name && <>{invoice.contact_name}<br/></>}
                  {invoice.phone         && <>{invoice.phone}<br/></>}
                  {invoice.email         && <>{invoice.email}<br/></>}
                  {invoice.address       && <>{invoice.address}{invoice.city ? `, ${invoice.city}` : ''}</>}
                </div>
                <div className={styles.billingMF}>MF : <strong>{invoice.matricule_fiscal}</strong></div>
              </div>

              <div className={styles.billingBlock}>
                <div className={styles.billingLabel}>Détails commande</div>
                <div className={styles.billingDetail}>
                  <strong style={{color:'#1a1a2e'}}>N° :</strong> {invoice.invoice_number}<br/>
                  <strong style={{color:'#1a1a2e'}}>Date :</strong> {date}<br/>
                  <strong style={{color:'#1a1a2e'}}>Mode paiement :</strong><br/>
                  Virement / Espèces à la livraison<br/>
                  <strong style={{color:'#1a1a2e'}}>Statut :</strong> {status.label}
                </div>
              </div>
            </div>

            {/* Lines table */}
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>N°</th>
                  <th>Désignation</th>
                  <th>Qté</th>
                  <th>P.U. HT</th>
                  <th>Total HT</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.product}</td>
                    <td>{item.qty}</td>
                    <td>{Number(item.unit_price_ht).toFixed(3)} DT</td>
                    <td>{(Number(item.qty) * Number(item.unit_price_ht)).toFixed(3)} DT</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className={styles.totalsWrap}>
              <div className={styles.totalsBlock}>
                <div className={styles.totalLine}>
                  <span className={styles.label}>Total HT</span>
                  <span>{Number(invoice.total_ht).toFixed(3)} DT</span>
                </div>
                <div className={styles.totalLine}>
                  <span className={styles.label}>Droit de consommation (1%)</span>
                  <span>{DC_AMT.toFixed(3)} DT</span>
                </div>
                <div className={styles.totalLine}>
                  <span className={styles.label}>TVA (19% sur HT+DC)</span>
                  <span>{TVA_AMT.toFixed(3)} DT</span>
                </div>
                <div className={styles.totalLine}>
                  <span className={styles.label}>Timbre fiscal</span>
                  <span>{Number(invoice.timbre ?? 1).toFixed(3)} DT</span>
                </div>
                <div className={styles.grandTotalLine}>
                  <span className={styles.label}>TOTAL TTC</span>
                  <span className={styles.amount}>{Number(invoice.total_ttc).toFixed(3)} DT</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className={styles.notesBlock}>
                <div className={styles.notesLabel}>Notes</div>
                <div className={styles.notesText}>{invoice.notes}</div>
              </div>
            )}
          </main>

          {/* ── FOOTER ── */}
          <footer className={styles.invFooter}>
            <div className={styles.watermark}>{invoice.invoice_number?.split('-').pop()}</div>
            <div className={styles.footerPayment}>
              <strong>Mode de règlement :</strong> Virement bancaire · Espèces à la livraison (COD)<br/>
              Assujetti TVA · DC 1% · Timbre quittance inclus
            </div>
            <div className={styles.footerBrand}>
              <div className={styles.footerThanks}>Merci pour votre confiance</div>
              <div className={styles.footerLegal}>
                Document généré le {new Date().toLocaleDateString('fr-TN')} — hap-p-kids.store
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
