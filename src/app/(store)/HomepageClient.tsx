'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Category, Product } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'
import { translations } from '@/lib/i18n'
import { ProductCard } from '@/components/ProductCard'
import type { StoreSettings, HeroSlide, TickerItem, TrustFeature } from '@/lib/settings'
import { 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  Compass, 
  ShieldCheck, 
  Edit3, 
  Settings, 
  Check, 
  X, 
  Loader2, 
  Plus, 
  Trash2 
} from 'lucide-react'

interface Props {
  categories: Category[]
  products: Product[]
  isAdmin?: boolean
  settings: StoreSettings
}

export function HomepageClient({ categories, products, isAdmin = false, settings }: Props) {
  const { locale } = useLocale()
  const t = translations[locale]
  const [currentSlide, setCurrentSlide] = useState(0)

  // Dynamic values in state
  const [localSettings, setLocalSettings] = useState<StoreSettings>(settings)
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)

  // Rotate hero banners every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % (localSettings.hero_slides?.length || 1))
    }, 6000)
    return () => clearInterval(timer)
  }, [localSettings.hero_slides])

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryNameAr, setCategoryNameAr] = useState('')
  const [categoryImageUrl, setCategoryImageUrl] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryUploading, setCategoryUploading] = useState(false)

  // Slide Banners Edit State
  const [editingHero, setEditingHero] = useState(false)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(localSettings.hero_slides)
  const [savingHero, setSavingHero] = useState(false)

  // Ticker Announcements Edit State
  const [editingTicker, setEditingTicker] = useState(false)
  const [announcementTopAr, setAnnouncementTopAr] = useState(localSettings.announcement_top_ar)
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(localSettings.ticker_items)
  const [savingTicker, setSavingTicker] = useState(false)

  // Brand Trust Features Edit State
  const [editingTrust, setEditingTrust] = useState(false)
  const [trustFeatures, setTrustFeatures] = useState<TrustFeature[]>(localSettings.trust_features)
  const [savingTrust, setSavingTrust] = useState(false)

  // Promo Banner Edit State
  const [editingPromo, setEditingPromo] = useState(false)
  const [promoPreAr, setPromoPreAr] = useState(localSettings.promo_banner.pre_ar)
  const [promoTitleAr, setPromoTitleAr] = useState(localSettings.promo_banner.title_ar)
  const [promoDescAr, setPromoDescAr] = useState(localSettings.promo_banner.desc_ar)
  const [promoBtnAr, setPromoBtnAr] = useState(localSettings.promo_banner.btn_ar)
  const [savingPromo, setSavingPromo] = useState(false)

  // Customer Gallery Edit State
  const [gallery, setGallery] = useState<string[]>(localSettings.customer_gallery || [])
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [savingGalleryState, setSavingGalleryState] = useState(false)

  // Populate category edit form fields
  useEffect(() => {
    if (editingCategory) {
      setCategoryNameAr(editingCategory.name_ar)
      setCategoryImageUrl(editingCategory.image_url ?? '')
    }
  }, [editingCategory])

  // Sync state if initial settings change
  useEffect(() => {
    setLocalSettings(settings)
    setHeroSlides(settings.hero_slides)
    setAnnouncementTopAr(settings.announcement_top_ar)
    setTickerItems(settings.ticker_items)
    setTrustFeatures(settings.trust_features)
    setPromoPreAr(settings.promo_banner.pre_ar)
    setPromoTitleAr(settings.promo_banner.title_ar)
    setPromoDescAr(settings.promo_banner.desc_ar)
    setPromoBtnAr(settings.promo_banner.btn_ar)
    setGallery(settings.customer_gallery || [])
  }, [settings])

  // Partition products into lists
  const bestSellers = products.slice(0, 4)
  const newestArrivals = products.slice(4, 8)

  // Save Settings Helper API
  const saveSettingsPayload = async (payload: Partial<StoreSettings>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Settings save failed')
    setLocalSettings(prev => ({ ...prev, ...payload }))
  }

  // Handle customer gallery photo uploading
  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setGalleryUploading(true)
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
          setGallery(prev => [...prev, data.url])
        }
      } else {
        const err = await res.json()
        alert('Upload failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Network error during upload')
    } finally {
      setGalleryUploading(false)
    }
  }

  // Handle saving customer gallery settings
  async function handleGallerySave() {
    setSavingGalleryState(true)
    try {
      await saveSettingsPayload({ customer_gallery: gallery })
      setGalleryModalOpen(false)
    } catch (err) {
      alert('Network error: ' + (err as Error).message)
    } finally {
      setSavingGalleryState(false)
    }
  }

  // Handle Category Image Uploading from device
  async function handleCategoryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCategoryUploading(true)
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
          setCategoryImageUrl(data.url)
        }
      } else {
        const err = await res.json()
        alert('Upload failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Network error during upload')
    } finally {
      setCategoryUploading(false)
    }
  }

  // 1. Save Category
  const handleSaveCategory = async () => {
    if (!editingCategory) return
    setSavingCategory(true)
    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ar: categoryNameAr,
          image_url: categoryImageUrl
        })
      })
      if (res.ok) {
        setLocalCategories(prev =>
          prev.map(c => c.id === editingCategory.id ? { ...c, name_ar: categoryNameAr, image_url: categoryImageUrl } : c)
        )
        setEditingCategory(null)
      } else {
        alert('Failed to update category')
      }
    } catch (err) {
      alert('Error updating category')
    } finally {
      setSavingCategory(false)
    }
  }

  // 2. Save Hero Slideshow Settings
  const handleSaveHero = async () => {
    setSavingHero(true)
    try {
      await saveSettingsPayload({ hero_slides: heroSlides })
      setEditingHero(false)
    } catch (err) {
      alert('Error saving slider settings')
    } finally {
      setSavingHero(false)
    }
  }

  // 3. Save Ticker Announcements
  const handleSaveTicker = async () => {
    setSavingTicker(true)
    try {
      await saveSettingsPayload({
        announcement_top_ar: announcementTopAr,
        ticker_items: tickerItems
      })
      setEditingTicker(false)
      // Trigger a page refresh to update Navbar announcements in layout
      window.location.reload()
    } catch (err) {
      alert('Error saving announcements settings')
    } finally {
      setSavingTicker(false)
    }
  }

  // 4. Save Brand Trust features
  const handleSaveTrust = async () => {
    setSavingTrust(true)
    try {
      await saveSettingsPayload({ trust_features: trustFeatures })
      setEditingTrust(false)
    } catch (err) {
      alert('Error saving trust features')
    } finally {
      setSavingTrust(false)
    }
  }

  // 5. Save Promo Banner
  const handleSavePromo = async () => {
    setSavingPromo(true)
    try {
      await saveSettingsPayload({
        promo_banner: {
          ...localSettings.promo_banner,
          pre_ar: promoPreAr,
          title_ar: promoTitleAr,
          desc_ar: promoDescAr,
          btn_ar: promoBtnAr
        }
      })
      setEditingPromo(false)
    } catch (err) {
      alert('Error saving promotional banner settings')
    } finally {
      setSavingPromo(false)
    }
  }

  // Utility to render dynamic features icon
  const renderTrustIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone': return <Smartphone size={24} />
      case 'Compass': return <Compass size={24} />
      default: return <ShieldCheck size={24} />
    }
  }

  // Active slideshow texts
  const currentHero = localSettings.hero_slides?.[currentSlide] || settings.hero_slides[0]
  const currentHeroTitle = locale === 'ar' ? currentHero.title_ar : currentHero.title_tr
  const currentHeroDesc = locale === 'ar' ? currentHero.desc_ar : currentHero.desc_tr
  const currentHeroBtn = locale === 'ar' ? currentHero.btn_ar : currentHero.btn_tr

  return (
    <div className="space-y-12 font-sans pb-16 relative">

      {/* ==================== 1. HERO SLIDESHOW SECTION ==================== */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-[#0da19a] to-slate-900 text-white h-[380px] md:h-[440px] flex items-center p-8 md:p-16 transition-all duration-700 group/hero">
        <div className="absolute inset-0 bg-black/10 z-0"></div>
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10">
            <Sparkles size={12} className="text-amber-300" />
            <span>{locale === 'ar' ? 'تصاميم حصرية ومميزة' : 'En Çok Satan Tasarımlar'}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black leading-tight animate-fade-in tracking-tight">
            {currentHeroTitle}
          </h1>

          <p className="text-sm md:text-base opacity-90 leading-relaxed max-w-lg font-medium">
            {currentHeroDesc}
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-[#0da19a] font-bold px-8 py-3.5 rounded-2xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <span>{currentHeroBtn}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Hero edit button (Floating overlay) */}
        {isAdmin && (
          <button
            onClick={() => setEditingHero(true)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-[#0da19a] hover:bg-[#0b807b] text-white px-3 py-1.5 rounded-xl shadow-lg font-bold text-xs transition-transform cursor-pointer"
          >
            <Settings size={14} />
            <span>تعديل الشرائح / Banner Düzenle</span>
          </button>
        )}

        {/* Small slide indicators dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {(localSettings.hero_slides || []).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'
              }`}
            ></button>
          ))}
        </div>
      </section>

      {/* ==================== 1.5 INFINITE MARQUEE TICKER SECTION ==================== */}
      <div 
        dir="ltr"
        className="relative w-full bg-[#47be37] text-white py-3 overflow-hidden rounded-2xl select-none shadow-sm flex items-center font-bold text-xs uppercase tracking-wider group/marquee"
      >
        <div className="animate-marquee whitespace-nowrap flex gap-16">
          <span className="flex items-center gap-16 flex-shrink-0">
            {localSettings.ticker_items.map((item, idx) => (
              <span key={idx} className="flex-shrink-0">🔥 {locale === 'ar' ? item.ar : item.tr}</span>
            ))}
          </span>
          <span className="flex items-center gap-16 flex-shrink-0" aria-hidden="true">
            {localSettings.ticker_items.map((item, idx) => (
              <span key={`dup-${idx}`} className="flex-shrink-0">🔥 {locale === 'ar' ? item.ar : item.tr}</span>
            ))}
          </span>
        </div>


        {/* Ticker edit button */}
        {isAdmin && (
          <button
            onClick={() => setEditingTicker(true)}
            className="absolute top-1/2 -translate-y-1/2 right-4 z-20 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg shadow-md font-bold text-[10px] cursor-pointer"
          >
            <Edit3 size={11} />
            <span>تعديل الشريط / Ticker Düzenle</span>
          </button>
        )}
      </div>

      {/* ==================== 2. BRAND TRUST FEATURES SECTION ==================== */}
      <section className="relative grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 group/trust">
        {localSettings.trust_features.map((feat, idx) => (
          <div key={idx} className={`flex items-center gap-4 p-3 ${idx > 0 ? 'border-t md:border-t-0 border-gray-200/60' : ''} ${idx === 1 ? 'md:border-x' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0da19a] flex items-center justify-center border border-[#0da19a]/20`}>
              {renderTrustIcon(feat.icon)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{locale === 'ar' ? feat.title_ar : feat.title_tr}</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">{locale === 'ar' ? feat.desc_ar : feat.desc_tr}</p>
            </div>
          </div>
        ))}

        {/* Trust Features edit trigger */}
        {isAdmin && (
          <button
            onClick={() => setEditingTrust(true)}
            className="absolute -top-3 right-4 z-20 flex items-center gap-1 bg-[#0da19a] hover:bg-[#0b807b] text-white px-2 py-1 rounded-lg shadow font-bold text-[10px] cursor-pointer"
          >
            <Edit3 size={10} />
            <span>تعديل المزايا / Özellikleri Düzenle</span>
          </button>
        )}
      </section>

      {/* ==================== 3. PORTRAIT COLLECTION BADGES ROW ==================== */}
      {localCategories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800">
                {locale === 'ar' ? 'أقسام مجموعاتنا الخاصة' : 'Özel Koleksiyonlarımız'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                {locale === 'ar' ? 'اختر التشكيلة المميزة التي تعبر عن أسلوبك الفريد' : 'Tarzınıza en uygun kılıf kategorisini seçin'}
              </p>
            </div>
            <Link href="/categories" className="text-xs font-bold text-[#0da19a] hover:underline flex items-center gap-1">
              <span>{t.viewAll}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex overflow-x-auto flex-nowrap gap-4 pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth w-full sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:gap-4 md:gap-5 sm:pb-0 sm:overflow-visible pt-1 px-1">
            {(() => {
              const collections = localCategories.filter(cat => cat.parent_type === 'collections')
              if (collections.length > 0) return collections.slice(0, 7)

              // Smart fallback list of slugs to show exactly 7 collections if database is not migrated yet
              const FALLBACK_SLUGS = [
                'kisiye-ozel-telefon-kilifi-tasarla',
                'kiiye-zel-telefon-klf-tasarla',
                'taraftar-ve-futbolcu-kiliflari',
                'taraftar-ve-futbolcu-klflar',
                'islami-tasarim-ve-filistin-temali-telefon-kiliflari',
                'islami-tasarim-ve-filistin-temali-telefon-klflar',
                'estetik-koleksiyonu',
                'araba-telefon-kiliflari',
                'araba-telefon-klflar',
                'matematik-telefon-kiliflari',
                'matematik-telefon-klflar',
                'tarih-telefon-kiliflari',
                'tarih-telefon-klflar',
                'film-dizi-ve-popler-kltr-koleksiyonu',
                'formula-1-telefon-klflar',
                'basketbol-telefon-klflar'
              ]
              const filtered = localCategories.filter(cat => FALLBACK_SLUGS.includes(cat.slug))
              return filtered.length > 0 ? filtered.slice(0, 7) : localCategories.slice(0, 7)
            })().map(cat => (
              <div key={cat.id} className="relative flex flex-col items-center gap-3 group/cat w-[42%] sm:w-full shrink-0 snap-start">
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <div className="relative w-full aspect-[3/4.2] rounded-2xl overflow-hidden border border-gray-150 p-1 bg-white group-hover:border-[#0da19a] group-hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
                    {cat.image_url ? (
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <Image src={cat.image_url} alt={cat.name_tr} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-xl bg-slate-50 flex items-center justify-center text-xs font-bold text-gray-400 border border-dashed border-gray-200">
                        {locale === 'ar' ? 'لا توجد صورة' : 'Görsel Yok'}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-gray-700 tracking-wide group-hover:text-[#0da19a] transition-colors w-full text-center line-clamp-2 leading-snug">
                    {locale === 'ar' ? cat.name_ar : cat.name_tr}
                  </span>
                </Link>

                {/* Edit Category badge overlay */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingCategory(cat)
                    }}
                    title="تعديل هذا القسم سريعاً"
                    className="absolute top-1 right-1 p-1.5 bg-[#0da19a] hover:bg-[#0b807b] text-white rounded-full shadow-lg z-10 opacity-0 group-hover/cat:opacity-100 transition-opacity scale-90 cursor-pointer"
                  >
                    <Edit3 size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

       {/* ==================== INFRASTRUCTURE: MARQUEE CSS INJECTION ==================== */}
      <style>{`
        @keyframes galleryMarqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-gallery-marquee-scroll {
          display: flex;
          width: max-content;
          animation: galleryMarqueeScroll 18s linear infinite;
        }
        .animate-gallery-marquee-scroll:hover {
          animation-play-state: paused;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ==================== CUSTOMER GALLERY SECTION (SIZDEN GELENLER) ==================== */}
      <section className="space-y-6 relative group/gallery">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-1.5">
              <span>{locale === 'ar' ? 'من تصاميم عملائنا الكرام 😍' : 'Sizden Gelenler 😍'}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              {locale === 'ar' ? 'مجموعة من صور وتصاميم الهواتف التي صممها عملاؤنا الكرام بأنفسهم' : 'Müşterilerimizin kendi hazırlayıp paylaştığı özel tasarım kılıf fotoğrafları'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setGalleryModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Settings size={14} />
              <span>إدارة المعرض / Galeri Yönetimi</span>
            </button>
          )}
        </div>

        <div className="overflow-hidden w-full relative py-4 bg-gray-50/20 rounded-3xl border border-gray-100/50">
          <div className="animate-gallery-marquee-scroll flex gap-6 px-3">
            {/* Render gallery images, fall back to default if empty */}
            {(gallery.length > 0 ? gallery : [
              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=80"
            ]).map((imgUrl, idx) => (
              <div 
                key={`g1-${idx}`} 
                className="w-48 h-64 shrink-0 rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative group bg-white"
              >
                <img src={imgUrl} alt="Sizden Gelenler" className="w-full h-full object-cover animate-in fade-in duration-300" loading="lazy" />
              </div>
            ))}
            {/* Replicated copy for continuous loop scrolling */}
            {(gallery.length > 0 ? gallery : [
              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=600&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=80"
            ]).map((imgUrl, idx) => (
              <div 
                key={`g2-${idx}`} 
                className="w-48 h-64 shrink-0 rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative group bg-white"
              >
                <img src={imgUrl} alt="Sizden Gelenler" className="w-full h-full object-cover animate-in fade-in duration-300" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. BEST SELLERS SECTION GRID ==================== */}
      {bestSellers.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800">
                {locale === 'ar' ? 'الأكثر طلباً ومبيعاً 🔥' : 'En Çok Satanlar 🔥'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {locale === 'ar' ? 'مجموعة كفرات الهواتف المفضلة لدى عملائنا' : 'Müşterilerimizin en çok tercih ettiği popüler kılıflar'}
              </p>
            </div>
            <Link href="/products" className="text-xs font-bold text-[#0da19a] hover:underline flex items-center gap-1">
              <span>{t.viewAll}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {bestSellers.map(p => <ProductCard key={p.id} product={p} isAdmin={isAdmin} />)}
          </div>
        </section>
      )}

      {/* ==================== 5. PROMOTIONAL MIDDLE BANNER SECTION ==================== */}
      <section className="relative rounded-3xl bg-slate-950 p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 group/promo">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0da19a]/15 rounded-full blur-3xl"></div>
        <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
          <span className="text-[10px] font-bold text-[#0da19a] tracking-widest uppercase bg-[#0da19a]/10 px-3 py-1 rounded-full">
            {locale === 'ar' ? localSettings.promo_banner.pre_ar : localSettings.promo_banner.pre_tr}
          </span>
          <h3 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight">
            {locale === 'ar' ? localSettings.promo_banner.title_ar : localSettings.promo_banner.title_tr}
          </h3>
          <p className="text-xs text-slate-400 max-w-md font-medium leading-relaxed">
            {locale === 'ar' ? localSettings.promo_banner.desc_ar : localSettings.promo_banner.desc_tr}
          </p>
        </div>
        <Link
          href="/products"
          className="flex-shrink-0 px-8 py-3.5 bg-[#0da19a] hover:bg-[#0b807b] text-white font-bold rounded-2xl shadow-lg shadow-[#0da19a]/10 transition-colors text-sm cursor-pointer relative z-10"
        >
          {locale === 'ar' ? localSettings.promo_banner.btn_ar : localSettings.promo_banner.btn_tr}
        </Link>

        {/* Promo edit trigger */}
        {isAdmin && (
          <button
            onClick={() => setEditingPromo(true)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-[#0da19a] hover:bg-[#0b807b] text-white px-2.5 py-1 rounded-lg shadow font-bold text-[10px] cursor-pointer"
          >
            <Edit3 size={11} />
            <span>تعديل البانر / Banner Düzenle</span>
          </button>
        )}
      </section>

      {/* ==================== 6. NEWEST PRODUCTS SECTION GRID ==================== */}
      {newestArrivals.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800">
                {locale === 'ar' ? 'أحدث كفرات الهواتف المضافة ✨' : 'Yeni Eklenen Kılıflar ✨'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {locale === 'ar' ? 'تصاميم حديثة ومبتكرة أسبوعياً' : 'Haftalık olarak güncellenen en yeni kılıf tasarımları'}
              </p>
            </div>
            <Link href="/products" className="text-xs font-bold text-[#0da19a] hover:underline flex items-center gap-1">
              <span>{t.viewAll}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {newestArrivals.map(p => <ProductCard key={p.id} product={p} isAdmin={isAdmin} />)}
          </div>
        </section>
      )}


      {/* ========================================================================= */}
      {/* ==================== ADMIN EDITING SYSTEM INLINE MODALS ================= */}
      {/* ========================================================================= */}

      {/* A. CATEGORY EDIT DIALOG POPUP */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-[#0da19a]">تعديل القسم / Kategori Düzenle</h3>
              <button onClick={() => setEditingCategory(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              {/* Category Name Arabic */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">الاسم (العربية)</label>
                <input
                  type="text"
                  value={categoryNameAr}
                  onChange={e => setCategoryNameAr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
                />
              </div>

              {/* Category Image Upload */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">صورة الغلاف / Kapak Görseli</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="category-file-input"
                      onChange={handleCategoryImageUpload}
                      disabled={categoryUploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="category-file-input"
                      className="w-full h-10 px-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-850 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors border-dashed"
                    >
                      {categoryUploading ? (
                        <>
                          <Loader2 className="animate-spin text-[#0da19a]" size={14} />
                          <span>جاري الرفع... / Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} className="text-[#0da19a]" />
                          <span>تحميل صورة / Fotoğraf Yükle</span>
                        </>
                      )}
                    </label>
                  </div>
                  {categoryImageUrl && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950 shrink-0">
                      <img src={categoryImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="أو رابط الصورة المباشر / Veya doğrudan URL yapıştırın"
                  value={categoryImageUrl}
                  onChange={e => setCategoryImageUrl(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-white focus:outline-none focus:border-[#0da19a]"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={savingCategory}
                className="flex-1 py-2 bg-[#0da19a] hover:bg-[#0b807b] rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingCategory ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>حفظ التعديلات / Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. HERO SLIDESHOW EDIT DIALOG POPUP */}
      {editingHero && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 text-white shadow-2xl scrollbar-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-[#0da19a]">تعديل شرائح البانر / Hero Banner Düzenle</h3>
              <button onClick={() => setEditingHero(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="space-y-6">
              {heroSlides.map((slide, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold text-[#0da19a]">الشريحة / Slayt #{idx + 1}</span>
                    {heroSlides.length > 1 && (
                      <button
                        onClick={() => setHeroSlides(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">العنوان (العربية)</label>
                      <input
                        type="text"
                        value={slide.title_ar}
                        onChange={e => {
                          const updated = [...heroSlides]
                          updated[idx].title_ar = e.target.value
                          setHeroSlides(updated)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">الوصف (العربية)</label>
                      <textarea
                        rows={2}
                        value={slide.desc_ar}
                        onChange={e => {
                          const updated = [...heroSlides]
                          updated[idx].desc_ar = e.target.value
                          setHeroSlides(updated)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">نص الزر (العربية)</label>
                      <input
                        type="text"
                        value={slide.btn_ar}
                        onChange={e => {
                          const updated = [...heroSlides]
                          updated[idx].btn_ar = e.target.value
                          setHeroSlides(updated)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setHeroSlides(prev => [
                  ...prev,
                  {
                    title_tr: "Yeni Tasarımlar",
                    title_ar: "تصاميم جديدة وفريدة",
                    desc_tr: "Yeni özel tasarım telefon kılıfları",
                    desc_ar: "أحدث تصاميم كفرات الهواتف حماية مميزة لسيارتك وهاتفك",
                    btn_tr: "Keşfet",
                    btn_ar: "تصفح الآن"
                  }
                ])}
                className="w-full py-2 bg-slate-950 border border-dashed border-slate-800 hover:border-[#0da19a] hover:text-[#0da19a] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>إضافة شريحة جديدة / Yeni Slayt Ekle</span>
              </button>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingHero(false)}
                className="flex-1 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                onClick={handleSaveHero}
                disabled={savingHero}
                className="flex-1 py-2 bg-[#0da19a] hover:bg-[#0b807b] rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingHero ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>حفظ الشرائح / Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. SCROLLING TICKER & TOP ANNOUNCEMENT EDIT POPUP */}
      {editingTicker && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 text-white shadow-2xl scrollbar-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-[#0da19a]">تعديل شريط الإعلانات والتيكر / Duyuruları Düzenle</h3>
              <button onClick={() => setEditingTicker(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Top Global header Announcement text */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-[#0da19a] uppercase">شريط الإعلان العلوي (في رأس الصفحة)</span>
                <input
                  type="text"
                  value={announcementTopAr}
                  onChange={e => setAnnouncementTopAr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                />
              </div>

              {/* Scrolling Announcement Marquee items list */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">عناصر الشريط المتحرك (Ticker Messages)</span>
                {tickerItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.ar}
                      onChange={e => {
                        const updated = [...tickerItems]
                        updated[idx].ar = e.target.value
                        setTickerItems(updated)
                      }}
                      placeholder="رسالة إعلانية باللغة العربية"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                    />
                    {tickerItems.length > 1 && (
                      <button
                        onClick={() => setTickerItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setTickerItems(prev => [...prev, { tr: "Yeni Duyuru", ar: "إعلان متحرك جديد" }])}
                  className="w-full py-2 bg-slate-950 border border-dashed border-slate-800 hover:border-[#0da19a] hover:text-[#0da19a] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>إضافة عنصر للشريط / Yeni Mesaj Ekle</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingTicker(false)}
                className="flex-1 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                onClick={handleSaveTicker}
                disabled={savingTicker}
                className="flex-1 py-2 bg-[#0da19a] hover:bg-[#0b807b] rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingTicker ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>حفظ التعديلات / Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. BRAND TRUST FEATURES EDIT POPUP */}
      {editingTrust && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 text-white shadow-2xl scrollbar-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-[#0da19a]">تعديل مزايا المتجر / Özellikleri Düzenle</h3>
              <button onClick={() => setEditingTrust(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {trustFeatures.map((feat, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0da19a]">الميزة {idx + 1} / Özellik #{idx + 1}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">أيقونة: {feat.icon}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">العنوان (العربية)</label>
                      <input
                        type="text"
                        value={feat.title_ar}
                        onChange={e => {
                          const updated = [...trustFeatures]
                          updated[idx].title_ar = e.target.value
                          setTrustFeatures(updated)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">الوصف (العربية)</label>
                      <input
                        type="text"
                        value={feat.desc_ar}
                        onChange={e => {
                          const updated = [...trustFeatures]
                          updated[idx].desc_ar = e.target.value
                          setTrustFeatures(updated)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none text-right dir-rtl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingTrust(false)}
                className="flex-1 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                onClick={handleSaveTrust}
                disabled={savingTrust}
                className="flex-1 py-2 bg-[#0da19a] hover:bg-[#0b807b] rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingTrust ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>حفظ التعديلات / Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. PROMOTIONAL MIDDLE BANNER EDIT POPUP */}
      {editingPromo && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-[#0da19a]">تعديل البانر الترويجي الأوسط / Banner Düzenle</h3>
              <button onClick={() => setEditingPromo(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              {/* Pre-title */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">النص العلوي الصغير (العربية)</label>
                <input
                  type="text"
                  value={promoPreAr}
                  onChange={e => setPromoPreAr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
                />
              </div>

              {/* Main Title */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">العنوان الرئيسي (العربية)</label>
                <input
                  type="text"
                  value={promoTitleAr}
                  onChange={e => setPromoTitleAr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">الوصف (العربية)</label>
                <textarea
                  rows={3}
                  value={promoDescAr}
                  onChange={e => setPromoDescAr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
                />
              </div>

              {/* Button text */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">نص الزر (العربية)</label>
                <input
                  type="text"
                  value={promoBtnAr}
                  onChange={e => setPromoBtnAr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-[#0da19a] text-right dir-rtl"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingPromo(false)}
                className="flex-1 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                onClick={handleSavePromo}
                disabled={savingPromo}
                className="flex-1 py-2 bg-[#0da19a] hover:bg-[#0b807b] rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingPromo ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>حفظ التعديلات / Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GALLERY MANAGEMENT EDIT MODAL ==================== */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">إدارة معرض "Sizden Gelenler" / Galeri Yönetimi</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">إضافة وحذف صور المعرض المتحرك في الصفحة الرئيسية</p>
              </div>
              <button 
                onClick={() => setGalleryModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              
              {/* Image upload row */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">تحميل صورة جديدة / Yeni Görsel Yükle</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="gallery-file-input"
                      onChange={handleGalleryUpload}
                      disabled={galleryUploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="gallery-file-input"
                      className="w-full h-10 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {galleryUploading ? (
                        <>
                          <Loader2 className="animate-spin text-[#0da19a]" size={14} />
                          <span>جاري الرفع... / Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} className="text-[#0da19a]" />
                          <span>اختر ملف من جهازك / Dosya Seç</span>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="flex gap-2 items-center flex-1">
                    <input
                      type="text"
                      placeholder="أو ضع رابط الصورة هنا / Veya URL yapıştır"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      className="flex-1 h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#0da19a]"
                    />
                    <button
                      onClick={() => {
                        if (!newImageUrl.trim()) return
                        setGallery(prev => [...prev, newImageUrl.trim()])
                        setNewImageUrl('')
                      }}
                      className="h-10 px-4 bg-[#0da19a] hover:bg-[#0b807b] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of active gallery images */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">الصور المفعلة حالياً ({gallery.length})</p>
                {gallery.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center bg-slate-950 rounded-2xl border border-slate-850">
                    لا توجد صور مضافة حالياً. سيتم عرض الصور الافتراضية.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 shadow-md"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذه الصورة من المعرض؟')) {
                                setGallery(prev => prev.filter((_, i) => i !== idx))
                              }
                            }}
                            className="p-2 bg-red-650/20 hover:bg-red-600/40 text-red-400 border border-red-500/20 rounded-xl cursor-pointer transition-colors"
                            title="حذف الصورة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
              <button
                onClick={() => setGalleryModalOpen(false)}
                className="flex-1 h-11 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                onClick={handleGallerySave}
                disabled={savingGalleryState}
                className="flex-1 h-11 bg-[#0da19a] hover:bg-[#0b807b] rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#0da19a]/10"
              >
                {savingGalleryState ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                <span>حفظ التعديلات / Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
