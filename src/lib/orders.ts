import { supabaseAdmin } from './supabase'
import path from 'path'
import { CartItem } from '@/components/CartProvider'
import { sendOrderStatusEmail } from './email'


export interface Order {
  id: string
  order_code: string
  email: string
  first_name: string
  last_name: string
  country: string
  address: string
  district: string
  postal_code?: string | null
  city: string
  phone: string
  shipping_cost: number
  discount: number
  total_price: number
  grand_total: number
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  payment_method: 'cod'
  items: CartItem[]
  created_at: string
  tracking_url?: string | null
}

// Load default settings/fallbacks
const DEFAULT_ORDERS: Order[] = []

// Helpers to read/write fallback file
function readLocalOrders(): Order[] {
  try {
    const fs = require('fs')
    const filePath = path.join(process.cwd(), 'src/lib/orders-store.json')
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as Order[]
    }
  } catch (err) {
    // Fail silently
  }
  return DEFAULT_ORDERS as Order[]
}

function writeLocalOrders(orders: Order[]) {
  try {
    const fs = require('fs')
    const filePath = path.join(process.cwd(), 'src/lib/orders-store.json')
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to write local orders file:', err)
  }
}

export async function getOrders(): Promise<Order[]> {
  if (typeof window !== 'undefined') {
    return DEFAULT_ORDERS as Order[]
  }

  // 1. Try querying Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const dbOrders = data as Order[]
      const localOrders = readLocalOrders()
      
      // Fail-safe merge: ensure tracking_url and status from local storage are merged
      return dbOrders.map(dbo => {
        const localMatch = localOrders.find(lo => lo.id === dbo.id)
        return {
          ...dbo,
          status: dbo.status || localMatch?.status || 'pending',
          tracking_url: dbo.tracking_url || localMatch?.tracking_url || null
        }
      })
    }
  } catch (err) {
    // Fail silently to try fallback
  }

  // 2. Fallback to local JSON file
  return readLocalOrders()
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'order_code'>): Promise<Order> {
  const code = 'KA-' + Math.floor(100000 + Math.random() * 900000)
  const newOrder: Order = {
    ...orderData,
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    order_code: code,
    created_at: new Date().toISOString()
  }

  // 1. Try saving to Supabase
  let supabaseSuccess = false
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .insert([newOrder])
    
    if (!error) {
      supabaseSuccess = true
    }
  } catch (err) {
    // Fail silently to local fallback
  }

  // 2. Update local fallback file
  const currentOrders = readLocalOrders()
  const updatedOrders = [newOrder, ...currentOrders]
  writeLocalOrders(updatedOrders)

  // Send initial Order Received (pending) email asynchronously
  sendOrderStatusEmail(newOrder).catch(err => {
    console.error('Failed to send order confirmation email:', err)
  })

  return newOrder
}

export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  trackingUrl?: string | null
): Promise<Order | null> {
  // 1. Try updating in Supabase
  let updatedOrder: Order | null = null
  const updatePayload: Record<string, any> = { status }
  if (trackingUrl !== undefined) {
    updatePayload.tracking_url = trackingUrl
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      updatedOrder = data as Order
    }
  } catch (err) {
    // Fail silently to local fallback
  }

  // 2. Update in local fallback file
  const currentOrders = readLocalOrders()
  const orderIndex = currentOrders.findIndex(o => o.id === id)
  
  if (orderIndex > -1) {
    currentOrders[orderIndex].status = status
    if (trackingUrl !== undefined) {
      currentOrders[orderIndex].tracking_url = trackingUrl
    }
    writeLocalOrders(currentOrders)
    if (!updatedOrder) {
      updatedOrder = currentOrders[orderIndex]
    }
  }

  // Send status update email asynchronously
  if (updatedOrder) {
    sendOrderStatusEmail(updatedOrder).catch(err => {
      console.error('Failed to send status update email:', err)
    })
  }

  return updatedOrder
}

export async function deleteOrder(id: string): Promise<boolean> {
  // 1. Try deleting from Supabase
  let supabaseSuccess = false
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (!error) {
      supabaseSuccess = true
    }
  } catch (err) {
    // Fail silently
  }

  // 2. Update local fallback file
  const currentOrders = readLocalOrders()
  const filtered = currentOrders.filter(o => o.id !== id)
  
  if (filtered.length !== currentOrders.length) {
    writeLocalOrders(filtered)
    return true
  }

  return supabaseSuccess
}
