import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { adminCreateCategory, adminGetAllCategories } from '@/lib/db'
import { autoTranslatePayload } from '@/lib/translation'

export async function GET() {
  try {
    if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const categories = await adminGetAllCategories()
    return NextResponse.json(categories)
  } catch (err: any) {
    console.error('Failed to get categories:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const translatedBody = await autoTranslatePayload(body)
    const category = await adminCreateCategory(translatedBody)
    return NextResponse.json(category)
  } catch (err: any) {
    console.error('Failed to create category:', err)
    return NextResponse.json({ error: err.message || 'Failed to create category' }, { status: 500 })
  }
}
