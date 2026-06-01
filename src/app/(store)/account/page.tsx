import { getCustomerFromSession } from '@/lib/customers'
import { getOrders, Order } from '@/lib/orders'
import AccountClient from './AccountClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'حسابي / Hesabım - SouvenirAl',
  description: 'صفحة العميل الخاصة لمشاهدة سجل الطلبات ومتابعة تفاصيلها.'
}

export default async function AccountPage() {
  const customer = await getCustomerFromSession()
  let initialOrders: Order[] = []
  
  if (customer) {
    try {
      const allOrders = await getOrders()
      const cleanCustomerPhone = customer.phone.replace(/\D/g, '')
      const customerEmailLower = customer.email.toLowerCase()

      initialOrders = allOrders.filter(order => {
        const cleanOrderPhone = order.phone.replace(/\D/g, '')
        const orderEmailLower = order.email.toLowerCase()

        return (
          orderEmailLower === customerEmailLower ||
          (cleanOrderPhone !== '' && cleanOrderPhone === cleanCustomerPhone)
        )
      })
    } catch (err) {
      console.error('Failed to pre-fetch customer orders on server:', err)
    }
  }

  // Convert dates and special values safely to JSON-safe structure
  const serializedCustomer = customer ? JSON.parse(JSON.stringify(customer)) : null
  const serializedOrders = JSON.parse(JSON.stringify(initialOrders))

  return (
    <AccountClient 
      customer={serializedCustomer} 
      initialOrders={serializedOrders} 
    />
  )
}
