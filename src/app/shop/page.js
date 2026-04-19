import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CatalogueContent from './CatalogueContent'

export const metadata = {
  title: 'Boutique Slime Tunisie — Unicolore, Bicolore, Buddies | HK Games',
  description: 'Achetez nos slimes artisanaux premium en Tunisie. Unicolores, Bicolores et Buddies. Livraison partout en Tunisie. Paiement à la livraison.',
}

export const revalidate = 300

export default function ShopPage({ searchParams }) {
  return (
    <>
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
