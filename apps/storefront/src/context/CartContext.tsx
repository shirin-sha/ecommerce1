import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  productId: string
  variationId?: string
  name: string
  slug: string
  price: number
  qty: number
  image?: string
  sku?: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  updateQuantity: (productId: string, variationId: string | undefined, qty: number) => void
  removeFromCart: (productId: string, variationId: string | undefined) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addToCart = (newItem: Omit<CartItem, 'qty'> & { qty?: number }) => {
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.productId === newItem.productId && item.variationId === newItem.variationId
      )

      if (existingIndex >= 0) {
        const updated = [...currentItems]
        updated[existingIndex].qty += newItem.qty || 1
        return updated
      }

      return [...currentItems, { ...newItem, qty: newItem.qty || 1 }]
    })
  }

  const updateQuantity = (productId: string, variationId: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, variationId)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId && item.variationId === variationId ? { ...item, qty } : item
      )
    )
  }

  const removeFromCart = (productId: string, variationId: string | undefined) => {
    setItems((currentItems) =>
      currentItems.filter((item) => !(item.productId === productId && item.variationId === variationId))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
