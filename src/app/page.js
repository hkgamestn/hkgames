'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
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
            <ReviewSection />
          </main>
          <Footer />
        </>
      )}
    </>
  )
}
