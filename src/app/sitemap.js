import { createAdminClient } from '@/lib/supabase/server'

export default async function sitemap() {
  const base = 'https://hap-p-kids.store'
  const now  = new Date()

  const staticPages = [
    { url: base,                changeFrequency: 'daily',   priority: 1.0, lastModified: now },
    { url: base + '/shop',      changeFrequency: 'daily',   priority: 0.95, lastModified: now },
    { url: base + '/blog',      changeFrequency: 'daily',   priority: 0.92, lastModified: now },
    { url: base + '/videos',    changeFrequency: 'weekly',  priority: 0.85, lastModified: now },
    { url: base + '/grossiste', changeFrequency: 'monthly', priority: 0.82, lastModified: now },
    { url: base + '/avis',      changeFrequency: 'weekly',  priority: 0.75, lastModified: now },
  ]

  try {
    const supabase = await createAdminClient()

    const [{ data: products }, { data: posts }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('blog_posts').select('slug, published_at, updated_at').eq('published', true),
    ])

    const productPages = (products || []).map(p => ({
      url:             base + '/produit/' + p.slug,
      lastModified:    new Date(p.updated_at || now),
      changeFrequency: 'weekly',
      priority:        0.88,
    }))

    const blogPages = (posts || []).map(p => ({
      url:             base + '/blog/' + p.slug,
      lastModified:    new Date(p.updated_at || p.published_at || now),
      changeFrequency: 'monthly',
      priority:        0.80,
    }))

    return [...staticPages, ...productPages, ...blogPages]
  } catch {
    return staticPages
  }
}
