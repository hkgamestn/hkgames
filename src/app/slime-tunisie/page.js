import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Slime Tunisie — Acheter Slime Premium en Ligne | HK Games',
  description: 'Achetez du slime artisanal en Tunisie. Slime Unicolore, Bicolore et Buddy 170g certifiés pour enfants. Livraison rapide Navex partout en Tunisie. Paiement à la livraison.',
  keywords: ['slime tunisie','slime en tunisie','acheter slime tunisie','slime premium tunisie','jouet slime tunisie 2026'],
  alternates: { canonical: 'https://www.hap-p-kids.store/slime-tunisie' },
  openGraph: {
    title:       'Slime Tunisie — HK Games',
    description: 'Le slime premium N°1 en Tunisie. Livraison nationale, paiement à la livraison.',
    url:         'https://www.hap-p-kids.store/slime-tunisie',
  },
}

// Redirect to shop but keep the SEO juice on this URL via canonical
export default function SlimeTunisiePage() {
  return redirect('/shop')
}
