'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle, Smartphone } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush, checkPushSubscription, isIOS, isPWA } from '@/lib/push/subscribe'
import styles from './PushSetup.module.css'

const WA_ADMIN = '+21621660303'

export default function PushSetup() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [msg, setMsg]               = useState(null)
  const [iosDevice, setIosDevice]   = useState(false)
  const [pwa, setPwa]               = useState(false)

  useEffect(() => {
    setIosDevice(isIOS())
    setPwa(isPWA())
    checkPushSubscription().then(setSubscribed)
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    const result = await subscribeToPush()
    if (result.error === 'ios_not_supported') {
      setMsg('ios')
    } else if (result.success) {
      setSubscribed(true)
      setMsg('success')
    } else {
      setMsg('error')
    }
    setLoading(false)
  }

  async function handleUnsubscribe() {
    setLoading(true)
    await unsubscribeFromPush()
    setSubscribed(false)
    setMsg(null)
    setLoading(false)
  }

  const waLink = 'https://wa.me/' + WA_ADMIN

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          {subscribed ? <Bell size={20} /> : <BellOff size={20} />}
        </div>
        <div>
          <h3 className={styles.title}>Notifications commandes</h3>
          <p className={styles.subtitle}>
            {subscribed ? 'Actives — alerte à chaque nouvelle commande.' : 'Recevez une alerte à chaque commande.'}
          </p>
        </div>
        {subscribed && <CheckCircle size={18} className={styles.check} />}
      </div>

      {iosDevice && !subscribed && (
        <div className={styles.iosBox}>
          <Smartphone size={18} />
          <div>
            <p className={styles.iosTitle}>iPhone détecté</p>
            {!pwa ? (
              <p className={styles.iosText}>
                Pour activer les notifications : appuie sur Partager dans Safari, puis Sur l écran d accueil. Ouvre l app installée et reviens ici.
              </p>
            ) : (
              <p className={styles.iosText}>
                Tu peux maintenant activer les notifications. Assure-toi d être sur iOS 16.4+
              </p>
            )}
          </div>
        </div>
      )}

      {msg === 'success' && <p className={styles.successMsg}>Notifications web activées !</p>}
      {msg === 'error'   && <p className={styles.errorMsg}>Erreur — réessaie.</p>}

      <div className={styles.actions}>
        {!subscribed ? (
          <button className={styles.btn} onClick={handleSubscribe} disabled={loading} type="button">
            <Bell size={16} />
            {loading ? 'Activation...' : 'Activer notifications web'}
          </button>
        ) : (
          <div className={styles.actions}>
            <button className={styles.testBtn} type="button" onClick={() => {
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('HK Games', { body: 'Test OK', icon: '/icons/hk-logo-192.png' })
              }
            }}>
              Tester
            </button>
            <button className={styles.offBtn} onClick={handleUnsubscribe} disabled={loading} type="button">
              Désactiver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
