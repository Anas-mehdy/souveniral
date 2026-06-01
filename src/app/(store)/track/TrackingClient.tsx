'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'
import { ShoppingBag, Phone, Clipboard, CheckCircle, Package, Truck, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TrackedOrder {
  id: string
  order_code: string
  email: string
  first_name: string
  last_name: string
  country: string
  address: string
  district: string
  city: string
  phone: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  grand_total: number
  shipping_cost: number
  discount: number
  created_at: string
  tracking_url?: string | null
  items: Array<{
    id: string
    name_ar: string
    name_tr: string
    price: number
    quantity: number
    brand: string
    model: string
    custom_text?: string | null
    custom_image?: string | null
  }>
}

export default function TrackingClient() {
  const { locale } = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [orderCode, setOrderCode] = useState(searchParams.get('code') || '')
  const [phone, setPhone] = useState(searchParams.get('phone') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<TrackedOrder | null>(null)

  // Labels structure for AR & TR
  const t = {
    ar: {
      title: 'تتبع حالة طلبك',
      subtitle: 'أدخل رقم الطلب ورقم الهاتف للاطلاع على تفاصيل وحالة الشحنة مباشرة',
      orderCode: 'رقم الطلب',
      orderCodePlaceholder: 'مثال: KA-123456',
      phone: 'رقم الهاتف',
      phonePlaceholder: 'مثال: 05555555555',
      button: 'تتبع الطلب الآن',
      tracking: 'جاري البحث عن الطلب...',
      notFound: 'لم يتم العثور على أي طلب بهذه التفاصيل. يرجى التأكد من رقم الطلب ورقم الهاتف.',
      detailsTitle: 'تفاصيل الطلب',
      statusTitle: 'حالة الطلب الحالية',
      itemsTitle: 'المنتجات المطلوبة',
      total: 'المجموع الكلي',
      shipping: 'تكلفة الشحن (PTT Kargo)',
      discount: 'خصم العرض (3 Al 2 Öde)',
      codPayment: 'طريقة الدفع: الدفع عند الاستلام (Kapıda Ödeme)',
      shippingTo: 'عنوان الشحن',
      backHome: 'العودة للرئيسية',
      date: 'تاريخ الطلب',
      stepPending: 'تم الاستلام',
      stepPendingDesc: 'تم استلام طلبك بنجاح وهو الآن قيد المراجعة.',
      stepProcessing: 'جاري التجهيز',
      stepProcessingDesc: 'طلبك قيد التصميم والطباعة المخصصة الآن.',
      stepCompleted: 'تم الشحن',
      stepCompletedDesc: 'تم شحن طلبك عبر شركة PTT Kargo وهو في الطريق إليك.',
      stepCancelled: 'تم إلغاء الطلب',
      stepCancelledDesc: 'تم إلغاء هذا الطلب. يرجى التواصل مع الدعم الفني للاستفسار.',
      customText: 'النص المطلوب',
      customImage: 'الصورة المرفوعة'
    },
    tr: {
      title: 'Sipariş Takibi',
      subtitle: 'Siparişinizin durumunu öğrenmek için lütfen sipariş kodunu ve telefon numaranızı girin.',
      orderCode: 'Sipariş Kodu',
      orderCodePlaceholder: 'Örn: KA-123456',
      phone: 'Telefon Numarası',
      phonePlaceholder: 'Örn: 05555555555',
      button: 'Siparişi Sorgula',
      tracking: 'Sipariş sorgulanıyor...',
      notFound: 'Bu bilgilere ait sipariş bulunamadı. Lütfen bilgilerinizi kontrol edin.',
      detailsTitle: 'Sipariş Detayları',
      statusTitle: 'Mevcut Sipariş Durumu',
      itemsTitle: 'Sipariş Edilen Ürünler',
      total: 'Toplam Tutar',
      shipping: 'Kargo Ücreti (PTT Kargo)',
      discount: 'İndirim (3 Al 2 Öde)',
      codPayment: 'Ödeme Türü: Kapıda Nakit Ödeme',
      shippingTo: 'Teslimat Adresi',
      backHome: 'Ana Sayfaya Dön',
      date: 'Sipariş Tarihi',
      stepPending: 'Sipariş Alındı',
      stepPendingDesc: 'Siparişiniz başarıyla alındı ve kontrol ediliyor.',
      stepProcessing: 'Hazırlanıyor',
      stepProcessingDesc: 'Kılıfınız özel olarak basılıyor ve hazırlanıyor.',
      stepCompleted: 'Kargolandı',
      stepCompletedDesc: 'Siparişiniz PTT Kargo ile yola çıktı.',
      stepCancelled: 'İptal Edildi',
      stepCancelledDesc: 'Bu sipariş iptal edilmiştir. Sorularınız için iletişime geçin.',
      customText: 'Yazılacak Yazı',
      customImage: 'Yüklenen Görsel'
    }
  }[locale]

  // Automatically track if parameters are in the URL
  useEffect(() => {
    const codeParam = searchParams.get('code')
    const phoneParam = searchParams.get('phone')
    if (codeParam && phoneParam) {
      handleTrack(codeParam, phoneParam)
    }
  }, [searchParams])

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderCode.trim() || !phone.trim()) return

    // Update URL params
    const params = new URLSearchParams()
    params.set('code', orderCode.trim())
    params.set('phone', phone.trim())
    router.replace(`/track?${params.toString()}`)

    handleTrack(orderCode, phone)
  }

  const handleTrack = async (codeVal: string, phoneVal: string) => {
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/track?code=${encodeURIComponent(codeVal.trim())}&phone=${encodeURIComponent(phoneVal.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.notFound)
      } else {
        setOrder(data)
      }
    } catch (err) {
      setError(t.notFound)
    } finally {
      setLoading(false)
    }
  }

  // Determine current step index for the visual stepper
  const getStepIndex = (status: TrackedOrder['status']) => {
    if (status === 'pending') return 0
    if (status === 'processing') return 1
    if (status === 'shipped' || status === 'completed') return 2
    return -1
  }

  const stepIndex = order ? getStepIndex(order.status) : -1

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Intro */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Search Input Card */}
        <div className="bg-white/85 backdrop-blur-xl border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
          <form onSubmit={handleTrackSubmit} className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                {t.orderCode}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                  <Clipboard size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t.orderCodePlaceholder}
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 focus:border-[#0da19a] focus:ring-2 focus:ring-[#0da19a]/20 rounded-2xl py-3.5 ps-10 pe-4 text-sm font-bold text-gray-800 outline-none transition-all placeholder:text-gray-400 uppercase"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                {t.phone}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 focus:border-[#0da19a] focus:ring-2 focus:ring-[#0da19a]/20 rounded-2xl py-3.5 ps-10 pe-4 text-sm font-bold text-gray-800 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-[#0da19a] hover:bg-[#0bc1b9] disabled:bg-gray-400 text-white font-extrabold text-sm py-4 px-8 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer select-none"
            >
              {loading ? t.tracking : t.button}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-3">
              <XCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Result Card */}
        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-350">
            
            {/* Stepper Status Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xl">
              <h2 className="text-lg font-black text-gray-900 border-b pb-4 mb-6">
                {t.statusTitle}
              </h2>

              {order.status === 'cancelled' ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-red-800 mb-1">{t.stepCancelled}</h3>
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{t.stepCancelledDesc}</p>
                  </div>
                </div>
              ) : (
                /* Stepper Visual Timeline */
                <div className="relative">
                  {/* Stepper Progress Bar Background */}
                  <div className="absolute top-6 start-6 end-6 h-0.5 bg-gray-200 -z-0 hidden md:block" />
                  
                  {/* Stepper Progress Bar Active Fill */}
                  <div 
                    className="absolute top-6 start-6 h-0.5 bg-[#0da19a] -z-0 transition-all duration-500 hidden md:block"
                    style={{
                      width: stepIndex === 0 ? '0%' : stepIndex === 1 ? '50%' : '100%'
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    
                    {/* Step 1: Received */}
                    <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all ${
                        stepIndex >= 0 ? 'bg-[#0da19a]' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-800">{t.stepPending}</h4>
                        <p className="text-xs text-gray-400 font-semibold mt-1 hidden md:block max-w-[180px] mx-auto">
                          {t.stepPendingDesc}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Processing */}
                    <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all ${
                        stepIndex >= 1 ? 'bg-[#0da19a]' : stepIndex === 0 ? 'bg-[#0da19a]/20 text-[#0da19a]' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-800">{t.stepProcessing}</h4>
                        <p className="text-xs text-gray-400 font-semibold mt-1 hidden md:block max-w-[180px] mx-auto">
                          {t.stepProcessingDesc}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Shipped */}
                    <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all ${
                        stepIndex >= 2 ? 'bg-[#0da19a]' : stepIndex >= 0 ? 'bg-gray-150 text-gray-400' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-800">{t.stepCompleted}</h4>
                        <p className="text-xs text-gray-400 font-semibold mt-1 hidden md:block max-w-[180px] mx-auto">
                          {t.stepCompletedDesc}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {order.tracking_url && (
                <div className="mt-8 p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-850">
                        {locale === 'ar' ? 'تم شحن طلبك بنجاح!' : 'Siparişiniz kargoya verildi!'}
                      </h4>
                      <p className="text-[11px] text-emerald-650 font-semibold mt-0.5">
                        {locale === 'ar' ? 'انقر على الرابط التالي لمتابعة مسار الشحنة مباشرة.' : 'Kargo hareketlerini takip etmek için aşağıdaki linke tıklayın.'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer select-none"
                  >
                    <Truck size={14} />
                    <span>{locale === 'ar' ? 'رابط تعقب الطلب' : 'Sipariş Takip Linki'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Order Details & Summary Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              
              {/* Meta Info Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{t.detailsTitle}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                    {order.order_code}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-500 block">{t.date}</span>
                  <span className="text-xs font-black text-gray-700">
                    {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {t.shippingTo}
                </h4>
                <p className="text-sm font-bold text-gray-800">
                  {order.first_name} {order.last_name}
                </p>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  {order.address}, {order.district}, {order.city}
                </p>
                <p className="text-xs text-gray-500 font-semibold mt-1" style={{ direction: 'ltr', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  {order.phone}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {t.itemsTitle}
                </h4>
                
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-4 flex gap-4 items-start">
                      {/* Placeholder Case Icon */}
                      <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
                        {item.custom_image ? (
                          <img 
                            src={item.custom_image} 
                            alt="POD preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="text-gray-400" size={24} />
                        )}
                      </div>

                      <div className="flex-1">
                        <h5 className="text-sm font-extrabold text-gray-800">
                          {locale === 'ar' ? item.name_ar : item.name_tr}
                        </h5>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          {item.brand} - {item.model}
                        </p>
                        
                        {/* Custom POD specs display */}
                        {item.custom_text && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#0da19a]/5 border border-[#0da19a]/10 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0da19a]">
                            <span>{t.customText}:</span>
                            <span className="italic">"{item.custom_text}"</span>
                          </div>
                        )}
                        {item.custom_image && !item.custom_text && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#0da19a]/5 border border-[#0da19a]/10 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0da19a]">
                            <span>{t.customImage}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400 font-bold">{item.quantity} x</p>
                        <p className="text-sm font-extrabold text-gray-850 mt-0.5">
                          {(item.price * item.quantity).toFixed(2)} TL
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Totals breakdown */}
              <div className="border-t pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Ara Toplam'}</span>
                  <span>{(order.grand_total - order.shipping_cost + order.discount).toFixed(2)} TL</span>
                </div>
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-red-500">
                    <span>{t.discount}</span>
                    <span>-{order.discount.toFixed(2)} TL</span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{t.shipping}</span>
                  <span>{order.shipping_cost.toFixed(2)} TL</span>
                </div>

                <div className="flex justify-between text-base font-black text-gray-900 border-t border-dashed pt-3">
                  <span>{t.total}</span>
                  <span>{order.grand_total.toFixed(2)} TL</span>
                </div>
              </div>

              {/* Payment notification */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-150 rounded-2xl text-[11px] font-extrabold text-emerald-800 text-center">
                {t.codPayment}
              </div>

            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0da19a] hover:text-[#0bc1b9] transition-colors select-none">
            {locale === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span>{t.backHome}</span>
            {locale === 'ar' ? null : <ChevronRight size={16} />}
          </Link>
        </div>

      </div>
    </div>
  )
}
