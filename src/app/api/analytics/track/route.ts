import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function parseUserAgent(ua: string) {
  let device = 'desktop'
  let browser = 'Unknown'
  let os = 'Unknown'

  const uaLower = ua.toLowerCase()

  // 1. Device Type detection
  if (/mobile|android|iphone|ipad|phone/i.test(uaLower)) {
    if (/ipad|tablet/i.test(uaLower)) {
      device = 'tablet'
    } else {
      device = 'mobile'
    }
  }

  // 2. OS detection
  if (/windows/i.test(uaLower)) {
    os = 'Windows'
  } else if (/macintosh|mac os x/i.test(uaLower)) {
    os = 'macOS'
  } else if (/iphone|ipad|ipod/i.test(uaLower)) {
    os = 'iOS'
  } else if (/android/i.test(uaLower)) {
    os = 'Android'
  } else if (/linux/i.test(uaLower)) {
    os = 'Linux'
  }

  // 3. Browser detection
  if (/chrome|crios/i.test(uaLower) && !/edge|edg/i.test(uaLower) && !/opr/i.test(uaLower)) {
    browser = 'Chrome'
  } else if (/safari/i.test(uaLower) && !/chrome|crios/i.test(uaLower)) {
    browser = 'Safari'
  } else if (/firefox|fxios/i.test(uaLower)) {
    browser = 'Firefox'
  } else if (/edge|edg/i.test(uaLower)) {
    browser = 'Edge'
  } else if (/opr/i.test(uaLower)) {
    browser = 'Opera'
  } else if (/fbav/i.test(uaLower)) {
    browser = 'Facebook App'
  } else if (/instagram/i.test(uaLower)) {
    browser = 'Instagram App'
  }

  return { device, browser, os }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, event_name, path, referrer, event_data } = body

    if (!session_id || !event_name || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Extract user agent header
    const ua = req.headers.get('user-agent') || ''
    const { device, browser, os } = parseUserAgent(ua)

    // Extract country header from Vercel/Cloudflare (fallback to TR for local testing)
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'TR'

    // Clean referrer (strip protocol/subdomain if needed, or save as is)
    let cleanReferrer = referrer || 'Direct'
    if (cleanReferrer !== 'Direct') {
      try {
        const refUrl = new URL(cleanReferrer)
        cleanReferrer = refUrl.hostname
      } catch (err) {
        // Keep as raw text if not a valid URL
      }
    }

    // Insert to Supabase analytics_events table
    const { error } = await supabaseAdmin.from('analytics_events').insert({
      session_id,
      event_name,
      path,
      referrer: cleanReferrer,
      device,
      browser,
      os,
      country,
      event_data: event_data || {},
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('Database write error tracking event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error in analytics tracking endpoint:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
