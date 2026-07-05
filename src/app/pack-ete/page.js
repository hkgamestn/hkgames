import { createClient } from '@supabase/supabase-js'
import PackEteLanding from './PackEteLanding'

export const metadata = {
  title: 'Pack Été — 6 Slimes Premium à 60 DT | Livraison Offerte | HK Games',
  description: 'Offre d\'été HK Games : 5 slimes achetés + 1 offert = 6 pots premium à 60 DT seulement. Livraison gratuite partout en Tunisie. Paiement à la livraison.',
  openGraph: {
    title: 'Pack Été — 6 Slimes Premium à 60 DT 🌞',
    description: '5 + 1 offert · Livraison gratuite · Paiement à la livraison',
    images: ['https://rsmebjtwmvwyeocvsowg.supabase.co/storage/v1/object/public/product-images/slime%20unicolore.png'],
  },
}

async function getPackEte() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, price_dt, images, line')
    .eq('line', 'pack_ete')
    .eq('is_active', true)
    .maybeSingle()
  return data
}

export default async function PackEtePage() {
  const product = await getPackEte()
  return (
    <>
      {/* Préchargement bannière hero — améliore LCP */}
      <link rel="preload" as="image" href="/pack-ete-banner.jpg" fetchPriority="high" />
      <PackEteLanding product={product} />
    </>
  )
}
