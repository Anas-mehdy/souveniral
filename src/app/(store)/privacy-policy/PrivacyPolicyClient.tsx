'use client'
import Link from 'next/link'
import { useLocale } from '@/components/LocaleProvider'

export function PrivacyPolicyClient() {
  const { locale } = useLocale()
  const isAr = locale === 'ar'

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 font-sans text-gray-800" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#0da19a] hover:underline mb-8 font-bold">
        {isAr ? '← الرئيسية' : '← Ana Sayfa'}
      </Link>

      {isAr ? (
        // ARABIC
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            سياسة الخصوصية
          </h1>
          <p className="text-gray-500 text-sm mb-8">آخر تحديث: {new Date().getFullYear()}</p>

          <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">١. المعلومات التي نجمعها</h2>
              <p>
                عند إنشاء طلبك، نجمع بياناتك الشخصية مثل الاسم والبريد الإلكتروني ورقم الهاتف وعنوان التوصيل.
                تُستخدم هذه البيانات فقط لمعالجة طلبك والتواصل معك.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٢. كيف نستخدم معلوماتك؟</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>معالجة طلباتك وتوصيلها</li>
                <li>إرسال إشعارات بحالة الطلب عبر البريد الإلكتروني</li>
                <li>تقديم خدمة العملاء</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٣. هل نشارك معلوماتك؟</h2>
              <p>
                لا نشارك بياناتك الشخصية مع أي طرف ثالث باستثناء شركة الشحن (PTT Kargo). لا نبيع بياناتك أبداً.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٤. الاتصال بنا</h2>
              <p>
                لأي استفسار:{' '}
                <a href="mailto:info@souveniral.com" className="text-[#0da19a] hover:underline font-semibold">
                  info@souveniral.com
                </a>
              </p>
            </section>
          </div>
        </div>
      ) : (
        // TURKISH
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Gizlilik Politikası
          </h1>
          <p className="text-gray-500 text-sm mb-8">Son güncelleme: {new Date().getFullYear()}</p>

          <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">1. Topladığımız Bilgiler</h2>
              <p>
                Sipariş oluştururken ad, soyad, e-posta adresi, telefon numarası ve teslimat adresi gibi kişisel
                verilerinizi topluyoruz. Bu veriler yalnızca siparişinizi işlemek ve size ulaşmak amacıyla
                kullanılır.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">2. Bilgilerinizi Nasıl Kullanıyoruz?</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Siparişlerinizi işlemek ve teslim etmek</li>
                <li>Sipariş durumu hakkında e-posta bildirimi göndermek</li>
                <li>Müşteri hizmetleri sağlamak</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">3. Bilgilerinizi Paylaşıyor muyuz?</h2>
              <p>
                Kişisel verilerinizi kargo şirketi (PTT Kargo) ve ödeme altyapısı dışında hiçbir üçüncü tarafla
                paylaşmıyoruz. Verilerinizi asla satmıyoruz.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">4. Veri Saklama</h2>
              <p>
                Sipariş verileriniz, yasal yükümlülüklerimiz kapsamında gerekli süre boyunca saklanmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">5. Çerezler</h2>
              <p>
                Sepet durumunuzu ve dil tercihlerinizi hatırlamak için çerezler kullanıyoruz. Bu çerezler
                işlevsel amaçlıdır ve reklam takibi içermez.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">6. İletişim</h2>
              <p>
                Gizlilik ile ilgili sorularınız için:{' '}
                <a href="mailto:info@souveniral.com" className="text-[#0da19a] hover:underline font-semibold">
                  info@souveniral.com
                </a>
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
