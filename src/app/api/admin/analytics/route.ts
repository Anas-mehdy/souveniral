import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const range = req.nextUrl.searchParams.get('range') || '30d'

    let startDate = new Date()
    let endDate = new Date()

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
    } else if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7)
    } else { // '30d'
      startDate.setDate(startDate.getDate() - 30)
    }

    // Fetch all analytics events in the date range
    let dbQuery = supabaseAdmin
      .from('analytics_events')
      .select('session_id, event_name, path, referrer, device, browser, os, country, created_at, event_data')
      .gte('created_at', startDate.toISOString())

    if (range === 'yesterday') {
      dbQuery = dbQuery.lt('created_at', endDate.toISOString())
    }

    const { data: events, error } = await dbQuery.order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching analytics events:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const eventsList = events || []

    // 1. General Metrics
    const uniqueSessionIds = new Set<string>()
    let totalPageviews = 0
    let totalPurchases = 0

    // Sets to count funnel participants
    const funnelSessions = {
      visit: new Set<string>(),         // Page view
      viewProduct: new Set<string>(),   // view_product
      addToCart: new Set<string>(),     // add_to_cart
      checkoutStart: new Set<string>(), // checkout_start
      purchase: new Set<string>()       // purchase
    }

    // Breakdown aggregators
    const pageviewsByPath: Record<string, { views: number; unique: Set<string> }> = {}
    const visitsByReferrer: Record<string, Set<string>> = {}
    const visitsByCountry: Record<string, Set<string>> = {}
    const visitsByDevice: Record<string, Set<string>> = {}
    const visitsByBrowser: Record<string, Set<string>> = {}

    // Initialize hourly or daily maps for charts
    const timeChartMap = new Map<string, { pageviews: number; visitors: Set<string> }>()

    if (range === 'today') {
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}:00`
        timeChartMap.set(label, { pageviews: 0, visitors: new Set() })
      }
    } else if (range === 'yesterday') {
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}:00`
        timeChartMap.set(label, { pageviews: 0, visitors: new Set() })
      }
    } else {
      const daysCount = range === '7d' ? 7 : 30
      const tempDate = new Date(startDate)
      for (let i = 0; i < daysCount; i++) {
        const label = tempDate.toISOString().split('T')[0]
        timeChartMap.set(label, { pageviews: 0, visitors: new Set() })
        tempDate.setDate(tempDate.getDate() + 1)
      }
    }

    // Process all events
    eventsList.forEach(event => {
      const { session_id, event_name, path, referrer, device, browser, country, created_at } = event
      const eventDate = new Date(created_at)

      // Add to general sets
      uniqueSessionIds.add(session_id)
      
      if (event_name === 'page_view') {
        totalPageviews++
      }
      if (event_name === 'purchase') {
        totalPurchases++
      }

      // Funnel attribution
      funnelSessions.visit.add(session_id)
      if (event_name === 'view_product') {
        funnelSessions.viewProduct.add(session_id)
      }
      if (event_name === 'add_to_cart') {
        funnelSessions.addToCart.add(session_id)
      }
      if (event_name === 'checkout_start') {
        funnelSessions.checkoutStart.add(session_id)
      }
      if (event_name === 'purchase') {
        funnelSessions.purchase.add(session_id)
      }

      // Path views
      if (event_name === 'page_view') {
        if (!pageviewsByPath[path]) {
          pageviewsByPath[path] = { views: 0, unique: new Set() }
        }
        pageviewsByPath[path].views++
        pageviewsByPath[path].unique.add(session_id)
      }

      // Breakdowns (attributed per unique session)
      const ref = referrer || 'Direct'
      if (!visitsByReferrer[ref]) visitsByReferrer[ref] = new Set()
      visitsByReferrer[ref].add(session_id)

      const ctry = country || 'Unknown'
      if (!visitsByCountry[ctry]) visitsByCountry[ctry] = new Set()
      visitsByCountry[ctry].add(session_id)

      const dev = device || 'desktop'
      if (!visitsByDevice[dev]) visitsByDevice[dev] = new Set()
      visitsByDevice[dev].add(session_id)

      const brow = browser || 'Unknown'
      if (!visitsByBrowser[brow]) visitsByBrowser[brow] = new Set()
      visitsByBrowser[brow].add(session_id)

      // Time chart grouping
      let chartKey = ''
      if (range === 'today' || range === 'yesterday') {
        const hour = eventDate.getHours()
        chartKey = `${hour.toString().padStart(2, '0')}:00`
      } else {
        chartKey = created_at.split('T')[0]
      }

      if (timeChartMap.has(chartKey)) {
        const bucket = timeChartMap.get(chartKey)!
        if (event_name === 'page_view') {
          bucket.pageviews++
          bucket.visitors.add(session_id)
        }
      }
    })

    // Formatting breakdowns for client response
    const topPages = Object.keys(pageviewsByPath)
      .map(path => ({
        path,
        views: pageviewsByPath[path].views,
        unique: pageviewsByPath[path].unique.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    const topReferrers = Object.keys(visitsByReferrer)
      .map(name => ({
        name,
        visits: visitsByReferrer[name].size
      }))
      .sort((a, b) => b.visits - a.visits)

    const topCountries = Object.keys(visitsByCountry)
      .map(code => ({
        code,
        visits: visitsByCountry[code].size
      }))
      .sort((a, b) => b.visits - a.visits)

    const deviceBreakdown = Object.keys(visitsByDevice)
      .map(name => ({
        name,
        visits: visitsByDevice[name].size
      }))
      .sort((a, b) => b.visits - a.visits)

    const browserBreakdown = Object.keys(visitsByBrowser)
      .map(name => ({
        name,
        visits: visitsByBrowser[name].size
      }))
      .sort((a, b) => b.visits - a.visits)

    // Format time chart lists
    const chartLabels: string[] = []
    const chartPageviews: number[] = []
    const chartVisitors: number[] = []

    timeChartMap.forEach((value, key) => {
      // For daily dates, format nicely (e.g. 2026-06-06 -> 06 Jun)
      if (key.includes('-')) {
        try {
          const parts = key.split('-')
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
          chartLabels.push(date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }))
        } catch (e) {
          chartLabels.push(key)
        }
      } else {
        chartLabels.push(key)
      }
      chartPageviews.push(value.pageviews)
      chartVisitors.push(value.visitors.size)
    })

    const visitorsCount = uniqueSessionIds.size
    const conversionRate = visitorsCount > 0 ? ((funnelSessions.purchase.size / visitorsCount) * 100).toFixed(2) : '0.00'

    return NextResponse.json({
      metrics: {
        visitors: visitorsCount,
        pageviews: totalPageviews,
        purchases: totalPurchases,
        conversionRate
      },
      funnel: {
        visit: funnelSessions.visit.size,
        viewProduct: funnelSessions.viewProduct.size,
        addToCart: funnelSessions.addToCart.size,
        checkoutStart: funnelSessions.checkoutStart.size,
        purchase: funnelSessions.purchase.size
      },
      chart: {
        labels: chartLabels,
        pageviews: chartPageviews,
        visitors: chartVisitors
      },
      breakdowns: {
        pages: topPages,
        referrers: topReferrers,
        countries: topCountries,
        devices: deviceBreakdown,
        browsers: browserBreakdown
      }
    })

  } catch (err) {
    console.error('Error in admin analytics report endpoint:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
