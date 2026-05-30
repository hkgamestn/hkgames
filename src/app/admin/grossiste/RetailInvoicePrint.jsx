'use client'
import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import styles from './invoice-print.module.css'

export default function RetailInvoicePrint({ order, onClose }) {
  const items    = order?.items || []
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0)
  const delivery = order.delivery_fee ?? 7
  const discount = order.discount ?? 0
  const total_ttc = order.total ?? (subtotal + delivery - discount)
  const ht        = total_ttc / 1.20
  const dc        = ht * 0.01
  const tva       = (ht + dc) * 0.19
  const timbre    = 0.600
  const invRef    = `RET-${order.order_number || order.id?.slice(0,8)}`
  const date      = new Date(order.created_at || Date.now()).toLocaleDateString('fr-TN', { day:'2-digit', month:'long', year:'numeric' })

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Facture — {order.customer_name} #{order.order_number || order.id?.slice(0,8)}</span>
        <div className={styles.toolbarActions}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={16}/> Imprimer / PDF
          </button>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
      </div>

      <div className={styles.printScroll}>
        <div className={styles.invoice}>

          {/* HEADER */}
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
              <div className={styles.invTypeLabel}>Facture — Vente au détail</div>
              <div className={styles.invNumber}>{invRef}</div>
              <div className={styles.invDateRow}>
                <span>📅 {date}</span>
              </div>
              <span className={`${styles.invStatus} ${styles.statusPaid}`}>Paiement COD</span>
            </div>
          </header>

          {/* BODY */}
          <main className={styles.invBody}>
            <div className={styles.billingRow}>
              <div className={styles.billingBlock}>
                <div className={styles.billingLabel}>Client</div>
                <div className={styles.billingName}>{order.customer_name}</div>
                <div className={styles.billingDetail}>
                  {order.customer_phone   && <>{order.customer_phone}<br/></>}
                  {order.customer_address && <>{order.customer_address}</>}
                  {order.customer_city    && <>, {order.customer_city}</>}
                </div>
              </div>
              <div className={styles.billingBlock}>
                <div className={styles.billingLabel}>Commande</div>
                <div className={styles.billingDetail}>
                  <strong style={{color:'#1a1a2e'}}>N° :</strong> #{order.order_number || order.id?.slice(0,8)}<br/>
                  <strong style={{color:'#1a1a2e'}}>Date :</strong> {date}<br/>
                  <strong style={{color:'#1a1a2e'}}>Mode paiement :</strong> Espèces à la livraison<br/>
                  <strong style={{color:'#1a1a2e'}}>Livraison :</strong> Navex
                </div>
              </div>
            </div>

            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>N°</th><th>Désignation</th><th>Qté</th><th>P.U. TTC</th><th>Total TTC</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.name}{item.color ? ` — ${item.color}` : ''}{item.weight ? ` (${item.weight})` : ''}</td>
                    <td>{item.qty || 1}</td>
                    <td>{Number(item.price || 0).toFixed(3)} DT</td>
                    <td>{(Number(item.price || 0) * (item.qty || 1)).toFixed(3)} DT</td>
                  </tr>
                ))}
                {delivery > 0 && (
                  <tr>
                    <td>{items.length + 1}</td>
                    <td>Frais de livraison (Navex)</td>
                    <td>1</td>
                    <td>{Number(delivery).toFixed(3)} DT</td>
                    <td>{Number(delivery).toFixed(3)} DT</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr className={styles.discountRow}>
                    <td>—</td><td>Remise / Promotion</td><td>—</td><td>—</td>
                    <td>-{Number(discount).toFixed(3)} DT</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className={styles.totalsWrap}>
              <div className={styles.totalsBlock}>
                <div className={styles.totalLine}><span className={styles.label}>Base HT</span><span>{ht.toFixed(3)} DT</span></div>
                <div className={styles.totalLine}><span className={styles.label}>Droit de consommation (1%)</span><span>{dc.toFixed(3)} DT</span></div>
                <div className={styles.totalLine}><span className={styles.label}>TVA (19% sur HT+DC)</span><span>{tva.toFixed(3)} DT</span></div>
                <div className={styles.totalLine}><span className={styles.label}>Timbre quittance</span><span>{timbre.toFixed(3)} DT</span></div>
                <div className={styles.grandTotalLine}>
                  <span className={styles.label}>TOTAL TTC</span>
                  <span className={styles.amount}>{(ht + dc + tva + timbre).toFixed(3)} DT</span>
                </div>
              </div>
            </div>

            {order.gift_message && (
              <div className={styles.notesBlock}>
                <div className={styles.notesLabel}>Message cadeau</div>
                <div className={styles.notesText}>{order.gift_message}</div>
              </div>
            )}
          </main>

          {/* FOOTER */}
          <footer className={styles.invFooter}>
            <div className={styles.watermark}>{order.order_number || order.id?.slice(0,6)}</div>
            <div className={styles.footerPayment}>
              <strong>Mode de règlement :</strong> Espèces à la livraison (COD)<br/>
              Assujetti TVA · DC 1% · Timbre quittance inclus
            </div>
            <div className={styles.footerBrand}>
              <div className={styles.footerThanks}>Merci pour votre achat</div>
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
