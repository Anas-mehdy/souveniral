'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useCart } from './CartProvider'
import { useLocale } from './LocaleProvider'
import { formatPrice } from '@/lib/utils'
import { X, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const checkoutTranslations = {
  ar: {
    contact: 'الاتصال',
    email: 'البريد الإلكتروني',
    emailMarketing: 'أرسل لي الأخبار والعروض عبر البريد الإلكتروني',
    delivery: 'التوصيل',
    country: 'الدولة / المنطقة',
    firstName: 'الاسم الأول',
    lastName: 'الكنية (الاسم الأخير)',
    address: 'العنوان بالتفصيل (الحي، الشارع، البناء، رقم الشقة)',
    district: 'المنطقة / الحي',
    postalCode: 'الرمز البريدي (اختياري)',
    city: 'المدينة / المحافظة',
    phone: 'رقم الهاتف (يفضل تركي أو واتساب)',
    saveInfo: 'حفظ هذه المعلومات للمرة القادمة',
    shippingMethod: 'طريقة الشحن',
    codShipping: 'الدفع عند الاستلام (نقدًا) - كارجو PTT',
    shippingTime: 'من 3 إلى 4 أيام عمل',
    payment: 'الدفع',
    secureNotes: 'جميع المعاملات آمنة ومشفرة.',
    codPayment: 'الدفع عند الاستلام (نقداً)',
    codDesc: 'ستقوم بدفع قيمة الطلب نقدًا عند استلامه من موظف شركة PTT.',
    billingAddress: 'عنوان الفاتورة',
    billingSame: 'نفس عنوان الشحن',
    billingDifferent: 'استخدام عنوان فاتورة مختلف',
    discountPlaceholder: 'رمز الخصم',
    apply: 'تطبيق',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    total: 'المجموع النهائي',
    payNow: 'أكمل الطلب الآن 🚀',
    codNote: 'الدفع عند الاستلام نقداً بواسطة PTT',
    backToCart: 'العودة للسلة',
    freeShipping: 'مجاني',
    successTitle: 'تم استلام طلبك بنجاح!',
    successDesc: 'شكراً لتسوقك معنا! سنقوم بتجهيز وشحن كفرات الهاتف الخاصة بك خلال 24 ساعة وسيتواصل معك مندوب شركة PTT.',
    orderCode: 'رمز الطلب الخاص بك',
    continueShopping: 'العودة للتسوق',
    processing: 'جاري تسجيل طلبك...',
  },
  tr: {
    contact: 'İletişim',
    email: 'E-posta',
    emailMarketing: 'Haberler ve teklifler hakkında bana e-posta gönder',
    delivery: 'Teslimat',
    country: 'Ülke/Bölge',
    firstName: 'Ad',
    lastName: 'Soyad',
    address: 'Adres',
    district: 'İlçe',
    postalCode: 'Posta kodu (isteğe bağlı)',
    city: 'İl',
    phone: 'Telefon',
    saveInfo: 'Bir sonraki işlem için bu bilgileri kaydet',
    shippingMethod: 'Kargo yöntemi',
    codShipping: 'Kapıda Öde (NAKİT) - PTT Kargo',
    shippingTime: '3 ila 4 iş günü',
    payment: 'Ödeme',
    secureNotes: 'Tüm işlemler güvenli ve şifrelidir.',
    codPayment: 'Kapıda Ödeme (NAKİT)',
    codDesc: 'Siparişinizi teslim alırken kargo görevlisine nakit olarak ödeme yapabilirsiniz.',
    billingAddress: 'Fatura adresi',
    billingSame: 'Kargo adresiyle aynı',
    billingDifferent: 'Farklı bir fatura adresi kullan',
    discountPlaceholder: 'İndirim kodu',
    apply: 'Uygula',
    subtotal: 'Alt toplam',
    shipping: 'Kargo',
    total: 'Toplam',
    payNow: 'SİPARİŞİ OLUŞTUR 🚀',
    codNote: 'PTT Kargo ile Kapıda Nakit Ödeme',
    backToCart: 'Sepete Dön',
    freeShipping: 'Ücretsiz',
    successTitle: 'Siparişiniz Başarıyla Alındı!',
    successDesc: 'Bizi tercih ettiğiniz için teşekkür ederiz! Kılıflarınız 24 saat içinde PTT Kargo ile gönderilecek ve kurye sizinle iletişime geçecektir.',
    orderCode: 'Sipariş Kodunuz',
    continueShopping: 'Alışverişe Devam Et',
    processing: 'Siparişiniz Alınıyor...',
  }
}

export function CheckoutDrawer({ open, onClose }: Props) {
  const { cartItems, totalPrice, totalItems, clearCart, setCartOpen, discount } = useCart()
  const { locale } = useLocale()
  const t = checkoutTranslations[locale === 'ar' ? 'ar' : 'tr']
  const [loading, setLoading] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [orderCode, setOrderCode] = useState('')

  // Form Fields
  const [email, setEmail] = useState('')
  const [emailMarketing, setEmailMarketing] = useState(true)
  const [country, setCountry] = useState('Türkiye')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [saveInfo, setSaveInfo] = useState(true)
  const [billingSame, setBillingSame] = useState(true)


  // Free shipping for 2+ items
  const shippingCost = totalItems >= 2 ? 0 : 90
  const isFreeShipping = shippingCost === 0
  const grandTotal = totalPrice - discount + shippingCost

  if (!open) return null

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      country,
      address,
      district,
      postal_code: postalCode || null,
      city,
      phone,
      shipping_cost: shippingCost,
      discount,
      total_price: totalPrice,
      grand_total: grandTotal,
      items: cartItems
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const order = await res.json()
        setOrderCode(order.order_code)
        setOrderCompleted(true)
        clearCart()
      } else {
        const err = await res.json()
        alert(locale === 'ar' ? 'فشل تسجيل الطلب: ' + (err.error || '') : 'Sipariş oluşturulamadı: ' + (err.error || ''))
      }
    } catch (err) {
      alert(locale === 'ar' ? 'خطأ في الشبكة' : 'Ağ hatası oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    setOrderCompleted(false)
    setEmail('')
    setFirstName('')
    setLastName('')
    setAddress('')
    setDistrict('')
    setPostalCode('')
    setCity('')
    setPhone('')
    onClose()
    setCartOpen(false) // Close the cart sidebar completely!
  }

  const BackIcon = locale === 'ar' ? ChevronRight : ChevronLeft

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white font-sans flex flex-col animate-in fade-in duration-300">
      
      {/* Top Brand & Return bar */}
      <header className="border-b border-gray-150 py-4 px-6 md:px-12 bg-white flex items-center justify-between flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-gray-500 font-bold hover:text-black transition-colors cursor-pointer"
        >
          <BackIcon size={14} />
          {t.backToCart}
        </button>
        <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent select-none tracking-wider">
          SouvenirAl
        </span>
        <div className="w-16"></div> {/* Spacer */}
      </header>

      {/* Main Two-Column Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Order success state wrapper */}
        {orderCompleted ? (
          <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-8 space-y-6 bg-[#fbfbfb]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h4 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-1.5">
                {t.successTitle}
                <Sparkles className="text-amber-500" size={18} />
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                {t.successDesc}
              </p>
            </div>

            {/* Order Code Container */}
            <div className="p-5 bg-white border border-dashed border-gray-250 rounded-2xl w-full max-w-xs shadow-xs">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                {t.orderCode}
              </p>
              <p className="text-xl font-black text-gray-900 font-mono mt-1 tracking-wider">{orderCode}</p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full max-w-xs py-3.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-xs"
            >
              {t.continueShopping}
            </button>
          </div>
        ) : (
          <>
            {/* Left Side: Shopify-Style Checkout Form */}
            <div className="w-full md:w-7/12 bg-white px-6 py-8 md:py-12 md:pl-16 md:pr-24 border-r border-gray-150/70 overflow-y-auto">
              <form onSubmit={handleOrderSubmit} className="space-y-8 max-w-xl ml-auto">
                
                {/* 1. İletişim (Contact) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-900">{t.contact}</h3>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      id="emailInput"
                    />
                    <label
                      htmlFor="emailInput"
                      className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                    >
                      {t.email}
                    </label>
                  </div>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emailMarketing}
                      onChange={e => setEmailMarketing(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5"
                    />
                    <span className="text-[10px] text-gray-500 font-bold leading-normal">
                      {t.emailMarketing}
                    </span>
                  </label>
                </div>

                {/* 2. Teslimat (Delivery Address) */}
                <div className="space-y-3.5">
                  <h3 className="text-base font-black text-gray-900">{t.delivery}</h3>
                  
                  {/* Country Selection */}
                  <div className="relative">
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white appearance-none"
                      id="countrySelect"
                    >
                      <option value="Türkiye">Türkiye</option>
                    </select>
                    <label
                      htmlFor="countrySelect"
                      className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all select-none pointer-events-none"
                    >
                      {t.country}
                    </label>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs font-black">▼</div>
                  </div>

                  {/* Ad & Soyad */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                        id="firstNameInput"
                      />
                      <label
                        htmlFor="firstNameInput"
                        className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                      >
                        {t.firstName}
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                        id="lastNameInput"
                      />
                      <label
                        htmlFor="lastNameInput"
                        className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                      >
                        {t.lastName}
                      </label>
                    </div>
                  </div>

                  {/* Adres */}
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      id="addressInput"
                    />
                    <label
                      htmlFor="addressInput"
                      className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                    >
                      {t.address}
                    </label>
                  </div>

                  {/* İlçe */}
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      id="districtInput"
                    />
                    <label
                      htmlFor="districtInput"
                      className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                    >
                      {t.district}
                    </label>
                  </div>

                  {/* Posta Kodu & İl */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                        id="postalInput"
                      />
                      <label
                        htmlFor="postalInput"
                        className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                      >
                        {t.postalCode}
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-3 pt-5 pb-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                        id="cityInput"
                      />
                      <label
                        htmlFor="cityInput"
                        className="absolute left-3 top-1 text-[10px] text-gray-400 font-bold uppercase transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-indigo-600 select-none pointer-events-none"
                      >
                        {t.city}
                      </label>
                    </div>
                  </div>

                  {/* Telefon */}
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="0535 124 57 89"
                      className="w-full pl-16 pr-3 py-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white text-left font-mono"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none select-none">
                      <span className="text-base">🇹🇷</span>
                      <span className="text-[10px] font-bold text-gray-400">+90</span>
                    </div>
                  </div>

                  {/* Save info checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={e => setSaveInfo(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5"
                    />
                    <span className="text-[10px] text-gray-500 font-bold leading-normal">
                      {t.saveInfo}
                    </span>
                  </label>
                </div>

                {/* 3. Kargo yöntemi (Shipping Option - PTT COD Only) */}
                <div className="space-y-3">
                  <h3 className="text-base font-black text-gray-900">{t.shippingMethod}</h3>
                  <div className="border border-indigo-600 bg-indigo-50/5 p-4 rounded-xl flex items-center justify-between relative cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-4 border-indigo-600 flex items-center justify-center flex-shrink-0 bg-white"></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{t.codShipping}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{t.shippingTime}</p>
                        {isFreeShipping && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            🎉 {locale === 'ar' ? 'الشحن مجاني عند طلب 2 أو أكثر!' : '2 ve üzeri siparişte kargo bedava!'}
                          </p>
                        )}
                      </div>
                    </div>
                    {isFreeShipping ? (
                      <span className="text-xs font-black text-emerald-600">
                        {locale === 'ar' ? 'مجاني' : 'Ücretsiz'}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-gray-900">{formatPrice(shippingCost, locale)}</span>
                    )}
                  </div>
                </div>

                {/* 4. Ödeme (Payment Option - COD Only) */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-black text-gray-900">{t.payment}</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      {t.secureNotes}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50/20 p-4 flex items-center justify-between cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-4 border-indigo-600 flex items-center justify-center flex-shrink-0 bg-white"></div>
                        <span className="text-xs font-bold text-gray-900">{t.codPayment}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">COD</span>
                    </div>
                    <div className="p-4 bg-gray-50/40 border-t border-gray-200/60">
                      <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                        {t.codDesc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Fatura adresi (Billing Address Option) */}
                <div className="space-y-3">
                  <h3 className="text-base font-black text-gray-900">{t.billingAddress}</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {/* Option 1: Same */}
                    <label
                      onClick={() => setBillingSame(true)}
                      className={`flex items-center gap-3 p-4 cursor-pointer select-none transition-colors border-b border-gray-200/60 ${billingSame ? 'bg-indigo-50/5' : 'hover:bg-gray-50/40'}`}
                    >
                      <input
                        type="radio"
                        checked={billingSame}
                        onChange={() => setBillingSame(true)}
                        className="text-indigo-650 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-bold text-gray-800">{t.billingSame}</span>
                    </label>

                    {/* Option 2: Different */}
                    <label
                      onClick={() => setBillingSame(false)}
                      className={`flex items-center gap-3 p-4 cursor-pointer select-none transition-colors ${!billingSame ? 'bg-indigo-50/5' : 'hover:bg-gray-50/40'}`}
                    >
                      <input
                        type="radio"
                        checked={!billingSame}
                        onChange={() => setBillingSame(false)}
                        className="text-indigo-650 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-bold text-gray-800">{t.billingDifferent}</span>
                    </label>
                  </div>
                </div>

                {/* Submit Toolbar */}
                <div className="pt-4 border-t border-gray-150 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <span className="text-xs text-gray-400 font-semibold text-center sm:text-left">
                    {t.codNote}
                  </span>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-10 py-3.5 bg-black hover:bg-gray-800 disabled:bg-gray-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>{t.processing}</span>
                      </>
                    ) : (
                      <span>{t.payNow}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side: Shopify-Style Order Summary */}
            <div className="w-full md:w-5/12 bg-gray-50/60 px-6 py-8 md:py-12 md:pr-16 md:pl-24 flex flex-col justify-start">
              <div className="max-w-md w-full mr-auto space-y-6">
                
                {/* Cart Items listing */}
                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.brand}-${item.model}-${idx}`} className="flex items-center gap-4 py-2 border-b border-gray-200/40 last:border-0 relative">
                      
                      {/* Image Thumbnail with Qty Badge */}
                      <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                        {item.image ? (
                          <Image src={item.image} alt={item.name_tr} fill className="object-cover" />
                        ) : (
                          <span className="text-xl">📱</span>
                        )}
                        
                        {/* Shopify-style absolute quantity badge */}
                        <span className="absolute -top-1.5 -right-1.5 bg-neutral-500/90 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md select-none">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-800 truncate">
                          {locale === 'ar' ? item.name_ar : item.name_tr}
                        </h4>
                        <p className="text-[10px] font-bold text-indigo-600 mt-0.5">
                          {item.brand} {item.model}
                        </p>
                        
                        {/* Custom PO Details */}
                        {item.custom_type === 'text' && item.custom_text && (
                          <p className="text-[9px] text-gray-500 font-semibold mt-1">
                            ✏️ <span className="text-gray-700">{item.custom_text}</span>
                          </p>
                        )}
                        {(item.custom_type === 'image' || item.custom_type === 'image_only') && item.custom_image && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-indigo-650 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.2 font-bold select-none">
                              🖼️ Görsel
                            </span>
                            {item.custom_details && (
                              <span className="text-[8px] text-gray-400 italic truncate max-w-[120px]">
                                {item.custom_details}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Multiple Custom Fields Values rendering */}
                        {item.custom_fields_values && Object.keys(item.custom_fields_values).length > 0 && (
                          <div className="text-[9px] text-gray-500 mt-1 space-y-0.5 bg-gray-50 p-1.5 rounded-lg border border-gray-150/40 text-start">
                            {Object.entries(item.custom_fields_values).map(([label, value]) => {
                              const displayLabel = label.includes('|')
                                ? (locale === 'ar' ? label.split('|')[1].trim() : label.split('|')[0].trim())
                                : label
                              return (
                                <div key={label} className="flex flex-wrap gap-1 leading-tight">
                                  <span className="font-semibold text-gray-500">{displayLabel}:</span>
                                  {value.startsWith('http') ? (
                                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#0da19a] hover:underline flex items-center gap-0.5 font-bold">
                                      <span>{locale === 'ar' ? 'عرض الصورة 🖼️' : 'Görseli Gör 🖼️'}</span>
                                    </a>
                                  ) : (
                                    <span className="font-bold text-gray-700">{value}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <span className="text-xs font-black text-gray-900 flex-shrink-0">
                        {formatPrice(item.price * item.quantity, locale)}
                      </span>
                    </div>
                  ))}
                </div>



                 {/* Pricing Summary Breakdown */}
                <div className="pt-4 border-t border-gray-200/60 space-y-2.5">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>{t.subtotal}</span>
                    <span className="text-gray-800 font-bold">{formatPrice(totalPrice, locale)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-rose-650 text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-lg">
                      <span>🎉 {locale === 'ar' ? 'عرض 3 بسعر 2' : '3 Al 2 Öde İndirimi'}</span>
                      <span className="font-bold">-{formatPrice(discount, locale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>{t.shipping}</span>
                    {isFreeShipping ? (
                      <span className="text-emerald-600 font-bold">
                        🚀 {locale === 'ar' ? 'مجاني' : 'Ücretsiz'}
                      </span>
                    ) : (
                      <span className="text-gray-800 font-bold">{formatPrice(shippingCost, locale)}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-200/80">
                    <span>{t.total}</span>
                    <span className="text-lg text-black">{formatPrice(grandTotal, locale)}</span>
                  </div>
                </div>
                
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
