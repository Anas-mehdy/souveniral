import { supabaseAdmin } from './supabase'
import path from 'path'
import { cookies } from 'next/headers'

export interface Customer {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  created_at: string
}

// Load default settings/fallbacks
import DEFAULT_CUSTOMERS from './customers-store.json'

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

export async function getCustomerFromSession(): Promise<Customer | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('customer_session')?.value
    if (!sessionCookie) return null

    // Decode token
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8')
    const { email, phone } = JSON.parse(decoded)

    return await verifyCustomerCredentials(email, phone)
  } catch (e) {
    return null
  }
}

export async function loginCustomer(email: string, phone: string): Promise<boolean> {
  const customer = await verifyCustomerCredentials(email, phone)
  if (!customer) return false

  const cookieStore = await cookies()
  const token = Buffer.from(JSON.stringify({ email: customer.email, phone: customer.phone })).toString('base64')
  
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
