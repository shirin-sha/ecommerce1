import { Product } from '../models/Product'
import { Variation } from '../models/Variation'
import { Coupon } from '../models/Coupon'
import { AppError } from '../middleware/errorHandler'

export interface CartItem {
  productId: string
  variationId?: string
  qty: number
}

export interface Cart {
  items: {
    productId: string
    variationId?: string
    name: string
    sku?: string
    price: number
    qty: number
    subtotal: number
    image?: string
  }[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  couponCode?: string
}

/**
 * Get cart with product details
 */
export const getCartDetails = async (items: CartItem[], couponCode?: string): Promise<Cart> => {
  const cartItems = []
  let subtotal = 0

  for (const item of items) {
    const product = await Product.findById(item.productId)
    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 404)
    }

    // Check if product is published and visible
    if (product.status !== 'published' || !['visible', 'catalog', 'search'].includes(product.visibility)) {
      throw new AppError(`Product ${item.productId} is not available`, 400)
    }

    let price = product.regularPrice
    let sku = product.sku
    let name = product.title
    let image = product.featuredImage

    // If variation, get variation details
    if (item.variationId) {
      if (product.type !== 'variable') {
        throw new AppError('Variation ID provided for non-variable product', 400)
      }

      const variation = await Variation.findById(item.variationId)
      if (!variation || variation.productId.toString() !== product._id.toString()) {
        throw new AppError('Variation not found for this product', 404)
      }

      if (variation.status !== 'active') {
        throw new AppError('Variation is not active', 400)
      }

      price = variation.regularPrice
      sku = variation.sku
      name = `${product.title} - ${Object.values(variation.attributeSelections).join(', ')}`
      image = variation.image || product.featuredImage
    }

    // Check stock availability
    if (product.manageStock) {
      const stockQty = item.variationId
        ? (await Variation.findById(item.variationId))?.stockQty
        : product.stockQty

      if (!stockQty || stockQty < item.qty) {
        throw new AppError(`Insufficient stock for ${name}`, 400)
      }
    }

    const itemSubtotal = price * item.qty
    subtotal += itemSubtotal

    cartItems.push({
      productId: item.productId,
      variationId: item.variationId,
      name,
      sku,
      price,
      qty: item.qty,
      subtotal: itemSubtotal,
      image,
    })
  }

  // Apply coupon if provided
  let discountTotal = 0
  let appliedCouponCode: string | undefined

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })
    if (!coupon) {
      throw new AppError('Invalid coupon code', 400)
    }

    // Validate coupon
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      throw new AppError('Coupon has expired', 400)
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 400)
    }

    if (coupon.minSpend && subtotal < coupon.minSpend) {
      throw new AppError(`Minimum spend of ${coupon.minSpend} required`, 400)
    }

    if (coupon.maxSpend && subtotal > coupon.maxSpend) {
      throw new AppError(`Maximum spend of ${coupon.maxSpend} exceeded`, 400)
    }

    // Calculate discount
    if (coupon.type === 'percent') {
      discountTotal = (subtotal * coupon.amount) / 100
    } else {
      discountTotal = Math.min(coupon.amount, subtotal)
    }

    appliedCouponCode = coupon.code
  }

  const shippingTotal = 0 // Will be calculated based on shipping method
  const taxTotal = 0 // Will be calculated based on tax settings
  const grandTotal = subtotal - discountTotal + shippingTotal + taxTotal

  return {
    items: cartItems,
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    grandTotal,
    couponCode: appliedCouponCode,
  }
}
