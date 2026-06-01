import { getCategories, getProducts } from '@/lib/db'
import { ProductsClient } from './ProductsClient'

export const revalidate = 30

interface Props {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = parseInt(sp.page ?? '1')
  const limit = 24
  const offset = (page - 1) * limit

  const [categories, { products, total }] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: sp.category, search: sp.search, limit, offset }),
  ])

  return (
    <ProductsClient
      products={products}
      categories={categories}
      total={total}
      page={page}
      limit={limit}
      currentCategory={sp.category}
      currentSearch={sp.search}
    />
  )
}
