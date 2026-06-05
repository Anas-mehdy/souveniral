import { NextResponse } from 'next/server'

// Seed endpoint disabled in production — only available locally.
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Run seeding locally.' },
    { status: 404 }
  )
}
