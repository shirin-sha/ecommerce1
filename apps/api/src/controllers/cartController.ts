import { Response } from 'express'
import { getCartDetails, CartItem } from '../services/cartService'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/cart
 * @desc    Get cart (session or user-based)
 * @access  Public (or Private if user)
 */
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a real implementation, cart would be stored in:
  // - Session (for guest users)
  // - User document or separate Cart collection (for logged-in users)
  // For now, we'll expect items in query params or body

  const items: CartItem[] = req.body.items || req.query.items || []

  if (items.length === 0) {
    return res.json({
      success: true,
      data: {
        items: [],
        subtotal: 0,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
      },
    })
  }

  const cart = await getCartDetails(items, req.body.couponCode || req.query.couponCode)

  res.json({
    success: true,
    data: cart,
  })
})

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add item to cart
 * @access  Public
 */
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, variationId, qty } = req.body

  // Validate input
  if (!productId || !qty || qty < 1) {
    throw new Error('Invalid cart item data')
  }

  // In real implementation, add to session/user cart
  // For now, return success
  res.json({
    success: true,
    message: 'Item added to cart',
  })
})

/**
 * @route   POST /api/v1/cart/apply-coupon
 * @desc    Apply coupon to cart
 * @access  Public
 */
export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, items } = req.body

  if (!code) {
    throw new Error('Coupon code is required')
  }

  const cart = await getCartDetails(items || [], code)

  res.json({
    success: true,
    data: cart,
    message: 'Coupon applied successfully',
  })
})

/**
 * @route   DELETE /api/v1/cart/remove-coupon/:code
 * @desc    Remove coupon from cart
 * @access  Public
 */
export const removeCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.params
  const items: CartItem[] = req.body.items || []

  const cart = await getCartDetails(items)

  res.json({
    success: true,
    data: cart,
    message: 'Coupon removed successfully',
  })
})
