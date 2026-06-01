'use client'
import { useRouter, usePathname } from 'next/navigation'
import type { Category, Product } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'
import { translations } from '@/lib/i18n'
import { ProductCard } from '@/components/ProductCard'
import { Search } from 'lucide-react'
import { useState } from 'react'

interface Props {
  products: Product[]
  categories: Category[]
  total: number
  page: number
  limit: number
  currentCategory?: string
  currentSearch?: string
}

export function ProductsClient({ products, categories, total, page, limit, currentCategory, currentSearch }: Props) {
  const { locale } = useLocale()
  const t = translations[locale]
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentSearch ?? '')
  const totalPages = Math.ceil(total / limit)

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (params.category) sp.set('category', params.category)
    if (params.search) sp.set('search', params.search)
    if (params.page && params.page !== '1') sp.set('page', params.page)
    router.push(`${pathname}?${sp.toString()}`)
  }

  return (
    <div className="font-sans pb-16">
      <h1 className="text-3xl font-black text-gray-800 mb-6">{t.allProducts}</h1>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate({ search, category: currentCategory })}
            placeholder={t.search}
            className={`w-full ps-9 pe-4 py-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0da19a] bg-white text-gray-800 ${locale === 'ar' ? 'text-right' : 'text-left'}`}
          />
        </div>
        <select
          value={currentCategory ?? ''}
          onChange={e => navigate({ category: e.target.value || undefined, search })}
          className="px-4 py-3 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0da19a] bg-white text-gray-800"
        >
          <option value="">{t.allProducts}</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>
              {locale === 'ar' ? c.name_ar : c.name_tr}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 font-bold mb-6">{t.total}: {total}</p>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm font-semibold">{t.noProducts}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => navigate({ category: currentCategory, search, page: String(n) })}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                n === page ? 'bg-[#0da19a] text-white shadow-md' : 'bg-white border border-gray-200 hover:border-[#0da19a] text-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
