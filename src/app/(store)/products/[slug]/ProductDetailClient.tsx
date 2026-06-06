'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import type { Product } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'
import { useCart } from '@/components/CartProvider'
import { translations } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Check, ShoppingBag, AlertCircle, UploadCloud, Trash2, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'

export function ProductDetailClient({ product, similarProducts = [] }: { product: Product, similarProducts?: Product[] }) {
  const { locale } = useLocale()
  const { addToCart } = useCart()
  const t = translations[locale]
  
  // Image states
  const [activeImg, setActiveImg] = useState(0)
  
  // Buying states
  const [quantity, setQuantity] = useState(1)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Print-on-Demand custom requirements states
  const [customText, setCustomText] = useState('')
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [customImageName, setCustomImageName] = useState('')
  const [customDetails, setCustomDetails] = useState('')
  const [customFieldsValues, setCustomFieldsValues] = useState<Record<string, string>>({})
  const [customFieldsFilesUploading, setCustomFieldsFilesUploading] = useState<Record<string, boolean>>({})

  const name = locale === 'ar' ? product.name_ar : product.name_tr
  const description = locale === 'ar' ? product.description_ar : product.description_tr
  const images = product.images ?? []
  const models = product.models ?? []
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft

  // 1. Gather all unique brands represented in this case listing
  const uniqueBrands = useMemo(() => {
    const brandsSet = new Set<string>()
    models.forEach(m => brandsSet.add(m.brand))
    return Array.from(brandsSet)
  }, [models])

  // 2. Filter compatible models based on the selected brand
  const filteredModels = useMemo(() => {
    if (!selectedBrand) return []
    return models.filter(m => m.brand === selectedBrand)
  }, [models, selectedBrand])

  // Automatically select the brand if there's only one
  useState(() => {
    if (uniqueBrands.length === 1) {
      setSelectedBrand(uniqueBrands[0])
    }
  })

  // Track product page view event
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).trackAnalyticsEvent) {
      (window as any).trackAnalyticsEvent('view_product', {
        product_id: product.id,
        slug: product.slug,
        name: product.name_ar,
        price: product.price
      })
    }
  }, [product])

  // Quantity adjuster
  const adjustQuantity = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount))
  }

  // Handle Add to Cart action
  const handleAddToCart = () => {
    setErrorMsg('')

    if (!selectedBrand) {
      setErrorMsg(locale === 'ar' ? 'الرجاء اختيار ماركة الهاتف أولاً' : 'Lütfen önce telefon markanızı seçin')
      return
    }
    if (!selectedModel) {
      setErrorMsg(locale === 'ar' ? 'الرجاء اختيار موديل الهاتف' : 'Lütfen telefon modelinizi seçin')
      return
    }

    // Validate PoD requirements
    if (product.custom_type === 'text' && !customText.trim()) {
      setErrorMsg(locale === 'ar' ? `الرجاء إدخال: ${product.custom_label_ar || 'النص المطلوب'}` : 'Lütfen gerekli alanı doldurun')
      return
    }
    if ((product.custom_type === 'image' || product.custom_type === 'image_only') && !customImage) {
      setErrorMsg(locale === 'ar' ? 'الرجاء إرفاق الصورة المطلوبة للطباعة' : 'Lütfen basılacak resmi yükleyin')
      return
    }

    // Validate multiple custom fields if present
    const fields = product.custom_fields || []
    for (const field of fields) {
      if (field.required !== false) {
        const combinedKey = `${field.label_tr} | ${field.label_ar}`
        const val = customFieldsValues[combinedKey]
        if (!val || !val.trim()) {
          const fieldLabel = locale === 'ar' ? field.label_ar : field.label_tr
          setErrorMsg(locale === 'ar' ? `الرجاء إدخال: ${fieldLabel}` : `Lütfen doldurun: ${fieldLabel}`)
          return
        }
      }
    }

    // Add to cart state
    addToCart({
      id: product.id,
      slug: product.slug,
      name_ar: product.name_ar,
      name_tr: product.name_tr,
      price: product.price,
      image: images[0]?.url ?? null,
      brand: selectedBrand,
      model: selectedModel,
      custom_type: product.custom_type,
      custom_text: product.custom_type === 'text' ? customText : null,
      custom_image: (product.custom_type === 'image' || product.custom_type === 'image_only') ? customImage : null,
      custom_image_name: (product.custom_type === 'image' || product.custom_type === 'image_only') ? customImageName : null,
      custom_details: product.custom_type === 'image' ? customDetails : null,
      custom_fields_values: Object.keys(customFieldsValues).length > 0 ? customFieldsValues : null
    }, quantity)

    // Track add to cart event
    if (typeof window !== 'undefined' && (window as any).trackAnalyticsEvent) {
      (window as any).trackAnalyticsEvent('add_to_cart', {
        product_id: product.id,
        slug: product.slug,
        name: product.name_ar,
        price: product.price,
        quantity
      })
    }
  }

  // Handle file uploads for multiple custom fields
  const handleCustomFieldFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number, label: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCustomFieldsFilesUploading(prev => ({ ...prev, [idx]: true }))
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          setCustomFieldsValues(prev => ({ ...prev, [label]: data.url }))
        }
      } else {
        const err = await res.json()
        alert(locale === 'ar' ? 'فشل تحميل الصورة: ' + (err.error || '') : 'Yükleme başarısız: ' + (err.error || ''))
      }
    } catch (err) {
      alert(locale === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Ağ hatası')
    } finally {
      setCustomFieldsFilesUploading(prev => ({ ...prev, [idx]: false }))
    }
  }

  return (
    <div className="font-sans pb-16">
      {/* Return to products */}
      <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-black text-[#0da19a] hover:underline mb-8">
        <BackIcon size={14} /> 
        <span>{t.backToProducts}</span>
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        
        {/* Left Side: Images View Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-150 shadow-xs">
            {images[activeImg] ? (
              <Image src={images[activeImg].url} alt={name} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-8xl">📱</div>
            )}

            {product.compare_price && (
              <span className="absolute top-4 start-4 bg-[#0da19a] text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                -{Math.round((1 - product.price / product.compare_price) * 100)}% {locale === 'ar' ? 'خصم' : 'İndirim'}
              </span>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-none">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    i === activeImg ? 'border-[#0da19a] scale-95 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt={`${name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product configuration specifications */}
        <div className="space-y-6">
          
          {/* Category */}
          {product.category && (
            <span className="inline-block text-[10px] bg-[#0da19a]/10 text-[#0da19a] px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider">
              {locale === 'ar' ? product.category.name_ar : product.category.name_tr}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {name}
          </h1>

          {/* Pricing Row */}
          <div className="flex items-center gap-4 bg-gray-55/40 p-4 rounded-2xl border border-gray-100 inline-flex">
            <span className="text-3xl font-black text-[#0da19a]">{formatPrice(product.price, locale)}</span>
            {product.compare_price && (
              <span className="text-gray-400 line-through text-lg font-semibold">{formatPrice(product.compare_price, locale)}</span>
            )}
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {product.stock > 0 ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                <Check size={14} /> {t.inStock}
              </span>
            ) : (
              <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full">{t.outOfStock}</span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">{t.description}</h3>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line font-medium">{description}</p>
            </div>
          )}

          {/* Premium Customization Container */}
          {((product.custom_fields && product.custom_fields.length > 0) || (product.custom_type && product.custom_type !== 'none')) && (
            <div className="border-t border-gray-100 pt-5">
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/60 space-y-4 text-start animate-in fade-in duration-200">
                <p className="text-[11px] font-black text-[#0da19a] uppercase tracking-wider mb-2">
                  {locale === 'ar' ? 'خيارات التخصيص المطلوبة 🎨' : 'Gerekli Özelleştirme Alanları 🎨'}
                </p>

                {/* Multiple custom fields */}
                {product.custom_fields && product.custom_fields.map((field, idx) => {
                  const fieldLabel = locale === 'ar' ? field.label_ar : field.label_tr
                  const fieldPlaceholder = locale === 'ar' ? (field.placeholder_ar || '') : (field.placeholder_tr || '')
                  const combinedKey = `${field.label_tr} | ${field.label_ar}`
                  const val = customFieldsValues[combinedKey] || ''
                  const maxLength = field.max_length || 20

                  return (
                    <div key={idx} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-800 flex items-center gap-1">
                        <span>{fieldLabel}</span>
                        {field.required !== false && <span className="text-red-500 font-bold">*</span>}
                      </label>

                      {field.type === 'text' ? (
                        <div className="space-y-1">
                          <div className="relative w-full">
                            <input
                              type="text"
                              suppressHydrationWarning
                              required={field.required !== false}
                              maxLength={maxLength}
                              value={val}
                              onChange={e => {
                                  setCustomFieldsValues(prev => ({
                                    ...prev,
                                    [combinedKey]: e.target.value
                                  }))
                                }}
                              placeholder={fieldPlaceholder}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0da19a] text-left pr-12 font-medium shadow-sm transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 select-none font-medium">
                              {val.length}/{maxLength}
                            </span>
                          </div>
                          {fieldPlaceholder && (
                            <p className="text-[10px] text-gray-400 font-medium leading-tight pl-0.5">{fieldPlaceholder}</p>
                          )}
                        </div>
                      ) : (
                        <div className="w-full">
                          {!val ? (
                            <div className="relative border border-dashed border-gray-200 rounded-xl p-3 bg-white hover:bg-gray-50/50 transition-all flex items-center justify-between gap-3 group">
                              <input
                                type="file"
                                accept="image/*"
                                disabled={customFieldsFilesUploading[idx]}
                                onChange={e => handleCustomFieldFileUpload(e, idx, combinedKey)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              />
                              {customFieldsFilesUploading[idx] ? (
                                <div className="flex items-center gap-2 w-full justify-center py-1">
                                  <Loader2 className="animate-spin text-[#0da19a]" size={16} />
                                  <span className="text-[10px] font-bold text-gray-400">جاري الرفع... / Yükleniyor...</span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[11px] font-medium text-gray-500 pl-2">
                                    {locale === 'ar' ? 'الرجاء اختيار ملف لرفع الصورة' : 'Görsel yüklemek için dosya seçimi yapınız'}
                                  </span>
                                  <button type="button" className="bg-black hover:bg-gray-950 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold pointer-events-none transition-colors">
                                    {locale === 'ar' ? 'اختر ملف' : 'Dosya Seç'}
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl animate-in zoom-in-95 duration-200">
                              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-150 flex-shrink-0 bg-slate-50">
                                <img src={val} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-gray-600 truncate">
                                  {locale === 'ar' ? 'تم رفع الصورة بنجاح' : 'Görsel başarıyla yüklendi'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                    setCustomFieldsValues(prev => {
                                      const updated = { ...prev }
                                      delete updated[combinedKey]
                                      return updated
                                    })
                                  }}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Standard customization back-compat: Text type */}
                {product.custom_type === 'text' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>{product.custom_label_ar || (locale === 'ar' ? 'الاسم أو الحرف المطلوب' : 'İstenen Harf veya İsim')}</span>
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      suppressHydrationWarning
                      required
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder={product.custom_placeholder_ar || (locale === 'ar' ? 'اكتب الاسم أو الحرف هنا...' : 'İsim/harf yazın...')}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0da19a] text-left font-medium shadow-sm transition-colors"
                    />
                    {product.custom_placeholder_ar && (
                      <p className="text-[10px] text-gray-400 font-medium leading-tight pl-0.5">{product.custom_placeholder_ar}</p>
                    )}
                  </div>
                )}

                {/* Standard customization back-compat: Image type */}
                {(product.custom_type === 'image' || product.custom_type === 'image_only') && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>{locale === 'ar' ? 'ارفق صورتك الشخصية للطباعة 🖼️' : 'Baskı İçin Görsel Yükle 🖼️'}</span>
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    {!customImage ? (
                      <div className="relative border border-dashed border-gray-200 rounded-xl p-3 bg-white hover:bg-gray-50/50 transition-all flex items-center justify-between gap-3 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setCustomImageName(file.name)
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setCustomImage(reader.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <span className="text-[11px] font-medium text-gray-500 pl-2">
                          {locale === 'ar' ? 'الرجاء اختيار ملف لرفع الصورة' : 'Görsel yüklemek için dosya seçimi yapınız'}
                        </span>
                        <button type="button" className="bg-black hover:bg-gray-950 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold pointer-events-none transition-colors">
                          {locale === 'ar' ? 'اختر ملف' : 'Dosya Seç'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl animate-in zoom-in-95 duration-200">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-150 flex-shrink-0 bg-slate-50">
                          <img src={customImage} alt="Custom upload" className="w-full h-full object-cover animate-in fade-in" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-600 truncate">{customImageName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomImage(null)
                            setCustomImageName('')
                          }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    {product.custom_placeholder_ar && (
                      <p className="text-[10px] text-gray-400 font-medium leading-tight pl-0.5">{product.custom_placeholder_ar}</p>
                    )}

                    {/* Extra custom details */}
                    {product.custom_type === 'image' && (
                      <div className="space-y-1 mt-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {locale === 'ar' ? 'تفاصيل إضافية للطباعة (اختياري)' : 'Ekstra Baskı Detayları (İsteğe Bağlı)'}
                        </label>
                        <textarea
                          rows={2}
                          value={customDetails}
                          onChange={e => setCustomDetails(e.target.value)}
                          placeholder={locale === 'ar' ? 'اكتب أي تفاصيل أو تعديلات تريدها على الصورة...' : 'Resim üzerinde yapılmasını istediğiniz düzenlemeleri yazabilirsiniz...'}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Variant Selector Phase */}
          {models.length > 0 && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              
              {/* Brand Selection pills */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {locale === 'ar' ? '1. ماركة الهاتف' : '1. Telefon Markası'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => {
                        setSelectedBrand(brand)
                        setSelectedModel('')
                      }}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBrand === brand
                          ? 'bg-[#0da19a]/10 border-[#0da19a] text-[#0da19a] shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection dropdown */}
              {selectedBrand && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-250">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {locale === 'ar' ? '2. موديل الهاتف' : '2. Telefon Modeli'}
                  </label>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0da19a]"
                  >
                    <option value="">{locale === 'ar' ? '-- اختر الموديل --' : '-- Model Seçin --'}</option>
                    {filteredModels.map((m, idx) => (
                      <option key={`${idx}-${m.brand}-${m.model_name}`} value={m.model_name}>
                        {m.model_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Interactive add-to-cart row toolbar */}
          {product.stock > 0 && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <div className="flex items-center gap-4">
                
                {/* Quantity select */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-white">
                  <button
                    onClick={() => adjustQuantity(-1)}
                    className="px-3 text-gray-500 hover:bg-gray-50 h-full font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-black text-gray-800">{quantity}</span>
                  <button
                    onClick={() => adjustQuantity(1)}
                    className="px-3 text-gray-500 hover:bg-gray-50 h-full font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#0da19a] hover:bg-[#0b807b] text-white font-bold rounded-xl shadow-lg shadow-[#0da19a]/10 hover:shadow-xl transition-all text-sm cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>{locale === 'ar' ? 'أضف للسلة 🛒' : 'Sepete Ekle 🛒'}</span>
                </button>
              </div>

              {/* Validation errors alert box */}
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 p-3 rounded-xl">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Static Product Info Banner and Guidelines */}
              <div className="pt-6 border-t border-gray-150/70 space-y-5 text-start font-sans">
                {/* Banner Image */}
                <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm">
                  <img
                    src="/info-banner.jpg"
                    alt="Önemli Bilgilendirme"
                    className="w-full h-auto object-contain"
                  />
                </div>
                
                {/* Bilingual Static Guideline Texts */}
                <div className="space-y-4 text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 border border-gray-150/50 p-5 rounded-2xl">
                  {locale === 'ar' ? (
                    <>
                      <p className="font-bold text-red-600 bg-red-50 border border-red-100/60 p-3 rounded-xl">
                        ⚠️ لا يتم إرسال منتجاتنا من المخزون الجاهز، بل يتم إنتاجها خصيصاً لكل عميل بناءً على طلبه. لذلك، لا تُقبل طلبات الإرجاع ما لم يكن هناك عيب حقيقي وواضح في المنتج. يرجى التأكد من اختيار موديل هاتفك بشكل صحيح عند تقديم الطلب.
                      </p>

                      <div className="space-y-2">
                        <p className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                          <span>📱</span> كيف يمكنني الطلب؟
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 pl-1">
                          <li>اختر ماركة وموديل هاتفك الذي تريد طلبه من حقل اختيار ماركة وموديل الهاتف أدناه، ثم اضغط على <span className="font-bold text-[#0da19a]">أضف إلى السلة</span>.</li>
                          <li>اضغط على خطوة الدفع الموجودة أسفل السلة وأدخل المعلومات المطلوبة لإكمال الطلب.</li>
                        </ol>
                      </div>

                      <p className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl font-bold">
                        📌 تتم طباعة التصميم الموجود في صورة المنتج على الكفر المناسب لموديل الهاتف الذي اخترته وإرساله إلى عنوانك.
                      </p>

                      <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="font-extrabold text-gray-800 text-sm">✨ مواصفات المنتج:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                          <li><span className="font-bold text-gray-700">طباعة UV عالية الدقة:</span> الألوان زاهية ومقاومة للبهتان أو التقشير.</li>
                          <li><span className="font-bold text-gray-700">حماية كاملة وامتصاص الصدمات:</span> هيكل سيليكون مرن يحمي جهازك من السقوط.</li>
                          <li><span className="font-bold text-gray-700">حماية الكاميرا:</span> إطار مرتفع يمنع خدش عدسات الكاميرا.</li>
                          <li><span className="font-bold text-gray-700">توافق واسع:</span> متوافق تماماً مع أجهزة iPhone وSamsung وXiaomi وRedmi وجميع موديلات Android الأخرى.</li>
                          <li><span className="font-bold text-gray-700">هدية مميزة:</span> واحدة من أكثر الهدايا تميزاً لنفسك أو لأحبائك. أضفه إلى سلتك الآن ليصلك حتى باب منزلك مع ميزة الدفع عند الاستلام!</li>
                        </ul>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="font-extrabold text-gray-800 text-sm">🛡️ المميزات البارزة:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                          <li><span className="font-bold text-gray-700">تصميم مريح:</span> مضاد للانزلاق وسهل الإمساك في اليد.</li>
                        </ul>
                      </div>

                      <div className="space-y-1.5 bg-teal-50 border border-teal-100 p-3 rounded-xl text-teal-850 font-bold text-xs">
                        <p>📢 العرض الحصري: اشترِ 3 واحصل على 2 مجاناً!</p>
                        <p>📦 توصيل سريع خلال 1-3 أيام عمل.</p>
                        <p>🛍️ تسوق آمن مع ميزة الدفع عند الاستلام.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-red-600 bg-red-50 border border-red-100/60 p-3 rounded-xl">
                        ⚠️ Ürünlerimiz hazır stoktan gönderilmemekte, sipariş üzerine kişiye özel olarak üretilmektedir. Bu nedenle, üründe geçerli bir kusur bulunmadıkça iade talepleri kabul edilmemektedir. Lütfen sipariş verirken telefon modelinizi doğru seçtiğinizden emin olunuz.
                      </p>

                      <div className="space-y-2">
                        <p className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                          <span>📱</span> Nasıl Sipariş Verebilirim?
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 pl-1">
                          <li>Aşağıda bulunan telefon marka ve model seçimi alanından sipariş vermek istediğiniz marka ve modeli seçip <span className="font-bold text-[#0da19a]">Sepete Ekle</span>’ye tıklayın.</li>
                          <li>Sepette alt kısımda bulunan ödeme adımına tıklayıp gerekli bilgileri girerek siparişi tamamlayın.</li>
                        </ol>
                      </div>

                      <p className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl font-bold">
                        📌 Seçtiğiniz telefon modeline uygun kılıfa, ürün fotoğrafındaki tasarım basılır ve adresinize gönderilir.
                      </p>

                      <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="font-extrabold text-gray-800 text-sm">✨ Ürün Özellikleri:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                          <li><span className="font-bold text-gray-700">Yüksek Çözünürlüklü UV Baskı:</span> Renkler canlıdır, solma veya soyulma yapmaz.</li>
                          <li><span className="font-bold text-gray-700">Tam Koruma & Darbe Emici:</span> Esnek silikon yapısı sayesinde cihazınızı düşmelere karşı korur.</li>
                          <li><span className="font-bold text-gray-700">Kamera Koruma:</span> Yükseltilmiş çerçeveler lenslerinizin çizilmesini önler.</li>
                          <li><span className="font-bold text-gray-700">Geniş Uyumluluk:</span> iPhone, Samsung, Xiaomi, Redmi ve diğer tüm Android modelleriyle tam uyum.</li>
                          <li><span className="font-bold text-gray-700">Anlamlı Bir Hediye:</span> Kendiniz için veya sevdiklerinize hediye edebileceğiniz en anlamlı modellerden biri. Şimdi sepetine ekle, kapıda nakit ödeme avantajıyla kapına gelsin!</li>
                        </ul>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="font-extrabold text-gray-800 text-sm">🛡️ Öne Çıkan Özellikler:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                          <li><span className="font-bold text-gray-700">Ergonomik Tasarım:</span> Kaymaz, elinizde rahatça tutabilirsiniz.</li>
                        </ul>
                      </div>

                      <div className="space-y-1.5 bg-teal-50 border border-teal-100 p-3 rounded-xl text-teal-850 font-bold text-xs">
                        <p>📢 Kampanya: Şimdi 3 Al, 2 Öde!</p>
                        <p>📦 1-3 iş gününde hızlı teslimat.</p>
                        <p>🛍️ Kapıda Ödeme ile Güvenli Alışveriş.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products Section */}
      {similarProducts && similarProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-150/70 space-y-6">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
            {t.similarProducts}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {similarProducts.slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
