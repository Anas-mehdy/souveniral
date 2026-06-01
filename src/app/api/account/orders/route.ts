import { NextResponse } from 'next/server'
import { getCustomerFromSession } from '@/lib/customers'
import { getOrders } from '@/lib/orders'

export async function GET() {
  try {
    const customer = await getCustomerFromSession()
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allOrders = await getOrders()
    const cleanCustomerPhone = customer.phone.replace(/\D/g, '')
    const customerEmailLower = customer.email.toLowerCase()

    // Filter orders by matching normalized email or phone
    const customerOrders = allOrders.filter(order => {
      const cleanOrderPhone = order.phone.replace(/\D/g, '')
      const orderEmailLower = order.email.toLowerCase()

      return (
        orderEmailLower === customerEmailLower ||
        (cleanOrderPhone !== '' && cleanOrderPhone === cleanCustomerPhone)
      )
    })

    return NextResponse.json(customerOrders)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
