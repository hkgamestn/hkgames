import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/actions/products'
import ProductCard from '@/components/product/ProductCard'
import styles from './CataloguePreview.module.css'

export default async function CataloguePreview() {
  const products = await getProducts()
  const preview  = products.slice(0, 6)

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nos Slimes du Moment</h2>
          <Link href="/shop" className={styles.viewAll}>
            Voir tout
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className={styles.grid}>
          {preview.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className={styles.cta}>
          <Link href="/shop" className={styles.ctaBtn}>
            Voir toute la boutique
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
