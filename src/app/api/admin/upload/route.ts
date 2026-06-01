import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type — images only
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, GIF and AVIF images are allowed.' }, { status: 400 })
    }

    // Validate file size — 5 MB max
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum allowed size is 5 MB.' }, { status: 400 })
    }

    const filename = file.name || 'image.jpg'
    const ext = filename.split('.').pop() || 'jpg'
    // Save inside 'gallery' subfolder within 'products' public bucket
    const path = `gallery/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`
    
    const arrayBuffer = await file.arrayBuffer()
    
    const { error } = await supabaseAdmin.storage
      .from('products')
      .upload(path, arrayBuffer, { 
        contentType: file.type || 'image/jpeg', 
        upsert: false 
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
