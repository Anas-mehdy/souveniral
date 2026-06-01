import { supabaseAdmin } from './supabase'
import path from 'path'

export interface HeroSlide {
  title_tr: string
  title_ar: string
  desc_tr: string
  desc_ar: string
  btn_tr: string
  btn_ar: string
}

export interface TickerItem {
  tr: string
  ar: string
}

export interface PromoBanner {
  pre_tr: string
  pre_ar: string
  title_tr: string
  title_ar: string
  desc_tr: string
  desc_ar: string
  btn_tr: string
  btn_ar: string
}

export interface TrustFeature {
  title_tr: string
  title_ar: string
  desc_tr: string
  desc_ar: string
  icon: string
}

export interface StoreSettings {
  announcement_top_tr: string
  announcement_top_ar: string
  ticker_items: TickerItem[]
  hero_slides: HeroSlide[]
  promo_banner: PromoBanner
  trust_features: TrustFeature[]
  customer_gallery?: string[]
}

// Default settings from local JSON
import DEFAULT_SETTINGS from './settings-store.json'

export async function getStoreSettings(): Promise<StoreSettings> {
  if (typeof window !== 'undefined') {
    // If somehow imported in client, return default settings
    return DEFAULT_SETTINGS as StoreSettings
  }

  try {
    // Try to get settings from Supabase store_settings table
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select('*')
      .single()

    if (!error && data && data.value) {
      return { ...DEFAULT_SETTINGS, ...data.value } as StoreSettings
    }
  } catch (err) {
    // Suppress console error to prevent cluttering logs
  }

  // Fallback to local settings file
  try {
    const fs = require('fs')
    const filePath = path.join(process.cwd(), 'src/lib/settings-store.json')
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fileData) } as StoreSettings
    }
  } catch (err) {
    // Fail silently
  }

  return DEFAULT_SETTINGS as StoreSettings
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  if (typeof window !== 'undefined') return

  const current = await getStoreSettings()
  const updated = { ...current, ...settings }

  // 1. Try updating in Supabase
  try {
    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert({ id: 'global', value: updated, updated_at: new Date().toISOString() })
    
    // If no error, we are good
    if (!error) return
  } catch (err) {
    // Fail silently to try file write fallback
  }

  // 2. Local file write fallback
  try {
    const fs = require('fs')
    const filePath = path.join(process.cwd(), 'src/lib/settings-store.json')
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
  } catch (err) {
    throw new Error('Failed to update storefront settings on disk: ' + (err as Error).message)
  }
}
