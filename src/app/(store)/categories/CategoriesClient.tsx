'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Category } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'
import { translations } from '@/lib/i18n'
import { ChevronDown, ChevronUp } from 'lucide-react'

function CategoryCard({ cat, locale, size = 'md' }: { cat: Category; locale: string; size?: 'sm' | 'md' }) {
  const imgSize = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20'
  return (
    <Link
      href={`/products?category=${cat.slug}`}
      className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#0da19a]/35 hover:shadow-md transition-all duration-300"
    >
      {cat.image_url ? (
        <div className={`relative ${imgSize} rounded-full overflow-hidden border border-gray-150 p-0.5 bg-white group-hover:border-[#0da19a] transition-all`}>
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image src={cat.image_url} alt={locale === 'ar' ? cat.name_ar : cat.name_tr} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      ) : (
        <div className={`${imgSize} rounded-full bg-gradient-to-br from-[#0da19a]/10 to-teal-50 flex items-center justify-center text-3xl`}>📂</div>
      )}
      <span className="font-bold text-gray-800 text-center group-hover:text-[#0da19a] transition-colors text-xs tracking-wide leading-snug">
        {locale === 'ar' ? cat.name_ar : cat.name_tr}
      </span>
    </Link>
  )
}

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const { locale } = useLocale()
  const t = translations[locale]
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (categories.length === 0) {
    return (
      <div className="font-sans">
        <h1 className="text-3xl font-black text-gray-800 mb-8">{t.categories}</h1>
        <p className="text-gray-400 text-center py-20">{t.noProducts}</p>
      </div>
    )
  }

  return (
    <div className="font-sans space-y-10">
      <h1 className="text-3xl font-black text-gray-800">{t.categories}</h1>

      {categories.map(cat => {
        const subs = cat.subcategories ?? []
        const hasSubcategories = subs.length > 0
        const isExpanded = expandedIds.has(cat.id)

        return (
          <section key={cat.id} className="space-y-4">
            {/* Parent category row */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <Link
                href={`/products?category=${cat.slug}`}
                className="flex items-center gap-3 group"
              >
                {cat.image_url ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                    <Image src={cat.image_url} alt={locale === 'ar' ? cat.name_ar : cat.name_tr} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#0da19a]/10 flex items-center justify-center text-xl flex-shrink-0">📂</div>
                )}
                <h2 className="text-lg font-black text-gray-800 group-hover:text-[#0da19a] transition-colors">
                  {locale === 'ar' ? cat.name_ar : cat.name_tr}
                </h2>
              </Link>

              {hasSubcategories && (
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0da19a] hover:text-[#0b807b] transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? (locale === 'ar' ? 'إخفاء' : 'Gizle') : `${subs.length} ${locale === 'ar' ? 'قسم فرعي' : 'alt kategori'}`}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>

            {/* Subcategories grid — always visible if subcategories exist */}
            {hasSubcategories && (
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-all duration-300 overflow-hidden ${
                  isExpanded || true ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {subs
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(sub => (
                    <CategoryCard key={sub.id} cat={sub} locale={locale} size="sm" />
                  ))}
              </div>
            )}

            {/* If no subcategories show direct link card */}
            {!hasSubcategories && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                <CategoryCard cat={cat} locale={locale} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
