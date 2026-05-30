'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'

export const metadata = {
  title: 'HK Games — Slime Premium en Tunisie | Livraison Rapide',
  description: 'Commandez votre slime artisanal en Tunisie. Unicolore, Bicolore et Buddy 170g. Paiement à la livraison via Navex partout en Tunisie. Certifié pour enfants dès 3 ans.',
  alternates: { canonical: 'https://hap-p-kids.store' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id':   'https://hap-p-kids.store/#org',
      name:    'HK Games',
      url:     'https://hap-p-kids.store',
      logo:    'https://hap-p-kids.store/icons/hk-logo-192.png',
      contactPoint: {
        '@type':       'ContactPoint',
        telephone:     '+21621660303',
        contactType:   'customer service',
        availableLanguage: ['French','Arabic'],
      },
      address: {
        '@type':           'PostalAddress',
        addressCountry:    'TN',
        addressLocality:   'Tunis',
      },
    },
    {
      '@type':       'WebSite',
      '@id':         'https://hap-p-kids.store/#website',
      url:           'https://hap-p-kids.store',
      name:          'HK Games',
      publisher:     { '@id': 'https://hap-p-kids.store/#org' },
      inLanguage:    'fr-TN',
      potentialAction: {
        '@type':        'SearchAction',
        target:         'https://hap-p-kids.store/shop?q={search_term_string}',
        'query-input':  'required name=search_term_string',
      },
    },
    {
      '@type':         'Store',
      '@id':           'https://hap-p-kids.store/#store',
      name:            'HK Games — Slime Tunisie',
      url:             'https://hap-p-kids.store',
      description:     'Boutique en ligne de slime artisanal premium en Tunisie. Unicolore, Bicolore et Buddy 170g. Livraison nationale via Navex.',
      image:           'https://hap-p-kids.store/og/og-default.jpg',
      priceRange:      '$$',
      servesCuisine:   null,
      hasMap:          null,
      address: {
        '@type':         'PostalAddress',
        addressCountry:  'TN',
        addressLocality: 'Tunis',
      },
      openingHours: 'Mo-Sa 09:00-18:00',
      paymentAccepted: 'Cash on Delivery',
      currenciesAccepted: 'TND',
    },
  ],
}
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/homepage/HeroSection'

// Lazy load tout ce qui est below-fold → libère le thread principal pour le LCP
const SlimeLab       = dynamic(() => import('@/components/homepage/SlimeLab'),       { ssr: false })
const SocialProof    = dynamic(() => import('@/components/homepage/SocialProof'),    { ssr: false })
const WhySlime       = dynamic(() => import('@/components/homepage/WhySlime'),       { ssr: false })
const ReviewSection  = dynamic(() => import('@/components/homepage/ReviewSection'),  { ssr: false })
const SplashScreen     = dynamic(() => import('@/components/homepage/SplashScreen'),     { ssr: false })
const CataloguePreview = dynamic(() => import('@/components/homepage/CataloguePreview'), { ssr: false })
const BlogCarousel    = dynamic(() => import('@/components/homepage/BlogCarousel'),    { ssr: false })
const VideoShowcase   = dynamic(() => import('@/components/homepage/VideoShowcase'),   { ssr: false })

export default function HomePage() {
  const [splashDone, setSplashDone]   = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('splashSeen')) {
      setSplashDone(true)
      setShowContent(true)
    }
  }, [])

  function handleSplashComplete() {
    setSplashDone(true)
    setTimeout(() => setShowContent(true), 100)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      {showContent && (
        <>
          <Navbar />
          <main>
            <HeroSection />
            <SocialProof />
            <SlimeLab />
            <WhySlime />
            <Suspense fallback={<div style={{ padding: '64px', textAlign: 'center' }}>Chargement...</div>}>
              <CataloguePreview />
            </Suspense>
            <VideoShowcase />
            <BlogCarousel />
            <ReviewSection />
          </main>
          <Footer />
        </>
      )}
    </>
  )
}
