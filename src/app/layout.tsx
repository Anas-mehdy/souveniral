import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://kilifal.com'),
  title: {
    default: 'SouvenirAl — Özel Tasarım Telefon Kılıfları',
    template: '%s | SouvenirAl',
  },
  description:
    'Kişiye özel baskılı telefon kılıfları. Sipariş üzerine üretim, yüksek çözünürlüklü UV baskı, 100+ telefon modeli. كفرات هاتف بتصاميم حصرية مطبوعة بالأشعة فوق البنفسجية.',
  keywords: [
    'telefon kılıfı',
    'özel baskılı kılıf',
    'kişiselleştirilmiş kılıf',
    'UV baskı kılıf',
    'iPhone kılıf',
    'Samsung kılıf',
    'كفر هاتف',
    'كفرات هواتف',
    'طباعة مخصصة',
    'SouvenirAl',
  ],
  authors: [{ name: 'SouvenirAl' }],
  creator: 'SouvenirAl',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: 'ar_SA',
    url: 'https://kilifal.com',
    siteName: 'SouvenirAl',
    title: 'SouvenirAl — Özel Tasarım Telefon Kılıfları',
    description:
      'Kişiye özel baskılı telefon kılıfları. Sipariş üzerine üretim, yüksek çözünürlüklü UV baskı.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SouvenirAl — Özel Tasarım Telefon Kılıfları',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SouvenirAl — Özel Tasarım Telefon Kılıfları',
    description:
      'Kişiye özel baskılı telefon kılıfları. Sipariş üzerine üretim, yüksek çözünürlüklü UV baskı.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
