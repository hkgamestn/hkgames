'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import styles from './CrossSell.module.css'

export default function CrossSell({ items }) {
  const hasUnicolore = items.some((i) => i.line === 'unicolore')
  const hasBicolore  = items.some((i) => i.line === 'bicolore')
  const hasBuddies   = items.some((i) => i.line === 'buddies')

  let suggestion = null

  if (hasUnicolore && !hasBuddies) {
    const unicolore = items.find((i) => i.line === 'unicolore')
    const color = unicolore?.color?.toLowerCase() || 'violet'
    suggestion = {
      text: `Rends-le vivant ! Ajoute les yeux à ton Slime ${unicolore?.color}`,
      link: `/shop/buddies`,
      cta:  'Voir les Buddies',
    }
  } else if (hasBicolore && !hasUnicolore) {
    suggestion = {
      text: "Garde la couleur secrète ! Ajoute l'Unicolore assorti",
      link: '/shop/unicolore',
      cta:  'Voir les Unicolores',
    }
  }

  if (!suggestion) return null

  return (
    <div className={styles.wrap}>
      <Sparkles size={16} className={styles.icon} />
      <p className={styles.text}>{suggestion.text}</p>
      <Link href={suggestion.link} className={styles.cta}>{suggestion.cta}</Link>
    </div>
  )
}
