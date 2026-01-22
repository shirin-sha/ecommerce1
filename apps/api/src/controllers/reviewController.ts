import { Response } from 'express'
import { Review } from '../models/Review'
import { Product } from '../models/Product'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

/**
 * @route   GET /api/v1/reviews
 * @desc    List reviews (with filters)
 * @access  Public
 */
export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = DEFAULT_PAGE_SIZE.toString(),
    productId,
    status,
    rating,
    search,
  } = req.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = Math.min(parseInt(limit as string, 10), MAX_PAGE_SIZE)
  const skip = (pageNum - 1) * limitNum

  const query: any = {}

  // Public can only see approved reviews
  if (!req.user || req.user.role === 'customer') {
    query.status = 'approved'
  } else if (status && status !== 'all') {
    query.status = status
  }

  if (productId) {
    query.productId = productId
  }

  if (rating) {
    query.rating = parseInt(rating as string, 10)
  }

  if (search) {
    query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { authorName: { $regex: search, $options: 'i' } },
    ]
  }

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('productId', 'title slug')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(query),
  ])

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

/**
 * @route   GET /api/v1/reviews/:id
 * @desc    Get review by ID
 * @access  Public
 */
export const getReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const review = await Review.findById(id)
    .populate('productId', 'title slug')
    .populate('customerId', 'name email')

  if (!review) {
    throw new AppError('Review not found', 404)
  }

  // Public can only see approved reviews
  if (!req.user || req.user.role === 'customer') {
    if (review.status !== 'approved') {
      throw new AppError('Review not found', 404)
    }
  }

  res.json({
    success: true,
    data: review,
  })
})

/**
 * @route   POST /api/v1/reviews
 * @desc    Create review (customer)
 * @access  Public (or Private if logged in)
 */
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, rating, content, authorName, authorEmail } = req.body

  // Verify product exists
  const product = await Product.findById(productId)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  // Check if customer already reviewed (if logged in)
  if (req.user) {
    const existingReview = await Review.findOne({
      productId,
      customerId: req.user.id,
    })

    if (existingReview) {
      throw new AppError('You have already reviewed this product', 400)
    }
  }

  // Check if customer has purchased (for verified owner)
  let isVerifiedOwner = false
  if (req.user) {
    const { Order } = await import('../models/Order')
    const hasOrder = await Order.findOne({
      customerId: req.user.id,
      'items.productId': productId,
      status: 'completed',
    })

    isVerifiedOwner = !!hasOrder
  }

  const review = await Review.create({
    productId,
    customerId: req.user?.id,
    rating,
    content,
    authorName: req.user?.name || authorName,
    authorEmail: req.user?.email || authorEmail,
    status: 'pending', // Requires moderation
    isVerifiedOwner,
  })

  res.status(201).json({
    success: true,
    data: review,
    message: 'Review submitted successfully. It will be published after moderation.',
  })
})

/**
 * @route   PATCH /api/v1/reviews/:id
 * @desc    Moderate review (admin: approve/spam/trash)
 * @access  Private (Admin/Shop Manager)
 */
export const moderateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const review = await Review.findById(id)
  if (!review) {
    throw new AppError('Review not found', 404)
  }

  review.status = status
  await review.save()

  res.json({
    success: true,
    data: review,
    message: 'Review status updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete review
 * @access  Private (Admin/Shop Manager)
 */
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const review = await Review.findById(id)
  if (!review) {
    throw new AppError('Review not found', 404)
  }

  await Review.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Review deleted successfully',
  })
})

/**
 * @route   POST /api/v1/reviews/:id/reply
 * @desc    Reply to review (admin)
 * @access  Private (Admin/Shop Manager)
 */
export const replyToReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { content } = req.body

  if (!content) {
    throw new AppError('Reply content is required', 400)
  }

  const review = await Review.findById(id)
  if (!review) {
    throw new AppError('Review not found', 404)
  }

  review.replies.push({
    content,
    userId: req.user!.id as any,
    createdAt: new Date(),
  })

  await review.save()

  res.json({
    success: true,
    data: review,
    message: 'Reply added successfully',
  })
})
