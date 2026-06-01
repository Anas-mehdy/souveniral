'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import { useLocale } from './LocaleProvider'
import { translations } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { Edit3, Check, X, Loader2 } from 'lucide-react'

interface Props {
  product: Product
  isAdmin?: boolean
}

export function ProductCard({ product: initialProduct, isAdmin = false }: Props) {
  const { locale } = useLocale()
  const t = translations[locale]
  
  const [product, setProduct] = useState<Product>(initialProduct)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // Edit fields state
  const [nameTr, setNameTr] = useState(product.name_tr)
  const [nameAr, setNameAr] = useState(product.name_ar)
  const [price, setPrice] = useState(product.price.toString())
  const [comparePrice, setComparePrice] = useState(product.compare_price?.toString() ?? '')

  const name = locale === 'ar' ? product.name_ar : product.name_tr
  const image = product.images?.[0]?.url

  // Quick Save Handler
  const handleQuickSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    const payload = {
      name_tr: nameTr,
      name_ar: nameAr,
      price: parseFloat(price),
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      stock: 99999
    }

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setProduct(prev => ({
          ...prev,
          ...payload
        }))
        setEditing(false)
      } else {
        alert('Quick save failed')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const toggleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditing(!editing)
  }

  return (
    <div className="relative group/card h-full font-sans">
      <Link href={`/products/${product.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 h-full flex flex-col justify-between">
        
        {/* Image / Thumbnail Container */}
        <div>
          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-5xl">📱</div>
            )}
            
            {product.compare_price && (
              <span className="absolute top-2 start-2 bg-[#0da19a] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                -{Math.round((1 - product.price / product.compare_price) * 100)}%
              </span>
            )}
          </div>
          
          {/* Card Info Details */}
          <div className="p-3 space-y-1">
            <p className="text-xs font-bold text-gray-800 line-clamp-2 min-h-[2rem] leading-relaxed">
              {name}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#0da19a] font-black text-xs">{formatPrice(product.price, locale)}</span>
              {product.compare_price && (
                <span className="text-gray-400 line-through text-[10px] font-semibold">{formatPrice(product.compare_price, locale)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Category Label */}
        {product.category && (
          <div className="px-3 pb-3">
            <span className="inline-block text-[9px] bg-[#0da19a]/10 text-[#0da19a] px-2 py-0.5 rounded-full font-black uppercase">
              {locale === 'ar' ? product.category.name_ar : product.category.name_tr}
            </span>
          </div>
        )}
      </Link>

      {/* Floating admin edit pencil toggle */}
      {isAdmin && (
        <button
          onClick={toggleEdit}
          title="Quick Edit Product Details Inline"
          className="absolute top-2 end-2 z-10 p-2 bg-[#0da19a] hover:bg-[#0b807b] text-white rounded-full shadow-lg transition-transform cursor-pointer scale-90 md:scale-100"
        >
          <Edit3 size={12} />
        </button>
      )}

      {/* Inline quick edit form modal popup */}
      {editing && (
        <div 
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute inset-0 bg-slate-950/90 rounded-2xl p-3 flex flex-col justify-between z-20 text-white animate-in zoom-in duration-200"
        >
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            <p className="text-[10px] font-bold text-[#0da19a] uppercase tracking-wider">تعديل سريع / Hızlı Düzenle</p>
            
            {/* AR Title Input */}
            <div className="space-y-0.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase">الاسم / Ürün Adı</label>
              <input
                type="text"
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
              />
            </div>


            <div className="space-y-0.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Fiyat (₺)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions footer */}
          <div className="flex gap-2 border-t border-slate-850 pt-2 flex-shrink-0">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <X size={10} className="inline mr-1" /> {locale === 'ar' ? 'إلغاء' : 'İptal'}
            </button>
            <button
              onClick={handleQuickSave}
              disabled={loading}
              className="flex-1 py-1.5 bg-[#0da19a] hover:bg-[#0b807b] rounded text-[10px] font-bold text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={10} />
              ) : (
                <>
                  <Check size={10} />
                  <span>{locale === 'ar' ? 'حفظ' : 'Kaydet'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
