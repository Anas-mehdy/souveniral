'use client'
import Link from 'next/link'
import { useLocale } from './LocaleProvider'

export function Footer() {
  const { locale } = useLocale()

  const t = {
    ar: {
      brandDesc: 'كفرات هاتف بتصاميم حصرية تم تصنيعها خصيصاً لك.',
      shippingInfo: 'شحن PTT — الدفع عند الاستلام',
      quickLinks: 'روابط سريعة',
      home: 'الرئيسية',
      products: 'المنتجات',
      categories: 'الأقسام',
      trackOrder: 'تتبع الطلب',
      legal: 'قانوني',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfUse: 'شروط الاستخدام',
      contact: 'تواصل',
      deliveryTime: '٣–٤ أيام عمل للتوصيل',
      paymentInfo: 'الدفع نقداً عند الاستلام',
      copyright: `جميع الحقوق محفوظة لـ SouvenirAl © ${new Date().getFullYear()}`
    },
    tr: {
      brandDesc: 'Özel tasarım telefon kılıfları. Sizin için özel olarak üretildi.',
      shippingInfo: 'PTT Kargo — Kapıda Ödeme',
      quickLinks: 'Hızlı Erişim',
      home: 'Ana Sayfa',
      products: 'Ürünler',
      categories: 'Kategoriler',
      trackOrder: 'Sipariş Takibi',
      legal: 'Yasal',
      privacyPolicy: 'Gizlilik Politikası',
      termsOfUse: 'Kullanım Koşulları',
      contact: 'İletişim',
      deliveryTime: '3–4 iş günü teslimat',
      paymentInfo: 'Kapıda Nakit Ödeme',
      copyright: `© ${new Date().getFullYear()} SouvenirAl. Tüm hakları saklıdır.`
    }
  }[locale]

  const isRtl = locale === 'ar'

  return (
    <footer className="mt-20 bg-gray-900 text-gray-400 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <p className="text-white font-black text-lg mb-2">SouvenirAl</p>
            <p className="text-xs leading-relaxed text-gray-500">
              {t.brandDesc}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <span>📦</span>
              <span>{t.shippingInfo}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white font-bold text-sm mb-4">
              {t.quickLinks}
            </p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">{t.home}</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">{t.products}</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">{t.categories}</Link></li>
              <li><Link href="/track" className="hover:text-white transition-colors">{t.trackOrder}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-bold text-sm mb-4">
              {t.legal}
            </p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">{t.privacyPolicy}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">{t.termsOfUse}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-bold text-sm mb-4">
              {t.contact}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:info@souveniral.com" className="hover:text-white transition-colors">
                  ✉️ info@souveniral.com
                </a>
              </li>
              <li className="text-gray-500">
                🕐 {t.deliveryTime}
              </li>
              <li className="text-gray-500">
                💳 {t.paymentInfo}
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>{t.copyright}</span>
        </div>
      </div>
    </footer>
  )
}
