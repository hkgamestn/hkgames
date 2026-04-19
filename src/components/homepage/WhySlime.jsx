'use client'

import { useRef, useEffect } from 'react'
import styles from './WhySlime.module.css'

const BENEFITS = [
  {
    emoji: '🧠',
    title: 'Anti-stress & Relaxation',
    desc: 'Malaxer du slime libère les tensions et calme l\'anxiété. Idéal après une longue journée d\'école ou de travail.',
    color: '#a855f7',
  },
  {
    emoji: '🎨',
    title: 'Développe la Créativité',
    desc: 'Mélanger les couleurs, créer son Buddy, inventer des textures — chaque session est une aventure créative unique.',
    color: '#ec4899',
  },
  {
    emoji: '🤲',
    title: 'Motricité Fine',
    desc: 'Étirer, plier, rouler le slime renforce les muscles des mains et améliore la coordination. Recommandé par les ergothérapeutes.',
    color: '#06b6d4',
  },
  {
    emoji: '😴',
    title: 'Aide à la Concentration',
    desc: 'Pour les enfants hyperactifs ou en difficulté de concentration, le slime offre un ancrage sensoriel apaisant.',
    color: '#10b981',
  },
  {
    emoji: '👨‍👩‍👧',
    title: 'Jeu en Famille',
    desc: 'Créer et jouer ensemble renforce les liens familiaux. Un moment de complicité loin des écrans.',
    color: '#fbbf24',
  },
  {
    emoji: '🧪',
    title: '100% Non-Toxique',
    desc: 'Nos slimes sont certifiés non-toxiques, sans borax ni produits dangereux. Sûrs pour les enfants dès 3 ans.',
    color: '#22c55e',
  },
]

export default function WhySlime() {
  const cardsRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }
        })
      },
      { threshold: 0.15 }
    )
    cardsRef.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tag}>Pourquoi le Slime ?</span>
          <h2 className={styles.title}>
            Bien plus qu'un jouet —
            <span className={styles.titleHighlight}> un outil de bien-être</span>
          </h2>
          <p className={styles.subtitle}>
            Des milliers de parents tunisiens ont découvert les bienfaits incroyables du slime artisanal pour leurs enfants.
          </p>
        </div>

        <div className={styles.grid}>
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              ref={(el) => (cardsRef.current[i] = el)}
              className={styles.card}
              style={{
                opacity: 0,
                transform: 'translateY(30px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
                '--card-color': b.color,
              }}
            >
              <div className={styles.cardGlow} />
              <span className={styles.emoji}>{b.emoji}</span>
              <h3 className={styles.cardTitle}>{b.title}</h3>
              <p className={styles.cardDesc}>{b.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <div className={styles.ctaStat}>
            <span className={styles.ctaNum}>+1 248</span>
            <span className={styles.ctaLabel}>familles satisfaites</span>
          </div>
          <div className={styles.ctaStat}>
            <span className={styles.ctaNum}>4.9★</span>
            <span className={styles.ctaLabel}>note moyenne</span>
          </div>
          <div className={styles.ctaStat}>
            <span className={styles.ctaNum}>100%</span>
            <span className={styles.ctaLabel}>non-toxique certifié</span>
          </div>
        </div>
      </div>
    </section>
  )
}
