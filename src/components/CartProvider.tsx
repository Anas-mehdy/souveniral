'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export interface CartItem {
  id: string
  slug: string
  name_ar: string
  name_tr: string
  price: number
  image: string | null
  brand: string
  model: string
  quantity: number
  custom_type?: string | null
  custom_text?: string | null
  custom_image?: string | null
  custom_image_name?: string | null
  custom_details?: string | null
  custom_fields_values?: Record<string, string> | null
}

interface CartContextType {
  cartItems: CartItem[]
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (
    id: string,
    brand: string,
    model: string,
    custom_text?: string | null,
    custom_image?: string | null,
    custom_details?: string | null,
    custom_fields_values?: Record<string, string> | null
  ) => void
  updateQuantity: (
    id: string,
    brand: string,
    model: string,
    amount: number,
    custom_text?: string | null,
    custom_image?: string | null,
    custom_details?: string | null,
    custom_fields_values?: Record<string, string> | null
  ) => void
  clearCart: () => void
  totalPrice: number
  totalItems: number
  discount: number
}

const CartCtx = createContext<CartContextType | undefined>(undefined)

const isSameItem = (a: Omit<CartItem, 'quantity'>, b: Omit<CartItem, 'quantity'>) => {
  return a.id === b.id &&
    a.brand === b.brand &&
    a.model === b.model &&
    (a.custom_text ?? null) === (b.custom_text ?? null) &&
    (a.custom_image ?? null) === (b.custom_image ?? null) &&
    (a.custom_details ?? null) === (b.custom_details ?? null) &&
    JSON.stringify(a.custom_fields_values ?? null) === JSON.stringify(b.custom_fields_values ?? null)
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kilifal_cart')
      if (saved) {
        setCartItems(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load cart', e)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when updated
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('kilifal_cart', JSON.stringify(cartItems))
    }
  }, [cartItems, isHydrated])

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => isSameItem(item, newItem))

      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx].quantity += quantity
        return updated
      }

      return [...prev, { ...newItem, quantity }]
    })
    setCartOpen(true) // Automatically slide drawer open upon cart addition!
  }

  const removeFromCart = (
    id: string,
    brand: string,
    model: string,
    custom_text?: string | null,
    custom_image?: string | null,
    custom_details?: string | null,
    custom_fields_values?: Record<string, string> | null
  ) => {
    setCartItems(prev => prev.filter(
      item => !(
        item.id === id &&
        item.brand === brand &&
        item.model === model &&
        (item.custom_text ?? null) === (custom_text ?? null) &&
        (item.custom_image ?? null) === (custom_image ?? null) &&
        (item.custom_details ?? null) === (custom_details ?? null) &&
        JSON.stringify(item.custom_fields_values ?? null) === JSON.stringify(custom_fields_values ?? null)
      )
    ))
  }

  const updateQuantity = (
    id: string,
    brand: string,
    model: string,
    amount: number,
    custom_text?: string | null,
    custom_image?: string | null,
    custom_details?: string | null,
    custom_fields_values?: Record<string, string> | null
  ) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (
          item.id === id &&
          item.brand === brand &&
          item.model === model &&
          (item.custom_text ?? null) === (custom_text ?? null) &&
          (item.custom_image ?? null) === (custom_image ?? null) &&
          (item.custom_details ?? null) === (custom_details ?? null) &&
          JSON.stringify(item.custom_fields_values ?? null) === JSON.stringify(custom_fields_values ?? null)
        ) {
          const newQty = item.quantity + amount
          return { ...item, quantity: Math.max(1, newQty) }
        }
        return item
      })
    })
  }

  const clearCart = () => {
    setCartItems([])
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // 3 Al 2 Öde: Cheapest cover free in every group of 3 covers
  const discount = (() => {
    const flatPrices: number[] = []
    cartItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        flatPrices.push(item.price)
      }
    })
    flatPrices.sort((a, b) => b - a)
    let d = 0
    for (let i = 2; i < flatPrices.length; i += 3) {
      d += flatPrices[i]
    }
    return d
  })()

  return (
    <CartCtx.Provider
      value={{
        cartItems,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        discount
      }}
    >
      {children}
    </CartCtx.Provider>
  )
}

export function useCart() {
  const context = useContext(CartCtx)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
