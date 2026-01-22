import { Response } from 'express'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { Variation } from '../models/Variation'
import { User } from '../models/User'
import { getCartDetails } from '../services/cartService'
import { generateOrderNumber } from '@ecommerce/shared'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   POST /api/v1/checkout/calculate
 * @desc    Calculate checkout totals (shipping, tax, discounts)
 * @access  Public
 */
export const calculateTotals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, shippingMethodId, couponCode } = req.body

  const cart = await getCartDetails(items || [], couponCode)

  // TODO: Calculate shipping based on shippingMethodId
  // TODO: Calculate tax based on settings and address

  res.json({
    success: true,
    data: cart,
  })
})

/**
 * @route   POST /api/v1/checkout/create-order
 * @desc    Create order from cart
 * @access  Public (or Private if user)
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, billingAddress, shippingAddress, shippingMethodId, paymentMethodId, couponCode, customerNotes } =
    req.body

  if (!items || items.length === 0) {
    throw new AppError('Cart is empty', 400)
  }

  if (!billingAddress || !shippingAddress) {
    throw new AppError('Billing and shipping addresses are required', 400)
  }

  // Get cart details with coupon
  const cart = await getCartDetails(items, couponCode)

  // Prepare order items
  const orderItems = []
  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.productId)
    if (!product) {
      throw new AppError(`Product ${cartItem.productId} not found`, 404)
    }

    // Check stock again before creating order
    if (product.manageStock) {
      const stockQty = cartItem.variationId
        ? (await Variation.findById(cartItem.variationId))?.stockQty
        : product.stockQty

      if (!stockQty || stockQty < cartItem.qty) {
        throw new AppError(`Insufficient stock for ${cartItem.name}`, 400)
      }
    }

    orderItems.push({
      productId: cartItem.productId,
      variationId: cartItem.variationId,
      nameSnapshot: cartItem.name,
      skuSnapshot: cartItem.sku,
      price: cartItem.price,
      qty: cartItem.qty,
      subtotal: cartItem.subtotal,
      total: cartItem.subtotal,
    })
  }

  // Get customer info
  let customerId: string | undefined
  let customerEmail: string
  let customerName: string

  if (req.user) {
    const user = await User.findById(req.user.id)
    if (user) {
      customerId = user._id.toString()
      customerEmail = user.email
      customerName = user.name
    } else {
      customerEmail = billingAddress.email || 'guest@example.com'
      customerName = `${billingAddress.firstName} ${billingAddress.lastName}`
    }
  } else {
    customerEmail = billingAddress.email || 'guest@example.com'
    customerName = `${billingAddress.firstName} ${billingAddress.lastName}`
  }

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    status: 'pending_payment',
    customerId,
    customerEmail,
    customerName,
    billingAddress,
    shippingAddress,
    items: orderItems,
    subtotal: cart.subtotal,
    discountTotal: cart.discountTotal,
    shippingTotal: cart.shippingTotal,
    taxTotal: cart.taxTotal,
    grandTotal: cart.grandTotal,
    couponCodes: cart.couponCode ? [cart.couponCode] : [],
    discounts: cart.couponCode
      ? [
          {
            couponCode: cart.couponCode,
            amount: cart.discountTotal,
          },
        ]
      : [],
    shippingMethod: {
      method: 'Standard Shipping', // TODO: Get from shippingMethodId
      cost: cart.shippingTotal,
    },
    payment: {
      provider: paymentMethodId || 'cod',
      methodTitle: paymentMethodId === 'cod' ? 'Cash on Delivery' : 'Online Payment',
      status: 'pending',
    },
    events: [
      {
        type: 'status_change',
        description: 'Order created',
        createdAt: new Date(),
      },
    ],
    attribution: req.body.attribution,
  })

  // Add customer note if provided
  if (customerNotes) {
    order.notes.push({
      content: customerNotes,
      isCustomerNote: true,
      createdBy: customerId ? (customerId as any) : undefined,
      createdAt: new Date(),
    })
    await order.save()
  }

  // Update coupon usage if applied
  if (cart.couponCode) {
    const { Coupon } = await import('../models/Coupon')
    const coupon = await Coupon.findOne({ code: cart.couponCode })
    if (coupon) {
      coupon.usageCount += 1
      if (customerId) {
        const existingUser = coupon.usedBy.find((u) => u.userId?.toString() === customerId)
        if (existingUser) {
          existingUser.orderIds.push(order._id as any)
        } else {
          coupon.usedBy.push({
            userId: customerId as any,
            orderIds: [order._id as any],
          })
        }
      }
      await coupon.save()
    }
  }

  // Update customer stats if logged in
  if (customerId) {
    await User.findByIdAndUpdate(customerId, {
      $inc: {
        ordersCount: 1,
        totalSpend: order.grandTotal,
      },
    })

    // Recalculate AOV
    const user = await User.findById(customerId)
    if (user && user.ordersCount > 0) {
      user.avgOrderValue = user.totalSpend / user.ordersCount
      await user.save()
    }
  }

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created successfully',
  })
})

/**
 * @route   POST /api/v1/checkout/payment-intent
 * @desc    Create payment intent/token (for payment provider)
 * @access  Public
 */
export const createPaymentIntent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, paymentMethodId } = req.body

  const order = await Order.findById(orderId)
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  // TODO: Integrate with payment providers (PayPal, MyFatoorah, etc.)
  // For now, return a placeholder

  res.json({
    success: true,
    data: {
      orderId: order._id,
      amount: order.grandTotal,
      paymentMethod: paymentMethodId,
      redirectUrl: `/checkout/payment/${order._id}`,
    },
  })
})
