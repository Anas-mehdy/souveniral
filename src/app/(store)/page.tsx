import { getCategories, getProducts } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { getStoreSettings } from '@/lib/settings'
import { HomepageClient } from './HomepageClient'

export const revalidate = 0 // Disable cache when admin checks are active to keep it real-time

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SouvenirAl',
  url: 'https://kilifal.com',
  description: 'Özel tasarım telefon kılıfları — كفرات هاتف بتصاميم حصرية',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://kilifal.com/products?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SouvenirAl',
  url: 'https://kilifal.com',
  logo: 'https://kilifal.com/icon-512.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+90-535-021-5375',
    contactType: 'customer service',
    availableLanguage: ['Turkish', 'Arabic'],
  },
}

export default async function HomePage() {
  const [categories, { products }, isAdmin, settings] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
    isAdminAuthenticated(),
    getStoreSettings()
  ])
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <HomepageClient
        categories={categories}
        products={products}
        isAdmin={isAdmin}
        settings={settings}
      />
    </>
  )
}
