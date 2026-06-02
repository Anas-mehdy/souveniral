import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { adminCreateProduct, adminGetAllProducts } from '@/lib/db'
import { autoTranslatePayload } from '@/lib/translation'

export async function GET() {
  try {
    if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const products = await adminGetAllProducts()
    return NextResponse.json(products)
  } catch (err: any) {
    console.error('Failed to get products:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const translatedBody = await autoTranslatePayload(body)
    const product = await adminCreateProduct(translatedBody)
    return NextResponse.json(product)
  } catch (err: any) {
    console.error('Failed to create product:', err)
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 })
  }
}
