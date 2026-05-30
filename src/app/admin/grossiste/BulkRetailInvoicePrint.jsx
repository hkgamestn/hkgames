'use client'
import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import styles from './invoice-print.module.css'

export default function BulkRetailInvoicePrint({ orders, settings, onClose }) {
  const tva_rate = parseFloat(settings.invoice_tva_rate  ?? 19)
  const dc_rate  = parseFloat(settings.invoice_dc_rate   ?? 1)
  const timbre   = parseFloat(settings.invoice_timbre    ?? 0.6)
  const grand_ttc = orders.reduce((s, o) => s + (o.total ?? 0), 0)
  const grand_ht  = grand_ttc / (1 + dc_rate/100 + tva_rate/100 * (1 + dc_rate/100))
  const grand_dc  = grand_ht * dc_rate / 100
  const grand_tva = (grand_ht + grand_dc) * tva_rate / 100
  const invDate   = new Date().toLocaleDateString('fr-TN', { day:'2-digit', month:'long', year:'numeric' })

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Facture groupée — {orders.length} commandes</span>
        <div className={styles.toolbarActions}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={16}/> Imprimer / PDF
          </button>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
      </div>

      <div className={styles.printScroll}>
        <div className={styles.invoice}>

          <header className={styles.invHeader}>
            <div className={styles.companyBlock}>
              <div className={styles.companyLogo}>HK<span>Games</span></div>
              <div className={styles.companyTagline}>Jouets & Slime Premium — Tunisie</div>
              <div className={styles.companyContact}>
                {settings.invoice_address && <span>📍 {settings.invoice_address}</span>}
                {settings.invoice_phone   && <span>📞 {settings.invoice_phone}</span>}
                {settings.invoice_matricule_fiscal && <span>MF : {settings.invoice_matricule_fiscal}</span>}
              </div>
            </div>
            <div className={styles.invMeta}>
              <div className={styles.invTypeLabel}>Facture groupée</div>
              <div className={styles.invNumber}>{orders.length} CMD</div>
              <div className={styles.invDateRow}>
                <span>📅 {invDate}</span>
                <span>{orders.length} commandes</span>
              </div>
              <span className={`${styles.invStatus} ${styles.statusSent}`}>Groupée</span>
            </div>
          </header>

          <main className={styles.invBody}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>N° Cde</th><th>Date</th><th>Client</th><th>Ville</th><th>Produits</th><th>Total TTC</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.order_number || o.id?.slice(0,8)}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('fr-TN')}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.customer_city || '—'}</td>
                    <td style={{fontSize:'10px'}}>
                      {(o.items||[]).map(it=>`${it.name}${it.color?' '+it.color:''} x${it.qty||1}`).join(', ')}
                    </td>
                    <td style={{fontWeight:700}}>{Number(o.total||0).toFixed(3)} DT</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totalsWrap}>
              <div className={styles.totalsBlock}>
                <div className={styles.totalLine}><span className={styles.label}>Base HT</span><span>{grand_ht.toFixed(3)} DT</span></div>
                <div className={styles.totalLine}><span className={styles.label}>DC ({dc_rate}%)</span><span>{grand_dc.toFixed(3)} DT</span></div>
                <div className={styles.totalLine}><span className={styles.label}>TVA ({tva_rate}%)</span><span>{grand_tva.toFixed(3)} DT</span></div>
                <div className={styles.totalLine}><span className={styles.label}>Timbre fiscal</span><span>{timbre.toFixed(3)} DT</span></div>
                <div className={styles.grandTotalLine}>
                  <span className={styles.label}>TOTAL TTC</span>
                  <span className={styles.amount}>{(grand_ht+grand_dc+grand_tva+timbre).toFixed(3)} DT</span>
                </div>
              </div>
            </div>
          </main>

          <footer className={styles.invFooter}>
            <div className={styles.watermark}>{orders.length}</div>
            <div className={styles.footerPayment}>
              <strong>Mode :</strong> Espèces à la livraison · DC {dc_rate}% · TVA {tva_rate}% · Timbre inclus
            </div>
            <div className={styles.footerBrand}>
              <div className={styles.footerThanks}>HK Games — Tunisie</div>
              <div className={styles.footerLegal}>Généré le {invDate} — hap-p-kids.store</div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
