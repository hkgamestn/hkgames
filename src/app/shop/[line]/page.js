'use client'

import { use } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CatalogueContent from '../CatalogueContent'

export default function LinePage({ params }) {
  const { line } = use(params)
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <CatalogueContent initialLine={line} />
      </main>
      <Footer />
    </>
  )
}
