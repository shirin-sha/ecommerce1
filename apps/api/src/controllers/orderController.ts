import { Response } from 'express'
import { Order } from '../models/Order'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

/**
 * @route   GET /api/v1/orders
 * @desc    List orders (customer: own, admin: all)
 * @access  Private
 */
export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = DEFAULT_PAGE_SIZE.toString(),
    status,
    search,
    customerId,
    dateFrom,
    dateTo,
  } = req.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = Math.min(parseInt(limit as string, 10), MAX_PAGE_SIZE)
  const skip = (pageNum - 1) * limitNum

  // Build query
  const query: any = {}

  // Customer can only see their own orders
  if (req.user && req.user.role === 'customer') {
    query.customerId = req.user.id
  }

  // Admin/Staff filters
  if (req.user && ['admin', 'shop_manager', 'staff'].includes(req.user.role)) {
    if (status && status !== 'all') {
      query.status = status
    }
    if (customerId) {
      query.customerId = customerId
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ]
    }
  }

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {}
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string)
    if (dateTo) query.createdAt.$lte = new Date(dateTo as string)
  }

  // Execute query
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query),
  ])

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order details
 * @access  Private
 */
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const order = await Order.findById(id)
    .populate('customerId', 'name email phone')
    .populate('items.productId', 'title slug featuredImage')
    .populate('items.variationId')

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  // Check access: customer can only see their own orders
  if (req.user && req.user.role === 'customer' && order.customerId?.toString() !== req.user.id) {
    throw new AppError('Access denied', 403)
  }

  res.json({
    success: true,
    data: order,
  })
})

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin/Shop Manager)
 */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const order = await Order.findById(id)
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  const oldStatus = order.status
  order.status = status

  // Add event
  order.events.push({
    type: 'status_change',
    description: `Order status changed from ${oldStatus} to ${status}`,
    userId: req.user?.id as any,
    createdAt: new Date(),
  })

  await order.save()

  res.json({
    success: true,
    data: order,
    message: 'Order status updated successfully',
  })
})

/**
 * @route   POST /api/v1/orders/:id/notes
 * @desc    Add note to order
 * @access  Private (Admin/Shop Manager)
 */
export const addOrderNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { content, isCustomerNote } = req.body

  if (!content) {
    throw new AppError('Note content is required', 400)
  }

  const order = await Order.findById(id)
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  order.notes.push({
    content,
    isCustomerNote: isCustomerNote || false,
    createdBy: req.user!.id as any,
    createdAt: new Date(),
  })

  order.events.push({
    type: 'note',
    description: isCustomerNote ? 'Customer note added' : 'Internal note added',
    userId: req.user?.id as any,
    createdAt: new Date(),
  })

  await order.save()

  res.json({
    success: true,
    data: order,
    message: 'Note added successfully',
  })
})

/**
 * @route   POST /api/v1/orders/:id/refund
 * @desc    Process refund
 * @access  Private (Admin)
 */
export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { amount, reason } = req.body

  const order = await Order.findById(id)
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  if (order.status !== 'completed' && order.status !== 'processing') {
    throw new AppError('Only completed or processing orders can be refunded', 400)
  }

  const refundAmount = amount || order.grandTotal

  // Update order status
  order.status = 'refunded'
  order.payment.status = 'refunded'

  // Add note
  order.notes.push({
    content: `Refund processed: ${refundAmount}. Reason: ${reason || 'No reason provided'}`,
    isCustomerNote: false,
    createdBy: req.user!.id as any,
    createdAt: new Date(),
  })

  // Add event
  order.events.push({
    type: 'payment',
    description: `Refund of ${refundAmount} processed`,
    userId: req.user?.id as any,
    createdAt: new Date(),
  })

  await order.save()

  res.json({
    success: true,
    data: order,
    message: 'Refund processed successfully',
  })
})
