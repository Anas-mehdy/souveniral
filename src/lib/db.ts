import { supabase, supabaseAdmin } from './supabase'
import type { Category, Product } from './types'

export async function getCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*, subcategories:categories!parent_id(*)')
    .is('parent_id', null)
    .order('sort_order')
  return (data as Category[]) ?? []
}

export async function getProducts(opts?: {
  categorySlug?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (opts?.categorySlug && opts.categorySlug !== 'all') {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', opts.categorySlug)
      .single()
    if (cat) {
      const { data: subcats } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', cat.id)
      
      const catIds = [cat.id]
      if (subcats && subcats.length > 0) {
        subcats.forEach(sc => catIds.push(sc.id))
      }
      query = query.in('category_id', catIds)
    }
  }

  if (opts?.search) {
    query = query.or(`name_ar.ilike.%${opts.search}%,name_tr.ilike.%${opts.search}%`)
  }

  const limit = opts?.limit ?? 24
  const offset = opts?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query
  return { products: (data as Product[]) ?? [], total: count ?? 0 }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) return null

  let uniqueModels: { brand: string; model_name: string }[] = []
  
  // Query compatible models of the first sample product that has them to get the complete global list
  const { data: firstModel } = await supabase
    .from('product_models')
    .select('product_id')
    .limit(1)

  if (firstModel && firstModel.length > 0) {
    const { data: modelsData } = await supabase
      .from('product_models')
      .select('brand, model_name')
      .eq('product_id', firstModel[0].product_id)

    if (modelsData) {
      uniqueModels = modelsData
    }
  }

  // Sort models alphabetically for a clean storefront selection UI
  uniqueModels.sort((a, b) => a.brand.localeCompare(b.brand) || a.model_name.localeCompare(b.model_name))

  product.models = uniqueModels
  return product as Product | null
}

export async function adminGetAllProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .order('created_at', { ascending: false })
  if (error) console.error('adminGetAllProducts error:', error)
  return (data as Product[]) ?? []
}

export async function adminGetAllCategories(): Promise<Category[]> {
  // Fetch ALL categories (roots + children) flat — admin dashboard handles grouping itself
  const { data } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order')
  return (data as Category[]) ?? []
}

export async function adminCreateProduct(p: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'models'>): Promise<Product> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(p)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function adminUpdateProduct(id: string, p: Partial<Omit<Product, 'category' | 'images' | 'models'>>): Promise<void> {
  const { error } = await supabaseAdmin.from('products').update(p).eq('id', id)
  if (error) throw error
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function adminCreateCategory(c: Omit<Category, 'id' | 'created_at' | 'subcategories'>): Promise<Category> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(c)
    .select()
    .single()
  if (error) throw error
  return data as Category
}

export async function adminUpdateCategory(id: string, c: Partial<Omit<Category, 'subcategories'>>): Promise<void> {
  const { error } = await supabaseAdmin.from('categories').update(c).eq('id', id)
  if (error) throw error
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function adminAddProductImage(productId: string, url: string, sortOrder: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('product_images')
    .insert({ product_id: productId, url, sort_order: sortOrder })
  if (error) throw error
}

export async function adminDeleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('product_images').delete().eq('id', imageId)
  if (error) throw error
}

export async function adminSetProductModels(productId: string, models: { brand: string; model_name: string }[]): Promise<void> {
  await supabaseAdmin.from('product_models').delete().eq('product_id', productId)
  if (models.length > 0) {
    const { error } = await supabaseAdmin
      .from('product_models')
      .insert(models.map((m, i) => ({ product_id: productId, ...m, sort_order: i })))
    if (error) throw error
  }
}
