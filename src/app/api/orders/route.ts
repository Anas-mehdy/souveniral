import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'
import { upsertCustomer } from '@/lib/customers'

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Allows max 5 order submissions per IP per 10 minutes.
// Simple Map-based approach — resets on server restart (acceptable for COD store).
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

const ipHits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true // allowed
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false // blocked
  }

  entry.count++
  return true // allowed
}

export async function POST(req: NextRequest) {
  // Rate limiting — get real IP (Vercel forwards it in x-forwarded-for)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin. / Too many requests, please wait.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    
    // Simple validation of required fields
    const required = ['email', 'first_name', 'last_name', 'country', 'address', 'district', 'city', 'phone', 'total_price', 'grand_total', 'items']
    for (const key of required) {
      if (body[key] === undefined || body[key] === null) {
        return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 })
      }
    }
    
    // Create/update customer account automatically
    await upsertCustomer(body.email, body.phone, body.first_name, body.last_name)

    // Create the order using our robust helper (handles Supabase + fallback)
    const newOrder = await createOrder({
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      country: body.country,
      address: body.address,
      district: body.district,
      postal_code: body.postal_code || null,
      city: body.city,
      phone: body.phone,
      shipping_cost: body.shipping_cost ?? 90,
      discount: body.discount ?? 0,
      total_price: body.total_price,
      grand_total: body.grand_total,
      status: 'pending',
      payment_method: 'cod',
      items: body.items
    })
    
    return NextResponse.json(newOrder)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
