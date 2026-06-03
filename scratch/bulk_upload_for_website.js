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
    console.warn('[SEED] phone models.txt not found. Using static defaults.');
    brandModels = {
      'iPhone': ['15 Pro Max', '15 Pro', '15', '14 Pro Max', '14 Pro', '13 Pro Max', '13', '12 Pro Max', '11'],
      'Samsung': ['S24 Ultra', 'S23 Ultra', 'S22 Ultra', 'A54', 'A34']
    };
  }
  return brandModels;
}

// 3. Category & Subcategory mapping details
const categoryMappings = {
  "تصاميم اسلامية": { slug: "tasamim-islamiah", name_ar: "تصاميم إسلامية", name_tr: "İslami Tasarımlar" },
  "تصاميم بناتية": { slug: "tasamim-banatiah", name_ar: "تصاميم بناتية", name_tr: "Kızlar İçin Tasarımlar" },
  "تصاميم حب": { slug: "tasamim-hob", name_ar: "تصاميم حب", name_tr: "Aşk Tasarımları" },
  "تصاميم عسكرية": { slug: "tasamim-askariah", name_ar: "تصاميم عسكرية", name_tr: "Askeri Tasarımlar" },
  "تصاميم فخمة": { slug: "tasamim-fakhmah", name_ar: "تصاميم فخمة", name_tr: "Lüks Tasarımlar" },
  "تصاميم ورد": { slug: "tasamim-ward", name_ar: "تصاميم ورد", name_tr: "Çiçek Tasarımları" },
  "سيارات": { slug: "araba-telefon-klflar", name_ar: "كفرات سيارات", name_tr: "Araba Telefon Kılıfları", isExisting: true },
  "سوريا": { slug: "suriye", name_ar: "كفرات سوريا", name_tr: "Suriye Telefon Kılıfları", isExisting: true },
  "فلسطين والقدس": { slug: "filastin-wal-quds", name_ar: "فلسطين والقدس", name_tr: "Filistin ve Kudüs" },
  "قطط": { slug: "qitat", name_ar: "قطط", name_tr: "Kedi Tasarımları" }
};

const syriaSubfolderMappings = {
  "ادلب": { slug: "idlib", name_ar: "إدلب", name_tr: "İdlib" },
  "الحسكة": { slug: "haseke", name_ar: "الحسكة", name_tr: "Haseke" },
  "الرقة": { slug: "rakka", name_ar: "الرقة", name_tr: "Rakka" },
  "القنيطرة": { slug: "kuneytire", name_ar: "القنيطرة", name_tr: "Kuneytire" },
  "اللاذقية": { slug: "lazkiye", name_ar: "اللاذقية", name_tr: "Lazkiye" },
  "الهوية البصرية السورية": { slug: "suriye-gorsel-kimligi", name_ar: "الهوية البصرية السورية", name_tr: "Suriye Görsel Kimliği" },
  "تشكيلة سورية": { slug: "suriye-karisik-koleksiyonu", name_ar: "تشكيلة سورية", name_tr: "Suriye Karışık Koleksiyonu" },
  "حلب": { slug: "halep", name_ar: "حلب", name_tr: "Halep" },
  "حماة": { slug: "hama", name_ar: "حماة", name_tr: "Hama" },
  "حمص": { slug: "humus", name_ar: "حمص", name_tr: "Humus" },
  "درعا": { slug: "dera", name_ar: "درعا", name_tr: "Dera" },
  "دمشق": { slug: "sam", name_ar: "دمشق", name_tr: "Şam" },
  "دير الزور": { slug: "deyrizor", name_ar: "دير الزور", name_tr: "Deyrizor" },
  "علم سوريا": { slug: "suriye-bayragi", name_ar: "علم سوريا", name_tr: "Suriye Bayrağı" }
};

// 4. Product Titles Base Elements
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

const themePhrases = {
  "تصاميم اسلامية": [
    { ar: "بتصميم إسلامي مميز وزخارف عريقة", tr: "Özel İslami tasarım ve köklü motiflerle" },
    { ar: "بنقوش إسلامية راقية تعبر عن الهوية", tr: "Kimliği ifade eden şık İslami desenli" },
    { ar: "بتصميم إسلامي أنيق وجذاب", tr: "Şık ve çekici İslami tasarımlı" },
    { ar: "بشكل إسلامي فريد وروحاني", tr: "Eşsiz ve manevi İslami tarzda" },
    { ar: "بنقش إسلامي فخم وعصري", tr: "Lüks ve modern İslami desenli" }
  ],
  "تصاميم بناتية": [
    { ar: "بتصميم بناتي لطيف وألوان زاهية", tr: "Sevimli kız tasarımı ve canlı renklerle" },
    { ar: "بتصميم بناتي رقيق وعصري", tr: "Zarif ve modern kız tasarımlı" },
    { ar: "بشكل بناتي ناعم وجذاب", tr: "Yumuşak ve çekici kız tarzında" },
    { ar: "بنمط بناتي رائع ومميز", tr: "Harika ve özel kız tarzında" },
    { ar: "بنقوش بناتية لطيفة وألوان دافئة", tr: "Sevimli kız desenleri ve sıcak renklerle" }
  ],
  "تصاميم حب": [
    { ar: "بتصميم يعبر عن الحب والرومانسية بشكل مميز", tr: "Aşkı ifade eden tasarımlı" },
    { ar: "بشكل يعبر عن الرومانسية والمشاعر الدافئة", tr: "Romantizm ve sıcak duyguları ifade eden" },
    { ar: "بقلوب رائعة تعبر عن المودة", tr: "Sevgiyi ifade eden harika kalpli" },
    { ar: "بتصميم دافئ يعبر عن الحب", tr: "Aşkı ifade eden sıcak tasarımlı" },
    { ar: "بنقوش حب رومانسية", tr: "Romantik aşk desenli" }
  ],
  "تصاميم عسكرية": [
    { ar: "بتصميم عسكري قوي بنقوش مموهة", tr: "Kamufle desenli güçlü askeri tasarımlı" },
    { ar: "بنمط عسكري رجالي فخم", tr: "Lüks erkek askeri tarzında" },
    { ar: "بتصميم عسكري جذاب ومقاوم للصدمات", tr: "Çekici ve darbeye dayanıklı askeri tasarımlı" },
    { ar: "بشكل عسكري قوي ومميز", tr: "Güçlü ve özel askeri tarzda" },
    { ar: "بنقوش عسكرية رائعة", tr: "Harika askeri desenli" }
  ],
  "تصاميم فخمة": [
    { ar: "بتصميم فخم وراقي يناسب كل الأذواق", tr: "Her zevke uygun lüks ve şık tasarımlı" },
    { ar: "بشكل فاخر وعصري وألوان متناسقة", tr: "Lüks, modern ve uyumlu renklerde" },
    { ar: "بتصميم أنيق وجذاب ذو طابع ملكي", tr: "Kraliyet karakterine sahip şık ve çekici tasarımlı" },
    { ar: "بنمط فخم يضفي جاذبية كاملة", tr: "Tam çekicilik katan lüks tarzda" },
    { ar: "بنقوش فخمة وراقية جداً", tr: "Çok lüks ve şık desenli" }
  ],
  "تصاميم ورد": [
    { ar: "بتصميم ورد زاهي وجميل يعبر عن الطبيعة", tr: "Doğayı ifade eden canlı ve güzel çiçek tasarımlı" },
    { ar: "بنقوش زهور رقيقة وألوان مبهجة", tr: "Zarif çiçek desenli ve neşeli renklerle" },
    { ar: "بتصميم زهور ناعمة وجذابة", tr: "Yumuşak ve çekici çiçek tasarımlı" },
    { ar: "بشكل ورد طبيعي أنيق ولمسة جمالية", tr: "Zarif doğal gül şeklinde ve estetik bir dokunuşla" },
    { ar: "بنمط ورود ملونة تضفي حياة لهاتفك", tr: "Telefonunuza hayat katan renkli çiçek tarzında" }
  ],
  "سيارات": [
    { ar: "بتصميم سيارة رياضية خارقة لعشاق السرعة", tr: "Hız tutkunları için süper spor araba tasarımlı" },
    { ar: "بتصميم سيارات كلاسيكية فخمة", tr: "Lüks klasik arabalar tasarımlı" },
    { ar: "بتصميم سيارات حديثة ومظهر جذاب", tr: "Modern arabalar tasarımlı ve çekici görünümlü" },
    { ar: "بنمط سيارة سباق حماسي", tr: "Heyecan verici yarış arabası tarzında" },
    { ar: "بنقش سيارة رياضية مميزة", tr: "Özel spor araba desenli" }
  ],
  "فلسطين والقدس": [
    { ar: "بتصميم المسجد الأقصى المبارك وقبة الصخرة المشرفة", tr: "Mescid-i Aksa ve Kubbetü's-Sahra tasarımlı" },
    { ar: "بتصميم خريطة فلسطين وعلمها الحبيب وصمود شعبها", tr: "Filistin haritası, sevgili bayrağı ve halkının direnişi tasarımlı" },
    { ar: "بتصميم الكوفية الفلسطينية العريقة ورموز النضال", tr: "Tarihi Filistin kefiyesi ve mücadele sembolleri tasarımlı" },
    { ar: "بشكل يعبر عن صمود وأمل فلسطين والقدس الشريف", tr: "Filistin ve Kudüs-ü Şerif'in direnişini ve umudunu ifade eden tarzda" },
    { ar: "بنمط فلسطيني مميز يعبر عن الهوية والأصالة", tr: "Kimlik ve özgünlüğü ifade eden özel Filistin tarzında" }
  ],
  "قطط": [
    { ar: "بتصميم قطة لطيفة وظريفة لعشاق الحيوانات الأليفة", tr: "Evcil hayvan severler için sevimli ve şirin kedi tasarımlı" },
    { ar: "بنقوش قطط جميلة وأشكال كرتونية مرحة", tr: "Güzel kedi desenli ve eğlenceli çizgi film şekillerinde" },
    { ar: "بتصميم قط كرتوني ظريف يضفي لمسة خاصة", tr: "Özel bir dokunuş katan şirin çizgi film kedisi tasarımlı" },
    { ar: "بشكل عيون قطة ساحرة وجذابة", tr: "Büyüleyici ve çekici kedi gözleri şeklinde" },
    { ar: "بنمط قطط مميز ولطيف يعبر عن المرح والبهجة", tr: "Eğlence ve neşeyi ifade eden özel ve sevimli kedi tarzında" }
  ],
  // Syria subfolders
  "حلب": [
    { ar: "بشكل يعبر عن أصالة حلب الشهباء وتراثها القديم", tr: "Halep'in özgünlüğünü ve eski mirasını ifade eden tarzda" },
    { ar: "بتصميم قلعة حلب العريقة وتاريخها العظيم", tr: "Tarihi Halep Kalesi tasarımlı ve harika tarihli" },
    { ar: "بنمط حلب التراثي الجميل والراقي", tr: "Güzel ve şık geleneksel Halep tarzında" }
  ],
  "دمشق": [
    { ar: "بتصميم الياسمين الدمشقي وجمال الشام القديمة", tr: "Şam yasemini tasarımlı ve eski Şam güzelliğinde" },
    { ar: "بشكل يعبر عن عراقة دمشق القديمة وتراثها الأصيل", tr: "Eski Şam'ın köklülüğünü ve özgün mirasını ifade eden tarzda" },
    { ar: "بنمط دمشقي فريد ورموز الشام الرائعة", tr: "Eşsiz Şam tarzında ve harika Şam sembolleriyle" }
  ],
  "حماة": [
    { ar: "بتصميم نواعير حماة العريقة وجمال نهر العاصي", tr: "Tarihi Hama su çarkları tasarımlı ve Asi Nehri güzelliğinde" },
    { ar: "بشكل يعبر عن أصالة وتراث حماة الجميل", tr: "Hama'nın özgünlüğünü ve güzel mirasını ifade eden tarzda" },
    { ar: "بنمط حماة المتميز والراقي", tr: "Seçkin ve şık Hama tarzında" }
  ],
  "حمص": [
    { ar: "بتصميم يعبر عن أصالة وتاريخ محافظة حمص العدية", tr: "Humus ilinin özgünlüğünü ve tarihini ifade eden tasarımlı" },
    { ar: "بشكل حمصي جميل وتراث فريد", tr: "Güzel Humus şeklinde ve eşsiz mirasla" },
    { ar: "بنمط حمص المتميز والراقي", tr: "Seçkin ve şık Humus tarzında" }
  ],
  "اللاذقية": [
    { ar: "بتصميم يعكس سحر وبحر اللاذقية وجمال طبيعتها", tr: "Lazkiye denizinin büyüsünü ve doğasının güzelliğini yansıtan tasarımlı" },
    { ar: "بشكل يعبر عن أصالة محافظة اللاذقية الساحلية", tr: "Kıyı ili Lazkiye'nin özgünlüğünü ifade eden tarzda" },
    { ar: "بنمط اللاذقية المتميز والأنيق", tr: "Seçkin ve şık Lazkiye tarzında" }
  ],
  "ادلب": [
    { ar: "بتصميم مميز وجميل لمحافظة إدلب الخضراء وتراثها", tr: "Yeşil İdlib ili ve mirası için özel ve güzel tasarımlı" },
    { ar: "بشكل يعبر عن أصالة إدلب الخضراء وتاريخها العريق", tr: "Yeşil İdlib'in özgünlüğünü og köklü tarihini ifade eden tarzda" },
    { ar: "بنمط إدلب المتميز والأنيق", tr: "Seçkin ve şık İdlib tarzında" }
  ],
  "درعا": [
    { ar: "بتصميم مميز وجذاب يعبر عن أصالة محافظة درعا", tr: "Dera ilinin özgünlüğünü ifade eden özel ve çekici tasarımlı" },
    { ar: "بشكل يعبر عن تراث درعا مهد التاريخ العريق", tr: "Köklü tarihin beşiği Dera'nın mirasını ifade eden tarzda" },
    { ar: "بنمط درعا المتميز والأنيق", tr: "Seçkin ve şık Dera tarzında" }
  ],
  "دير الزور": [
    { ar: "بتصميم جسر دير الزور المعلق العريق ونهر الفرات", tr: "Tarihi Deyrizor Asma Köprüsü tasarımlı ve Fırat Nehri temalı" },
    { ar: "بشكل يعبر عن أصالة وكرم دير الزور وتراث الفرات", tr: "Deyrizor'un özgünlüğünü, cömertliğini ve Fırat mirasını ifade eden tarzda" },
    { ar: "بنمط دير الزور المتميز والراقي", tr: "Seçkin ve şık Deyrizor tarzında" }
  ],
  "الحسكة": [
    { ar: "بتصميم يعبر عن أصالة وتاريخ محافظة الحسكة العريقة", tr: "Tarihi Haseke ilinin özgünlüğünü ve tarihini ifade eden tasarımlı" },
    { ar: "بشكل يعبر عن تراث الحسكة الجميل والمتنوع", tr: "Haseke'nin güzel ve çeşitli mirasını ifade eden tarzda" },
    { ar: "بنمط الحسكة المتميز والأنيق", tr: "Seçkin ve şık Haseke tarzında" }
  ],
  "الرقة": [
    { ar: "بتصميم جميل ومميز لمحافظة الرقة العريقة ونهر الفرات", tr: "Tarihi Rakka ili ve Fırat Nehri için güzel ve özel tasarımlı" },
    { ar: "بشكل يعبر عن أصالة الرقة وتاريخها وتراثها", tr: "Rakka'nın özgünlüğünü, tarihini ve mirasını ifade eden tarzda" },
    { ar: "بنمط الرقة المتميز والراقي", tr: "Seçkin ve şık Rakka tarzında" }
  ],
  "القنيطرة": [
    { ar: "بتصميم رائع ومميز لمحافظة القنيطرة الباسلة وأصالتها", tr: "Kahraman Kuneytire ili ve özgünlüğü için harika ve özel tasarımlı" },
    { ar: "بشكل يعبر عن تراث وفخر القنيطرة العريقة", tr: "Tarihi Kuneytire'nin mirasını ve gururunu ifade eden tarzda" },
    { ar: "بنمط القنيطرة المتميز والأنيق", tr: "Seçkin ve şık Kuneytire tarzında" }
  ],
  "علم سوريا": [
    { ar: "بتصميم علم سوريا بألوانه الوطنية الجميلة يرفرف بفخر", tr: "Gururla dalgalanan güzel ulusal renklerdeki Suriye Bayrağı tasarımlı" },
    { ar: "بشكل علم سوريا الوطني الرائع وتصميم عصري فخم", tr: "Harika ulusal Suriye Bayrağı şeklinde ve lüks modern tasarımlı" },
    { ar: "بنمط علم سوريا الجذاب لبلد الأصالة والياسمين", tr: "Özgünlük ve yasemin ülkesi Suriye Bayrağı tarzında" }
  ],
  "الهوية البصرية السورية": [
    { ar: "مستوحى من الهوية البصرية السورية العريقة وتراثها الفني", tr: "Tarihi Suriye görsel kimliğinden ve sanatsal mirasından esinlenilmiş" },
    { ar: "يجسد الهوية البصرية ورموز التراث السوري القديم", tr: "Görsel kimliği ve antik Suriye mirası sembollerini somutlaştıran" },
    { ar: "بتصميم فني راقي يعبر عن الهوية البصرية السورية المميزة", tr: "Özel Suriye görsel kimliğini ifade eden şık sanatsal tasarımlı" }
  ],
  "تشكيلة سورية": [
    { ar: "بتصميم سوري مميز يعبر عن أصالة وعراقة بلد الياسمين", tr: "Yasemin ülkesinin özgünlüğünü ve köklülüğünü ifade eden özel Suriye tasarımlı" },
    { ar: "بشكل سوري رائع من التشكيلة المتنوعة لبلد الأصالة", tr: "Özgünlük ülkesinin çeşitli koleksiyonundan harika Suriye şeklinde" },
    { ar: "بنمط سوري متميز يضفي جمالاً وتراثاً فريداً", tr: "Benzersiz bir güzellik ve miras katan seçkin Suriye tarzında" }
  ]
};

// Title Generator Function
function generateTitle(folderName, imageNumber) {
  const tPhrases = themePhrases[folderName];
  if (!tPhrases || tPhrases.length === 0) {
    // Fallback if no specific phrases
    return {
      ar: `كفر هاتف مميز بتصميم رائع - تصميم ${imageNumber}`,
      tr: `Harika tasarımlı Özel Kılıf - Tasarım ${imageNumber}`
    };
  }

  // Determine a deterministic index based on the imageNumber (or random, but deterministic ensures consistency if re-run)
  const numericVal = parseInt(imageNumber) || 0;
  
  const pIdx = (numericVal + 1) % prefixes.length;
  const sIdx = (numericVal + 3) % suffixes.length;
  const tIdx = numericVal % tPhrases.length;

  const prefix = prefixes[pIdx];
  const suffix = suffixes[sIdx];
  const theme = tPhrases[tIdx];

  const nameAr = `${prefix.ar} ${suffix.ar} ${theme.ar} - تصميم ${imageNumber}`;
  const nameTr = `${theme.tr} ${suffix.tr} ${prefix.tr} - Tasarım ${imageNumber}`;

  return { ar: nameAr, tr: nameTr };
}

// Dry run tester to inspect output formats
function dryRunTest() {
  console.log('--- Dry Run Title Generation Sample Output ---');
  const sampleFolders = ['تصاميم حب', 'حلب', 'دمشق', 'سيارات', 'قطط'];
  for (const f of sampleFolders) {
    console.log(`\nFolder: "${f}"`);
    for (let i = 1; i <= 3; i++) {
      const num = 100 + i * 7;
      const titles = generateTitle(f, num);
      console.log(`  Img #${num}:`);
      console.log(`    AR: "${titles.ar}"`);
      console.log(`    TR: "${titles.tr}"`);
      console.log(`    Slug: "${turkishSlugify(titles.tr)}"`);
    }
  }
  console.log('---------------------------------------------\n');
}

// Run dry run test immediately on script execution to verify titles
dryRunTest();

// Main Upload Function
async function startSeeding() {
  try {
    // Load Phone Models
    const BRAND_MODELS = loadPhoneModels();

    const rootDir = path.join(__dirname, '..', 'for website');
    if (!fs.existsSync(rootDir)) {
      console.error('[FATAL] Directory "for website" not found at:', rootDir);
      process.exit(1);
    }

    // 1. Resolve Category IDs mapping
    console.log('[SEED] Resolving categories in Database...');
    const dbCategoryIds = {};

    for (const [folderName, info] of Object.entries(categoryMappings)) {
      // Find or create category
      console.log(`- Resolving root category for: "${folderName}" (slug: ${info.slug})...`);
      let { data: cat, error: catError } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('slug', info.slug)
        .maybeSingle();

      if (catError) throw catError;

      if (!cat) {
        console.log(`  ➔ Creating root category: "${info.name_ar}" / "${info.name_tr}"...`);
        const { data: newCat, error: insertError } = await supabaseAdmin
          .from('categories')
          .insert({
            slug: info.slug,
            name_ar: info.name_ar,
            name_tr: info.name_tr,
            parent_type: 'collections',
            sort_order: 10
          })
          .select()
          .single();

        if (insertError) throw insertError;
        cat = newCat;
      } else {
        console.log(`  ➔ Category already exists: "${cat.name_ar}" with ID ${cat.id}`);
      }

      dbCategoryIds[folderName] = cat.id;
    }

    // 2. Resolve Syria Subcategories
    const syriaParentId = dbCategoryIds["سوريا"];
    console.log(`[SEED] Resolving Syria subcategories (parent_id: ${syriaParentId})...`);

    const dbSubcategoryIds = {};

    for (const [subfolderName, info] of Object.entries(syriaSubfolderMappings)) {
      console.log(`- Resolving Syria subcategory: "${subfolderName}" (slug: ${info.slug})...`);
      let { data: subcat, error: subError } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('slug', info.slug)
        .maybeSingle();

      if (subError) throw subError;

      if (!subcat) {
        console.log(`  ➔ Creating subcategory: "${info.name_ar}" under "سوريا"...`);
        const { data: newSubcat, error: insertSubError } = await supabaseAdmin
          .from('categories')
          .insert({
            slug: info.slug,
            name_ar: info.name_ar,
            name_tr: info.name_tr,
            parent_type: 'none',
            parent_id: syriaParentId,
            sort_order: 20
          })
          .select()
          .single();

        if (insertSubError) throw insertSubError;
        subcat = newSubcat;
      } else {
        // Update parent_id if not set to ensure correctness
        if (subcat.parent_id !== syriaParentId) {
          console.log(`  ➔ Updating subcategory parent_id to Syria parent ID...`);
          const { error: updateError } = await supabaseAdmin
            .from('categories')
            .update({ parent_id: syriaParentId, parent_type: 'none' })
            .eq('id', subcat.id);
          
          if (updateError) throw updateError;
        }
        console.log(`  ➔ Subcategory already exists: "${subcat.name_ar}" with ID ${subcat.id}`);
      }

      dbSubcategoryIds[subfolderName] = subcat.id;
    }

    // 3. Scan folders and queue products to upload
    console.log('[SEED] Scanning directories for designs...');
    const uploadQueue = []; // Array of { categoryId, categoryName, folderName, imagePath, filename, imageNumber }

    const items = fs.readdirSync(rootDir);
    for (const item of items) {
      const fullPath = path.join(rootDir, item);
      const stat = fs.statSync(fullPath);

      if (!stat.isDirectory()) continue;

      if (item === "سوريا") {
        // Syria contains subfolders
        const subfolders = fs.readdirSync(fullPath);
        for (const sub of subfolders) {
          const subPath = path.join(fullPath, sub);
          const subStat = fs.statSync(subPath);
          if (!subStat.isDirectory()) continue;

          const catId = dbSubcategoryIds[sub];
          if (!catId) {
            console.warn(`[WARN] No database subcategory ID found for Syrian subfolder: "${sub}". Skipping.`);
            continue;
          }

          const images = fs.readdirSync(subPath).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
          }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

          for (const img of images) {
            const imgPath = path.join(subPath, img);
            const imageNumber = path.basename(img, path.extname(img));
            uploadQueue.push({
              categoryId: catId,
              categoryName: sub,
              folderName: sub, // theme is subfolder
              imagePath: imgPath,
              filename: img,
              imageNumber
            });
          }
        }
      } else {
        // Other top-level folders
        const catId = dbCategoryIds[item];
        if (!catId) {
          console.warn(`[WARN] No database category ID found for folder: "${item}". Skipping.`);
          continue;
        }

        const images = fs.readdirSync(fullPath).filter(f => {
          const ext = path.extname(f).toLowerCase();
          return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
        }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        for (const img of images) {
          const imgPath = path.join(fullPath, img);
          const imageNumber = path.basename(img, path.extname(img));
          uploadQueue.push({
            categoryId: catId,
            categoryName: item,
            folderName: item, // theme is folder
            imagePath: imgPath,
            filename: img,
            imageNumber
          });
        }
      }
    }

    console.log(`[SEED] Scanned completed. Found a total of ${uploadQueue.length} products to upload.`);

    if (uploadQueue.length === 0) {
      console.log('[SEED] Upload queue is empty. Exiting.');
      process.exit(0);
    }

    // 4. Perform the uploads one by one
    let successCount = 0;
    const categoryThumbnails = {}; // Stores first public URL per category to update its thumbnail later

    for (let i = 0; i < uploadQueue.length; i++) {
      const task = uploadQueue[i];
      const indexStr = `${i + 1}/${uploadQueue.length}`;
      console.log(`[${indexStr}] Processing product for category "${task.categoryName}" file "${task.filename}"...`);

      try {
        // A. Read local image file
        const fileBuffer = fs.readFileSync(task.imagePath);
        const ext = path.extname(task.filename).toLowerCase().replace('.', '') || 'jpg';
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

        // B. Generate unique name in storage
        const cleanCategorySlug = turkishSlugify(task.categoryName);
        const uniqueFileName = `${cleanCategorySlug}-${Date.now()}-${i + 1}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
        const storagePath = `gallery/${uniqueFileName}`;

        console.log(`  - Uploading to Supabase Storage: "${storagePath}"...`);
        const { error: uploadError } = await supabaseAdmin.storage
          .from('products')
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: false
          });

        if (uploadError) {
          console.error(`  [ERR] Failed to upload image "${task.filename}" to storage:`, uploadError.message);
          continue;
        }

        // C. Retrieve public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('products')
          .getPublicUrl(storagePath);

        console.log(`  - Public URL: ${publicUrl}`);

        if (!categoryThumbnails[task.categoryId]) {
          categoryThumbnails[task.categoryId] = publicUrl;
        }

        // D. Generate title and slug
        const titles = generateTitle(task.folderName, task.imageNumber);
        
        // Ensure slug is completely unique by appending index
        let slug = turkishSlugify(titles.tr);
        
        // Quick verification of unique slug
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

        // E. Insert product
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .insert({
            slug,
            name_ar: titles.ar,
            name_tr: titles.tr,
            description_ar: `كفر حماية عالي الجودة بتصميم ${task.categoryName} مميز. مقاوم للخدوش والصدمات لحماية هاتفك بأناقة كاملة.`,
            description_tr: `Özel ${task.categoryName} tasarımlı yüksek kaliteli koruyucu telefon kılıfı. Çizilmelere ve darbelere karşı dayanıklı.`,
            price: 310.00,
            compare_price: 400.00,
            category_id: task.categoryId,
            is_active: true,
            stock: Math.floor(Math.random() * 41) + 20 // 20 to 60 stock
          })
          .select()
          .single();

        if (productError) {
          console.error(`  [ERR] Failed to insert product into database:`, productError.message);
          continue;
        }

        const productId = product.id;
        console.log(`  - Created product ID: ${productId}`);

        // F. Insert product image record
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

        // G. Associate product models compatibility
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
          // Batch in chunks of 500
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
      } catch (prodErr) {
        console.error(`[ERR] Exception error while processing file "${task.filename}":`, prodErr);
      }
    }

    // 5. Update Category image_url thumbnails
    console.log('[SEED] Updating category thumbnails...');
    for (const [catId, url] of Object.entries(categoryThumbnails)) {
      console.log(`- Updating category ID ${catId} image_url to: ${url}`);
      const { error: catUpdateError } = await supabaseAdmin
        .from('categories')
        .update({ image_url: url })
        .eq('id', catId);

      if (catUpdateError) {
        console.error(`  [ERR] Failed to update category ID ${catId} image_url:`, catUpdateError.message);
      } else {
        console.log(`  ➔ Updated successfully!`);
      }
    }

    console.log(`\n==============================================`);
    console.log(`[SUCCESS] Seeding Process Complete!`);
    console.log(`- Total Files processed: ${uploadQueue.length}`);
    console.log(`- Successfully uploaded and seeded: ${successCount}`);
    console.log(`==============================================`);

    process.exit(0);
  } catch (fatalError) {
    console.error('[FATAL SEED ERROR]', fatalError);
    process.exit(1);
  }
}

// Start Seeding Process after Dry Run
if (process.argv.includes('--dry-run')) {
  console.log('[DRY-RUN] Exiting before database connection and insertions.');
  process.exit(0);
}

startSeeding();
