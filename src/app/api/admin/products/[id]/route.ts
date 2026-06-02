import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { adminUpdateProduct, adminDeleteProduct } from '@/lib/db'
import { autoTranslatePayload } from '@/lib/translation'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const translatedBody = await autoTranslatePayload(body)
    await adminUpdateProduct(id, translatedBody)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Failed to patch product:', err)
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await adminDeleteProduct(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Failed to delete product:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 })
  }
}
