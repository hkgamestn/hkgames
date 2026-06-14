'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/product/ProductCard'
import styles from './CatalogueContent.module.css'

const TABS = [
  { id: null,        label: 'Tous' },
  { id: 'unicolore', label: 'Unicolore' },
  { id: 'bicolore',  label: 'Bicolore' },
  { id: 'buddies',   label: 'Buddies' },
  { id: 'pack_ete',  label: '☀️ Pack Été' },
]

const SORT_OPTIONS = [
  { value: 'position',   label: 'Popularité' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
]

export default function CatalogueContent({ initialProducts = [], initialLine, line }) {
  const [activeTab, setActiveTab] = useState(initialLine || line || null)
  const [products, setProducts]   = useState(initialProducts)
  const [loading, setLoading]     = useState(false)
  const [sort, setSort]           = useState('position')
  const [isPending, startTransition] = useTransition()
  const [firstLoad, setFirstLoad] = useState(true)

  useEffect(() => {
    // Skip refetch on very first render if server already provided products
    if (firstLoad && initialProducts.length > 0 && !activeTab && sort === 'position') {
      setFirstLoad(false)
      return
    }
    async function fetchProducts() {
      setLoading(true)
      try {
        const supabase = createClient()
        let query = supabase
          .from('products')
          .select('id, slug, name, description, line, price_dt, images, colors, is_active, position')
          .eq('is_active', true)

        if (activeTab) query = query.eq('line', activeTab)
        if (sort === 'price_asc')  query = query.order('price_dt', { ascending: true })
        else if (sort === 'price_desc') query = query.order('price_dt', { ascending: false })
        else query = query.order('position', { ascending: true })

        const { data, error } = await query
        // Only replace products if fetch succeeded — never wipe on error
        if (!error && data) setProducts(data)
      } catch (e) {
        // Keep existing products on failure (don't show 0)
      } finally {
        setLoading(false)
        setFirstLoad(false)
      }
    }
    fetchProducts()
  }, [activeTab, sort])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('products-stock-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setProducts((prev) => prev.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          {activeTab ? TABS.find(t => t.id === activeTab)?.label : 'Notre Boutique'}
        </h1>
        <p className={styles.subtitle}>{products.length} slimes disponibles</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={String(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => startTransition(() => setActiveTab(tab.id))}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.filtersRow}>
        <select className={styles.sortSelect} value={sort} onChange={(e) => startTransition(() => setSort(e.target.value))}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun produit trouvé.</p>
          <button onClick={() => setActiveTab(null)} type="button" className={styles.resetBtn}>Voir tous</button>
        </div>
      ) : (
        <div className={`${styles.grid} ${isPending ? styles.pending : ''}`}>
          {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      )}
    </div>
  )
}
