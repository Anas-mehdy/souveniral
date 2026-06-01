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
const DEFAULT_SETTINGS: StoreSettings = {
  announcement_top_tr: "🚚 3 AL 2 ÖDE FIRSATI! TÜM SİPARİŞLERDE ÜCRETSİZ KARGO + KAPIDA NAKİT ÖDEME!",
  announcement_top_ar: "🚚 عرض 3 بسعر 2! شحن مجاني بالكامل لجميع الطلبات + الدفع عند الاستلام!",
  ticker_items: [
    {
      tr: "3 Al 2 Öde Fırsatını Kaçırma!",
      ar: "لا تفوت عرض اشترِ 3 واحصل على 2 مجاناً!"
    },
    {
      tr: "Hayalindeki Tasarımı Kılıfına Taşı - Tarzını Sen Belirle!",
      ar: "صمم كفر هاتفك بنفسك وعبر عن أسلوبك!"
    },
    {
      tr: "Kapıda Ödeme ile Güvenli Alışveriş",
      ar: "الدفع عند الاستلام لتسوق آمن وسهل!"
    },
    {
      tr: "Yeni Duyuru",
      ar: "إعلان متحرك جديد"
    }
  ],
  hero_slides: [
    {
      title_tr: "Tarzınızı Yansıtan Kılıflar",
      title_ar: "كفرات تعبر عن شخصيتك وأناقتك",
      desc_tr: "iPhone, Samsung ve tüm popüler modeller için darbe emici, yüksek kaliteli özel tasarım telefon kılıfları.",
      desc_ar: "كفرات حماية فائقة ومقاومة للصدمات مصممة خصيصاً لأجهزة آيفون، سامسونج وكافة الهواتف بأشكال فريدة.",
      btn_tr: "Koleksiyonu Keşfet",
      btn_ar: "اكتشف المجموعة"
    },
    {
      title_tr: "Kişiye Özel Kılıf Tasarla 🎨",
      title_ar: "صمم كفر هاتفك على ذوقك 🎨",
      desc_tr: "İsminizi, plakanızı veya en sevdiğiniz fotoğrafı ekleyerek tamamen size özel bir kılıf hazırlayın.",
      desc_ar: "أضف اسمك، لوحة سيارتك المفضلة أو صورتك الشخصية لنصنع لك كفراً مخصصاً لك بالكامل.",
      btn_tr: "Kendin Tasarla",
      btn_ar: "صمم كفرك الآن"
    }
  ],
  promo_banner: {
    pre_tr: "Kişiye Özel Tasarım",
    pre_ar: "طلب مخصص بالكامل",
    title_tr: "Aracınızın Plakası ve Adı Kılıfınızda Parlasın!",
    title_ar: "أضف اسمك وهاتف سيارتك في كفر مخصص!",
    desc_tr: "Favori araba markanızı seçin, adınızı ve plakanızı yazarak tamamen size ait eşsiz kılıfı hemen hazırlayalım.",
    desc_ar: "اختر شعار ماركة سيارتك، اكتب لوحتك الخاصة واجعل هاتفك فريداً ومميزاً.",
    btn_tr: "Kendin Tasarla 🎨",
    btn_ar: "صمم كفرك الخاص الآن 🎨"
  },
  trust_features: [
    {
      title_tr: "Premium Koruma",
      title_ar: "حماية فائقة ومتانة",
      desc_tr: "Darbe emici, çizilmeye dayanıklı çift katmanlı yapı.",
      desc_ar: "كفرات مزدوجة الطبقات مقاومة للخدش والسقوط",
      icon: "ShieldCheck"
    },
    {
      title_tr: "Birebir Uyum",
      title_ar: "تطابق تام ومثالي",
      desc_tr: "Hassas kesim delikler ve tuşlar ile tam uyum.",
      desc_ar: "أزرار مرنة وتطابق دقيق لمخارج الشحن والكاميرا",
      icon: "Smartphone"
    },
    {
      title_tr: "Hızlı Kargo",
      title_ar: "شحن وتوصيل مجاني",
      desc_tr: "Tüm Türkiye'ye kargo ücretsiz! Adresinize teslim.",
      desc_ar: "توصيل مجاني تماماً لجميع المدن + كود تتبع مباشر",
      icon: "Compass"
    }
  ],
  customer_gallery: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=80"
  ]
}

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
