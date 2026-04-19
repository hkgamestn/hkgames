import Navbar from '@/components/layout/Navbar'
import CheckoutForm from './CheckoutForm'

export const metadata = {
  title: 'Commander — HK Games Slime Store',
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <CheckoutForm />
      </main>
    </>
  )
}
