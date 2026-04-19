import AdminNav from './AdminNav'
import AdminLayoutClient from './AdminLayoutClient'
import styles from './admin.module.css'

export const metadata = {
  title: 'HK Games Admin',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HK Admin',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'HK Admin',
  },
}

export default function AdminLayout({ children }) {
  return (
    <AdminLayoutClient>
      <div className={styles.adminShell}>
        <AdminNav />
        <main className={styles.adminMain}>{children}</main>
      </div>
    </AdminLayoutClient>
  )
}
