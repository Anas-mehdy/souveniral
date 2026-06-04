'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useLocale } from './LocaleProvider'
import { useCart } from './CartProvider'
import { translations } from '@/lib/i18n'
import { Menu, X, ShoppingBag, ChevronDown, Sparkles } from 'lucide-react'
import type { StoreSettings } from '@/lib/settings'
import type { Category } from '@/lib/types'

export function Navbar({ settings, categories = [] }: { settings?: StoreSettings; categories?: Category[] }) {
  const { locale, setLocale } = useLocale()
  const { totalItems, setCartOpen } = useCart()
  const t = translations[locale]
  const [open, setOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<'collections' | 'trends' | null>(null)

  const topText = locale === 'ar'
    ? (settings?.announcement_top_ar || '🚚 شحن مجاني بالكامل لجميع الطلبات + الدفع عند الاستلام!')
    : (settings?.announcement_top_tr || '🚚 TÜM SİPARİŞLERDE ÜCRETSİZ KARGO + KAPIDA NAKİT ÖDEME!')

  // Dynamic filter for Koleksiyonlar (collections) and Trendler (trends)
  const collectionsCategories = categories.filter(c => !c.parent_type || c.parent_type === 'collections')
  const trendsCategories = categories.filter(c => c.parent_type === 'trends')

  // Localized Navigation Labels
  const labels = {
    home: locale === 'ar' ? 'الرئيسية' : 'Ana Sayfa',
    collections: locale === 'ar' ? 'المجموعات' : 'Koleksiyonlar',
    trends: locale === 'ar' ? 'الأكثر رواجاً' : 'Trendler',
    allProducts: locale === 'ar' ? 'جميع المنتجات' : 'Tüm ürünler',
    customCover: locale === 'ar' ? 'كفر هاتف مخصص' : 'Kişiye Özel Telefon Kılıfı',
    orderTracking: locale === 'ar' ? 'تتبع الطلب' : 'Sipariş Takibi',
    myAccount: locale === 'ar' ? 'حسابي' : 'Hesabım'
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 font-sans">
      {/* Announcement top header */}
      <div className="relative overflow-hidden bg-[#0da19a] text-white text-[10px] sm:text-xs font-bold py-1.5 flex select-none" dir="ltr">
        <style>{`
          @keyframes marquee-to-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-to-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-left {
            display: inline-flex;
            white-space: nowrap;
            animation: marquee-to-left 25s linear infinite;
          }
          .animate-marquee-right {
            display: inline-flex;
            white-space: nowrap;
            animation: marquee-to-right 25s linear infinite;
          }
        `}</style>
        <div className={locale === 'ar' ? 'animate-marquee-right' : 'animate-marquee-left'}>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          {/* Repeated items to achieve seamless loop */}
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
          <span className="flex items-center gap-1.5 px-8 flex-shrink-0">
            <Sparkles size={12} /> {topText}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Mobile toggle button */}
        <button className="md:hidden p-1 text-gray-500 hover:text-gray-800" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="text-2xl font-black text-[#0da19a] tracking-tight select-none">
          SouvenirAl
        </Link>

        {/* Desktop navbar links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-gray-700">
          <Link href="/" className="hover:text-[#0da19a] transition-colors">{labels.home}</Link>
          
          {/* Koleksiyonlar Mega Menu */}
          <div 
            className="relative py-4"
            onMouseEnter={() => setActiveMegaMenu('collections')}
            onMouseLeave={() => setActiveMegaMenu(null)}
          >
            <button className="flex items-center gap-1 hover:text-[#0da19a] transition-colors cursor-pointer">
              <span>{labels.collections}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${activeMegaMenu === 'collections' ? 'rotate-180' : ''}`} />
            </button>

            {activeMegaMenu === 'collections' && (
              <div className="absolute top-14 start-1/2 -translate-x-1/2 w-[580px] bg-white border border-gray-100 rounded-3xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">
                  {locale === 'ar' ? 'أقسام المجموعات المميزة' : 'Koleksiyon Kategorileri'}
                </p>
                {collectionsCategories.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">
                    {locale === 'ar' ? 'لا توجد أقسام حالياً' : 'Kategori bulunamadı'}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {collectionsCategories.map(col => (
                      <Link
                        key={col.id}
                        href={`/products?category=${col.slug}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-[#0da19a]/5 border border-gray-100 hover:border-[#0da19a]/20 rounded-2xl transition-all group"
                      >
                        {col.image_url ? (
                          <img src={col.image_url} alt="" className="w-8 h-8 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-8 h-8 bg-white border border-gray-150 rounded-xl flex items-center justify-center text-[10px] font-black text-[#0da19a] uppercase shadow-xs group-hover:scale-105 transition-transform">
                            {(locale === 'ar' ? col.name_ar : col.name_tr).slice(0, 2)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-gray-800 group-hover:text-[#0da19a] transition-colors truncate">
                          {locale === 'ar' ? col.name_ar : col.name_tr}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trendler Mega Menu */}
          <div 
            className="relative py-4"
            onMouseEnter={() => setActiveMegaMenu('trends')}
            onMouseLeave={() => setActiveMegaMenu(null)}
          >
            <button className="flex items-center gap-1 hover:text-[#0da19a] transition-colors cursor-pointer">
              <span>{labels.trends}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${activeMegaMenu === 'trends' ? 'rotate-180' : ''}`} />
            </button>

            {activeMegaMenu === 'trends' && (
              <div className="absolute top-14 start-1/2 -translate-x-1/2 w-[580px] bg-white border border-gray-100 rounded-3xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">
                  {locale === 'ar' ? 'أقسام الأكثر رواجاً والتريندات' : 'Trend Kategorileri'}
                </p>
                {trendsCategories.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">
                    {locale === 'ar' ? 'لا توجد أقسام تريندات حالياً' : 'Trend kategorisi bulunamadı'}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {trendsCategories.map(col => (
                      <Link
                        key={col.id}
                        href={`/products?category=${col.slug}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-[#0da19a]/5 border border-gray-100 hover:border-[#0da19a]/20 rounded-2xl transition-all group"
                      >
                        {col.image_url ? (
                          <img src={col.image_url} alt="" className="w-8 h-8 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-8 h-8 bg-white border border-gray-150 rounded-xl flex items-center justify-center text-[10px] font-black text-[#0da19a] uppercase shadow-xs group-hover:scale-105 transition-transform">
                            {(locale === 'ar' ? col.name_ar : col.name_tr).slice(0, 2)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-gray-800 group-hover:text-[#0da19a] transition-colors truncate">
                          {locale === 'ar' ? col.name_ar : col.name_tr}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/products" className="hover:text-[#0da19a] transition-colors">{labels.allProducts}</Link>
          <Link href="/products?category=kisiye-ozel-telefon-kilifi-tasarla" className="hover:text-[#0da19a] transition-colors text-rose-500 font-extrabold flex items-center gap-1">
            <Sparkles size={13} className="text-rose-500 animate-pulse" />
            <span>{labels.customCover}</span>
          </Link>
          <Link href="/track" className="hover:text-[#0da19a] transition-colors">{labels.orderTracking}</Link>
          <Link href="/account" className="hover:text-[#0da19a] transition-colors">{labels.myAccount}</Link>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(locale === 'ar' ? 'tr' : 'ar')}
            className="px-3 py-1 rounded-full border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-50 transition-colors uppercase cursor-pointer"
          >
            {locale === 'ar' ? 'TR' : 'AR'}
          </button>

          {/* Persistent Cart Shopping bag Icon */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-gray-600 hover:text-[#0da19a] transition-colors flex items-center justify-center cursor-pointer"
          >
            <ShoppingBag size={21} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#0da19a] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-4 text-sm font-bold text-gray-800 shadow-lg animate-in fade-in duration-200 max-h-[85vh] overflow-y-auto">
          <Link href="/" className="py-2.5 hover:text-[#0da19a] border-b border-gray-50 transition-colors" onClick={() => setOpen(false)}>{labels.home}</Link>
          
          {/* Mobile Koleksiyonlar Header List */}
          {collectionsCategories.length > 0 && (
            <div className="py-2 border-b border-gray-50 space-y-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{labels.collections}</span>
              <div className="grid grid-cols-2 gap-2">
                {collectionsCategories.slice(0, 8).map(col => (
                  <Link
                    key={col.id}
                    href={`/products?category=${col.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 p-2 bg-gray-50/70 rounded-xl text-xs font-semibold hover:text-[#0da19a] transition-colors"
                  >
                    {col.image_url ? (
                      <img src={col.image_url} alt="" className="w-6 h-6 rounded-lg object-cover" />
                    ) : (
                      <div className="w-6 h-6 bg-white border border-gray-150 rounded-lg flex items-center justify-center text-[8px] font-black text-[#0da19a] uppercase">
                        {(locale === 'ar' ? col.name_ar : col.name_tr).slice(0, 2)}
                      </div>
                    )}
                    <span className="truncate">{locale === 'ar' ? col.name_ar : col.name_tr}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Trendler Header List */}
          {trendsCategories.length > 0 && (
            <div className="py-2 border-b border-gray-50 space-y-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{labels.trends}</span>
              <div className="grid grid-cols-2 gap-2">
                {trendsCategories.slice(0, 8).map(col => (
                  <Link
                    key={col.id}
                    href={`/products?category=${col.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 p-2 bg-gray-50/70 rounded-xl text-xs font-semibold hover:text-[#0da19a] transition-colors"
                  >
                    {col.image_url ? (
                      <img src={col.image_url} alt="" className="w-6 h-6 rounded-lg object-cover" />
                    ) : (
                      <div className="w-6 h-6 bg-white border border-gray-150 rounded-lg flex items-center justify-center text-[8px] font-black text-[#0da19a] uppercase">
                        {(locale === 'ar' ? col.name_ar : col.name_tr).slice(0, 2)}
                      </div>
                    )}
                    <span className="truncate">{locale === 'ar' ? col.name_ar : col.name_tr}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/products" className="py-2.5 hover:text-[#0da19a] border-b border-gray-50 transition-colors" onClick={() => setOpen(false)}>{labels.allProducts}</Link>
          <Link href="/products?category=kisiye-ozel-telefon-kilifi-tasarla" className="py-2.5 hover:text-[#0da19a] border-b border-gray-50 transition-colors text-rose-500 font-extrabold flex items-center gap-1" onClick={() => setOpen(false)}>
            <Sparkles size={13} className="text-rose-500" />
            <span>{labels.customCover}</span>
          </Link>
          <Link href="/track" className="py-2.5 hover:text-[#0da19a] border-b border-gray-50 transition-colors" onClick={() => setOpen(false)}>{labels.orderTracking}</Link>
          <Link href="/account" className="py-2.5 hover:text-[#0da19a] transition-colors" onClick={() => setOpen(false)}>{labels.myAccount}</Link>
        </div>
      )}
    </nav>
  )
}
