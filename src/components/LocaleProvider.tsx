'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Locale } from '@/lib/types'

const LocaleCtx = createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
}>({ locale: 'ar', setLocale: () => {} })

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar')

  useEffect(() => {
    const saved = document.cookie.match(/locale=([^;]+)/)?.[1] as Locale | undefined
    if (saved === 'ar' || saved === 'tr') setLocaleState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
    document.cookie = `locale=${locale};path=/;max-age=31536000`
  }, [locale])

  const setLocale = (l: Locale) => setLocaleState(l)

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>
}

export function useLocale() {
  return useContext(LocaleCtx)
}
