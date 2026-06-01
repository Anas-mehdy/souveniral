import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'
import { adminGetAllCategories, adminGetAllProducts } from '@/lib/db'
import { DashboardClient } from './DashboardClient'

export const revalidate = 0 // Disable cache for admin panel

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) {
    redirect('/admin/login')
  }

  // Fetch full inventory and category lists
  const [products, categories] = await Promise.all([
    adminGetAllProducts(),
    adminGetAllCategories()
  ])

  return <DashboardClient initialProducts={products} initialCategories={categories} />
}
