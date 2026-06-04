const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read env variables from .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[ERR] .env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('[ERR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRole);

// Custom Turkish-safe Slugify function
function turkishSlugify(text) {
  let str = text.toLowerCase();
  const mapping = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'â': 'a', 'î': 'i', 'û': 'u'
  };
  for (const [key, val] of Object.entries(mapping)) {
    str = str.replace(new RegExp(key, 'g'), val);
  }
  return str
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim();
}

// 2. Load Phone Models from phone models.txt
function loadPhoneModels() {
  let brandModels = {};
  const modelsFilePath = path.join(__dirname, '..', 'phone models.txt');
  if (fs.existsSync(modelsFilePath)) {
    const content = fs.readFileSync(modelsFilePath, 'utf8');
    const lines = content.split('\n');
    let currentBrand = null;
    let jsonBuffer = '';
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.endsWith(':')) {
        if (currentBrand && jsonBuffer) {
          try {
            brandModels[currentBrand] = JSON.parse(jsonBuffer);
          } catch (e) {
            console.error('[ERR] Parsing error for', currentBrand, e);
          }
        }
        currentBrand = line.slice(0, -1).trim();
        jsonBuffer = '';
      } else {
        if (currentBrand) {
          jsonBuffer += line;
        }
      }
    }
    if (currentBrand && jsonBuffer) {
      try {
        brandModels[currentBrand] = JSON.parse(jsonBuffer);
      } catch (e) {
        console.error('[ERR] Parsing error for final brand', currentBrand, e);
      }
    }
    console.log(`[SEED] Parsed ${Object.keys(brandModels).length} brands dynamically from phone models.txt`);
  } else {
    console.warn('[SEED] phone models.txt not found. Using defaults.');
    brandModels = {
      'iPhone': ['15 Pro Max', '15 Pro', '15', '14 Pro Max', '14 Pro', '13 Pro Max', '13', '12 Pro Max', '11']
    };
  }
  return brandModels;
}

// 3. Product Titles Base Elements
const prefixes = [
  { ar: "كفر هاتف", tr: "Telefon Kılıfı" },
  { ar: "حافظة هاتف", tr: "Kılıf" },
  { ar: "كفر جوال", tr: "Telefon Kapağı" },
  { ar: "كفر حماية", tr: "Koruyucu Kılıf" }
];

const suffixes = [
  { ar: "مميز", tr: "Özel" },
  { ar: "أنيق", tr: "Şık" },
  { ar: "راقي", tr: "Elit" },
  { ar: "جميل", tr: "Güzel" },
  { ar: "رائع", tr: "Harika" },
  { ar: "جذاب", tr: "Çekici" }
];

const themePhrases = [
  { ar: "بتصميم علم تركيا الوطني يرفرف بفخر", tr: "Gururla dalgalanan Türk Bayrağı tasarımlı" },
  { ar: "بتصميم الهلال والنجم التركي المميز", tr: "Özel Türk Hilal ve Yıldız tasarımlı" },
  { ar: "بتصميم يعبر عن أصالة الفن والتراث التركي", tr: "Türk sanatını ve mirasını yansıtan" },
  { ar: "بشكل علم تركيا الجذاب لعشاق التراث والوطن", tr: "Türk kültürünü yansıtan harika tasarımlı" },
  { ar: "بتصميم فني راقي لعلم تركيا الأحمر الأنيق", tr: "Şık kırmızı Türk Bayrağı tasarımlı" },
  { ar: "بتصميم خريطة تركيا وعلمها الوطني الجميل", tr: "Türkiye haritası ve Türk Bayrağı temalı" }
];

function generateTitle(imageNumber) {
  const numericVal = parseInt(imageNumber) || 0;
  
  const pIdx = (numericVal + 1) % prefixes.length;
  const sIdx = (numericVal + 3) % suffixes.length;
  const tIdx = numericVal % themePhrases.length;

  const prefix = prefixes[pIdx];
  const suffix = suffixes[sIdx];
  const theme = themePhrases[tIdx];

  const nameAr = `${prefix.ar} ${suffix.ar} ${theme.ar} - تصميم ${imageNumber}`;
  const nameTr = `${theme.tr} ${suffix.tr} ${prefix.tr} - Tasarım ${imageNumber}`;

  return { ar: nameAr, tr: nameTr };
}

async function startSeeding() {
  try {
    const BRAND_MODELS = loadPhoneModels();
    const sourceDir = path.join(__dirname, '..', 'TURKIYE');

    if (!fs.existsSync(sourceDir)) {
      console.error('[FATAL] Directory "TURKIYE" not found at:', sourceDir);
      process.exit(1);
    }

    // 1. Resolve Category 'turkiye'
    console.log('[SEED] Resolving category "turkiye" in Database...');
    let { data: cat, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', 'turkiye')
      .maybeSingle();

    if (catError) throw catError;

    if (!cat) {
      console.log('➔ Creating category: "تركيا" / "Türkiye"...');
      const { data: newCat, error: insertError } = await supabaseAdmin
        .from('categories')
        .insert({
          slug: 'turkiye',
          name_ar: 'تركيا',
          name_tr: 'Türkiye',
          parent_type: 'collections',
          sort_order: 12
        })
        .select()
        .single();

      if (insertError) throw insertError;
      cat = newCat;
    } else {
      console.log(`➔ Category already exists: "${cat.name_ar}" with ID ${cat.id}`);
    }

    const categoryId = cat.id;

    // 2. Scan directory
    const files = fs.readdirSync(sourceDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    console.log(`[SEED] Found ${files.length} design files to upload.`);

    if (files.length === 0) {
      console.log('[SEED] No files to process. Exiting.');
      process.exit(0);
    }

    let successCount = 0;
    let firstPublicUrl = null;

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const imageNumber = path.basename(filename, path.extname(filename));
      const indexStr = `${i + 1}/${files.length}`;
      const filePath = path.join(sourceDir, filename);

      console.log(`[${indexStr}] Processing file: ${filename}...`);

      try {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase().replace('.', '') || 'jpg';
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

        const uniqueFileName = `turkiye-${Date.now()}-${i + 1}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
        const storagePath = `gallery/${uniqueFileName}`;

        console.log(`  - Uploading to Storage: "${storagePath}"...`);
        const { error: uploadError } = await supabaseAdmin.storage
          .from('products')
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: false
          });

        if (uploadError) {
          console.error(`  [ERR] Failed to upload image "${filename}" to storage:`, uploadError.message);
          continue;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('products')
          .getPublicUrl(storagePath);

        console.log(`  - Public URL: ${publicUrl}`);

        if (!firstPublicUrl) {
          firstPublicUrl = publicUrl;
        }

        const titles = generateTitle(imageNumber);
        let slug = turkishSlugify(titles.tr);

        // Ensure uniqueness
        let isSlugUnique = false;
        let suffixCount = 0;
        let finalSlug = slug;
        while (!isSlugUnique) {
          const { data: existingProd, error: slugCheckError } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('slug', finalSlug)
            .maybeSingle();

          if (slugCheckError) throw slugCheckError;

          if (!existingProd) {
            isSlugUnique = true;
          } else {
            suffixCount++;
            finalSlug = `${slug}-${suffixCount}`;
          }
        }
        slug = finalSlug;

        console.log(`  - Title AR: "${titles.ar}"`);
        console.log(`  - Title TR: "${titles.tr}"`);
        console.log(`  - Slug: "${slug}"`);

        // Insert product
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .insert({
            slug,
            name_ar: titles.ar,
            name_tr: titles.tr,
            description_ar: 'كفر حماية عالي الجودة بتصميم تركي مميز وعلم تركيا الوطني. مقاوم للخدوش والصدمات لحماية هاتفك بأناقة كاملة.',
            description_tr: 'Özel Türkiye ve Türk Bayrağı tasarımlı yüksek kaliteli koruyucu telefon kılıfı. Çizilmelere ve darbelere karşı dayanıklı.',
            price: 310.00,
            compare_price: 400.00,
            category_id: categoryId,
            is_active: true,
            stock: Math.floor(Math.random() * 41) + 20
          })
          .select()
          .single();

        if (productError) {
          console.error(`  [ERR] Failed to insert product into database:`, productError.message);
          continue;
        }

        const productId = product.id;
        console.log(`  - Product ID: ${productId}`);

        // Insert image record
        const { error: imageError } = await supabaseAdmin
          .from('product_images')
          .insert({
            product_id: productId,
            url: publicUrl,
            alt_ar: titles.ar,
            alt_tr: titles.tr,
            sort_order: 0
          });

        if (imageError) {
          console.error(`  [ERR] Failed to insert image record for product ID ${productId}:`, imageError.message);
        }

        // Link models compatibility
        const modelsToInsert = [];
        let modelSortOrder = 0;
        for (const brand of Object.keys(BRAND_MODELS)) {
          if (brand === 'Genel') continue;
          const models = BRAND_MODELS[brand] || [];
          for (const m of models) {
            modelsToInsert.push({
              product_id: productId,
              brand,
              model_name: m,
              sort_order: modelSortOrder++
            });
          }
        }

        if (modelsToInsert.length > 0) {
          const chunkSize = 500;
          let hasModelError = false;
          for (let idx = 0; idx < modelsToInsert.length; idx += chunkSize) {
            const chunk = modelsToInsert.slice(idx, idx + chunkSize);
            const { error: modelError } = await supabaseAdmin
              .from('product_models')
              .insert(chunk);

            if (modelError) {
              console.error(`  [ERR] Failed to insert phone models chunk for product ID ${productId}:`, modelError.message);
              hasModelError = true;
              break;
            }
          }
          if (!hasModelError) {
            console.log(`  - Compatible models linked: ${modelsToInsert.length} models`);
          }
        }

        successCount++;
        console.log(`[OK] Product ${indexStr} completely uploaded and seeded!`);
      } catch (err) {
        console.error(`[ERR] Exception error while processing file "${filename}":`, err);
      }
    }

    // 3. Update Category thumbnail
    if (firstPublicUrl) {
      console.log(`[SEED] Updating category "turkiye" thumbnail to: ${firstPublicUrl}`);
      const { error: catUpdateError } = await supabaseAdmin
        .from('categories')
        .update({ image_url: firstPublicUrl })
        .eq('id', categoryId);

      if (catUpdateError) {
        console.error(`  [ERR] Failed to update category image_url:`, catUpdateError.message);
      } else {
        console.log(`  ➔ Updated successfully!`);
      }
    }

    console.log(`\n==============================================`);
    console.log(`[SUCCESS] Seeding Process Complete!`);
    console.log(`- Total Files processed: ${files.length}`);
    console.log(`- Successfully uploaded and seeded: ${successCount}`);
    console.log(`==============================================`);

    process.exit(0);
  } catch (fatalError) {
    console.error('[FATAL SEED ERROR]', fatalError);
    process.exit(1);
  }
}

startSeeding();
