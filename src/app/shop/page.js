import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CatalogueContent from './CatalogueContent'
import { createAdminClient } from '@/lib/supabase/server'

const faqShopLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Où acheter du slime en Tunisie ?',
      acceptedAnswer: { '@type': 'Answer', text: 'HK Games livre du slime premium dans toute la Tunisie. Commandez sur hap-p-kids.store avec paiement à la livraison partout — Tunis, Sfax, Sousse, Nabeul, Bizerte et tous les gouvernorats.' } },
    { '@type': 'Question', name: 'Quel prix pour du slime en Tunisie ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Le slime HK Games est disponible en pot de 170g. Consultez notre boutique sur hap-p-kids.store pour les prix. Paiement en espèces à la livraison — pas de carte bancaire nécessaire.' } },
    { '@type': 'Question', name: 'Le slime est-il sans danger pour les enfants ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Oui, nos slimes sont sans borax, sans produits toxiques, certifiés pour enfants dès 3 ans selon les normes de sécurité européennes. Idéal pour les enfants de 3 à 12 ans.' } },
    { '@type': 'Question', name: 'Livraison slime partout en Tunisie ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Oui, HK Games livre dans les 24 gouvernorats tunisiens via Navex en 24 à 72h. Tunis, Ariana, Sfax, Sousse, Monastir, Nabeul, Bizerte, Gabès et partout en Tunisie.' } },
    { '@type': 'Question', name: 'Quels types de slime proposez-vous ?',
      acceptedAnswer: { '@type': 'Answer', text: 'HK Games propose 3 gammes : Slime Unicolore (couleur unie 170g), Slime Bicolore (effet marbré 170g), et Slime Buddy (avec personnage 170g). Tous certifiés pour enfants.' } },
    { '@type': 'Question', name: 'Le slime est-il un bon cadeau pour enfant en Tunisie ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Absolument ! Le slime HK Games est le cadeau idéal pour anniversaires et fêtes. Nos Slime Buddies contiennent une surprise incluse — parfait pour les enfants de 4 à 10 ans.' } },
  ],
}

export const metadata = {
  title: 'Acheter Slime en Tunisie — Slime Unicolore, Bicolore & Buddy 170g | HK Games',
  description: 'Achetez du slime artisanal premium en Tunisie. Slime Unicolore, Bicolore et Buddy 170g certifié pour enfants. Livraison rapide Navex partout. Paiement à la livraison. Jouet sensoriel, cadeau enfant, ASMR.',
  keywords: [
    'slime','vendre slime tunisie','vente slime tunisie','slime à vendre tunisie','vendre slime','slime tunisie','acheter slime tunisie','slime 170g',
    'slime unicolore tunisie','slime bicolore tunisie','slime buddy tunisie',
    'jouet slime tunisie','slime enfant tunisie','cadeau enfant tunisie',
    'slime livraison tunisie','slime paiement livraison','jouet sensoriel tunisie',
    'slime asmr tunisie','slime premium tunisie','slime pas cher tunisie',
    'slime satisfaisant','pate slime tunisie','slime certifié enfants',
    'jouet créatif enfant tunisie','slime tunis','slime sfax','slime sousse',
  ],
  alternates: { canonical: 'https://www.hap-p-kids.store/shop' },
  openGraph: {
    title:       'Slime Premium en Tunisie — HK Games | Livraison Rapide',
    description: 'Unicolore, Bicolore, Buddy 170g. Paiement à la livraison, partout en Tunisie.',
    url:         'https://www.hap-p-kids.store/shop',
    type:        'website',
  },
}

export const revalidate = 60

export default async function ShopPage({ searchParams }) {
  // Fetch products server-side with admin client (bypasses RLS, always works)
  let initialProducts = []
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('products')
      .select('id, slug, name, description, line, price_dt, images, colors, is_active, position')
      .eq('is_active', true)
      .order('position', { ascending: true })
    initialProducts = data || []
  } catch (e) {
    initialProducts = []
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqShopLd) }}/>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <Suspense fallback={<div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>}>
          <CatalogueContent line={null} initialProducts={initialProducts} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
