'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Category, Product, ProductImage, ProductModel, CustomField } from '@/lib/types'
import { 
  Plus, Search, Edit2, Image as ImageIcon, Smartphone, Trash2, 
  LogOut, Layers, Package, Eye, EyeOff, AlertTriangle, X, Check, Loader2,
  ShoppingBag, Clock, Truck, CheckCircle2, Download, ExternalLink, UploadCloud,
  TrendingUp, Globe, Monitor, MousePointer, Users, BarChart2
} from 'lucide-react'
import { Order } from '@/lib/orders'

interface Props {
  initialProducts: Product[]
  initialCategories: Category[]
}

const BRAND_MODELS_LIST: Record<string, string[]> = {
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

export function DashboardClient({ initialProducts, initialCategories }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'analytics'>('products')

  // Analytics States
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('30d')

  async function fetchAnalytics(range: string) {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`)
      if (res.ok) {
        const data = await res.json()
        setAnalyticsData(data)
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (err) {
      console.error('Network error fetching analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics(analyticsRange)
    }
  }, [analyticsRange, activeTab])

  // Orders Management States
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderSearchQuery, setOrderSearchQuery] = useState('')

  // Fetch all orders
  async function fetchOrders() {
    setOrdersLoading(true)
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Load orders on mount
  useEffect(() => {
    fetchOrders()
  }, [])

  // Update order status
  async function handleStatusUpdate(orderId: string, status: Order['status'], trackingUrl?: string | null) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, tracking_url: trackingUrl })
      })
      if (res.ok) {
        const updated: Order = await res.json()
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated)
        }
      } else {
        alert('Failed to update status')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  // Delete an order
  async function handleDeleteOrder(orderId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟ / Bu siparişi silmek istediğinizden emin misiniz?')) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
        setOrderModalOpen(false)
      } else {
        alert('Failed to delete order')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  function handleTabChange(tab: 'products' | 'categories' | 'orders' | 'analytics') {
    setActiveTab(tab)
    if (tab === 'orders') {
      fetchOrders()
    } else if (tab === 'analytics') {
      fetchAnalytics(analyticsRange)
    }
  }

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [productPage, setProductPage] = useState(1)
  const PRODUCTS_PER_PAGE = 15

  useEffect(() => {
    setProductPage(1)
  }, [searchQuery, categoryFilter])

  // Loading indicator states
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Current active product/category for Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Modals visibility toggles
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productModalMode, setProductModalMode] = useState<'add' | 'edit'>('add')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add')
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modelModalOpen, setModelModalOpen] = useState(false)

  // Form states - Product
  const [prodSlug, setProdSlug] = useState('')
  const [prodNameAr, setProdNameAr] = useState('')
  const [prodNameTr, setProdNameTr] = useState('')
  const [prodDescAr, setProdDescAr] = useState('')
  const [prodDescTr, setProdDescTr] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodComparePrice, setProdComparePrice] = useState('')
  const [prodCategoryId, setProdCategoryId] = useState('')
  const [prodIsActive, setProdIsActive] = useState(true)
  const [prodCustomType, setProdCustomType] = useState<'none' | 'image' | 'image_only' | 'text'>('none')
  const [prodCustomLabelAr, setProdCustomLabelAr] = useState('')
  const [prodCustomPlaceholderAr, setProdCustomPlaceholderAr] = useState('')
  const [prodCustomFields, setProdCustomFields] = useState<CustomField[]>([])

  // Bulk selection states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [savingBulkAction, setSavingBulkAction] = useState(false)

  // Clear selections when filters or page changes
  useEffect(() => {
    setSelectedProductIds([])
  }, [searchQuery, categoryFilter, productPage])

  const handleSelectProductToggle = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAllToggle = () => {
    const allPaginatedSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id))
    if (allPaginatedSelected) {
      setSelectedProductIds(prev => prev.filter(id => !paginatedProducts.some(p => p.id === id)))
    } else {
      setSelectedProductIds(prev => {
        const newSelections = paginatedProducts.filter(p => !prev.includes(p.id)).map(p => p.id)
        return [...prev, ...newSelections]
      })
    }
  }

  const handleClearSelections = () => {
    setSelectedProductIds([])
  }

  async function handleBulkUpdateCategory(categoryId: string) {
    setSavingBulkAction(true)
    try {
      const promises = selectedProductIds.map(id =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: categoryId || null })
        }).then(async res => {
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || `Failed to update product ${id}`)
          }
          return id
        })
      )
      
      await Promise.all(promises)

      // Update local state inline
      setProducts(prev => 
        prev.map(p => 
          selectedProductIds.includes(p.id) 
            ? { ...p, category_id: categoryId || null } 
            : p
        )
      )

      setSelectedProductIds([])
      alert('تم تحديث الأقسام بنجاح! / Kategoriler başarıyla güncellendi!')
    } catch (err: any) {
      alert('حدث خطأ أثناء التحديث الجماعي: / Toplu güncelleme hatası: ' + err.message)
    } finally {
      setSavingBulkAction(false)
    }
  }

  async function handleBulkDeleteProducts() {
    setSavingBulkAction(true)
    try {
      const promises = selectedProductIds.map(id =>
        fetch(`/api/admin/products/${id}`, {
          method: 'DELETE'
        }).then(async res => {
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || `Failed to delete product ${id}`)
          }
          return id
        })
      )
      
      await Promise.all(promises)

      // Update local state inline
      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)))

      setSelectedProductIds([])
      alert('تم حذف المنتجات المحددة بنجاح! / Seçili ürünler başarıyla silindi!')
    } catch (err: any) {
      alert('حدث خطأ أثناء الحذف الجماعي: / Toplu silme hatası: ' + err.message)
    } finally {
      setSavingBulkAction(false)
    }
  }

  // Form states - Category
  const [catSlug, setCatSlug] = useState('')
  const [catNameAr, setCatNameAr] = useState('')
  const [catNameTr, setCatNameTr] = useState('')
  const [catImageUrl, setCatImageUrl] = useState('')
  const [catUploading, setCatUploading] = useState(false)
  const [catSortOrder, setCatSortOrder] = useState('0')
  const [catParentType, setCatParentType] = useState<'collections' | 'trends' | 'none'>('collections')
  const [catParentId, setCatParentId] = useState<string>('')

  // Form states - Models Selector
  const [selectedModels, setSelectedModels] = useState<{ brand: string; model_name: string }[]>([])

  // Calculate Metrics
  const stats = useMemo(() => {
    const totalProd = products.length
    const totalCat = categories.length
    const activeProd = products.filter(p => p.is_active).length
    return { totalProd, totalCat, activeProd }
  }, [products, categories])

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name_tr.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        p.category_id === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, categoryFilter])

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PRODUCTS_PER_PAGE
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE)
  }, [filteredProducts, productPage])

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.order_code.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
        (o.first_name + ' ' + o.last_name).toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
        o.phone.includes(orderSearchQuery) || 
        o.email.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.city.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.address.toLowerCase().includes(orderSearchQuery.toLowerCase())
      
      const matchesStatus = 
        orderStatusFilter === 'all' || 
        o.status === orderStatusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [orders, orderSearchQuery, orderStatusFilter])

  // Actions - Authenticated Logout
  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  // Modals open triggers
  function openAddProductModal() {
    setProdSlug('')
    setProdNameAr('')
    setProdNameTr('')
    setProdDescAr('')
    setProdDescTr('')
    setProdPrice('')
    setProdComparePrice('')
    setProdCategoryId(categories[0]?.id ?? '')
    setProdIsActive(true)
    setProdCustomType('none')
    setProdCustomLabelAr('')
    setProdCustomPlaceholderAr('')
    setProdCustomFields([])
    setProductModalMode('add')
    setProductModalOpen(true)
  }

  function openEditProductModal(p: Product) {
    setSelectedProduct(p)
    setProdSlug(p.slug)
    setProdNameAr(p.name_ar)
    setProdNameTr(p.name_tr)
    setProdDescAr(p.description_ar ?? '')
    setProdDescTr(p.description_tr ?? '')
    setProdPrice(p.price.toString())
    setProdComparePrice(p.compare_price?.toString() ?? '')
    setProdCategoryId(p.category_id ?? '')
    setProdIsActive(p.is_active)
    setProdCustomType(p.custom_type ?? 'none')
    setProdCustomLabelAr(p.custom_label_ar ?? '')
    setProdCustomPlaceholderAr(p.custom_placeholder_ar ?? '')
    setProdCustomFields(p.custom_fields ?? [])
    setProductModalMode('edit')
    setProductModalOpen(true)
  }

  function openAddCategoryModal() {
    setCatSlug('')
    setCatNameAr('')
    setCatNameTr('')
    setCatImageUrl('')
    setCatSortOrder('0')
    setCatParentType('collections')
    setCatParentId('')
    setCategoryModalMode('add')
    setCategoryModalOpen(true)
  }

  function openEditCategoryModal(c: Category) {
    setSelectedCategory(c)
    setCatSlug(c.slug)
    setCatNameAr(c.name_ar)
    setCatNameTr(c.name_tr)
    setCatImageUrl(c.image_url ?? '')
    setCatSortOrder(c.sort_order.toString())
    setCatParentType(c.parent_type ?? 'collections')
    setCatParentId(c.parent_id ?? '')
    setCategoryModalMode('edit')
    setCategoryModalOpen(true)
  }

  async function openImageManagerModal(p: Product) {
    // Re-fetch details to ensure we have latest images list
    const res = await fetch(`/api/admin/products`)
    if (res.ok) {
      const fullList: Product[] = await res.json()
      const updated = fullList.find(x => x.id === p.id)
      setSelectedProduct(updated ?? p)
    } else {
      setSelectedProduct(p)
    }
    setImageModalOpen(true)
  }

  async function openModelManagerModal(p: Product) {
    setSelectedProduct(p)
    // Re-fetch full details to read product_models
    const res = await fetch(`/api/admin/products`)
    if (res.ok) {
      const fullList: Product[] = await res.json()
      const updated = fullList.find(x => x.id === p.id)
      const existing = updated?.models ?? []
      setSelectedModels(existing.map(m => ({ brand: m.brand, model_name: m.model_name })))
    } else {
      setSelectedModels([])
    }
    setModelModalOpen(true)
  }

  // CRUD Product Actions
  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      slug: prodSlug,
      name_ar: prodNameAr,
      name_tr: prodNameAr, // set Turkish name to Arabic as requested for Arabic-only admin
      description_ar: prodDescAr || null,
      description_tr: prodDescAr || null, // set Turkish description to Arabic
      price: parseFloat(prodPrice),
      compare_price: prodComparePrice ? parseFloat(prodComparePrice) : null,
      category_id: prodCategoryId || null,
      stock: 99999,
      is_active: prodIsActive,
      custom_type: prodCustomType,
      custom_label_ar: prodCustomType === 'text' ? prodCustomLabelAr : null,
      custom_placeholder_ar: prodCustomType !== 'none' ? prodCustomPlaceholderAr : null,
      custom_fields: prodCustomFields
    }

    try {
      let res
      if (productModalMode === 'add') {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`/api/admin/products/${selectedProduct?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        setProductModalOpen(false)
        // Refresh local listing
        const listRes = await fetch('/api/admin/products')
        if (listRes.ok) setProducts(await listRes.json())
      } else {
        const err = await res.json()
        alert('Hata / Error: ' + (err.error || 'Operation failed'))
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz? / Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id))
      } else {
        alert('Delete failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  async function toggleProductActive(p: Product) {
    const nextActive = !p.is_active
    // Optimistic UI updates
    setProducts(products.map(x => x.id === p.id ? { ...x, is_active: nextActive } : x))

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive })
      })
      if (!res.ok) {
        // Rollback
        setProducts(products.map(x => x.id === p.id ? { ...x, is_active: p.is_active } : x))
        alert('Failed to update status')
      }
    } catch (err) {
      setProducts(products.map(x => x.id === p.id ? { ...x, is_active: p.is_active } : x))
    }
  }

  // CRUD Category Actions
  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      slug: catSlug,
      name_ar: catNameAr,
      name_tr: catNameAr, // set Turkish category name to Arabic
      image_url: catImageUrl || null,
      sort_order: parseInt(catSortOrder) || 0,
      parent_type: catParentId ? 'none' as const : catParentType,
      parent_id: catParentId || null
    }

    try {
      let res
      if (categoryModalMode === 'add') {
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`/api/admin/categories/${selectedCategory?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        setCategoryModalOpen(false)
        const listRes = await fetch('/api/admin/categories')
        if (listRes.ok) setCategories(await listRes.json())
      } else {
        const err = await res.json()
        alert('Hata / Error: ' + (err.error || 'Operation failed'))
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCategoryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCatUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setCatImageUrl(data.url)
      } else {
        const err = await res.json()
        alert('Resim yüklenemedi / Upload failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Ağ hatası / Network error during upload')
    } finally {
      setCatUploading(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz? / Are you sure you want to delete this category?')) return

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id))
      } else {
        alert('Delete failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  // Image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedProduct) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sort_order', (selectedProduct.images?.length ?? 0).toString())

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/images`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        // Refresh selected product info to display the new image
        await openImageManagerModal(selectedProduct)
        
        // Refresh general products list as well
        const listRes = await fetch('/api/admin/products')
        if (listRes.ok) setProducts(await listRes.json())
      } else {
        const err = await res.json()
        alert('Upload failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Network error during upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteImage(image: ProductImage) {
    if (!confirm('Resmi silmek istiyor musunuz? / Delete this image?')) return

    // Extract storage filename path if uploaded via Supabase Storage
    let storagePath = ''
    if (image.url.includes('/storage/v1/object/public/products/')) {
      storagePath = image.url.split('/products/').pop() ?? ''
    }

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct?.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id, storagePath })
      })

      if (res.ok) {
        if (selectedProduct) await openImageManagerModal(selectedProduct)
        const listRes = await fetch('/api/admin/products')
        if (listRes.ok) setProducts(await listRes.json())
      } else {
        alert('Delete image failed')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  // Models Selection Sync
  function toggleModelSelected(brand: string, modelName: string) {
    const exists = selectedModels.some(x => x.brand === brand && x.model_name === modelName)
    if (exists) {
      setSelectedModels(selectedModels.filter(x => !(x.brand === brand && x.model_name === modelName)))
    } else {
      setSelectedModels([...selectedModels, { brand, model_name: modelName }])
    }
  }

  async function handleModelsSave() {
    if (!selectedProduct) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/models`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: selectedModels })
      })

      if (res.ok) {
        setModelModalOpen(false)
        const listRes = await fetch('/api/admin/products')
        if (listRes.ok) setProducts(await listRes.json())
      } else {
        alert('Save models failed')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Kılıf Store Admin
            </span>
            <span className="text-xs bg-indigo-900/60 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
              Bilingual (AR/TR)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/?edit=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all text-sm font-semibold cursor-pointer"
            >
              <ExternalLink size={16} />
              <span>تعديل الصفحة الرئيسية 🏠 / Anasayfa Düzenle</span>
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-xl text-slate-300 hover:text-white transition-colors text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>تسجيل الخروج / Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Metrics & Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Top metrics grids */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">المنتجات / Ürünler</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{stats.totalProd}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Package size={20} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">الأقسام / Kategoriler</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{stats.totalCat}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Layers size={20} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">نشط / Aktif</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">{stats.activeProd}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Check size={20} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">الطلبات / Siparişler</p>
              <h3 className="text-2xl font-bold mt-1 text-indigo-400">{orders.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-8 gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => handleTabChange('products')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'products' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            إدارة المنتجات / Ürün Yönetimi
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'categories' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            إدارة الأقسام / Kategori Yönetimi
          </button>
          <button
            onClick={() => handleTabChange('orders')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            إدارة الطلبات / Sipariş Yönetimi
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            التحليلات والتقارير / Analiz ve Raporlar
          </button>
        </div>

        {/* Tab 1: Products */}
        {activeTab === 'products' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Filter toolbar */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث المنتجات... / Ürün ara..."
                    className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">جميع الأقسام / Tüm Kategoriler</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name_tr}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={openAddProductModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <Plus size={16} />
                <span>إضافة منتج / Ürün Ekle</span>
              </button>
            </div>

            {/* Bulk actions banner */}
            {selectedProductIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-4 bg-slate-900 border border-[#0da19a]/35 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-[#0da19a]/20 text-[#0da19a] px-3 py-1.5 rounded-xl border border-[#0da19a]/20">
                    تم تحديد {selectedProductIds.length} منتج / {selectedProductIds.length} ürün seçildi
                  </span>
                  <button
                    onClick={handleClearSelections}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-bold underline cursor-pointer"
                  >
                    إلغاء التحديد / Seçimi Temizle
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Bulk Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      تغيير القسم إلى: / Kategoriyi Değiştir:
                    </span>
                    <select
                      disabled={savingBulkAction}
                      onChange={async (e) => {
                        const targetCatId = e.target.value
                        if (!targetCatId) return
                        if (confirm(`هل أنت متأكد من نقل ${selectedProductIds.length} منتج إلى هذا القسم؟\nSeçili ${selectedProductIds.length} ürünü bu kategoriye taşımak istediğinizden emin misiniz?`)) {
                          await handleBulkUpdateCategory(targetCatId)
                          e.target.value = "" // Reset select value
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="">اختر القسم... / Kategori Seç...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name_ar} / {c.name_tr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bulk Delete Button */}
                  <button
                    disabled={savingBulkAction}
                    onClick={async () => {
                      if (confirm(`⚠️ تحذير: هل أنت متأكد من حذف ${selectedProductIds.length} منتج بشكل نهائي؟ لا يمكن التراجع عن هذه الخطوة!\n⚠️ Uyarı: Seçili ${selectedProductIds.length} ürünü kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
                        await handleBulkDeleteProducts()
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingBulkAction ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                    <span>حذف جماعي / Toplu Sil</span>
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-4 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id))}
                        onChange={handleSelectAllToggle}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0da19a]"
                      />
                    </th>
                    <th className="px-6 py-4">صورة / Foto</th>
                    <th className="px-6 py-4">المنتج / Ürün</th>
                    <th className="px-6 py-4">القسم / Kategori</th>
                    <th className="px-6 py-4">السعر / Fiyat</th>
                    <th className="px-6 py-4 text-center">نشط / Aktif</th>
                    <th className="px-6 py-4 text-right">خيارات / İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        لا توجد نتائج / Ürün bulunamadı
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map(p => {
                      const primaryImg = p.images?.[0]?.url
                      const cat = categories.find(c => c.id === p.category_id)
                      return (
                        <tr key={p.id} className={`hover:bg-slate-800/20 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-[#0da19a]/5' : ''}`}>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <input 
                              type="checkbox"
                              checked={selectedProductIds.includes(p.id)}
                              onChange={() => handleSelectProductToggle(p.id)}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0da19a]"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {primaryImg ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-800 relative bg-slate-950">
                                <Image src={primaryImg} alt={p.name_tr} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 text-lg">
                                📱
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-white">{p.name_tr}</p>
                              <p className="text-xs text-slate-400 mt-0.5 dir-rtl text-right font-medium">{p.name_ar}</p>
                              <p className="text-xs text-slate-600 mt-1 font-mono">{p.slug}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-full text-slate-300">
                              {cat ? cat.name_tr : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                            <div>
                              <span>₺{p.price.toFixed(2)}</span>
                              {p.compare_price && (
                                <span className="text-xs text-slate-500 line-through ml-2">
                                  ₺{p.compare_price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleProductActive(p)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                p.is_active 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-slate-950 text-slate-600 border border-slate-850'
                              }`}
                            >
                              {p.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditProductModal(p)}
                                title="Edit product information"
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded-lg cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => openImageManagerModal(p)}
                                title="Manage product images"
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-purple-400 border border-slate-800 rounded-lg cursor-pointer"
                              >
                                <ImageIcon size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Delete product listing"
                                className="p-2 bg-slate-950 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-900/30 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredProducts.length > PRODUCTS_PER_PAGE && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-5 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <button
                  type="button"
                  suppressHydrationWarning
                  disabled={productPage === 1}
                  onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2.5 text-xs font-bold bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 border border-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer select-none disabled:cursor-not-allowed"
                >
                  ← السابق / Geri
                </button>
                <span className="text-xs font-semibold text-slate-400">
                  الصفحة {productPage} من {Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)} (إجمالي {filteredProducts.length} منتج)
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  disabled={productPage * PRODUCTS_PER_PAGE >= filteredProducts.length}
                  onClick={() => setProductPage(prev => prev + 1)}
                  className="px-4 py-2.5 text-xs font-bold bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 border border-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer select-none disabled:cursor-not-allowed"
                >
                  التالي / İleri →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Categories */}
        {activeTab === 'categories' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <h4 className="font-semibold text-white">الأقسام / Kategoriler ({categories.length})</h4>
              
              <button
                onClick={openAddCategoryModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <Plus size={16} />
                <span>إضافة قسم / Kategori Ekle</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">صورة / Resim</th>
                    <th className="px-6 py-4">القسم / Kategori</th>
                    <th className="px-6 py-4">slug / المعرّف</th>
                    <th className="px-6 py-4 text-center">الترتيب / Sıralama</th>
                    <th className="px-6 py-4 text-right">خيارات / İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        لا توجد أقسام / Kategori bulunamadı
                      </td>
                    </tr>
                  ) : (
                    categories.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {c.image_url ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-800 relative bg-slate-950">
                              <Image src={c.image_url} alt={c.name_tr} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 text-lg">
                              📁
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-white">{c.name_tr}</p>
                            <p className="text-xs text-slate-400 mt-0.5 dir-rtl text-right font-medium">{c.name_ar}</p>
                            {c.parent_id && (
                              <p className="text-[10px] text-indigo-400 mt-1 font-semibold">
                                ↳ {categories.find(p => p.id === c.parent_id)?.name_ar ?? 'قسم فرعي'}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">
                          {c.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-white">
                          {c.sort_order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditCategoryModal(c)}
                              className="p-2 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded-lg cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-2 bg-slate-950 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-900/30 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Orders Management */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-300">
            {/* Filter toolbar */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    placeholder="بحث في الطلبات (الاسم، الرمز، الهاتف، المدينة)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">جميع الحالات / Tüm Durumlar</option>
                  <option value="pending">قيد الانتظار / Beklemede</option>
                  <option value="processing">قيد التجهيز / Hazırlanıyor</option>
                  <option value="shipped">تم الشحن / Kargolandı</option>
                  <option value="completed">مكتمل / Tamamlandı</option>
                  <option value="cancelled">ملغي / İptal Edildi</option>
                </select>
              </div>

              <button
                onClick={fetchOrders}
                disabled={ordersLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 hover:border-slate-750 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                {ordersLoading ? <Loader2 className="animate-spin" size={16} /> : <span>تحديث الطلبات 🔄</span>}
              </button>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">رمز الطلب</th>
                    <th className="px-6 py-4">العميل / الهاتف</th>
                    <th className="px-6 py-4">المدينة / العنوان</th>
                    <th className="px-6 py-4">المجموع النهائي</th>
                    <th className="px-6 py-4 text-center">حالة الطلب</th>
                    <th className="px-6 py-4 text-right">خيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} />
                          <span>جاري تحميل الطلبات...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-550 text-slate-500 font-bold">
                        لا توجد طلبات متوفرة
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const dateFormatted = new Date(order.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-white bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg select-all">
                              {order.order_code}
                            </span>
                            <p className="text-[10px] text-slate-500 font-semibold mt-2">{dateFormatted}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-white">{order.first_name} {order.last_name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{order.phone}</p>
                              <p className="text-[10px] text-slate-650 text-slate-500 font-semibold truncate max-w-[150px]">{order.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-xs px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/30 rounded-full text-indigo-300 font-semibold">
                                {order.city}
                              </span>
                              <p className="text-xs text-slate-400 mt-1.5 truncate max-w-[180px]">{order.address}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-black text-white">
                            ₺{order.grand_total.toFixed(2)}
                            {order.discount > 0 && (
                              <p className="text-[9px] text-rose-500 font-bold mt-1">خصم 3 بسعر 2: -₺{order.discount}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full border ${
                              order.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : order.status === 'processing'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                : order.status === 'shipped'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : order.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {order.status === 'pending'
                                ? 'قيد الانتظار / Beklemede'
                                : order.status === 'processing'
                                ? 'قيد التجهيز / Hazırlanıyor'
                                : order.status === 'shipped'
                                ? 'تم الشحن / Kargolandı'
                                : order.status === 'completed'
                                ? 'مكتمل / Tamamlandı'
                                : 'ملغي / İptal Edildi'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setSelectedOrder(order); setOrderModalOpen(true); }}
                                title="عرض تفاصيل الطلب وتحديث حالته"
                                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-850 border-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                عرض التفاصيل 👁️
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                title="حذف الطلب نهائياً"
                                className="p-2 bg-slate-950 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-900/30 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <div>
                <h3 className="text-base font-black text-indigo-400">لوحة تحليلات الزوار / Analiz ve Rapor Paneli</h3>
                <p className="text-xs text-slate-550 text-slate-400 mt-1">تعقب زيارات الموقع ومسارات التحويل بشكل حي ومباشر</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">النطاق الزمني:</span>
                <select
                  value={analyticsRange}
                  onChange={(e: any) => setAnalyticsRange(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs font-semibold text-white rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="today">اليوم / Bugün</option>
                  <option value="yesterday">أمس / Dün</option>
                  <option value="7d">آخر 7 أيام / Son 7 Gün</option>
                  <option value="30d">آخر 30 يوم / Son 30 Gün</option>
                </select>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl gap-3">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
                <span className="text-xs text-slate-400 font-semibold">جاري تحميل البيانات الإحصائية...</span>
              </div>
            ) : analyticsData ? (
              <>
                {/* KPIs Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-xs font-bold">الزوار الفريدين / Tekil Ziyaretçi</span>
                      <Users size={16} className="text-indigo-400" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">{analyticsData.metrics.visitors}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">الأجهزة الفريدة التي تصفحت الموقع</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-xs font-bold">مشاهدات الصفحات / Sayfa Görüntüleme</span>
                      <BarChart2 size={16} className="text-cyan-400" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">{analyticsData.metrics.pageviews}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">إجمالي التصفح والنقرات بالمتجر</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-xs font-bold">المبيعات الناجحة / Başarılı Sipariş</span>
                      <ShoppingBag size={16} className="text-emerald-400" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">{analyticsData.metrics.purchases}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">الطلبات المكتملة في هذا النطاق</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-xs font-bold">معدل التحويل / Dönüşüm Oranı</span>
                      <TrendingUp size={16} className="text-amber-400" />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-white">{analyticsData.metrics.conversionRate}%</h3>
                      <p className="text-[10px] text-slate-500 mt-1">نسبة الشراء مقارنة بإجمالي الزوار</p>
                    </div>
                  </div>
                </div>

                {/* Main Graph & Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Graph */}
                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-350 text-slate-300 uppercase tracking-widest">معدل الزيارات وتصفح الصفحات / Trafik Grafiği</h4>
                      <div className="flex gap-4 text-[10px] font-bold">
                        <span className="flex items-center gap-1.5 text-cyan-450 text-cyan-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/20 border border-cyan-400" />
                          مشاهدات الصفحات
                        </span>
                        <span className="flex items-center gap-1.5 text-indigo-450 text-indigo-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400/20 border border-indigo-400" />
                          الزوار الفريدين
                        </span>
                      </div>
                    </div>
                    
                    <SVGChart 
                      labels={analyticsData.chart.labels}
                      series1={analyticsData.chart.pageviews}
                      series2={analyticsData.chart.visitors}
                      label1="مشاهدات الصفحات"
                      label2="الزوار الفريدين"
                    />
                  </div>

                  {/* Funnel */}
                  <FunnelChart funnel={analyticsData.funnel} />
                </div>

                {/* Breakdown Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Pages */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                    <h4 className="text-xs font-black text-indigo-450 text-indigo-450 text-indigo-400 uppercase tracking-widest">الصفحات الأكثر زيارة / Popüler Sayfalar</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-slate-400 text-right dir-rtl font-sans">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold">
                            <th className="pb-2 text-right">رابط الصفحة</th>
                            <th className="pb-2 text-center">المشاهدات</th>
                            <th className="pb-2 text-center">الزيارات الفريدة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analyticsData.breakdowns.pages.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-950/20">
                              <td className="py-2.5 font-mono text-left select-all text-slate-300 truncate max-w-xs">{p.path}</td>
                              <td className="py-2.5 text-center text-white font-bold">{p.views}</td>
                              <td className="py-2.5 text-center">{p.unique}</td>
                            </tr>
                          ))}
                          {analyticsData.breakdowns.pages.length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-center py-4 text-slate-650 text-slate-500">لا توجد بيانات</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Traffic Sources */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                    <h4 className="text-xs font-black text-indigo-450 text-indigo-400 uppercase tracking-widest">مصادر الزيارات / Trafik Kaynakları</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-slate-400 text-right dir-rtl font-sans">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold">
                            <th className="pb-2 text-right">المصدر</th>
                            <th className="pb-2 text-center">عدد الزيارات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analyticsData.breakdowns.referrers.map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-950/20">
                              <td className="py-2.5 font-semibold text-slate-350 text-slate-350 text-slate-300">{r.name}</td>
                              <td className="py-2.5 text-center text-white font-bold">{r.visits}</td>
                            </tr>
                          ))}
                          {analyticsData.breakdowns.referrers.length === 0 && (
                            <tr>
                              <td colSpan={2} className="text-center py-4 text-slate-650 text-slate-500">لا توجد بيانات</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Countries */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                    <h4 className="text-xs font-black text-indigo-450 text-indigo-400 uppercase tracking-widest">الدول والبلدان / Ülkeler</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-slate-400 text-right dir-rtl font-sans">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold">
                            <th className="pb-2 text-right">الدولة</th>
                            <th className="pb-2 text-center">الزيارات الفريدة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analyticsData.breakdowns.countries.map((c: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-950/20">
                              <td className="py-2.5 font-semibold text-slate-300 flex items-center gap-2">
                                <span className="text-base">{getFlagEmoji(c.code)}</span>
                                <span>{c.code}</span>
                              </td>
                              <td className="py-2.5 text-center text-white font-bold">{c.visits}</td>
                            </tr>
                          ))}
                          {analyticsData.breakdowns.countries.length === 0 && (
                            <tr>
                              <td colSpan={2} className="text-center py-4 text-slate-650 text-slate-500">لا توجد بيانات</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Devices & Browsers */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-indigo-450 text-indigo-450 text-indigo-400 uppercase tracking-widest mb-3">الأجهزة والمتصفحات / Cihaz ve Tarayıcı</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Devices */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">نوع الجهاز (Cihaz Tipi)</span>
                          <div className="space-y-1">
                            {analyticsData.breakdowns.devices.map((d: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-800/30">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  {d.name === 'mobile' ? '📱' : d.name === 'tablet' ? '📟' : '💻'}
                                  {d.name === 'mobile' ? 'هاتف' : d.name === 'tablet' ? 'تابلت' : 'حاسوب'}
                                </span>
                                <span className="text-white font-bold">{d.visits}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Browsers */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">المتصفح (Tarayıcı)</span>
                          <div className="space-y-1">
                            {analyticsData.breakdowns.browsers.slice(0, 4).map((b: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-800/30">
                                <span className="text-slate-400 truncate max-w-[80px]">{b.name}</span>
                                <span className="text-white font-bold">{b.visits}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                فشل في تحميل التحليلات
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: ADD/EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {productModalMode === 'add' ? 'إضافة منتج جديد' : 'تعديل المنتج'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">اسم المنتج بالعربية / Ürün Adı</label>
                <input
                  type="text"
                  required
                  value={prodNameAr}
                  onChange={e => setProdNameAr(e.target.value)}
                  placeholder="كفر Always Couple"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">معرّف الرابط / Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={prodSlug}
                  onChange={e => setProdSlug(e.target.value)}
                  placeholder="always-couple-telefon-kilifi"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">السعر (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    placeholder="310.00"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">السعر قبل الخصم (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodComparePrice}
                    onChange={e => setProdComparePrice(e.target.value)}
                    placeholder="349.90"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">القسم / Kategori</label>
                <select
                  value={prodCategoryId}
                  onChange={e => setProdCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">بدون قسم</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">وصف المنتج بالعربية / Ürün Açıklaması</label>
                <textarea
                  rows={2}
                  value={prodDescAr}
                  onChange={e => setProdDescAr(e.target.value)}
                  placeholder="كفر حماية عالي الجودة بملمس ناعم..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm text-right dir-rtl"
                />
              </div>

              {/* خيارات التخصيص للطباعة عند الطلب */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-[#0da19a] uppercase tracking-wider">
                  خيارات الطباعة والتخصيص عند الطلب (Print on Demand)
                </h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">نوع التخصيص المطلوب للمنتج</label>
                  <select
                    value={prodCustomType}
                    onChange={e => setProdCustomType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="none">لا يوجد (منتج قياسي عادي)</option>
                    <option value="image">رفع صورة مخصصة للطباعة + تفاصيل نصية</option>
                    <option value="image_only">رفع صورة مخصصة للطباعة فقط</option>
                    <option value="text">كتابة نص/حرف مخصص للطباعة</option>
                  </select>
                </div>

                {prodCustomType === 'text' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">عنوان حقل النص المطلوب (مثال: أدخل الحرف المطلوب)</label>
                      <input
                        type="text"
                        required
                        value={prodCustomLabelAr}
                        onChange={e => setProdCustomLabelAr(e.target.value)}
                        placeholder="أدخل الاسم أو الحرف المطلوب"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">النص المساعد للتوضيح (مثال: كتابة الاسم المطلوب طباعته)</label>
                      <input
                        type="text"
                        value={prodCustomPlaceholderAr}
                        onChange={e => setProdCustomPlaceholderAr(e.target.value)}
                        placeholder="كتابة الاسم المطلوب طباعته على الكفر"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                      />
                    </div>
                  </div>
                )}

                {(prodCustomType === 'image' || prodCustomType === 'image_only') && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">شرح/تعليمات رفع الصورة الشخصية</label>
                    <input
                      type="text"
                      value={prodCustomPlaceholderAr}
                      onChange={e => setProdCustomPlaceholderAr(e.target.value)}
                      placeholder="الرجاء رفع صورتك هنا بجودة عالية لتتم طباعتها"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                    />
                  </div>
                )}

                {/* MULTIPLE CUSTOM FIELDS SETTINGS */}
                {prodCustomType !== 'none' && (
                  <div className="border border-slate-850 bg-slate-950/40 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-indigo-400">حقول تخصيص إضافية متعددة (اختياري)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setProdCustomFields(prev => [
                            ...prev,
                            { type: 'text', label_tr: 'Alan ' + (prev.length + 1), label_ar: 'حقل ' + (prev.length + 1), placeholder_tr: '', placeholder_ar: '', required: true }
                          ])
                        }}
                        className="px-3 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                      >
                        + إضافة حقل مخصص
                      </button>
                    </div>

                    {prodCustomFields.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-2">لم تقم بإضافة حقول متعددة بعد. الحقل الافتراضي كافٍ.</p>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {prodCustomFields.map((field, idx) => (
                          <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3 relative group/field">
                            <div className="flex justify-between items-center border-b border-slate-850/50 pb-1.5">
                              <span className="text-[10px] font-bold text-slate-400">حقل التخصيص #{idx + 1}</span>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.required ?? true}
                                    onChange={e => {
                                      const updated = [...prodCustomFields]
                                      updated[idx].required = e.target.checked
                                      setProdCustomFields(updated)
                                    }}
                                    className="rounded border-slate-800 text-indigo-600 bg-slate-900"
                                  />
                                  <span>مطلوب</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setProdCustomFields(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-300 p-0.5"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Type */}
                              <div className="col-span-2">
                                <label className="block text-[9px] font-bold text-slate-500 mb-1">نوع الحقل</label>
                                <select
                                  value={field.type}
                                  onChange={e => {
                                    const updated = [...prodCustomFields]
                                    updated[idx].type = e.target.value as any
                                    setProdCustomFields(updated)
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="text">نص مخصص / Metin</option>
                                  <option value="image">صورة مرفوعة من العميل / Görsel Yükleme</option>
                                </select>
                              </div>

                              {/* Label Arabic */}
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-1">اسم الحقل (العربية) *</label>
                                <input
                                  type="text"
                                  required
                                  value={field.label_ar}
                                  onChange={e => {
                                    const updated = [...prodCustomFields]
                                    updated[idx].label_ar = e.target.value
                                    // Mirror to Turkish label for convenience
                                    if (!updated[idx].label_tr || updated[idx].label_tr.startsWith('Alan')) {
                                      updated[idx].label_tr = e.target.value
                                    }
                                    setProdCustomFields(updated)
                                  }}
                                  placeholder="مثال: 1. الاسم"
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none text-right dir-rtl"
                                />
                              </div>

                              {/* Label Turkish */}
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-1">اسم الحقل (التركية) *</label>
                                <input
                                  type="text"
                                  required
                                  value={field.label_tr}
                                  onChange={e => {
                                    const updated = [...prodCustomFields]
                                    updated[idx].label_tr = e.target.value
                                    setProdCustomFields(updated)
                                  }}
                                  placeholder="مثال: 1. İsim"
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none"
                                />
                              </div>

                              {/* Placeholder Arabic */}
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-1">وصف توضيحي للعميل (العربية)</label>
                                <input
                                  type="text"
                                  value={field.placeholder_ar ?? ''}
                                  onChange={e => {
                                    const updated = [...prodCustomFields]
                                    updated[idx].placeholder_ar = e.target.value
                                    if (!updated[idx].placeholder_tr) updated[idx].placeholder_tr = e.target.value
                                    setProdCustomFields(updated)
                                  }}
                                  placeholder="مثال: اكتب الاسم الأول المطلوب"
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none text-right dir-rtl"
                                />
                              </div>

                              {/* Placeholder Turkish */}
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-1">وصف توضيحي للعميل (التركية)</label>
                                <input
                                  type="text"
                                  value={field.placeholder_tr ?? ''}
                                  onChange={e => {
                                    const updated = [...prodCustomFields]
                                    updated[idx].placeholder_tr = e.target.value
                                    setProdCustomFields(updated)
                                  }}
                                  placeholder="مثال: ilk başta olmasını istediğiniz..."
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none"
                                />
                              </div>

                              {/* Character Limit for Text field */}
                              {field.type === 'text' && (
                                <div className="col-span-2">
                                  <label className="block text-[9px] font-bold text-slate-500 mb-1">الحد الأقصى لعدد الحروف / Karakter Sınırı (افتراضي 20)</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={field.max_length ?? 20}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 20
                                      const updated = [...prodCustomFields]
                                      updated[idx].max_length = val
                                      setProdCustomFields(updated)
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prodIsActive"
                  checked={prodIsActive}
                  onChange={e => setProdIsActive(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 bg-slate-950"
                />
                <label htmlFor="prodIsActive" className="text-sm text-slate-300 font-semibold cursor-pointer">
                  عرض كمنتج نشط في المتجر
                </label>
              </div>

              {/* تنبيه إدارة الصور */}
              <div className="bg-slate-955 border border-slate-850 rounded-xl p-3 text-right dir-rtl text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-indigo-400">🖼️ إدارة صور المنتج:</p>
                <p>لتسهيل إضافة صور متعددة وترتيبها وحذفها، يتم إدارة صور المنتج بشكل منفصل. يرجى حفظ معلومات المنتج أولاً، ثم الضغط على **أيقونة الصورة 🖼️** البنفسجية الموجودة بجانب اسم المنتج في جدول المنتجات لرفع وتعديل صوره في أي وقت.</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT CATEGORY */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {categoryModalMode === 'add' ? 'إضافة قسم جديد' : 'تعديل القسم'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">اسم القسم بالعربية / Kategori Adı</label>
                <input
                  type="text"
                  required
                  value={catNameAr}
                  onChange={e => setCatNameAr(e.target.value)}
                  placeholder="كفرات آيفون"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">slug الرابط / URL</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={e => setCatSlug(e.target.value)}
                  placeholder="iphone-telefon-kiliflari"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  صورة القسم / Kategori Görseli
                </label>
                
                {catImageUrl ? (
                  <div className="relative group/catimg rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video max-w-xs flex items-center justify-center">
                    <img 
                      src={catImageUrl} 
                      alt="Category preview" 
                      className="w-full h-full object-cover"
                    />
                    {/* Hover controls to change or remove */}
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover/catimg:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer shadow-lg transition-transform hover:scale-105">
                        <UploadCloud size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={catUploading}
                          onChange={handleCategoryUpload}
                          className="hidden" 
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setCatImageUrl('')}
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-lg transition-transform hover:scale-105"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 bg-slate-950/40 hover:bg-slate-950/80 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer max-w-xs">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={catUploading}
                      onChange={handleCategoryUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <UploadCloud size={24} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
                    <span className="text-[10px] text-slate-450 font-bold text-center select-none">
                      {catUploading ? 'جاري الرفع / Yükleniyor...' : 'اختر صورة للقسم / Kategori Görseli Seç'}
                    </span>
                  </div>
                )}
                
                {/* Optional URL input fallback to allow raw entry if necessary */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={catImageUrl}
                    onChange={e => setCatImageUrl(e.target.value)}
                    placeholder="أو اكتب رابط الصورة هنا / Veya resim URL'si girin..."
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 text-[10px] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">ترتيب العرض / Sıralama</label>
                <input
                  type="number"
                  required
                  value={catSortOrder}
                  onChange={e => setCatSortOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">القسم الأب / Üst Kategori</label>
                <select
                  value={catParentId}
                  onChange={e => setCatParentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
                >
                  <option value="">بلا — قسم رئيسي / Üst Kategori Yok</option>
                  {categories
                    .filter(c => !c.parent_id && c.id !== selectedCategory?.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                </select>
                {catParentId && (
                  <p className="text-[10px] text-indigo-400 mt-1 font-semibold">
                    ℹ️ القسم الفرعي لا يظهر في الصفحة الرئيسية — يظهر فقط تحت قسمه الأب
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">تصنيف الأب / Kategori Türü</label>
                <select
                  value={catParentType}
                  onChange={e => setCatParentType(e.target.value as any)}
                  disabled={!!catParentId}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-right dir-rtl disabled:opacity-40"
                >
                  <option value="collections">مجموعات / Koleksiyonlar</option>
                  <option value="trends">تريندات / Trendler</option>
                  <option value="none">بلا / Yok (None)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  إلغاء / İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  <span>حفظ / Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMAGES MANAGER */}
      {imageModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">إدارة صور المنتج / Ürün Görselleri</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">{selectedProduct.name_tr}</p>
              </div>
              <button onClick={() => setImageModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image files lists */}
              <div className="grid grid-cols-4 gap-3">
                {(selectedProduct.images ?? []).map(img => (
                  <div key={img.id} className="group relative aspect-square bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <Image src={img.url} alt="Product case" fill className="object-cover" />
                    <button
                      onClick={() => handleDeleteImage(img)}
                      title="Delete Image"
                      className="absolute inset-0 bg-red-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {/* Empty slot placeholder */}
                {(!selectedProduct.images || selectedProduct.images.length === 0) && (
                  <div className="col-span-4 py-8 text-center text-slate-500 text-sm">
                    لا توجد صور لهذا المنتج / Görsel bulunmuyor.
                  </div>
                )}
              </div>

              {/* Upload field */}
              <div className="border-t border-slate-800 pt-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  رفع صورة جديدة / Yeni Görsel Yükle
                </label>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleImageUpload}
                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/10 file:text-indigo-400 hover:file:bg-indigo-600/20 file:transition-colors file:cursor-pointer"
                  />
                  {uploading && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-indigo-400 text-xs">
                      <Loader2 className="animate-spin" size={14} />
                      <span>جاري الرفع... / Yükleniyor...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PHONE MODEL COMPATIBILITIES SELECTOR */}
      {modelModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">الموديلات المتوافقة / Uyumlu Telefon Modelleri</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">{selectedProduct.name_tr}</p>
              </div>
              <button onClick={() => setModelModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {Object.entries(BRAND_MODELS_LIST).map(([brand, models]) => (
                <div key={brand} className="space-y-2.5">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800/60 pb-1">{brand}</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {models.map(modelName => {
                      const isSelected = selectedModels.some(x => x.brand === brand && x.model_name === modelName)
                      return (
                        <button
                          key={modelName}
                          onClick={() => toggleModelSelected(brand, modelName)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-700'
                          }`}
                        >
                          {modelName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModelModalOpen(false)}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                إلغاء / İptal
              </button>
              <button
                type="button"
                onClick={handleModelsSave}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                <span>حفظ التعديلات / Değişiklikleri Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ORDERS VIEW & FULFILLMENT MODAL */}
      {orderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>تفاصيل الطلب:</span>
                  <span className="font-mono text-indigo-400 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg select-all">{selectedOrder.order_code}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  تاريخ الطلب: {new Date(selectedOrder.created_at).toLocaleString('tr-TR')}
                </p>
              </div>
              <button onClick={() => setOrderModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Row 1: Status changer & actions */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">حالة الطلب الحالية:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={e => handleStatusUpdate(selectedOrder.id, e.target.value as any, selectedOrder.tracking_url)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="pending">قيد الانتظار / Beklemede</option>
                      <option value="processing">قيد التجهيز / Hazırlanıyor</option>
                      <option value="shipped">تم الشحن / Kargolandı</option>
                      <option value="completed">مكتمل / Tamamlandı</option>
                      <option value="cancelled">ملغي / İptal Edildi</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="px-4 py-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-900/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    حذف الطلب نهائياً 🗑️
                  </button>
                </div>

                {selectedOrder.status === 'shipped' && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-900">
                    <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest block">
                      رابط تتبع الشحنة / Kargo Takip Linki
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أدخل رابط التتبع هنا (مثال: رابط PTT)..."
                        defaultValue={selectedOrder.tracking_url || ''}
                        onBlur={e => handleStatusUpdate(selectedOrder.id, 'shipped', e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-200 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          handleStatusUpdate(selectedOrder.id, 'shipped', input.value);
                          alert('تم حفظ رابط التتبع بنجاح! / Takip linki kaydedildi.');
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        حفظ / Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Customer Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">تفاصيل العميل</h4>
                  <div className="text-xs space-y-1 font-semibold text-slate-300">
                    <p><span className="text-slate-500 font-bold">الاسم:</span> {selectedOrder.first_name} {selectedOrder.last_name}</p>
                    <p><span className="text-slate-500 font-bold">البريد الإلكتروني:</span> <a href={`mailto:${selectedOrder.email}`} className="text-indigo-400 hover:underline">{selectedOrder.email}</a></p>
                    <p><span className="text-slate-500 font-bold">رقم الهاتف:</span> <a href={`tel:${selectedOrder.phone}`} className="text-indigo-400 hover:underline font-mono">{selectedOrder.phone}</a></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">تفاصيل الشحن والتوصيل (PTT)</h4>
                  <div className="text-xs space-y-1 font-semibold text-slate-300">
                    <p><span className="text-slate-500 font-bold">الدولة:</span> {selectedOrder.country}</p>
                    <p><span className="text-slate-500 font-bold">المدينة / المحافظة:</span> {selectedOrder.city}</p>
                    <p><span className="text-slate-500 font-bold">المنطقة / الحي:</span> {selectedOrder.district}</p>
                    <p><span className="text-slate-500 font-bold">العنوان بالتفصيل:</span> {selectedOrder.address}</p>
                    {selectedOrder.postal_code && <p><span className="text-slate-500 font-bold">الرمز البريدي:</span> {selectedOrder.postal_code}</p>}
                  </div>
                </div>
              </div>

              {/* Row 3: Ordered Customized Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">المنتجات المطلوبة للطباعة</h4>
                
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/30 border border-slate-850 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <Image src={item.image} alt={item.name_tr} fill className="object-cover" />
                          ) : (
                            <span className="text-xl">📱</span>
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white">{item.name_ar}</h5>
                          <p className="text-[10px] text-indigo-400 font-black mt-0.5">{item.brand} {item.model}</p>
                          <p className="text-[10px] text-slate-550 text-slate-500 font-semibold mt-1">الكمية: {item.quantity} × ₺{item.price}</p>
                        </div>
                      </div>

                      {/* Customized variables (Engravings or custom images) */}
                      <div className="w-full sm:w-auto text-right sm:text-left">
                        {item.custom_type === 'text' && item.custom_text && (
                          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-2.5 inline-block text-right">
                            <p className="text-[9px] text-slate-500 font-bold">الاسم/الحرف المطلوب طباعته ✏️</p>
                            <p className="text-xs font-black text-white mt-1 select-all">{item.custom_text}</p>
                          </div>
                        )}

                        {(item.custom_type === 'image' || item.custom_type === 'image_only') && item.custom_image && (
                          <div className="flex flex-col items-center sm:items-start gap-1">
                            <p className="text-[9px] text-slate-550 text-slate-500 font-bold">التصميم الشخصي للطباعة 🖼️</p>
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-800 group bg-slate-950 inline-block shadow-lg">
                              <img src={item.custom_image} alt="Design upload" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <a
                                href={item.custom_image}
                                download={`order-${selectedOrder.order_code}-design-${item.brand}-${item.model}.png`}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-[8px] font-black text-white cursor-pointer"
                              >
                                <Download size={12} />
                                تحميل الصورة
                              </a>
                            </div>
                            {item.custom_details && (
                              <p className="text-[9px] text-slate-400 italic mt-1 font-semibold max-w-[150px] truncate" title={item.custom_details}>
                                تفاصيل إضافية: {item.custom_details}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Multiple Custom Fields Values rendering */}
                        {item.custom_fields_values && Object.keys(item.custom_fields_values).length > 0 && (
                          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 inline-block text-right dir-rtl w-full sm:max-w-xs shadow-md mt-2">
                            <p className="text-[9px] text-indigo-400 font-bold border-b border-slate-850 pb-1 mb-1.5 flex items-center justify-between">
                              <span>تفاصيل التخصيص المطلوبة</span>
                              <span>🎨</span>
                            </p>
                            <div className="space-y-1.5">
                              {Object.entries(item.custom_fields_values).map(([label, value]) => {
                                const displayLabel = label.includes('|')
                                  ? label.split('|')[1].trim()
                                  : label
                                return (
                                  <div key={label} className="text-[10px] leading-relaxed">
                                    <span className="text-slate-500 font-semibold">{displayLabel}: </span>
                                    {value.startsWith('http') ? (
                                      <div className="inline-block relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 group bg-slate-900 shadow-sm align-top mt-1">
                                        <img src={value} alt="" className="w-full h-full object-cover" />
                                        <a
                                          href={value}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[8px] font-black text-white cursor-pointer"
                                        >
                                          <ExternalLink size={10} />
                                        </a>
                                      </div>
                                    ) : (
                                      <span className="font-extrabold text-white select-all">{value}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Pricing totals */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col gap-2.5 max-w-sm mr-auto font-semibold">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>مجموع المنتجات:</span>
                  <span>₺{selectedOrder.total_price.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-400 font-bold">
                    <span>خصم 3 بسعر 2:</span>
                    <span>-₺{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>تكلفة الشحن (PTT):</span>
                  <span>₺{selectedOrder.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>المجموع الإجمالي:</span>
                  <span className="text-indigo-400 text-base">₺{selectedOrder.grand_total.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer animate-pulse"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// Custom SVG Area Chart & Funnel Components for Store Analytics (RTL Safe)
// ----------------------------------------------------------------------

function SVGChart({ labels, series1, series2, label1, label2 }: { labels: string[], series1: number[], series2: number[], label1: string, label2: string }) {
  const chartHeight = 220
  const chartWidth = 600
  const paddingLeft = 45
  const paddingBottom = 30
  const paddingTop = 15
  const paddingRight = 15

  const graphHeight = chartHeight - paddingTop - paddingBottom
  const graphWidth = chartWidth - paddingLeft - paddingRight

  const n = labels.length
  if (n === 0) return <div className="text-slate-550 text-slate-500 text-xs text-center py-10">لا توجد بيانات كافية للرسم البياني</div>

  const maxVal = Math.max(...series1, ...series2, 5)

  // Generate coordinates
  const points1 = series1.map((val, i) => {
    const x = paddingLeft + (n > 1 ? (i / (n - 1)) * graphWidth : 0)
    const y = paddingTop + graphHeight - (val / maxVal) * graphHeight
    return { x, y }
  })

  const points2 = series2.map((val, i) => {
    const x = paddingLeft + (n > 1 ? (i / (n - 1)) * graphWidth : 0)
    const y = paddingTop + graphHeight - (val / maxVal) * graphHeight
    return { x, y }
  })

  // Build SVG path strings
  const linePath1 = points1.length > 0 ? `M ${points1.map(p => `${p.x} ${p.y}`).join(' L ')}` : ''
  const areaPath1 = points1.length > 0 ? `${linePath1} L ${points1[points1.length - 1].x} ${paddingTop + graphHeight} L ${points1[0].x} ${paddingTop + graphHeight} Z` : ''

  const linePath2 = points2.length > 0 ? `M ${points2.map(p => `${p.x} ${p.y}`).join(' L ')}` : ''
  const areaPath2 = points2.length > 0 ? `${linePath2} L ${points2[points2.length - 1].x} ${paddingTop + graphHeight} L ${points2[0].x} ${paddingTop + graphHeight} Z` : ''

  // Grid lines
  const gridLines = []
  const gridCount = 4
  for (let i = 0; i <= gridCount; i++) {
    const y = paddingTop + (i / gridCount) * graphHeight
    const val = Math.round(maxVal - (i / gridCount) * maxVal)
    gridLines.push({ y, val })
  }

  // X-axis label ticks
  const labelTicks = []
  const step = Math.max(1, Math.floor(n / 6))
  for (let i = 0; i < n; i += step) {
    labelTicks.push({ x: points1[i].x, label: labels[i] })
  }
  if (n > 1 && (n - 1) % step !== 0) {
    labelTicks.push({ x: points1[n - 1].x, label: labels[n - 1] })
  }

  return (
    <div className="w-full h-64 relative bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl font-sans">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0da19a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0da19a" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines & Y-axis labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={chartWidth - paddingRight} 
              y2={line.y} 
              stroke="#1e293b" 
              strokeWidth="1" 
              strokeDasharray={idx === gridCount ? "0" : "4 4"}
            />
            <text 
              x={paddingLeft - 8} 
              y={line.y + 4} 
              fill="#94a3b8" 
              fontSize="10" 
              textAnchor="end"
              className="font-medium"
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* Areas */}
        {areaPath1 && <path d={areaPath1} fill="url(#grad1)" />}
        {areaPath2 && <path d={areaPath2} fill="url(#grad2)" />}

        {/* Lines */}
        {linePath1 && (
          <path 
            d={linePath1} 
            fill="none" 
            stroke="#0da19a" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}
        {linePath2 && (
          <path 
            d={linePath2} 
            fill="none" 
            stroke="#6366f1" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Data points dots */}
        {points1.map((p, idx) => (
          <circle 
            key={`c1-${idx}`} 
            cx={p.x} 
            cy={p.y} 
            r="3.5" 
            fill="#0da19a" 
            stroke="#0f172a" 
            strokeWidth="1.5"
            className="hover:r-5 cursor-pointer transition-all"
          >
            <title>{`${label1}: ${series1[idx]}`}</title>
          </circle>
        ))}

        {points2.map((p, idx) => (
          <circle 
            key={`c2-${idx}`} 
            cx={p.x} 
            cy={p.y} 
            r="3.5" 
            fill="#6366f1" 
            stroke="#0f172a" 
            strokeWidth="1.5"
            className="hover:r-5 cursor-pointer transition-all"
          >
            <title>{`${label2}: ${series2[idx]}`}</title>
          </circle>
        ))}

        {/* X-axis labels */}
        {labelTicks.map((tick, idx) => (
          <text 
            key={idx}
            x={tick.x} 
            y={chartHeight - 8} 
            fill="#94a3b8" 
            fontSize="9.5" 
            textAnchor="middle"
            className="font-medium"
          >
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function FunnelChart({ funnel }: { funnel: any }) {
  const visit = funnel.visit || 0
  const viewProduct = funnel.viewProduct || 0
  const addToCart = funnel.addToCart || 0
  const checkoutStart = funnel.checkoutStart || 0
  const purchase = funnel.purchase || 0

  const steps = [
    { label_ar: 'زيارة الموقع', label_tr: 'Ziyaretçi', count: visit, percent: 100, color: 'bg-slate-700/50 border border-slate-600/40' },
    { label_ar: 'تصفح المنتجات', label_tr: 'Ürün İnceleme', count: viewProduct, percent: visit > 0 ? Math.round((viewProduct / visit) * 100) : 0, color: 'bg-indigo-650/40 border border-indigo-500/30' },
    { label_ar: 'إضافة للسلة', label_tr: 'Sepete Ekleme', count: addToCart, percent: visit > 0 ? Math.round((addToCart / visit) * 100) : 0, color: 'bg-cyan-650/40 border border-cyan-500/30' },
    { label_ar: 'بدء الدفع', label_tr: 'Ödeme Başlatma', count: checkoutStart, percent: visit > 0 ? Math.round((checkoutStart / visit) * 100) : 0, color: 'bg-amber-650/40 border border-amber-500/30' },
    { label_ar: 'إتمام الطلب', label_tr: 'Sipariş Tamamlama', count: purchase, percent: visit > 0 ? Math.round((purchase / visit) * 100) : 0, color: 'bg-emerald-650/40 border border-emerald-500/30' }
  ]

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl font-sans">
      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">مسار تحويل المبيعات / Dönüşüm Hunisi</h4>
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-350 text-slate-300">{step.label_ar} / <span className="text-slate-500 font-medium">{step.label_tr}</span></span>
              <span className="text-white">{step.count} <span className="text-slate-400 font-normal">({step.percent}%)</span></span>
            </div>
            <div className="w-full bg-slate-950 border border-slate-850 h-6 rounded-lg overflow-hidden flex relative items-center">
              <div 
                className={`h-full ${step.color} transition-all duration-500 rounded-lg`} 
                style={{ width: `${step.percent}%` }}
              />
              {step.percent > 5 && (
                <span className="absolute left-2 text-[10px] font-black text-white drop-shadow">
                  {step.percent}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getFlagEmoji(countryCode: string) {
  if (countryCode === 'Unknown' || !countryCode) return '🌐'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  try {
    return String.fromCodePoint(...codePoints)
  } catch (e) {
    return '🌐'
  }
}
