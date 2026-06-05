import { getProductBySlug, getProducts } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from './ProductDetailClient'
import type { Product } from '@/lib/types'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 100 })
  return products.map(p => ({ slug: p.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  const image = product.images?.[0]?.url
  return {
    title: `${product.name_ar} / ${product.name_tr}`,
    description: product.description_ar || product.description_tr || undefined,
    openGraph: image
      ? { images: [{ url: image, width: 800, height: 800 }] }
      : undefined,
  }
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

  // Build Product Schema.org JSON-LD for Google Shopping & Search
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kilifal.com'
  const image = product.images?.[0]?.url
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name_ar} — ${product.name_tr}`,
    description: product.description_tr || product.description_ar || 'Özel tasarım telefon kılıfı',
    url: `${appUrl}/products/${product.slug}`,
    ...(image ? { image } : {}),
    brand: {
      '@type': 'Brand',
      name: 'SouvenirAl',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'TRY',
      price: product.price.toFixed(2),
      availability: product.is_active
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${appUrl}/products/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'SouvenirAl',
      },
    },
    ...(product.compare_price
      ? {
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: product.price.toFixed(2),
            highPrice: product.compare_price.toFixed(2),
            priceCurrency: 'TRY',
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient product={product} similarProducts={similarProducts} />
    </>
  )
}
