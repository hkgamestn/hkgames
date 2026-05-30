import { createAdminClient } from '@/lib/supabase/server'
import VideosClient from './VideosClient'

export const metadata = {
  title: 'Vidéos Slime — HK Games | ASMR & Unboxing Tunisie',
  description: 'Regardez nos vidéos de slime satisfaisant, ASMR et unboxing enfants. Partagez et réagissez ! Livraison Tunisie.',
}

export const revalidate = 0

export default async function VideosPage({ searchParams }) {
  const supabase = await createAdminClient()
  const [{ data: videos }, { data: products }] = await Promise.all([
    supabase
    .from('videos')
    .select(`
      id, title, description, video_url, thumbnail_url, tags, views, created_at,
      video_reactions(emoji)
    `)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, slug, name, line, price_dt, images')
      .eq('is_active', true)
      .order('position', { ascending: true }),
  ])

  const sp = await searchParams
  const initialIndex = sp?.v ? parseInt(sp.v, 10) : 0
  return <VideosClient initialVideos={videos || []} products={products || []} initialIndex={initialIndex} />
}
