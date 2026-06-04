export type Locale = 'ar' | 'tr'

export interface Category {
  id: string
  slug: string
  name_ar: string
  name_tr: string
  image_url: string | null
  sort_order: number
  created_at: string
  parent_type?: 'collections' | 'trends' | 'none'
  parent_id?: string | null
  subcategories?: Category[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_ar: string | null
  alt_tr: string | null
  sort_order: number
}

export interface ProductModel {
  id: string
  product_id: string
  brand: string
  model_name: string
  sort_order: number
}

export interface CustomField {
  type: 'text' | 'image'
  label_tr: string
  label_ar: string
  placeholder_tr?: string
  placeholder_ar?: string
  required?: boolean
  max_length?: number
}

export interface Product {
  id: string
  slug: string
  name_ar: string
  name_tr: string
  description_ar: string | null
  description_tr: string | null
  price: number
  compare_price: number | null
  category_id: string | null
  is_active: boolean
  stock: number
  created_at: string
  updated_at: string
  category?: Category
  images?: ProductImage[]
  models?: ProductModel[]
  custom_type?: 'none' | 'image' | 'image_only' | 'text'
  custom_label_ar?: string | null
  custom_placeholder_ar?: string | null
  custom_fields?: CustomField[]
}
