'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDT } from '@/lib/utils/formatDT'
import { ShoppingBag, TrendingUp, Package, Clock } from 'lucide-react'
import PushSetup from '@/components/admin/PushSetup'
import styles from './dashboard.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ today: 0, todayRevenue: 0, pending: 0, total: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)

    function fetchStats() {
      Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).neq('status', 'cancelled').is('deleted_at', null),
        supabase.from('orders').select('total_dt').gte('created_at', todayStart.toISOString()).neq('status', 'cancelled').is('deleted_at', null),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
        supabase.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'cancelled').is('deleted_at', null),
        supabase.from('orders').select('id, order_number, customer_name, customer_phone, total_dt, status, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      ]).then(([todayCount, todayRevData, pendingCount, totalCount, recentData]) => {
        const revenue = (todayRevData.data || []).reduce((s, o) => s + (o.total_dt || 0), 0)
        setStats({
          today: todayCount.count || 0,
          todayRevenue: revenue,
          pending: pendingCount.count || 0,
          total: totalCount.count || 0,
        })
        setRecentOrders(recentData.data || [])
        setLoading(false)
      })
    }

    fetchStats()

    // Realtime — rafraîchit les KPIs à chaque changement de commande
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 'var(--space-8)' }}>Chargement...</p>

  const CARDS = [
    { icon: ShoppingBag, label: "Commandes aujourd'hui", value: stats.today, color: 'var(--color-primary)' },
    { icon: TrendingUp,  label: "CA aujourd'hui",        value: formatDT(stats.todayRevenue), color: 'var(--color-cta)' },
    { icon: Clock,       label: 'En attente',            value: stats.pending, color: '#fbbf24' },
    { icon: Package,     label: 'Total commandes',       value: stats.total, color: 'var(--color-success)' },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tableau de bord</h1>

      <div className={styles.statsGrid}>
        {CARDS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ color, background: `${color}18` }}>
              <Icon size={22} />
            </div>
            <div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <PushSetup />

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Dernières commandes</h2>
        <div className={styles.recentList}>
          {recentOrders.map((o) => (
            <div key={o.id} className={styles.recentItem}>
              <div>
                <p className={styles.recentName}>{o.customer_name || o.customer_phone}</p>
                <p className={styles.recentNum}>{o.order_number || o.id.slice(0,8)}</p>
              </div>
              <div className={styles.recentRight}>
                <p className={styles.recentTotal}>{formatDT(o.total_dt || 0)}</p>
                <span className={`${styles.recentStatus} ${styles[o.status]}`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
