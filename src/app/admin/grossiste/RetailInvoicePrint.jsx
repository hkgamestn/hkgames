'use client'
import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import styles from './invoice-print.module.css'

// Tunisie: DC 1% sur HT, TVA 19% sur (HT + DC)
function calcTaxes(total_ttc_order) {
  // Retro-calcul depuis TTC de la commande retail
  // On reçoit directement les montants
  return {}
}

export default function RetailInvoicePrint({ order, onClose }) {
  const items = order?.items || []

  // Calcul fiscal tunisien
  const subtotal = order.subtotal ?? items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
  const delivery = order.delivery_fee ?? 7
  const discount = order.discount ?? 0
  const total_ttc = order.total ?? (subtotal + delivery - discount)

  // Décomposition: total_ttc = HT * (1 + 0.01 + 0.19*(1+0.01)) = HT * 1.2019
  // Simplifié selon pratique courante tunisienne:
  // HT = total_ttc / 1.20  (DC 1% + TVA 19% = 20% charge fiscale)
  const ht        = total_ttc / 1.20
  const dc        = ht * 0.01
  const tva_base  = ht + dc
  const tva       = tva_base * 0.19
  const timbre    = 0.600  // timbre quittance

  const date = new Date(order.created_at || Date.now()).toLocaleDateString('fr-TN', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className={styles.overlay}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Facture — {order.customer_name} #{order.order_number || order.id?.slice(0,8)}</span>
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
            <div className={styles.companyName}>HK Games</div>
            <div className={styles.companyDetails}>
              <div>Vente de jouets et accessoires enfants</div>
              <div>Tunisie — hap-p-kids.store</div>
            </div>
          </div>
          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceTitle}>FACTURE</div>
            <table className={styles.metaTable}>
              <tbody>
                <tr><td>N° Commande :</td><td><strong>#{order.order_number || order.id?.slice(0,8)}</strong></td></tr>
                <tr><td>Date :</td><td>{date}</td></tr>
                <tr><td>Mode paiement :</td><td>Paiement à la livraison</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Client */}
        <div className={styles.clientSection}>
          <div className={styles.clientLabel}>FACTURÉ À :</div>
          <div className={styles.clientName}>{order.customer_name}</div>
          {order.customer_phone   && <div className={styles.clientDetail}>Tél : {order.customer_phone}</div>}
          {order.customer_address && <div className={styles.clientDetail}>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}</div>}
        </div>

        {/* Lignes */}
        <table className={styles.linesTable}>
          <thead>
            <tr>
              <th>N°</th>
              <th>Désignation</th>
              <th>Qté</th>
              <th>Prix unitaire TTC</th>
              <th>Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.name}{item.color ? ` — ${item.color}` : ''}{item.weight ? ` (${item.weight})` : ''}</td>
                <td style={{ textAlign: 'center' }}>{item.qty || 1}</td>
                <td style={{ textAlign: 'right' }}>{Number(item.price || 0).toFixed(3)} DT</td>
                <td style={{ textAlign: 'right' }}>{(Number(item.price || 0) * (item.qty || 1)).toFixed(3)} DT</td>
              </tr>
            ))}
            {delivery > 0 && (
              <tr>
                <td>{items.length + 1}</td>
                <td>Frais de livraison (Navex)</td>
                <td style={{ textAlign: 'center' }}>1</td>
                <td style={{ textAlign: 'right' }}>{Number(delivery).toFixed(3)} DT</td>
                <td style={{ textAlign: 'right' }}>{Number(delivery).toFixed(3)} DT</td>
              </tr>
            )}
            {discount > 0 && (
              <tr style={{ color: '#10b981' }}>
                <td>—</td>
                <td>Remise / Promotion</td>
                <td style={{ textAlign: 'center' }}>—</td>
                <td style={{ textAlign: 'right' }}>—</td>
                <td style={{ textAlign: 'right' }}>-{Number(discount).toFixed(3)} DT</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totaux fiscaux */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsRight}>
            <div className={styles.totalLine}><span>Base HT</span><span>{ht.toFixed(3)} DT</span></div>
            <div className={styles.totalLine}><span>Droit de consommation (1%)</span><span>{dc.toFixed(3)} DT</span></div>
            <div className={styles.totalLine}><span>TVA (19% sur HT+DC)</span><span>{tva.toFixed(3)} DT</span></div>
            <div className={styles.totalLine}><span>Timbre quittance</span><span>{timbre.toFixed(3)} DT</span></div>
            <div className={`${styles.totalLine} ${styles.grandTotal}`}>
              <span>TOTAL TTC</span>
              <span>{(ht + dc + tva + timbre).toFixed(3)} DT</span>
            </div>
          </div>
        </div>

        {order.gift_message && (
          <div className={styles.notesSection}>
            <div className={styles.notesLabel}>Message cadeau :</div>
            <div className={styles.notesText}>{order.gift_message}</div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerPayment}><strong>Mode de règlement :</strong> Espèces à la livraison (COD)</div>
          <div className={styles.footerThanks}>Merci pour votre achat — HK Games</div>
          <div className={styles.footerLegal}>
            Document généré le {new Date().toLocaleDateString('fr-TN')} — hap-p-kids.store<br />
            Assujetti TVA — DC 1% — Timbre quittance inclus
          </div>
        </div>
      </div>
    </div>
  )
}
