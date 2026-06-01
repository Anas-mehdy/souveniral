import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (token) {
    await supabaseAdmin.from('admin_sessions').delete().eq('token', token)
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  return res
}
