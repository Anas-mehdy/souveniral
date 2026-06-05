'use client'
import Link from 'next/link'
import { useLocale } from '@/components/LocaleProvider'

export function TermsClient() {
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
          <h1 className="text-3xl font-black text-gray-900 mb-2">شروط الاستخدام</h1>
          <p className="text-gray-500 text-sm mb-8">آخر تحديث: {new Date().getFullYear()}</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">١. الطلب والإنتاج</h2>
              <p className="text-gray-600">
                منتجاتنا لا تُشحن من مخزون جاهز، بل تُنتج خصيصاً لكل طلب. لذلك بعد تأكيد الطلب تبدأ
                عملية الإنتاج ولا يمكن إلغاؤها.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٢. سياسة الإرجاع والاستبدال</h2>
              <p className="text-gray-600">
                نظراً للطبيعة المخصصة للمنتجات، لا تُقبل طلبات الإرجاع إلا في حالة وجود عيب مصنعي حقيقي.
                في حال وجود مشكلة، تواصل معنا على{' '}
                <a href="mailto:info@souveniral.com" className="text-[#0da19a] hover:underline font-semibold">
                  info@souveniral.com
                </a>
                . يتم إعادة الإنتاج مجاناً في حالات التوصيل التالف أو الخاطئ.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٣. التوصيل</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>الشحن عبر: PTT Kargo (الدفع عند الاستلام)</li>
                <li>الوقت المتوقع: ٣-٤ أيام عمل</li>
                <li>تكلفة الشحن: ₺٩٠ (مجاني عند طلب كفرين أو أكثر)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٤. الدفع</h2>
              <p className="text-gray-600">
                حالياً نقبل فقط الدفع نقداً عند الاستلام (COD). يتولى موظف الشحن تحصيل المبلغ عند التسليم.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">٥. مسؤولية اختيار الموديل</h2>
              <p className="text-gray-600">
                يرجى التأكد من اختيار موديل هاتفك بشكل صحيح عند الطلب. لا تُقبل الإرجاعات الناتجة عن
                اختيار موديل خاطئ.
              </p>
            </section>
          </div>
        </div>
      ) : (
        // TURKISH
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Kullanım Koşulları</h1>
          <p className="text-gray-500 text-sm mb-8">Son güncelleme: {new Date().getFullYear()}</p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">1. Sipariş ve Üretim</h2>
              <p className="text-gray-600">
                Ürünlerimiz hazır stoktan gönderilmemekte, sipariş üzerine kişiye özel olarak üretilmektedir.
                Bu nedenle sipariş onaylandıktan sonra üretim süreci başlar ve iptal edilemez.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">2. İade ve Değişim Politikası</h2>
              <p className="text-gray-600">
                Kişiye özel üretim nedeniyle, üründe geçerli bir imalat hatası bulunmadıkça iade talepleri
                kabul edilmemektedir. Ürününüzde bir sorun olması durumunda{' '}
                <a href="mailto:info@souveniral.com" className="text-[#0da19a] hover:underline font-semibold">
                  info@souveniral.com
                </a>{' '}
                adresinden bizimle iletişime geçiniz. Hasarlı veya yanlış ürün teslimatlarında ücretsiz
                yeniden üretim yapılmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">3. Teslimat</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Kargo: PTT Kargo (Kapıda Ödeme)</li>
                <li>Tahmini süre: 3-4 iş günü</li>
                <li>Kargo ücreti: ₺90 (2 ve üzeri ürünlerde ücretsiz)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">4. Ödeme</h2>
              <p className="text-gray-600">
                Şu an yalnızca kapıda nakit ödeme (COD) seçeneği sunulmaktadır. Kargo görevlisi teslimatta
                ödemeyi tahsil eder.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">5. Model Seçimi Sorumluluğu</h2>
              <p className="text-gray-600">
                Lütfen sipariş verirken telefon modelinizi doğru seçtiğinizden emin olunuz. Yanlış model
                seçimi nedeniyle oluşan uyumsuzluklarda iade kabul edilmemektedir.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 mb-2">6. İletişim</h2>
              <p className="text-gray-600">
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
