// Server component — exports metadata + JSON-LD for homepage
import HomePage from './HomeClient'

export const metadata = {
  title: 'HK Games — Slime Premium en Tunisie | Livraison Rapide',
  description: 'Commandez votre slime artisanal en Tunisie. Unicolore, Bicolore et Buddy 170g. Paiement à la livraison via Navex partout en Tunisie. Certifié pour enfants dès 3 ans.',
  alternates: { canonical: 'https://www.hap-p-kids.store' },
  openGraph: {
    title:       'HK Games — Slime Premium en Tunisie',
    description: 'Le slime N°1 de Tunisie. Unicolore, Bicolore et Buddy 170g. Livraison Navex, paiement à la livraison.',
    url:         'https://www.hap-p-kids.store',
    type:        'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id':   'https://www.hap-p-kids.store/#org',
      name:    'HK Games',
      url:     'https://www.hap-p-kids.store',
      logo:    'https://www.hap-p-kids.store/icons/hk-logo-192.png',
      contactPoint: { '@type': 'ContactPoint', telephone: '+21621660303', contactType: 'customer service' },
      address: { '@type': 'PostalAddress', addressCountry: 'TN', addressLocality: 'Tunis' },
    },
    {
      '@type':  'WebSite',
      '@id':    'https://www.hap-p-kids.store/#website',
      url:      'https://www.hap-p-kids.store',
      name:     'HK Games',
      publisher: { '@id': 'https://www.hap-p-kids.store/#org' },
      inLanguage: 'fr-TN',
      potentialAction: {
        '@type':       'SearchAction',
        target:        'https://www.hap-p-kids.store/shop?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type':       'Store',
      name:          'HK Games — Slime Tunisie',
      url:           'https://www.hap-p-kids.store',
      description:   'Boutique en ligne de slime artisanal premium en Tunisie. Livraison nationale via Navex.',
      image:         'https://www.hap-p-kids.store/og/og-default.jpg',
      priceRange:    '$$',
      address: { '@type': 'PostalAddress', addressCountry: 'TN', addressLocality: 'Tunis' },
      openingHours:        'Mo-Sa 09:00-18:00',
      paymentAccepted:     'Cash on Delivery',
      currenciesAccepted:  'TND',
    },
  ],
}

export default function HomeServer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  )
}
