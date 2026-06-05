'use client'
import { useLocale } from './LocaleProvider'

const WHATSAPP_NUMBER = '+905350215375'

export function WhatsAppButton() {
  const { locale } = useLocale()

  const message = locale === 'ar'
    ? encodeURIComponent('مرحباً، أريد الاستفسار عن منتجاتكم 👋')
    : encodeURIComponent('Merhaba, ürünleriniz hakkında bilgi almak istiyorum 👋')

  const href = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={locale === 'ar' ? 'تواصل معنا عبر واتساب' : 'WhatsApp ile iletişime geçin'}
      className="fixed bottom-6 end-6 z-50 flex items-center gap-2.5 group"
    >
      {/* Tooltip label */}
      <span
        className={`
          hidden sm:block text-[11px] font-bold text-white bg-gray-900/80 px-3 py-1.5 rounded-xl
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none whitespace-nowrap
        `}
      >
        {locale === 'ar' ? 'تواصل معنا واتساب' : 'WhatsApp ile yaz'}
      </span>

      {/* WhatsApp circle button */}
      <div className="relative">
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 scale-110" />
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 scale-125 animation-delay-150" />

        <div
          className="
            relative w-14 h-14 bg-[#25D366] hover:bg-[#22c55e] rounded-full shadow-xl
            flex items-center justify-center transition-transform duration-200 hover:scale-110
            cursor-pointer
          "
        >
          {/* WhatsApp SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-7 h-7"
          >
            <path d="M12.001 2C6.477 2 2.001 6.476 2.001 12c0 1.98.574 3.843 1.565 5.42L2 22l4.715-1.537A9.962 9.962 0 0 0 12.001 22c5.523 0 10-4.477 10-10S17.524 2 12.001 2zm0 18a7.96 7.96 0 0 1-4.075-1.117l-.29-.175-3 .977.99-2.91-.19-.3A7.96 7.96 0 0 1 4.001 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.588 8-7.999 8zm4.4-6.161c-.24-.12-1.42-.7-1.64-.779-.22-.079-.38-.12-.54.12-.16.24-.619.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.374-1.923-1.19-.71-.635-1.19-1.418-1.33-1.659-.14-.24-.015-.37.105-.49.108-.107.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.194-.468-.392-.404-.54-.412l-.459-.008a.88.88 0 0 0-.64.3c-.22.24-.84.82-.84 2s.861 2.32.981 2.48c.12.16 1.695 2.59 4.106 3.631.575.248 1.023.396 1.372.507.577.183 1.102.157 1.516.096.462-.069 1.422-.582 1.622-1.144.2-.562.2-1.044.14-1.144-.059-.1-.219-.16-.459-.28z"/>
          </svg>
        </div>
      </div>
    </a>
  )
}
