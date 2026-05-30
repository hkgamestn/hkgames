'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'

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
