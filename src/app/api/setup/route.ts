import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cannot run raw SQL via REST API directly — return instructions
  return NextResponse.json({
    message: 'Please run supabase-schema.sql in your Supabase SQL Editor',
    url: 'https://supabase.com/dashboard/project/nywrftutioksevutcrpn/sql/new'
  })
}

