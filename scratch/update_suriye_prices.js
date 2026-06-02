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

async function run() {
  try {
    // A. Query category ID for 'suriye'
    console.log('[UPDATE] Finding category "suriye"...')
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', 'suriye')
      .single()

    if (catError || !category) {
      console.error('[ERR] Category "suriye" not found in the database.')
      process.exit(1)
    }

    const categoryId = category.id
    console.log('[UPDATE] Category "suriye" ID:', categoryId)

    // B. Update prices of all products in this category to 310.00
    console.log('[UPDATE] Updating product prices to 310.00 TRY...')
    const { data, error: updateError, count } = await supabaseAdmin
      .from('products')
      .update({ price: 310.00 })
      .eq('category_id', categoryId)
      .select('id')

    if (updateError) {
      throw updateError
    }

    console.log(`[SUCCESS] Prices updated successfully for ${data?.length || 0} products!`)
    process.exit(0)
  } catch (err) {
    console.error('[FATAL ERROR DURING UPDATE]', err)
    process.exit(1)
  }
}

run()
