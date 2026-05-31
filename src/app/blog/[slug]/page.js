import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './post.module.css'

export const revalidate = 300

export async function generateMetadata({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('title, excerpt, cover_image').eq('slug', slug).single()
  if (!data) return { title: 'Article introuvable' }
  return {
    title: `${data.title} | HK Games Blog`,
    description: data.excerpt || '',
    openGraph: data.cover_image ? { images: [data.cover_image] } : {},
  }
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  // Increment views (fire and forget)
  supabase.from('blog_posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id).then(() => {})

  // Related posts
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, slug, title, cover_image, published_at')
    .eq('published', true)
    .neq('id', post.id)
    .limit(3)
    .order('published_at', { ascending: false })

  const articleLd = {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:   post.title,
    description: post.excerpt || '',
    image:      post.cover_image ? [post.cover_image] : [],
    datePublished: post.published_at,
    dateModified:  post.updated_at || post.published_at,
    author: { '@type': 'Organization', name: 'HK Games', url: 'https://www.hap-p-kids.store' },
    publisher: {
      '@type': 'Organization',
      name:    'HK Games',
      logo:    { '@type': 'ImageObject', url: 'https://www.hap-p-kids.store/icons/hk-logo-192.png' },
    },
    mainEntityOfPage: `https://www.hap-p-kids.store/blog/${post.slug}`,
    keywords: post.tags?.join(', '),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}/>
      <Navbar />
      <main className={styles.main}>
        <article className={styles.article}>
          {post.cover_image && (
            <div className={styles.cover}>
              <Image src={post.cover_image} alt={post.title} fill sizes="100vw" style={{objectFit:'cover'}} priority />
              <div className={styles.coverOverlay} />
            </div>
          )}

          <div className={styles.container}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
              <Link href="/" className={styles.breadLink}>Accueil</Link>
              <span>›</span>
              <Link href="/blog" className={styles.breadLink}>Blog</Link>
              <span>›</span>
              <span className={styles.breadCurrent}>{post.title}</span>
            </nav>

            {/* Header */}
            <header className={styles.header}>
              {post.tags?.length > 0 && (
                <div className={styles.tags}>
                  {post.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
              )}
              <h1 className={styles.title}>{post.title}</h1>
              <div className={styles.meta}>
                <span>📅 {post.published_at ? new Date(post.published_at).toLocaleDateString('fr-TN', {day:'2-digit',month:'long',year:'numeric'}) : ''}</span>
                {post.views > 0 && <span>👁 {post.views} lectures</span>}
              </div>
            </header>

            {/* Content */}
            <div className={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* CTA */}
            <div className={styles.cta}>
              <h3>Prêt à commander votre slime ?</h3>
              <p>Livraison partout en Tunisie · Paiement à la livraison</p>
              <Link href="/shop" className={styles.ctaBtn}>Voir la boutique →</Link>
            </div>

            {/* Related */}
            {related?.length > 0 && (
              <section className={styles.related}>
                <h3 className={styles.relatedTitle}>Articles similaires</h3>
                <div className={styles.relatedGrid}>
                  {related.map(r => (
                    <Link key={r.id} href={`/blog/${r.slug}`} className={styles.relatedCard}>
                      <div className={styles.relatedImg}>
                        {r.cover_image
                          ? <Image src={r.cover_image} alt={r.title} fill sizes="200px" style={{objectFit:'cover'}} />
                          : <span style={{fontSize:'2rem'}}>🧪</span>}
                      </div>
                      <div className={styles.relatedTitle2}>{r.title}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
