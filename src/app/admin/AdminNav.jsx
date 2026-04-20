'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingBag, Package, BarChart2, Settings, LogOut, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './AdminNav.module.css'

const NAV_ITEMS = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/commandes',  icon: ShoppingBag,     label: 'Commandes',   badge: 'pending' },
  { href: '/admin/produits',   icon: Package,         label: 'Produits' },
  { href: '/admin/avis',       icon: Star,            label: 'Avis & UGC' },
  { href: '/admin/analytics',  icon: BarChart2,       label: 'Analytics' },
  { href: '/admin/parametres', icon: Settings,        label: 'Paramètres' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  // Ne pas afficher sur la page login
  if (pathname === '/admin/login') return null

  useEffect(() => {
    const supabase = createClient()
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null)
      .then(({ count }) => setPendingCount(count || 0))
    const channel = supabase.channel('pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null)
          .then(({ count }) => setPendingCount(count || 0))
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.brandName}>HK Games</span>
        <span className={styles.brandSub}>Admin</span>
      </div>
      <nav className={styles.links}>
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          const count    = badge === 'pending' ? pendingCount : 0
          return (
            <Link key={href} href={href} className={`${styles.link} ${isActive ? styles.linkActive : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </Link>
          )
        })}
      </nav>
      <button className={styles.logout} onClick={handleLogout} type="button" title="Déconnexion">
        <LogOut size={18} />
      </button>
    </aside>
  )
}
