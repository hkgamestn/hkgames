import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './blog.module.css'

export const metadata = {
  title: 'Blog Slime Tunisie 2026 — Conseils Parents, Astuces & Idées Cadeaux',
  description: 'Tout sur le slime en Tunisie : guide complet pour parents, bienfaits, ASMR, livraison, couleurs tendance 2026. Articles par HK Games.',
  keywords: ['blog slime tunisie','conseils slime','astuces slime','idées cadeaux enfant tunisie','slime 2026'],
  alternates: { canonical: 'https://hap-p-kids.store/blog' },
  openGraph: {
    title:    'Blog HK Games — Slime Tunisie 2026',
    description: 'Articles sur le slime : conseils, astuces et tendances pour parents tunisiens.',
    url:     'https://hap-p-kids.store/blog',
    type:    'website',
  },
}

export const revalidate = 300

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, tags, published_at, views')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.chip}>📝 Blog</span>
            <h1 className={styles.title}>Slime, Enfants & Jeu Créatif</h1>
            <p className={styles.sub}>Conseils pour parents, idées cadeaux et tout sur le monde du slime en Tunisie.</p>
          </div>
        </div>

        <div className={styles.container}>
          {!posts?.length ? (
            <div className={styles.empty}>Les articles arrivent bientôt… 🌟</div>
          ) : (
            <div className={styles.grid}>
              {posts.map((post, i) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className={`${styles.card} ${i === 0 ? styles.cardFeatured : ''}`}>
                  <div className={styles.cardImg}>
                    {post.cover_image ? (
                      <Image src={post.cover_image} alt={post.title} fill sizes="(max-width:768px) 100vw, 50vw" style={{objectFit:'cover'}} />
                    ) : (
                      <div className={styles.cardImgPlaceholder}>🧪</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    {post.tags?.length > 0 && (
                      <div className={styles.tags}>
                        {post.tags.slice(0,3).map(t => <span key={t} className={styles.tag}>{t}</span>)}
                      </div>
                    )}
                    <h2 className={styles.cardTitle}>{post.title}</h2>
                    {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
                    <div className={styles.cardMeta}>
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('fr-TN', {day:'2-digit',month:'long',year:'numeric'}) : ''}</span>
                      {post.views > 0 && <span>👁 {post.views}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
