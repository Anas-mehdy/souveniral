'use client'

import { useEffect, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Helper to generate a random UUID
function generateUUID(): string {
  try {
    return window.crypto.randomUUID()
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

// Separate component to use pathname and searchParams inside Suspense
function TrackerCore() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevPathRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  // Initialize session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('sa_session_id')
      if (!id) {
        id = generateUUID()
        sessionStorage.setItem('sa_session_id', id)
      }
      sessionIdRef.current = id

      // Define global tracker helper on window
      ;(window as any).trackAnalyticsEvent = async (eventName: string, eventData?: any) => {
        const currentPath = window.location.pathname + window.location.search
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionIdRef.current,
              event_name: eventName,
              path: currentPath,
              referrer: document.referrer || 'Direct',
              event_data: eventData || {}
            })
          })
        } catch (err) {
          // Fail silently to avoid interrupting user flows
        }
      }
    }
  }, [])

  // Track page_view on path/searchParams change
  useEffect(() => {
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Avoid double tracking on initial mount if pathname hasn't actually changed
    if (prevPathRef.current === fullPath) return
    prevPathRef.current = fullPath

    const trackPage = async () => {
      // Small delay to ensure sessionId is initialized first and page title is updated
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      if (sessionIdRef.current && (window as any).trackAnalyticsEvent) {
        ;(window as any).trackAnalyticsEvent('page_view')
      }
    }

    trackPage()
  }, [pathname, searchParams])

  return null
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerCore />
    </Suspense>
  )
}
