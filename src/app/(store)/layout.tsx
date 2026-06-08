import { LocaleProvider } from '@/components/LocaleProvider'
import { CartProvider } from '@/components/CartProvider'
import { Navbar } from '@/components/Navbar'
import { CartDrawer } from '@/components/CartDrawer'
import { getStoreSettings } from '@/lib/settings'
import { getCategories } from '@/lib/db'
import { Footer } from '@/components/Footer'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { AnalyticsTracker } from '@/components/AnalyticsTracker'
import { cookies, headers } from 'next/headers'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings()
  const categories = await getCategories()

  // Resolve initial language on the server to prevent layout shift and hydration mismatches
  const cookieStore = await cookies()
  const savedLocale = cookieStore.get('locale')?.value

  let initialLocale: 'ar' | 'tr' = 'ar'
  if (savedLocale === 'ar' || savedLocale === 'tr') {
    initialLocale = savedLocale
  } else {
    // If no cookie is set, inspect the client's browser languages from headers
    const headersList = await headers()
    const acceptLang = headersList.get('accept-language') || ''
    if (acceptLang.toLowerCase().includes('tr')) {
      initialLocale = 'tr'
    }
  }
  
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <CartProvider>
        <AnalyticsTracker />
        <Navbar settings={settings} categories={categories} />
        <main className="w-full max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
          {children}
        </main>

        <CartDrawer />
        <WhatsAppButton />

        <Footer />
      </CartProvider>
    </LocaleProvider>
  )
}

