import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'
import { upsertCustomer } from '@/lib/customers'

// ── Rate limiter using Supabase-compatible sliding window ─────────────────────
// Uses a Map with sliding window. Resets on restart (acceptable for COD store).
// On Vercel edge, consider using Upstash Redis for persistence.
const RATE_LIMIT_MAX = 3           // Max 3 order submissions per window
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes window

interface RateLimitEntry {
  timestamps: number[]
}

const ipHits = new Map<string, RateLimitEntry>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS

  const entry = ipHits.get(ip)
  if (!entry) {
    ipHits.set(ip, { timestamps: [now] })
    return true
  }

  // Remove timestamps outside the window (sliding)
  entry.timestamps = entry.timestamps.filter(ts => ts > cutoff)

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    return false
  }

  entry.timestamps.push(now)
  return true
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

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Phone must be at least 7 digits
    const digitsOnly = body.phone.replace(/\D/g, '')
    if (digitsOnly.length < 7) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Items must be non-empty array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // grand_total sanity check (must be positive)
    if (typeof body.grand_total !== 'number' || body.grand_total <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 })
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
