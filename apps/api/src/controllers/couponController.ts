import { Response } from 'express'
import { Coupon } from '../models/Coupon'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

/**
 * @route   GET /api/v1/coupons
 * @desc    List coupons
 * @access  Private (Admin/Shop Manager)
 */
export const getCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = DEFAULT_PAGE_SIZE.toString(),
    search,
  } = req.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = Math.min(parseInt(limit as string, 10), MAX_PAGE_SIZE)
  const skip = (pageNum - 1) * limitNum

  const query: any = {}
  if (search) {
    query.code = { $regex: search, $options: 'i' }
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Coupon.countDocuments(query),
  ])

  res.json({
    success: true,
    data: coupons,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

/**
 * @route   GET /api/v1/coupons/:id
 * @desc    Get coupon by ID
 * @access  Private (Admin/Shop Manager)
 */
export const getCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const coupon = await Coupon.findById(id)
  if (!coupon) {
    throw new AppError('Coupon not found', 404)
  }

  res.json({
    success: true,
    data: coupon,
  })
})

/**
 * @route   POST /api/v1/coupons
 * @desc    Create coupon
 * @access  Private (Admin/Shop Manager)
 */
export const createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.create(req.body)

  res.status(201).json({
    success: true,
    data: coupon,
    message: 'Coupon created successfully',
  })
})

/**
 * @route   PATCH /api/v1/coupons/:id
 * @desc    Update coupon
 * @access  Private (Admin/Shop Manager)
 */
export const updateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const coupon = await Coupon.findById(id)
  if (!coupon) {
    throw new AppError('Coupon not found', 404)
  }

  Object.assign(coupon, req.body)
  await coupon.save()

  res.json({
    success: true,
    data: coupon,
    message: 'Coupon updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/coupons/:id
 * @desc    Delete coupon
 * @access  Private (Admin/Shop Manager)
 */
export const deleteCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const coupon = await Coupon.findById(id)
  if (!coupon) {
    throw new AppError('Coupon not found', 404)
  }

  await Coupon.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Coupon deleted successfully',
  })
})

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate coupon code (for storefront)
 * @access  Public
 */
export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, items } = req.body

  if (!code) {
    throw new AppError('Coupon code is required', 400)
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() })
  if (!coupon) {
    throw new AppError('Invalid coupon code', 400)
  }

  // Validate expiry
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new AppError('Coupon has expired', 400)
  }

  // Validate usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400)
  }

  // Calculate cart total for min/max spend validation
  let cartTotal = 0
  if (items && items.length > 0) {
    const { Product } = await import('../models/Product')
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (product) {
        cartTotal += product.regularPrice * item.qty
      }
    }
  }

  if (coupon.minSpend && cartTotal < coupon.minSpend) {
    throw new AppError(`Minimum spend of ${coupon.minSpend} required`, 400)
  }

  if (coupon.maxSpend && cartTotal > coupon.maxSpend) {
    throw new AppError(`Maximum spend of ${coupon.maxSpend} exceeded`, 400)
  }

  res.json({
    success: true,
    data: {
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      description: coupon.description,
    },
    message: 'Coupon is valid',
  })
})
