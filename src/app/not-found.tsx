'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [locale, setLocale] = useState<'ar' | 'tr'>('tr')

  useEffect(() => {
    const saved = document.cookie.match(/locale=([^;]+)/)?.[1]
    if (saved === 'ar' || saved === 'tr') setLocale(saved)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden px-4 font-sans">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Giant 404 */}
        <div className="select-none mb-4">
          <span
            className="text-[10rem] font-black leading-none"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </span>
        </div>

        {/* Phone emoji */}
        <div className="text-5xl mb-6 animate-bounce">📱</div>

        <h1 className="text-2xl font-black text-white mb-3">
          {locale === 'ar' ? 'الصفحة غير موجودة!' : 'Sayfa Bulunamadı!'}
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {locale === 'ar'
            ? 'يبدو أن هذه الصفحة غير موجودة أو تم نقلها. تفضّل بالعودة للمتجر لاستكشاف كفرات الهاتف الحصرية.'
            : 'Aradığınız sayfa bulunamadı veya taşınmış olabilir. Özel tasarım telefon kılıflarımızı keşfetmeye devam edin.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 text-sm"
          >
            {locale === 'ar' ? '🏠 العودة للرئيسية' : '🏠 Ana Sayfaya Dön'}
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700 text-sm"
          >
            {locale === 'ar' ? '🛍️ تصفّح المنتجات' : '🛍️ Ürünlere Göz At'}
          </Link>
        </div>

        <p className="text-slate-600 text-xs mt-8">SouvenirAl</p>
      </div>
    </div>
  )
}
