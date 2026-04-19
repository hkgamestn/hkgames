import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartContent from './CartContent'

export const metadata = {
  title: 'Mon Panier — HK Games Slime Store',
}

export default function CartPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <CartContent />
      </main>
      <Footer />
    </>
  )
}
