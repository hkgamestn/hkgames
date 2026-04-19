import { createClient as createSupabaseClient } from '@supabase/supabase-js'
function createStaticClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export default async function sitemap() {
  const base = 'https://hap-p-kids.store'

  // Pages statiques
  const staticPages = [
    { url: base,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: base + '/shop',        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: base + '/shop/unicolore', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: base + '/shop/bicolore',  lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: base + '/shop/buddies',   lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: base + '/avis',        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  ]

  // Pages produits dynamiques depuis Supabase
  const supabase = createStaticClient()
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)

  const productPages = (products || []).map((p) => ({
    url:             base + '/produit/' + p.slug,
    lastModified:    new Date(p.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority:        0.85,
  }))

  return [...staticPages, ...productPages]
}
