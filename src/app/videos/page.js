import { createClient } from '@/lib/supabase/server'
import VideosClient from './VideosClient'

export const metadata = {
  title: 'Vidéos Slime — HK Games | ASMR & Unboxing Tunisie',
  description: 'Regardez nos vidéos de slime satisfaisant, ASMR et unboxing enfants. Partagez et réagissez ! Livraison Tunisie.',
}

export const revalidate = 60

export default async function VideosPage() {
  const supabase = await createClient()
  const { data: videos } = await supabase
    .from('videos')
    .select(`
      id, title, description, video_url, thumbnail_url, tags, views, created_at,
      video_reactions(emoji)
    `)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return <VideosClient initialVideos={videos || []} />
}
