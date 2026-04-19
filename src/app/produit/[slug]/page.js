import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductDetail from './ProductDetail'
import { createClient } from '@/lib/supabase/server'

function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createSupabaseClient(url, key)
}

export async function generateMetadata({ params }) {
  const supabase = createStaticClient()
  if (!supabase) return {}
  const { data: product } = await supabase
    .from('products')
    .select('name, description, price_dt, line, colors')
    .eq('slug', params.slug)
    .single()
  if (!product) return {}

  const image = product.colors?.[0]?.image || '/og/og-default.jpg'
  const lineLabel = product.line === 'unicolore' ? 'Unicolore' : product.line === 'bicolore' ? 'Bicolore' : 'Buddy'
  const title = `${product.name} — Slime ${lineLabel} Tunisie | HK Games`
  const description = product.description ||
    `Achetez ${product.name} — Slime artisanal premium ${lineLabel}. Livraison partout en Tunisie. Paiement à la livraison. ${product.price_dt} DT.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      locale: 'fr_TN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `https://hap-p-kids.store/produit/${params.slug}`,
    },
  }
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  if (!supabase) return []
  const { data: products } = await supabase.from('products').select('slug').eq('is_active', true)
  return (products || []).map((p) => ({ slug: p.slug }))
}

export const revalidate = 300

export default async function ProductPage({ params }) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('id, slug, name, description, line, price_dt, images, colors, bicolor_combos, is_active, position')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()
  if (!product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('id, slug, name, price_dt, images, colors, line')
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4)

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('id, customer_name, customer_city, rating, review_text, photo_url')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .limit(6)

  // JSON-LD données structurées Product pour Google
  const avgRating = testimonials?.length
    ? (testimonials.reduce((s, t) => s + (t.rating || 5), 0) / testimonials.length).toFixed(1)
    : '5.0'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || 'Slime artisanal premium HK Games Tunisie',
    image: product.colors?.[0]?.image || 'https://hap-p-kids.store/og/og-default.jpg',
    brand: { '@type': 'Brand', name: 'HK Games' },
    offers: {
      '@type': 'Offer',
      url: 'https://hap-p-kids.store/produit/' + product.slug,
      priceCurrency: 'TND',
      price: product.price_dt,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'HK Games' },
    },
    aggregateRating: testimonials?.length ? {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: testimonials.length,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <ProductDetail product={product} related={related || []} testimonials={testimonials || []} />
      </main>
      <Footer />
    </>
  )
}
