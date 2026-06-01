const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 1. Read env variables from .env.local manually
const envPath = path.join(__dirname, '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('[ERR] .env.local file not found at:', envPath)
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] ? match[2].trim() : ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value
  }
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error('[ERR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(url, serviceRole)

function slugify(text) {
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

const CATEGORY_TRANSLATIONS = {
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

let BRAND_MODELS = {}
const modelsFilePath = path.join(__dirname, 'phone models.txt')
if (fs.existsSync(modelsFilePath)) {
  const content = fs.readFileSync(modelsFilePath, 'utf8')
  const lines = content.split('\n')
  let currentBrand = null
  let jsonBuffer = ''
  for (let line of lines) {
    line = line.trim()
    if (!line) continue
    if (line.endsWith(':')) {
      if (currentBrand && jsonBuffer) {
        try {
          BRAND_MODELS[currentBrand] = JSON.parse(jsonBuffer)
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
      BRAND_MODELS[currentBrand] = JSON.parse(jsonBuffer)
    } catch (e) {
      console.error('[ERR] Parsing error for final brand', currentBrand, e)
    }
  }
  console.log(`[SEED] Parsed ${Object.keys(BRAND_MODELS).length} brands dynamically from phone models.txt`)
} else {
  console.warn('[SEED] phone models.txt not found. Using static default BRAND_MODELS.')
  BRAND_MODELS = {
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
}

async function run() {
  try {
    const jsonPath = path.join(__dirname, 'scraping kilifal', 'products.json')
    if (!fs.existsSync(jsonPath)) {
      console.error('[ERR] products.json not found at:', jsonPath)
      process.exit(1)
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const rawProducts = rawData.products || []

    console.log(`[SEED] Found ${rawProducts.length} raw products. Starting migration...`)

    // 1. Gather all unique non-generic collections
    const categoriesMap = new Map()
    
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
      const payload = {
        slug: cat.slug,
        name_ar: cat.name_ar,
        name_tr: cat.name_tr,
        sort_order: index,
        image_url: null
      }
      if (hasParentType) {
        payload.parent_type = cat.parent_type
      }
      return payload
    })

    console.log(`[SEED] Upserting ${categoriesToInsert.length} categories...`)
    const { data: dbCategories, error: catError } = await supabaseAdmin
      .from('categories')
      .upsert(categoriesToInsert, { onConflict: 'slug' })
      .select()

    if (catError) throw catError
    console.log(`[SEED] Upserted ${dbCategories?.length || 0} categories successfully.`)

    const catIdMap = new Map()
    for (const dbCat of dbCategories) {
      catIdMap.set(dbCat.slug, dbCat.id)
    }

    // 2. Prepare Products
    const SLUG_MAPPING = {
      'taraftar-kiliflari': 'taraftar-ve-futbolcu-kiliflari',
      'filistin-muhafazakar': 'islami-tasarim-ve-filistin-temali-telefon-kiliflari',
      'film-dizi-ve-populer-kultur-koleksiyonu': 'estetik-koleksiyonu'
    }

    const productsToInsert = []
    const productSlugToRaw = new Map()

    for (const p of rawProducts) {
      if (p.price === '0.00' || p.title.includes('Özelleştirme')) continue
      
      const collections = p.collections || []
      // Skip Ataturk products/covers completely
      if (
        collections.some(c => c.toLowerCase().includes('ataturk') || c.toLowerCase().includes('atatürk')) ||
        p.title.toLowerCase().includes('ataturk') ||
        p.title.toLowerCase().includes('atatürk') ||
        (p.handle && (p.handle.toLowerCase().includes('ataturk') || p.handle.toLowerCase().includes('atatürk')))
      ) {
        continue
      }

      const slug = p.handle || slugify(p.title)
      
      let categoryId = null
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
        stock: Math.floor(Math.random() * 45) + 5
      })

      productSlugToRaw.set(slug, p)
    }

    console.log(`[SEED] Upserting ${productsToInsert.length} products...`)
    const { data: dbProducts, error: prodError } = await supabaseAdmin
      .from('products')
      .upsert(productsToInsert, { onConflict: 'slug' })
      .select()

    if (prodError) throw prodError
    console.log(`[SEED] Upserted ${dbProducts.length} products successfully.`)

    // 3. Prepare Images & Models
    const imagesToInsert = []
    const modelsToInsert = []

    for (const dbP of dbProducts) {
      const rawP = productSlugToRaw.get(dbP.slug)
      if (!rawP) continue

      const rawImages = rawP.images || []
      rawImages.forEach((img, idx) => {
        imagesToInsert.push({
          product_id: dbP.id,
          url: img.url,
          alt_tr: dbP.name_tr,
          alt_ar: dbP.name_ar,
          sort_order: idx
        })
      })

      // Make all print-on-demand covers universally compatible with all phone brands from phone models.txt
      let brands = Object.keys(BRAND_MODELS)

      let sortOrder = 0
      for (const brand of brands) {
        if (brand === 'Genel') continue
        const models = BRAND_MODELS[brand] || []
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

    // Clean old
    const productIds = dbProducts.map(p => p.id)
    console.log(`[SEED] Cleaning old images and models for upserted products...`)
    await supabaseAdmin.from('product_images').delete().in('product_id', productIds)
    await supabaseAdmin.from('product_models').delete().in('product_id', productIds)

    // Batch inserts with chunks
    const chunkSize = 2500
    console.log(`[SEED] Inserting ${imagesToInsert.length} product images...`)
    for (let i = 0; i < imagesToInsert.length; i += chunkSize) {
      const chunk = imagesToInsert.slice(i, i + chunkSize)
      const { error: imgErr } = await supabaseAdmin.from('product_images').insert(chunk)
      if (imgErr) throw imgErr
    }

    console.log(`[SEED] Inserting ${modelsToInsert.length} product models...`)
    for (let i = 0; i < modelsToInsert.length; i += chunkSize) {
      const chunk = modelsToInsert.slice(i, i + chunkSize)
      const { error: modelErr } = await supabaseAdmin.from('product_models').insert(chunk)
      if (modelErr) throw modelErr
    }

    // Assign Category Thumbnails
    console.log(`[SEED] Assigning thumbnail images to categories...`)
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

    console.log(`[OK] Seeding successfully completed!`)
    console.log(`- Categories Upserted: ${categoriesToInsert.length}`)
    console.log(`- Products Upserted: ${productsToInsert.length}`)
    console.log(`- Images Inserted: ${imagesToInsert.length}`)
    console.log(`- Models Inserted: ${modelsToInsert.length}`)
    
    process.exit(0)
  } catch (err) {
    console.error('[SEED ERROR]', err)
    process.exit(1)
  }
}

run()
