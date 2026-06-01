import { getProductBySlug, getProducts } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from './ProductDetailClient'
import type { Product } from '@/lib/types'

export const revalidate = 60

export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 100 })
  return products.map(p => ({ slug: p.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  // Fetch similar products from the same category
  let similarProducts: Product[] = []
  if (product.category?.slug) {
    const { products } = await getProducts({
      categorySlug: product.category.slug,
      limit: 5, // Fetch 5 to get up to 4 other products
    })
    similarProducts = products.filter(p => p.id !== product.id)
  }

  return <ProductDetailClient product={product} similarProducts={similarProducts} />
}
