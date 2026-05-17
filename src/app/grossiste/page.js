import { createClient } from '@/lib/supabase/server'
import GrossisteClient from './GrossisteClient'

export const metadata = {
  title: 'Vente en Gros Slime Tunisie — HK Games | Dès 60 pièces',
  description: 'Revendez HK Games en Tunisie. Slime en gros dès 60 pièces, mélange Unicolore/Bicolore/Buddy 170g. Prix dégressifs, livraison Navex nationale.',
  keywords: 'slime en gros tunisie, grossiste slime, revendeur slime tunisie, jouet en gros, slime 170g',
}

export default async function GrossistePage() {
  const supabase = await createClient()

  const [{ data: tiers }, { data: products }] = await Promise.all([
    supabase.from('wholesale_tiers').select('*').eq('active', true).order('sort_order'),
    supabase.from('products')
      .select('line, images')
      .in('line', ['unicolore', 'bicolore', 'buddies'])
      .eq('is_active', true)
      .not('images', 'is', null)
      .order('position'),
  ])

  // First image per line
  const lineImages = {}
  for (const p of (products || [])) {
    if (!lineImages[p.line] && p.images?.length > 0) {
      lineImages[p.line] = p.images[0]
    }
  }

  return <GrossisteClient tiers={tiers || []} lineImages={lineImages} />
}
