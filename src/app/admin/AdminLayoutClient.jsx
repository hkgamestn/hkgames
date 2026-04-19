'use client'

import OrderNotifier from '@/components/admin/OrderNotifier'

export default function AdminLayoutClient({ children }) {
  return (
    <>
      {children}
      <OrderNotifier />
    </>
  )
}
