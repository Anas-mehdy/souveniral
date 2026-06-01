import { NextResponse } from 'next/server'
import { logoutCustomer } from '@/lib/customers'

export async function POST() {
  try {
    await logoutCustomer()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
