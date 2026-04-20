'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { CheckCircle, Package, Clock, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDT } from '@/lib/utils/formatDT'
import OTOWidget from '@/components/confirmation/OTOWidget'
import GiftCardConfirmation from '@/components/confirmation/GiftCardConfirmation'
import styles from './ConfirmationContent.module.css'

export default function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  // Confetti au chargement
  useEffect(() => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7','#ec4899','#06b6d4','#fbbf24','#10b981'] })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#a855f7','#fbbf24'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ec4899','#10b981'] })
    }, 400)
  }, [])

  // Charger la commande
  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, items, total_dt, status, oto_accepted, gift_message, gift_recipient')
      .eq('id', orderId)
      .single()
    setOrder(data)
    setLoading(false)
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  // Rafraîchir la commande après acceptation OTO
  function handleOTOAccepted() {
    setTimeout(() => fetchOrder(), 600) // laisser le temps à Supabase de commit
  }

  if (loading) return <div className={styles.loading}>Chargement...</div>

  const hasBuddy = order?.items?.some((i) => i.line === 'buddies')
  const showOTO  = order && !order.oto_accepted && !hasBuddy

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.successIcon}>
          <CheckCircle size={64} />
        </div>

        <h1 className={styles.title}>Commande confirmée !</h1>

        {/* Numéro de commande CACHÉ — pas affiché au client */}

        <p className={styles.subtitle}>
          Merci {order?.customer_name?.split(' ')[0] || ''} ! Notre équipe va vous appeler pour confirmer votre livraison.
        </p>

        {/* Steps */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.stepDone}`}>
            <CheckCircle size={20} /><span>Commande reçue</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={`${styles.step} ${styles.stepActive}`}>
            <Package size={20} /><span>Confirmation téléphonique</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.step}>
            <Clock size={20} /><span>En préparation</span>
          </div>
        </div>

        {/* Récapitulatif */}
        {order?.items && (
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Récapitulatif</h2>
            <div className={styles.itemsList}>
              {order.items.map((item, i) => (
                <div key={i} className={styles.item}>
                  <div className={styles.itemDot} style={{ background: item.color_hex || '#a855f7' }} />
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemTotal}>{formatDT(item.price_dt * item.qty)}</p>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span>Total payé à la livraison</span>
              <span className={styles.totalAmount}>{formatDT(order.total_dt)}</span>
            </div>
          </div>
        )}

        {/* Carte cadeau */}
        {order?.gift_message && (
          <GiftCardConfirmation message={order.gift_message} recipient={order.gift_recipient} />
        )}

        {/* OTO — passer le callback de refresh */}
        {showOTO && <OTOWidget orderId={orderId} onAccepted={handleOTOAccepted} />}

        {/* WhatsApp share si Buddy */}
        {hasBuddy && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Je viens de commander mon Slime Buddy sur hkgames.tn ! 🎉')}`}
            target="_blank" rel="noopener noreferrer"
            className={styles.whatsappBtn}
          >
            Partager sur WhatsApp
          </a>
        )}

        <Link href="/" className={styles.homeBtn}>
          <Home size={16} />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
