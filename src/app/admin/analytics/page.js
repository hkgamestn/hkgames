'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDT } from '@/lib/utils/formatDT'
import styles from './analytics.module.css'

export default function AnalyticsPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const supabase = createClient()
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0,0,0,0)

    Promise.all([
      supabase.from('orders').select('total_dt, status, created_at, customer_city, items').is('deleted_at', null).gte('created_at', monthStart.toISOString()),
      supabase.from('orders').select('total_dt, status, created_at').is('deleted_at', null).gte('created_at', weekStart.toISOString()).neq('status', 'cancelled'),
    ]).then(([monthData, weekData]) => {
      const orders = monthData.data || []
      const confirmed = orders.filter((o) => !['cancelled', 'pending'].includes(o.status))
      const revenue = confirmed.reduce((s, o) => s + (o.total_dt || 0), 0)
      const avg     = confirmed.length ? revenue / confirmed.length : 0

      // Top cities
      const cityMap = {}
      confirmed.forEach((o) => { if (o.customer_city) cityMap[o.customer_city] = (cityMap[o.customer_city] || 0) + 1 })
      const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

      // Daily revenue (last 7 days)
      const dayMap = {}
      ;(weekData.data || []).forEach((o) => {
        const day = new Date(o.created_at).toLocaleDateString('fr-TN', { weekday: 'short', day: '2-digit' })
        dayMap[day] = (dayMap[day] || 0) + (o.total_dt || 0)
      })

      setData({
        totalOrders: confirmed.length,
        revenue, avg,
        cancelledCount: orders.filter((o) => o.status === 'cancelled').length,
        topCities,
        dayMap,
      })
    })
  }, [])

  if (!data) return <p style={{ color: 'var(--text-muted)', padding: 'var(--space-8)' }}>Chargement des analytics...</p>

  const maxDayRevenue = Math.max(...Object.values(data.dayMap), 1)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Analytics — Ce mois-ci</h1>

      <div className={styles.statsGrid}>
        {[
          { label: 'Commandes confirmées', value: data.totalOrders },
          { label: 'Chiffre d\'affaires',  value: formatDT(data.revenue) },
          { label: 'Panier moyen',         value: formatDT(data.avg) },
          { label: 'Annulées',             value: data.cancelledCount },
        ].map(({ label, value }) => (
          <div key={label} className={styles.statCard}>
            <p className={styles.statValue}>{value}</p>
            <p className={styles.statLabel}>{label}</p>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chart}>
          <h2 className={styles.chartTitle}>CA par jour (7 jours)</h2>
          <div className={styles.barChart}>
            {Object.entries(data.dayMap).map(([day, rev]) => (
              <div key={day} className={styles.barGroup}>
                <div className={styles.barTrack}>
                  <div className={styles.bar} style={{ height: `${(rev / maxDayRevenue) * 100}%` }} />
                </div>
                <span className={styles.barLabel}>{day}</span>
                <span className={styles.barValue}>{formatDT(rev)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chart}>
          <h2 className={styles.chartTitle}>Top gouvernorats</h2>
          <div className={styles.citiesList}>
            {data.topCities.map(([city, count]) => (
              <div key={city} className={styles.cityRow}>
                <span className={styles.cityName}>{city}</span>
                <div className={styles.cityBar}>
                  <div
                    className={styles.cityFill}
                    style={{ width: `${(count / data.topCities[0][1]) * 100}%` }}
                  />
                </div>
                <span className={styles.cityCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
