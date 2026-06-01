import type { Metadata } from 'next'
import { TermsClient } from './TermsClient'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları / شروط الاستخدام',
  description: 'SouvenirAl kullanım koşulları — sipariş, iade ve teslimat politikamızı inceleyin.',
}

export default function TermsPage() {
  return <TermsClient />
}
