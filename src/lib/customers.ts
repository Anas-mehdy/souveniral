import { supabaseAdmin } from './supabase'
import path from 'path'
import { cookies } from 'next/headers'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

export interface Customer {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  created_at: string
}

// Load default settings/fallbacks
const DEFAULT_CUSTOMERS: Customer[] = []

// Helpers to read/write fallback file
function readLocalCustomers(): Customer[] {
  try {
    const fs = require('fs')
    const filePath = path.join(process.cwd(), 'src/lib/customers-store.json')
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as Customer[]
    }
  } catch (err) {
    // Fail silently
  }
  return DEFAULT_CUSTOMERS as Customer[]
}

function writeLocalCustomers(customers: Customer[]) {
  try {
    const fs = require('fs')
    const filePath = path.join(process.cwd(), 'src/lib/customers-store.json')
    fs.writeFileSync(filePath, JSON.stringify(customers, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to write local customers file:', err)
  }
}

export async function getCustomers(): Promise<Customer[]> {
  if (typeof window !== 'undefined') {
    return DEFAULT_CUSTOMERS as Customer[]
  }

  // 1. Try querying Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data as Customer[]
    }
  } catch (err) {
    // Fail silently to try fallback
  }

  // 2. Fallback to local JSON file
  return readLocalCustomers()
}

export async function upsertCustomer(
  email: string,
  phone: string,
  firstName: string,
  lastName: string
): Promise<Customer> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()

  const existingCustomers = await getCustomers()
  const found = existingCustomers.find(
    c => c.email.toLowerCase() === normalizedEmail && c.phone === normalizedPhone
  )

  if (found) {
    // Already exists, return it
    return found
  }

  // Create new customer
  const newCustomer: Customer = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    email: normalizedEmail,
    phone: normalizedPhone,
    first_name: firstName,
    last_name: lastName,
    created_at: new Date().toISOString()
  }

  // Try Supabase
  try {
    const { error } = await supabaseAdmin
      .from('customers')
      .insert([newCustomer])
    
    if (error) {
      console.error('Supabase customer insert error:', error)
    }
  } catch (err) {
    // Fail silently
  }

  // Local fallback write
  const current = readLocalCustomers()
  writeLocalCustomers([newCustomer, ...current])

  return newCustomer
}

export async function verifyCustomerCredentials(email: string, phone: string): Promise<Customer | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()

  const customers = await getCustomers()
  const matched = customers.find(
    c => c.email.toLowerCase() === normalizedEmail && c.phone === normalizedPhone
  )

  return matched || null
}

// ── Secure HMAC-signed session token ──────────────────────────────────────────
// Uses HMAC-SHA256 with a secret to sign session tokens.
// Falls back to a hardcoded secret if SESSION_SECRET env is not set.
const SESSION_SECRET = process.env.SESSION_SECRET || 'kilifal-session-secret-please-change-me'

function signToken(payload: Record<string, string>): string {
  const data = JSON.stringify(payload)
  const dataB64 = Buffer.from(data).toString('base64url')
  const sig = createHmac('sha256', SESSION_SECRET).update(dataB64).digest('base64url')
  return `${dataB64}.${sig}`
}

function verifyToken(token: string): Record<string, string> | null {
  try {
    const [dataB64, sig] = token.split('.')
    if (!dataB64 || !sig) return null
    const expectedSig = createHmac('sha256', SESSION_SECRET).update(dataB64).digest('base64url')
    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null
    const data = Buffer.from(dataB64, 'base64url').toString('utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export async function getCustomerFromSession(): Promise<Customer | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('customer_session')?.value
    if (!sessionCookie) return null

    const payload = verifyToken(sessionCookie)
    if (!payload || !payload.email || !payload.phone) return null

    return await verifyCustomerCredentials(payload.email, payload.phone)
  } catch (e) {
    return null
  }
}

export async function loginCustomer(email: string, phone: string): Promise<boolean> {
  const customer = await verifyCustomerCredentials(email, phone)
  if (!customer) return false

  const cookieStore = await cookies()
  const token = signToken({ email: customer.email, phone: customer.phone })
  
  cookieStore.set('customer_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })

  return true
}

export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('customer_session')
}
