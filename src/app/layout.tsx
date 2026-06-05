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
  manifest: '/manifest.json',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0da19a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SouvenirAl" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

