import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { adminAddProductImage, adminDeleteProductImage } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: productId } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // Validate file type — images only
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, GIF and AVIF images are allowed.' }, { status: 400 })
  }

  // Validate file size — 5 MB max
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum allowed size is 5 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${productId}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('products')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('products').getPublicUrl(path)
  const sortOrder = parseInt(formData.get('sort_order') as string ?? '0')
  await adminAddProductImage(productId, publicUrl, sortOrder)
  return NextResponse.json({ url: publicUrl })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { imageId, storagePath } = await req.json()
  if (storagePath) {
    await supabaseAdmin.storage.from('products').remove([storagePath])
  }
  await adminDeleteProductImage(imageId)
  return NextResponse.json({ ok: true })
}
