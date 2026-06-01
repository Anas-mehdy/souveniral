import { NextRequest, NextResponse } from 'next/server'
import { getOrders } from '@/lib/orders'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')?.trim().toUpperCase()
    const phone = searchParams.get('phone')?.trim()

    if (!code || !phone) {
      return NextResponse.json({ error: 'Order code and phone number are required' }, { status: 400 })
    }

    const allOrders = await getOrders()
    const cleanTrackPhone = phone.replace(/\D/g, '')

    const order = allOrders.find(o => {
      const cleanOrderPhone = o.phone.replace(/\D/g, '')
      return (
        o.order_code.toUpperCase() === code && 
        cleanOrderPhone !== '' && 
        cleanOrderPhone === cleanTrackPhone
      )
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found with these details' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
