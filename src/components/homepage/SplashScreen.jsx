'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('blob') // blob | logo | done

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('splashSeen')) {
      onComplete()
      return
    }

    const t1 = setTimeout(() => setPhase('logo'), 800)
    const t2 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem('splashSeen', 'true')
      onComplete()
    }, 2000)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  if (phase === 'done') return null

  return (
    <div className={`${styles.splash} ${phase === 'logo' ? styles.logoPhase : ''}`}>
      <div className={`${styles.blob} ${phase === 'logo' ? styles.blobExplode : ''}`} />
      {phase === 'logo' && (
        <div className={styles.logo}>
          <Image
            src="/icons/hk-logo-512.png"
            alt="HK Games"
            width={120}
            height={120}
            priority
          />
          <p className={styles.tagline}>Le Slime N°1 de Tunisie</p>
        </div>
      )}
    </div>
  )
}
