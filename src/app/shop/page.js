import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CatalogueContent from './CatalogueContent'

export const metadata = {
  title: 'Acheter Slime en Tunisie — Unicolore, Bicolore, Buddy 170g | HK Games',
  description: 'Achetez du slime artisanal premium en Tunisie. Slime Unicolore, Bicolore et Buddy 170g. Livraison rapide partout en Tunisie via Navex. Paiement à la livraison. Certifié pour enfants dès 3 ans.',
  keywords: ['slime tunisie','acheter slime tunisie','slime 170g tunisie','slime unicolore tunisie','slime bicolore tunisie','slime buddy tunisie','jouet slime tunisie'],
  alternates: { canonical: 'https://www.hap-p-kids.store/shop' },
  openGraph: {
    title:       'Slime Premium en Tunisie — HK Games | Livraison Rapide',
    description: 'Unicolore, Bicolore, Buddy 170g. Paiement à la livraison, partout en Tunisie.',
    url:         'https://www.hap-p-kids.store/shop',
  },
}

export const revalidate = 300

export default function ShopPage({ searchParams }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqShopLd) }}/>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <Suspense fallback={<div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>}>
          <CatalogueContent line={null} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
