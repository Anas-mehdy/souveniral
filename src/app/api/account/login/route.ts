import { NextRequest, NextResponse } from 'next/server'
import { loginCustomer } from '@/lib/customers'

export async function POST(req: NextRequest) {
  try {
    const { email, phone } = await req.json()
    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone are required' }, { status: 400 })
    }

    const success = await loginCustomer(email, phone)
    if (!success) {
      return NextResponse.json({ error: 'Invalid credentials or no order found with these details' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
