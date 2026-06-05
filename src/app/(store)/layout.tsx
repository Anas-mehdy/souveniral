import { LocaleProvider } from '@/components/LocaleProvider'
import { CartProvider } from '@/components/CartProvider'
import { Navbar } from '@/components/Navbar'
import { CartDrawer } from '@/components/CartDrawer'
import { getStoreSettings } from '@/lib/settings'
import { getCategories } from '@/lib/db'
import { Footer } from '@/components/Footer'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings()
  const categories = await getCategories()
  
  return (
    <LocaleProvider>
      <CartProvider>
        <Navbar settings={settings} categories={categories} />
        <main className="w-full max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
          {children}
        </main>

        <CartDrawer />

        <Footer />
      </CartProvider>
    </LocaleProvider>
  )
}
