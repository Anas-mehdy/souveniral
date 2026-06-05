import { NextResponse } from 'next/server'

// Setup endpoint disabled in production — only for initial schema setup.
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Setup your schema via Supabase SQL Editor.' },
    { status: 404 }
  )
}
