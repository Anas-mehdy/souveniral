const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 1. Read env variables from .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
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

// 2. Custom Turkish-safe Slugify function
function turkishSlugify(text) {
  let str = text.toLowerCase()
  const mapping = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'â': 'a', 'î': 'i', 'û': 'u'
  }
  for (const [key, val] of Object.entries(mapping)) {
    str = str.replace(new RegExp(key, 'g'), val)
  }
  return str
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim()
}

// 3. User's 5 Arabic base titles
const arabicBaseTitles = [
  'كفر سوريا بتصميم جميل وخامة ممتازة',
  'تصاميم سوريا تصلح لكافة انواع الهواتف',
  'كفر سوريا لكل انواع الهواتف',
  'تصميم سوري خامة ممتازة',
  'كفر بتصميم سوري جميل'
]

// Local high-quality fallbacks for MyMemory translations
const fallbackTurkishTitles = [
  'Harika tasarıma ve mükemmel malzemeye sahip Suriye kılıfı',
  'Tüm telefon modellerine uygun Suriye tasarımları',
  'Tüm telefon türleri için Suriye kılıfı',
  'Mükemmel kalitede Suriye tasarımı',
  'Güzel Suriye tasarımlı kılıf'
]

// 4. Translate base titles using MyMemory API with local fallbacks
async function translateText(text, from, to) {
  let processedText = text.trim()
  if (from === 'ar') {
    processedText = processedText.replace(/كفرات/g, 'حافظات هواتف')
    processedText = processedText.replace(/كفر/g, 'حافظة هاتف')
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(processedText)}&langpair=${from}|${to}&de=info@souveniral.com`
    )
    if (res.ok) {
      const data = await res.json()
      const translated = data.responseData?.translatedText
      if (translated) {
        let resultText = translated.trim()
        if (to === 'ar') {
          resultText = resultText.replace(/(حافظات الهواتف|حافظات هواتف|أغطية الهواتف|أغطية هواتف)/g, 'كفرات')
          resultText = resultText.replace(/(حافظة الهاتف|حافظة هاتف|غطاء الهاتف|غطاء هاتف)/g, 'كفر')
        }
        return resultText
      }
    }
  } catch (err) {
    console.error(`[WARN] Translation failed for "${text}", using fallback:`, err.message)
  }
  return null
}

async function prepareTranslations() {
  const turkishTitles = []
  console.log('[SEED] Translating the 5 base titles...')
  for (let i = 0; i < arabicBaseTitles.length; i++) {
    const ar = arabicBaseTitles[i]
    let tr = await translateText(ar, 'ar', 'tr')
    if (!tr) {
      tr = fallbackTurkishTitles[i]
      console.log(`- Title ${i + 1}: Using pre-defined Turkish fallback: "${tr}"`)
    } else {
      console.log(`- Title ${i + 1}: Translated successfully: "${tr}"`)
    }
    turkishTitles.push(tr)
  }
  return turkishTitles
}

// 5. Parse phone models dynamically from phone models.txt if available
function loadPhoneModels() {
  let brandModels = {}
  const modelsFilePath = path.join(__dirname, '..', 'phone models.txt')
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
            brandModels[currentBrand] = JSON.parse(jsonBuffer)
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
        brandModels[currentBrand] = JSON.parse(jsonBuffer)
      } catch (e) {
        console.error('[ERR] Parsing error for final brand', currentBrand, e)
      }
    }
    console.log(`[SEED] Parsed ${Object.keys(brandModels).length} brands dynamically from phone models.txt`)
  } else {
    console.warn('[SEED] phone models.txt not found. Using static default brand models.')
    brandModels = {
      'iPhone': ['15 Pro Max', '15 Pro', '15', '14 Pro Max', '14 Pro', '13 Pro Max', '13', '12 Pro Max', '11'],
      'Samsung': ['S24 Ultra', 'S23 Ultra', 'S22 Ultra', 'A54', 'A34']
    }
  }
  return brandModels
}

async function run() {
  try {
    // 1. Prepare Brand Models
    const BRAND_MODELS = loadPhoneModels()

    // 2. Translate base titles
    const turkishBaseTitles = await prepareTranslations()

    // 3. Ensure Category 'suriye' exists in the database
    console.log('[SEED] Ensuring category "suriye" exists...')
    let { data: category, error: catFindError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', 'suriye')
      .maybeSingle()

    if (catFindError) {
      throw catFindError
    }

    if (!category) {
      console.log('[SEED] Category "suriye" not found. Creating it...')
      const { data: newCat, error: catInsertError } = await supabaseAdmin
        .from('categories')
        .insert({
          slug: 'suriye',
          name_ar: 'كفرات سوريا',
          name_tr: 'Suriye Kılıfları',
          parent_type: 'collections',
          sort_order: 10
        })
        .select()
        .single()

      if (catInsertError) throw catInsertError
      category = newCat
      console.log('[SEED] Category "suriye" created successfully.')
    } else {
      console.log('[SEED] Category "suriye" exists with ID:', category.id)
    }

    const categoryId = category.id

    // 4. Scan Syria folder for images
    const syriaDir = path.join(__dirname, '..', 'سوريا')
    if (!fs.existsSync(syriaDir)) {
      console.error('[ERR] "سوريا" directory not found at:', syriaDir)
      process.exit(1)
    }

    const files = fs.readdirSync(syriaDir)
      .filter(f => {
        const ext = path.extname(f).toLowerCase()
        return ext === '.jpg' || ext === '.jpeg' || ext === '.png'
      })
      // Sort alphabetically so we seed them in order
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    console.log(`[SEED] Found ${files.length} design files to upload and seed.`)

    if (files.length === 0) {
      console.warn('[SEED] No files to process. Exiting.')
      process.exit(0)
    }

    let successCount = 0
    let firstPublicUrl = null

    for (let i = 0; i < files.length; i++) {
      const filename = files[i]
      const fileIndex = i + 1
      const filePath = path.join(syriaDir, filename)
      console.log(`[${fileIndex}/${files.length}] Processing file: ${filename}...`)

      // A. Read local file
      const fileBuffer = fs.readFileSync(filePath)
      const ext = path.extname(filename).toLowerCase().replace('.', '') || 'jpg'
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'

      // B. Upload image to Supabase storage bucket 'products' under 'gallery/'
      const uniqueFileName = `suriye-${Date.now()}-${fileIndex}-${Math.random().toString(36).substring(2, 6)}.${ext}`
      const storagePath = `gallery/${uniqueFileName}`

      console.log(`  - Uploading to storage path: ${storagePath}...`)
      const { error: uploadError } = await supabaseAdmin.storage
        .from('products')
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: false
        })

      if (uploadError) {
        console.error(`  [ERR] Failed to upload image ${filename}:`, uploadError.message)
        continue
      }

      // C. Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(storagePath)

      if (!firstPublicUrl) {
        firstPublicUrl = publicUrl
      }
      console.log(`  - Public URL: ${publicUrl}`)

      // D. Generate random title with unique suffix
      const baseIdx = Math.floor(Math.random() * arabicBaseTitles.length)
      const arabicTitle = `${arabicBaseTitles[baseIdx]} - تصميم ${fileIndex}`
      const turkishTitle = `${turkishBaseTitles[baseIdx]} - Tasarım ${fileIndex}`

      const slug = turkishSlugify(turkishTitle)
      console.log(`  - Title (AR): ${arabicTitle}`)
      console.log(`  - Title (TR): ${turkishTitle}`)
      console.log(`  - Slug: ${slug}`)

      // E. Insert product
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .insert({
          slug,
          name_ar: arabicTitle,
          name_tr: turkishTitle,
          description_ar: 'كفر حماية عالي الجودة بتصميم سوري مميز. تصميم مقاوم للخدوش والصدمات لحماية هاتفك بأناقة.',
          description_tr: 'Özel Suriye tasarımlı, yüksek kaliteli koruyucu telefon kılıfı. Çizilmelere ve darbelere karşı dayanıklı.',
          price: 299.00,
          compare_price: 399.00,
          category_id: categoryId,
          is_active: true,
          stock: Math.floor(Math.random() * 41) + 10 // stock between 10 and 50
        })
        .select()
        .single()

      if (productError) {
        console.error(`  [ERR] Failed to insert product ${turkishTitle} into database:`, productError.message)
        continue
      }

      const productId = product.id
      console.log(`  - Product created with ID: ${productId}`)

      // F. Insert product image record
      const { error: imageError } = await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: productId,
          url: publicUrl,
          alt_ar: arabicTitle,
          alt_tr: turkishTitle,
          sort_order: 0
        })

      if (imageError) {
        console.error(`  [ERR] Failed to insert image record for product ID ${productId}:`, imageError.message)
      }

      // G. Insert brand phone models
      const modelsToInsert = []
      let modelSortOrder = 0
      for (const brand of Object.keys(BRAND_MODELS)) {
        if (brand === 'Genel') continue
        const models = BRAND_MODELS[brand] || []
        for (const m of models) {
          modelsToInsert.push({
            product_id: productId,
            brand,
            model_name: m,
            sort_order: modelSortOrder++
          })
        }
      }

      if (modelsToInsert.length > 0) {
        // Chunk model inserts to avoid payload size warnings/limits
        const chunkSize = 500
        let hasModelError = false
        for (let idx = 0; idx < modelsToInsert.length; idx += chunkSize) {
          const chunk = modelsToInsert.slice(idx, idx + chunkSize)
          const { error: modelError } = await supabaseAdmin
            .from('product_models')
            .insert(chunk)
          
          if (modelError) {
            console.error(`  [ERR] Failed to insert phone models chunk for product ID ${productId}:`, modelError.message)
            hasModelError = true
            break
          }
        }
        if (!hasModelError) {
          console.log(`  - Compatible phone models associated successfully: ${modelsToInsert.length} models`)
        }
      }

      successCount++
      console.log(`[OK] Product ${fileIndex}/${files.length} completely seeded!`)
    }

    // 5. Update Category image_url with the first uploaded product image as its thumbnail
    if (firstPublicUrl) {
      console.log('[SEED] Updating category "suriye" thumbnail with first product image...')
      const { error: updateCatError } = await supabaseAdmin
        .from('categories')
        .update({ image_url: firstPublicUrl })
        .eq('id', categoryId)

      if (updateCatError) {
        console.error('[ERR] Failed to update category thumbnail:', updateCatError.message)
      } else {
        console.log('[OK] Category thumbnail updated successfully!')
      }
    }

    console.log(`\n==============================================`)
    console.log(`[SUCCESS] Seeding Process Complete!`)
    console.log(`- Total Files found: ${files.length}`)
    console.log(`- Successfully uploaded and seeded: ${successCount}`)
    console.log(`==============================================`)
    
    process.exit(0)
  } catch (err) {
    console.error('[FATAL SEED ERROR]', err)
    process.exit(1)
  }
}

run()
