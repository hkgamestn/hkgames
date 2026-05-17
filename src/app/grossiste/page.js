import { createClient } from '@/lib/supabase/server'
import GrossisteClient from './GrossisteClient'

export const metadata = {
  title: 'Vente en Gros — Slime Tunisie | HK Games',
  description: 'Devenez revendeur HK Games en Tunisie. Slime en gros pour boutiques, papeteries, kiosques enfants. Prix dégressifs, livraison Navex partout en Tunisie.',
  keywords: 'slime en gros tunisie, grossiste slime, revendeur slime tunisie, jouet en gros tunisie',
}

export default async function GrossistePage() {
  const supabase = await createClient()
  const { data: tiers } = await supabase
    .from('wholesale_tiers')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  return <GrossisteClient tiers={tiers || []} />
}
