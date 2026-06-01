import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { adminCreateCategory, adminGetAllCategories } from '@/lib/db'

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categories = await adminGetAllCategories()
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const category = await adminCreateCategory(body)
  return NextResponse.json(category)
}
