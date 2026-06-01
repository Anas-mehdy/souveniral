import { Suspense } from 'react'
import TrackingClient from './TrackingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تتبع الطلب / Sipariş Takibi - SouvenirAl',
  description: 'تتبع حالة طلبك في متجر SouvenirAl باستخدام رقم الطلب ورقم الهاتف.'
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-500">Loading...</div>}>
      <TrackingClient />
    </Suspense>
  )
}
