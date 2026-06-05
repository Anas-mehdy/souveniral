import { getAllCategories } from '@/lib/db'
import { CategoriesClient } from './CategoriesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الأقسام / Kategoriler - SouvenirAl',
  description: 'تصفح جميع أقسام ومجموعات كفرات الهواتف المتوفرة في SouvenirAl. Tüm telefon kılıfı kategorilerini keşfedin.',
}

export const revalidate = 60

export default async function CategoriesPage() {
  // Fetch all root categories (with their subcategories)
  const categories = await getAllCategories()
  return <CategoriesClient categories={categories} />
}
