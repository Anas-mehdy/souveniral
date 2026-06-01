'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { Category } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'
import { translations } from '@/lib/i18n'

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const { locale } = useLocale()
  const t = translations[locale]

  return (
    <div className="font-sans">
      <h1 className="text-3xl font-black text-gray-800 mb-8">{t.categories}</h1>
      {categories.length === 0 ? (
        <p className="text-gray-400 text-center py-20">{t.noProducts}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 hover:border-[#0da19a]/35 hover:shadow-md transition-all duration-300"
            >
              {cat.image_url ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gray-150 p-0.5 bg-white group-hover:border-[#0da19a] transition-all">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image src={cat.image_url} alt={locale === 'ar' ? cat.name_ar : cat.name_tr} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0da19a]/10 to-teal-50 flex items-center justify-center text-4xl">📂</div>
              )}
              <span className="font-bold text-gray-800 text-center group-hover:text-[#0da19a] transition-colors text-xs tracking-wide">
                {locale === 'ar' ? cat.name_ar : cat.name_tr}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
