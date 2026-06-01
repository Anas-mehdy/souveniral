import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getOrders } from '@/lib/orders'

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const orders = await getOrders()
    return NextResponse.json(orders)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
