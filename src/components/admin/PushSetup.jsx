'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle, Smartphone, Battery, Download } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush, checkPushSubscription, isIOS, isAndroid, isPWA } from '@/lib/push/subscribe'
import styles from './PushSetup.module.css'

export default function PushSetup() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [msg, setMsg]               = useState(null)
  const [iosDevice, setIosDevice]   = useState(false)
  const [androidDevice, setAndroidDevice] = useState(false)
  const [pwa, setPwa]               = useState(false)

  useEffect(() => {
    setIosDevice(isIOS())
    setAndroidDevice(isAndroid())
    setPwa(isPWA())
    checkPushSubscription().then(setSubscribed)
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    setMsg(null)
    const result = await subscribeToPush()
    if (result.error === 'not_supported') {
      setMsg('not_supported')
    } else if (result.error === 'permission_denied') {
      setMsg('permission_denied')
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

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          {subscribed ? <Bell size={20} /> : <BellOff size={20} />}
        </div>
        <div>
          <h3 className={styles.title}>Notifications commandes</h3>
          <p className={styles.subtitle}>
            {subscribed
              ? 'Actives — alerte à chaque nouvelle commande.'
              : 'Recevez une alerte à chaque commande.'}
          </p>
        </div>
        {subscribed && <CheckCircle size={18} className={styles.check} />}
      </div>

      {/* Guide iOS */}
      {iosDevice && !pwa && (
        <div className={styles.guideBox}>
          <Smartphone size={16} />
          <div>
            <p className={styles.guideTitle}>iPhone / iPad</p>
            <p className={styles.guideText}>
              1. Appuie sur <strong>Partager</strong> dans Safari<br />
              2. Sélectionne <strong>Sur l&apos;écran d&apos;accueil</strong><br />
              3. Ouvre l&apos;app installée et reviens ici
            </p>
          </div>
        </div>
      )}

      {/* Guide Android */}
      {androidDevice && (
        <div className={styles.guideBox}>
          <Download size={16} />
          <div>
            <p className={styles.guideTitle}>Android — Pour recevoir les notifs en arrière-plan</p>
            <p className={styles.guideText}>
              <strong>Étape 1 — Installe l&apos;app :</strong><br />
              Chrome → menu ⋮ → <strong>Ajouter à l&apos;écran d&apos;accueil</strong><br />
              Ouvre l&apos;app depuis l&apos;icône installée<br /><br />
              <strong>Étape 2 — Désactive l&apos;optimisation batterie :</strong><br />
              Paramètres → Applications → Chrome → Batterie<br />
              → Sélectionne <strong>Sans restriction</strong>
            </p>
          </div>
        </div>
      )}

      {/* Android installé mais pas PWA */}
      {androidDevice && !pwa && (
        <div className={styles.warningBox}>
          <Battery size={16} />
          <p>Tu n&apos;utilises pas l&apos;app installée. Les notifications en arrière-plan ne fonctionneront pas.</p>
        </div>
      )}

      {/* Messages état */}
      {msg === 'success'          && <p className={styles.successMsg}>✅ Notifications activées !</p>}
      {msg === 'error'            && <p className={styles.errorMsg}>❌ Erreur — réessaie.</p>}
      {msg === 'permission_denied'&& <p className={styles.errorMsg}>❌ Permission refusée. Autorise les notifications dans les réglages du navigateur.</p>}
      {msg === 'not_supported'    && <p className={styles.errorMsg}>❌ Navigateur non supporté.</p>}

      {/* Actions */}
      <div className={styles.actions}>
        {!subscribed ? (
          <button className={styles.btn} onClick={handleSubscribe} disabled={loading} type="button">
            <Bell size={16} />
            {loading ? 'Activation...' : 'Activer notifications'}
          </button>
        ) : (
          <div className={styles.actions}>
            <button
              className={styles.testBtn}
              type="button"
              onClick={() => {
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                  new Notification('HK Games', { body: 'Test OK ✅', icon: '/icons/hk-logo-192.png' })
                }
              }}
            >
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
