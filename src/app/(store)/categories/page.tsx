import { getCategories } from '@/lib/db'
import { CategoriesClient } from './CategoriesClient'

export const revalidate = 60

export default async function CategoriesPage() {
  const categories = await getCategories()
  return <CategoriesClient categories={categories} />
}
