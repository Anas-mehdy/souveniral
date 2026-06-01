'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'
import { User, Mail, Phone, Lock, Calendar, ShoppingBag, Eye, LogOut, Package, Clipboard, ChevronLeft, ChevronRight, X, Truck } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  created_at: string
}

interface OrderItem {
  id: string
  name_ar: string
  name_tr: string
  price: number
  quantity: number
  brand: string
  model: string
  custom_text?: string | null
  custom_image?: string | null
}

interface CustomerOrder {
  id: string
  order_code: string
  email: string
  first_name: string
  last_name: string
  address: string
  district: string
  city: string
  phone: string
  shipping_cost: number
  discount: number
  total_price: number
  grand_total: number
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  payment_method: 'cod'
  items: OrderItem[]
  created_at: string
  tracking_url?: string | null
}

interface AccountClientProps {
  customer: Customer | null
  initialOrders: CustomerOrder[]
}

export default function AccountClient({ customer, initialOrders }: AccountClientProps) {
  const { locale } = useLocale()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  // Translations for Portal
  const t = {
    ar: {
      loginTitle: 'تسجيل الدخول لحسابي',
      loginSubtitle: 'أدخل البريد الإلكتروني ورقم الهاتف المستخدمين في طلبك للوصول إلى تفاصيل طلباتك تلقائياً',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'example@mail.com',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '05555555555',
      loginBtn: 'دخول سريع',
      loginBtnActive: 'جاري التحقق...',
      welcome: 'أهلاً بك',
      profileTitle: 'بيانات الحساب الشخصية',
      logoutBtn: 'تسجيل الخروج',
      ordersTitle: 'طلباتي',
      noOrders: 'ليس لديك أي طلبات سابقة حتى الآن.',
      shopNow: 'تصفح كفرات الهواتف الآن',
      orderCode: 'رقم الطلب',
      date: 'التاريخ',
      total: 'المجموع الكلي',
      status: 'حالة الطلب',
      viewDetails: 'تفاصيل الطلب',
      trackOrder: 'صفحة التتبع العامة',
      statusPending: 'تم الاستلام',
      statusProcessing: 'جاري التجهيز',
      statusCompleted: 'تم الشحن',
      statusCancelled: 'ملغي',
      close: 'إغلاق',
      shippingAddress: 'عنوان التوصيل',
      paymentMethod: 'طريقة الدفع',
      paymentCOD: 'الدفع عند الاستلام (Kapıda Ödeme)',
      priceSummary: 'خلاصة الحساب',
      subtotal: 'المجموع الفرعي',
      shipping: 'تكلفة الشحن (PTT)',
      discount: 'الخصم (3 Al 2 Öde)',
      customText: 'النص المطلوب',
      customImage: 'الصورة المرفوعة'
    },
    tr: {
      loginTitle: 'Hesabıma Giriş Yap',
      loginSubtitle: 'Siparişlerinizin durumunu ve geçmişini görmek için sipariş esnasında verdiğiniz e-posta ve telefon numarasını girin.',
      emailLabel: 'E-posta Adresi',
      emailPlaceholder: 'ornek@mail.com',
      phoneLabel: 'Telefon Numarası',
      phonePlaceholder: '05555555555',
      loginBtn: 'Giriş Yap',
      loginBtnActive: 'Giriş yapılıyor...',
      welcome: 'Hoş Geldiniz',
      profileTitle: 'Hesap Bilgileri',
      logoutBtn: 'Çıkış Yap',
      ordersTitle: 'Siparişlerim',
      noOrders: 'Henüz kayıtlı bir siparişiniz bulunmamaktadır.',
      shopNow: 'Ürünleri İncele',
      orderCode: 'Sipariş Kodu',
      date: 'Tarih',
      total: 'Toplam Tutar',
      status: 'Durum',
      viewDetails: 'Detaylar',
      trackOrder: 'Genel Takip Sayfası',
      statusPending: 'Sipariş Alındı',
      statusProcessing: 'Hazırlanıyor',
      statusCompleted: 'Kargolandı',
      statusCancelled: 'İptal Edildi',
      close: 'Kapat',
      shippingAddress: 'Teslimat Adresi',
      paymentMethod: 'Ödeme Türü',
      paymentCOD: 'Kapıda Nakit Ödeme',
      priceSummary: 'Fiyat Özeti',
      subtotal: 'Ara Toplam',
      shipping: 'Kargo Ücreti (PTT)',
      discount: 'İndirim (3 Al 2 Öde)',
      customText: 'Yazılacak Yazı',
      customImage: 'Yüklenen Görsel'
    }
  }[locale]

  // Handle passwordless login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !phone.trim()) return

    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() })
      })
      const data = await res.json()

      if (!res.ok) {
        setLoginError(locale === 'ar' 
          ? 'لم نجد أي حساب مسجل بهذه البيانات. يرجى التأكد من البريد والهاتف الصحيحين للطلب.' 
          : 'Bu bilgilerle eşleşen bir müşteri kaydı bulunamadı. Lütfen e-posta ve telefonunuzu kontrol edin.'
        )
      } else {
        // Trigger server refresh and get customer session state
        router.refresh()
      }
    } catch (err) {
      setLoginError(locale === 'ar' ? 'حدث خطأ في الشبكة، يرجى المحاولة لاحقاً.' : 'Bir ağ hatası oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle customer logout
  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await fetch('/api/account/logout', { method: 'POST' })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLogoutLoading(false)
    }
  }

  const getStatusBadge = (status: CustomerOrder['status']) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: t.statusPending },
      processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: t.statusProcessing },
      shipped: { color: 'bg-emerald-100 text-emerald-800 border-emerald-250', label: t.statusCompleted },
      completed: { color: 'bg-emerald-100 text-emerald-800 border-emerald-250', label: t.statusCompleted },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', label: t.statusCancelled }
    }[status]

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  // 1. Render Login Form if Customer is Guest (not logged in)
  if (!customer) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white/85 backdrop-blur-xl border border-gray-150 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0da19a]/10 text-[#0da19a] flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {t.loginTitle}
            </h2>
            <p className="text-xs font-semibold text-gray-400 mt-2 leading-relaxed">
              {t.loginSubtitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                {t.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 focus:border-[#0da19a] focus:ring-2 focus:ring-[#0da19a]/20 rounded-2xl py-3.5 ps-10 pe-4 text-sm font-bold text-gray-800 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                {t.phoneLabel}
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

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-[11px] font-bold text-red-650">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#0da19a] hover:bg-[#0bc1b9] disabled:bg-gray-400 text-white font-extrabold text-sm py-4 px-6 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer select-none"
            >
              {loginLoading ? t.loginBtnActive : t.loginBtn}
            </button>
          </form>

        </div>
      </div>
    )
  }

  // 2. Render Main Account Portal Dashboard
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Dashboard Header */}
        <div className="bg-linear-to-r from-gray-900 to-gray-850 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl text-white flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0da19a]/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#0da19a] text-2xl shadow-inner font-extrabold">
              {customer.first_name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{t.welcome}، {customer.first_name} 👋</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{customer.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="relative z-10 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-97 text-xs font-bold text-white px-5 py-3 rounded-xl border border-white/15 transition-all cursor-pointer select-none"
          >
            <LogOut size={16} />
            <span>{logoutLoading ? '...' : t.logoutBtn}</span>
          </button>
        </div>

        {/* Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Account Details */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-black text-gray-900 border-b pb-3 flex items-center gap-2">
              <User size={18} className="text-[#0da19a]" />
              <span>{t.profileTitle}</span>
            </h3>

            <div className="space-y-4 text-sm font-bold text-gray-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t.welcome}</span>
                <p className="text-gray-700 bg-gray-50 border rounded-xl p-2.5">{customer.first_name} {customer.last_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t.emailLabel}</span>
                <p className="text-gray-700 bg-gray-50 border rounded-xl p-2.5 truncate" style={{ direction: 'ltr', textAlign: 'left' }}>{customer.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t.phoneLabel}</span>
                <p className="text-gray-700 bg-gray-50 border rounded-xl p-2.5" style={{ direction: 'ltr', textAlign: 'left' }}>{customer.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{locale === 'ar' ? 'تاريخ الانضمام' : 'Kayıt Tarihi'}</span>
                <div className="text-gray-500 text-xs font-semibold flex items-center gap-1.5 p-1">
                  <Calendar size={14} />
                  <span>{new Date(customer.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Orders Grid */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-black text-gray-900 border-b pb-3 flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#0da19a]" />
                <span>{t.ordersTitle} ({initialOrders.length})</span>
              </h3>

              {initialOrders.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 border flex items-center justify-center mx-auto text-gray-400">
                    <Package size={28} />
                  </div>
                  <p className="text-xs font-bold text-gray-400">{t.noOrders}</p>
                  <Link
                    href="/products"
                    className="inline-block bg-[#0da19a] hover:bg-[#0bc1b9] text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all shadow-xs cursor-pointer select-none"
                  >
                    {t.shopNow}
                  </Link>
                </div>
              ) : (
                /* Orders list responsive table */
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="border-b text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2 text-start">{t.orderCode}</th>
                        <th className="py-3 px-2 text-start">{t.date}</th>
                        <th className="py-3 px-2 text-start">{t.total}</th>
                        <th className="py-3 px-2 text-start">{t.status}</th>
                        <th className="py-3 px-2 text-end"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 font-bold text-gray-700">
                      {initialOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-2 select-all font-black text-[#0da19a]">{order.order_code}</td>
                          <td className="py-4 px-2 font-medium text-gray-500">
                            {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'tr-TR', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-2 text-gray-900 font-extrabold">{order.grand_total.toFixed(2)} TL</td>
                          <td className="py-4 px-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {getStatusBadge(order.status)}
                              {order.tracking_url && (
                                <a
                                  href={order.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={locale === 'ar' ? 'رابط تعقب الطلب' : 'Sipariş Takip Linki'}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-[10px] px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer select-none animate-pulse"
                                >
                                  <Truck size={11} />
                                  <span>{locale === 'ar' ? 'رابط تعقب الطلب' : 'Takip Linki'}</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-end">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1 bg-[#0da19a]/5 hover:bg-[#0da19a]/15 text-[#0da19a] border border-[#0da19a]/10 px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>{t.viewDetails}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Detailed Order Popup Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-250 relative">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="border-b pb-4 mb-6 pr-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-gray-900">
                    {t.viewDetails}: <span className="font-extrabold text-[#0da19a] select-all">{selectedOrder.order_code}</span>
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400 mt-2">
                  <span>{t.date}: {new Date(selectedOrder.created_at).toLocaleString()}</span>
                  <span>|</span>
                  <Link 
                    href={`/track?code=${selectedOrder.order_code}&phone=${encodeURIComponent(selectedOrder.phone)}`}
                    className="text-[#0da19a] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Clipboard size={12} />
                    <span>{t.trackOrder}</span>
                  </Link>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border rounded-2xl p-5 mb-6 text-xs font-bold text-gray-800">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t.shippingAddress}
                  </h4>
                  <p className="text-gray-900">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-gray-500 font-semibold">{selectedOrder.address}, {selectedOrder.district}, {selectedOrder.city}</p>
                  <p className="text-gray-500 font-semibold" style={{ direction: 'ltr', textAlign: 'start' }}>{selectedOrder.phone}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t.paymentMethod}
                  </h4>
                  <p className="text-gray-950">{t.paymentCOD}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">{locale === 'ar' ? 'التسليم والدفع عبر شركة PTT Kargo' : 'PTT Kargo ile Kapıda Nakit Ödeme'}</p>
                </div>
              </div>

              {selectedOrder.tracking_url && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex items-center justify-between gap-4 mb-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">
                      {locale === 'ar' ? 'طلبك مشحون ومتابع!' : 'Siparişiniz kargolandı!'}
                    </span>
                  </div>
                  <a
                    href={selectedOrder.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer select-none"
                  >
                    <Truck size={12} />
                    <span>{locale === 'ar' ? 'رابط تعقب الطلب' : 'Sipariş Takip Linki'}</span>
                  </a>
                </div>
              )}

              {/* Items Summary Table */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1.5">
                  {locale === 'ar' ? 'المنتجات' : 'Ürünler'}
                </h4>
                
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex gap-4 items-start">
                      <div className="w-12 h-12 bg-gray-50 border rounded-xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                        {item.custom_image ? (
                          <img 
                            src={item.custom_image} 
                            alt="POD design" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <ShoppingBag className="text-gray-400" size={20} />
                        )}
                      </div>
                      
                      <div className="flex-1 text-xs">
                        <h5 className="font-extrabold text-gray-800">
                          {locale === 'ar' ? item.name_ar : item.name_tr}
                        </h5>
                        <p className="text-gray-400 mt-0.5 font-bold">{item.brand} - {item.model}</p>
                        
                        {item.custom_text && (
                          <div className="mt-1 inline-flex items-center gap-1.5 bg-[#0da19a]/5 border border-[#0da19a]/10 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#0da19a]">
                            <span>{t.customText}:</span>
                            <span className="italic font-semibold">"{item.custom_text}"</span>
                          </div>
                        )}
                        {item.custom_image && !item.custom_text && (
                          <div className="mt-1 inline-flex items-center gap-1 bg-[#0da19a]/5 border border-[#0da19a]/10 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#0da19a]">
                            <span>{t.customImage}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right text-xs shrink-0 font-bold">
                        <p className="text-gray-400">{item.quantity} x</p>
                        <p className="text-gray-900 font-black mt-0.5">{(item.price * item.quantity).toFixed(2)} TL</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Breakdown */}
              <div className="border-t pt-4 space-y-2 text-xs font-bold text-gray-500">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="text-gray-900">{(selectedOrder.grand_total - selectedOrder.shipping_cost + selectedOrder.discount).toFixed(2)} TL</span>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>{t.discount}</span>
                    <span>-{selectedOrder.discount.toFixed(2)} TL</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t.shipping}</span>
                  <span className="text-gray-900">{selectedOrder.shipping_cost.toFixed(2)} TL</span>
                </div>

                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-dashed pt-3.5">
                  <span>{t.total}</span>
                  <span className="text-base text-gray-950">{selectedOrder.grand_total.toFixed(2)} TL</span>
                </div>
              </div>

              {/* Close Bottom Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-100 hover:bg-gray-250 text-gray-800 font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  {t.close}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
