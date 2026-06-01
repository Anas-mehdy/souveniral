import { getCategories, getProducts } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { getStoreSettings } from '@/lib/settings'
import { HomepageClient } from './HomepageClient'

export const revalidate = 0 // Disable cache when admin checks are active to keep it real-time

export default async function HomePage() {
  const [categories, { products }, isAdmin, settings] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
    isAdminAuthenticated(),
    getStoreSettings()
  ])
  return (
    <HomepageClient
      categories={categories}
      products={products}
      isAdmin={isAdmin}
      settings={settings}
    />
  )
}

