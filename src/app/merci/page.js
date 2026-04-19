import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ConfirmationContent from './ConfirmationContent'

export const metadata = {
  title: 'Commande confirmée — HK Games Slime Store',
}

export default function MerciPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <Suspense fallback={<div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
