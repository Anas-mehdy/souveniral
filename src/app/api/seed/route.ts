import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

// Helper slugify function if needed
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim()
}

const GENERIC_COLLECTIONS = [
  'Best Selling Products',
  'En Çok Satanlar',
  'Newest Products',
  'Çok Satanlar',
  'All Products',
  'Tüm Ürünler'
]

const CATEGORY_TRANSLATIONS: Record<string, { ar: string; tr: string }> = {
  'Amedspor': { ar: 'أميد سبور', tr: 'Amedspor' },
  'Erzurumspor FK': { ar: 'أرضروم سبور', tr: 'Erzurumspor FK' },
  'Casper Telefon Kılıfları': { ar: 'كفرات كاسبر', tr: 'Casper Telefon Kılıfları' },
  'General Mobile Telefon Kılıfları': { ar: 'كفرات جنرال موبايل', tr: 'General Mobile Telefon Kılıfları' },
  'Honor Telefon Kılıfları': { ar: 'كفرات هونر', tr: 'Honor Telefon Kılıfları' },
  'Huawei Telefon Kılıfları': { ar: 'كفرات هواوي', tr: 'Huawei Telefon Kılıfları' },
  'Infinix Telefon Kılıfları': { ar: 'كفرات إنفينيكس', tr: 'Infinix Telefon Kılıfları' },
  'iPhone Telefon Kılıfları': { ar: 'كفرات آيفون', tr: 'iPhone Telefon Kılıfları' },
  'Omix Telefon Kılıfları': { ar: 'كفرات أوميكس', tr: 'Omix Telefon Kılıfları' },
  'Oppo Telefon Kılıfları': { ar: 'كفرات أوبو', tr: 'Oppo Telefon Kılıfları' },
  'Realme Telefon Kılıfları': { ar: 'كفرات ريلمي', tr: 'Realme Telefon Kılıfları' },
  'Reeder Telefon Kılıfları': { ar: 'كفرات ريدر', tr: 'Reeder Telefon Kılıfları' },
  'Araba Telefon Kılıfları': { ar: 'كفرات سيارات', tr: 'Araba Telefon Kılıfları' },
  'Film, Dizi ve Popüler Kültür Koleksiyonu': { ar: 'كفرات أفلام ومسلسلات', tr: 'Film, Dizi ve Popüler Kültür Koleksiyonu' },
  'Matematik Telefon Kılıfları': { ar: 'كفرات رياضيات', tr: 'Matematik Telefon Kılıfları' }
}

const BRAND_MODELS: Record<string, string[]> = {
  'iPhone': ['15 Pro Max', '15 Pro', '15', '14 Pro Max', '14 Pro', '13 Pro Max', '13', '12 Pro Max', '11'],
  'Samsung': ['S24 Ultra', 'S23 Ultra', 'S22 Ultra', 'A54', 'A34'],
  'Xiaomi': ['Redmi Note 13 Pro', 'Redmi Note 12 Pro', '13T Pro'],
  'Huawei': ['Mate 60 Pro', 'P60 Pro', 'Nova 11'],
  'Honor': ['90', 'X9b', 'Magic6 Pro'],
  'Oppo': ['Reno10 Pro', 'A78'],
  'Realme': ['11 Pro+', 'C55'],
  'Vivo': ['V29', 'Y36'],
  'Tecno': ['Camon 20 Pro', 'Spark 10 Pro'],
  'Infinix': ['Note 30 Pro', 'Hot 30'],
  'Casper': ['VIA VIA X30', 'VIA M30 Plus'],
  'Omix': ['X600', 'X400'],
  'Reeder': ['S19 Max Pro', 'S22 Max'],
  'General Mobile': ['GM 24 Pro', 'GM 23']
}

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const filePath = path.join(process.cwd(), 'scraping kilifal', 'products.json')
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'scraped products.json not found' }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const rawData = JSON.parse(fileContent)
    const rawProducts = rawData.products || []

    let dynamicBrandModels: Record<string, string[]> = BRAND_MODELS
    const modelsFilePath = path.join(process.cwd(), 'phone models.txt')
    if (fs.existsSync(modelsFilePath)) {
      const content = fs.readFileSync(modelsFilePath, 'utf8')
      const lines = content.split('\n')
      let currentBrand: string | null = null
      let jsonBuffer = ''
      const parsedBrands: Record<string, string[]> = {}
      
      for (let line of lines) {
        line = line.trim()
        if (!line) continue
        if (line.endsWith(':')) {
          if (currentBrand && jsonBuffer) {
            try {
              parsedBrands[currentBrand] = JSON.parse(jsonBuffer)
            } catch (e) {
              console.error('[ERR] Parsing error for', currentBrand, e)
            }
          }
          currentBrand = line.slice(0, -1).trim()
          jsonBuffer = ''
        } else {
          if (currentBrand) {
            jsonBuffer += line
          }
        }
      }
      if (currentBrand && jsonBuffer) {
        try {
          parsedBrands[currentBrand] = JSON.parse(jsonBuffer)
        } catch (e) {
          console.error('[ERR] Parsing error for final brand', currentBrand, e)
        }
      }
      if (Object.keys(parsedBrands).length > 0) {
        dynamicBrandModels = parsedBrands
        console.log(`[SEED] Parsed ${Object.keys(dynamicBrandModels).length} brands dynamically in web seeder.`)
      }
    }

    console.log(`[SEED] Starting migration for ${rawProducts.length} items...`)

    // 1. Gather all unique non-generic collection categories
    const categoriesMap = new Map<string, { slug: string; name_ar: string; name_tr: string; parent_type: string }>()
    
    // Seed our 7 explicit special collections first
    const SPECIAL_COLLECTIONS = [
      { slug: 'kisiye-ozel-telefon-kilifi-tasarla', name_tr: 'Kişiye Özel Telefon Kılıfı Tasarla', name_ar: 'Kişiye Özel Telefon Kılıfı Tasarla', parent_type: 'collections' },
      { slug: 'taraftar-ve-futbolcu-kiliflari', name_tr: 'Taraftar ve Futbolcu Kılıfları', name_ar: 'Taraftar ve Futbolcu Kılıfları', parent_type: 'collections' },
      { slug: 'islami-tasarim-ve-filistin-temali-telefon-kiliflari', name_tr: 'İslami Tasarım ve Filistin Temalı Telefon Kılıfları', name_ar: 'İslami Tasarım ve Filistin Temalı Telefon Kılıfları', parent_type: 'collections' },
      { slug: 'estetik-koleksiyonu', name_tr: 'Estetik Koleksiyonu', name_ar: 'Estetik Koleksiyonu', parent_type: 'collections' },
      { slug: 'araba-telefon-kiliflari', name_tr: 'Araba Telefon Kılıfları', name_ar: 'Araba Telefon Kılıfları', parent_type: 'collections' },
      { slug: 'matematik-telefon-kiliflari', name_tr: 'Matematik Telefon Kılıfları', name_ar: 'Matematik Telefon Kılıfları', parent_type: 'collections' },
      { slug: 'tarih-telefon-kiliflari', name_tr: 'Tarih Telefon Kılıfları', name_ar: 'Tarih Telefon Kılıfları', parent_type: 'collections' }
    ]

    SPECIAL_COLLECTIONS.forEach(col => {
      categoriesMap.set(col.slug, {
        slug: col.slug,
        name_tr: col.name_tr,
        name_ar: col.name_ar,
        parent_type: 'collections'
      })
    })

    for (const p of rawProducts) {
      const collections = p.collections || []
      for (const col of collections) {
        if (GENERIC_COLLECTIONS.includes(col)) continue
        const slug = slugify(col)
        if (!categoriesMap.has(slug)) {
          const trans = CATEGORY_TRANSLATIONS[col] || {
            tr: col,
            ar: 'كفرات ' + col.replace('Telefon Kılıfları', '').replace('Kılıfları', '').trim()
          }
          categoriesMap.set(slug, {
            slug: slug,
            name_ar: trans.ar,
            name_tr: trans.tr,
            parent_type: 'none' // Hide brands from collections lists
          })
        }
      }
    }

    // Check if the 'parent_type' column exists in the database
    const { data: sampleCats } = await supabaseAdmin.from('categories').select('*').limit(1)
    const hasParentType = sampleCats && sampleCats.length > 0 && ('parent_type' in sampleCats[0])

    const categoriesToInsert = Array.from(categoriesMap.values()).map((cat, index) => {
      const payload: any = {
        slug: cat.slug,
        name_ar: cat.name_ar,
        name_tr: cat.name_tr,
        sort_order: index,
        image_url: null as string | null
      }
      if (hasParentType) {
        payload.parent_type = cat.parent_type
      }
      return payload
    })

    // Batch insert categories
    const { data: dbCategories, error: catError } = await supabaseAdmin
      .from('categories')
      .upsert(categoriesToInsert, { onConflict: 'slug' })
      .select()

    if (catError) throw catError
    console.log(`[SEED] Upserted ${dbCategories?.length || 0} categories successfully.`)

    // Build category slug-to-ID lookup mapping
    const catIdMap = new Map<string, string>()
    for (const dbCat of dbCategories) {
      catIdMap.set(dbCat.slug, dbCat.id)
    }

    // Mappings for scraping collections
    const SLUG_MAPPING: Record<string, string> = {
      'taraftar-kiliflari': 'taraftar-ve-futbolcu-kiliflari',
      'filistin-muhafazakar': 'islami-tasarim-ve-filistin-temali-telefon-kiliflari',
      'film-dizi-ve-populer-kultur-koleksiyonu': 'estetik-koleksiyonu'
    }

    const productsToInsert: any[] = []
    const productSlugToRaw = new Map<string, any>()

    for (const p of rawProducts) {
      if (p.price === '0.00' || p.title.includes('Özelleştirme')) continue // Skip customization charge
      
      const collections = p.collections || []
      // Skip Ataturk products/covers completely
      if (
        collections.some((c: string) => c.toLowerCase().includes('ataturk') || c.toLowerCase().includes('atatürk')) ||
        p.title.toLowerCase().includes('ataturk') ||
        p.title.toLowerCase().includes('atatürk') ||
        (p.handle && (p.handle.toLowerCase().includes('ataturk') || p.handle.toLowerCase().includes('atatürk')))
      ) {
        continue
      }
      
      const slug = p.handle || slugify(p.title)
      
      // Determine primary category
      let categoryId: string | null = null
      for (const col of collections) {
        if (GENERIC_COLLECTIONS.includes(col)) continue
        let catSlug = slugify(col)
        if (SLUG_MAPPING[catSlug]) {
          catSlug = SLUG_MAPPING[catSlug]
        }
        const id = catIdMap.get(catSlug)
        if (id) {
          categoryId = id
          break
        }
      }

      // Generate bilingal Arabic product name and descriptive placeholders
      const name_tr = p.title
      const name_ar = 'كفر ' + p.title.replace('Telefon Kılıfı', '').replace('Kılıfı', '').replace('(Android/IOS Uyumlu)', '').replace('(iPhone/Android Uyumlu)', '').replace('(Tüm Modellere Uyumlu)', '').trim()
      
      const description_tr = `${p.title} yüksek kaliteli koruyucu telefon kılıfı. Çizilmelere ve darbelere karşı dayanıklı tasarım.`
      const description_ar = `كفر حماية عالي الجودة لـ ${name_ar}. تصميم مقاوم للخدوش والصدمات لحماية هاتفك بأناقة.`

      const price = parseFloat(p.price) || 299.0
      const comparePrice = p.compare_at_price ? parseFloat(p.compare_at_price) : null

      productsToInsert.push({
        slug,
        name_ar,
        name_tr,
        description_ar,
        description_tr,
        price,
        compare_price: comparePrice,
        category_id: categoryId,
        is_active: true,
        stock: Math.floor(Math.random() * 45) + 5 // Random stock between 5 and 50
      })

      productSlugToRaw.set(slug, p)
    }

    // Batch upsert products
    const { data: dbProducts, error: prodError } = await supabaseAdmin
      .from('products')
      .upsert(productsToInsert, { onConflict: 'slug' })
      .select()

    if (prodError) throw prodError
    console.log(`[SEED] Upserted ${dbProducts.length} products successfully.`)

    // 3. Prepare Product Images & Models
    const imagesToInsert: any[] = []
    const modelsToInsert: any[] = []

    for (const dbP of dbProducts) {
      const rawP = productSlugToRaw.get(dbP.slug)
      if (!rawP) continue

      // Images mapping
      const rawImages = rawP.images || []
      rawImages.forEach((img: any, idx: number) => {
        imagesToInsert.push({
          product_id: dbP.id,
          url: img.url,
          alt_tr: dbP.name_tr,
          alt_ar: dbP.name_ar,
          sort_order: idx
        })
      })

      // Make all print-on-demand covers universally compatible with all phone brands from phone models.txt
      let brands = Object.keys(dynamicBrandModels)

      let sortOrder = 0
      for (const brand of brands) {
        if (brand === 'Genel') continue
        const models = dynamicBrandModels[brand] || []
        for (const m of models) {
          modelsToInsert.push({
            product_id: dbP.id,
            brand,
            model_name: m,
            sort_order: sortOrder++
          })
        }
      }
    }

    // Clean old images and models to avoid double insertion conflicts
    const productIds = dbProducts.map(p => p.id)
    await supabaseAdmin.from('product_images').delete().in('product_id', productIds)
    await supabaseAdmin.from('product_models').delete().in('product_id', productIds)

    // Batch insert product images (chunked to prevent Postgres bind limit exceeded)
    const chunkSize = 2500
    for (let i = 0; i < imagesToInsert.length; i += chunkSize) {
      const chunk = imagesToInsert.slice(i, i + chunkSize)
      const { error: imgErr } = await supabaseAdmin.from('product_images').insert(chunk)
      if (imgErr) throw imgErr
    }
    console.log(`[SEED] Inserted ${imagesToInsert.length} product images successfully.`)

    // Batch insert product models (chunked)
    for (let i = 0; i < modelsToInsert.length; i += chunkSize) {
      const chunk = modelsToInsert.slice(i, i + chunkSize)
      const { error: modelErr } = await supabaseAdmin.from('product_models').insert(chunk)
      if (modelErr) throw modelErr
    }
    console.log(`[SEED] Inserted ${modelsToInsert.length} product compatible models successfully.`)

    // Update some category image URLs to use product images of their first item
    for (const dbCat of dbCategories) {
      const { data: catProds } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('category_id', dbCat.id)
        .limit(1)

      if (catProds && catProds.length > 0) {
        const { data: firstProdImg } = await supabaseAdmin
          .from('product_images')
          .select('url')
          .eq('product_id', catProds[0].id)
          .limit(1)
          .single()

        if (firstProdImg) {
          await supabaseAdmin
            .from('categories')
            .update({ image_url: firstProdImg.url })
            .eq('id', dbCat.id)
        }
      }
    }
    console.log(`[SEED] Automated category thumbnail images mapping finished.`)

    return NextResponse.json({
      success: true,
      message: `Database successfully seeded from products.json!`,
      stats: {
        categories: categoriesToInsert.length,
        products: productsToInsert.length,
        images: imagesToInsert.length,
        models: modelsToInsert.length
      }
    })

  } catch (err: any) {
    console.error('[SEED ERROR]', err)
    return NextResponse.json({ error: 'Migration failed', details: err.message }, { status: 500 })
  }
}
