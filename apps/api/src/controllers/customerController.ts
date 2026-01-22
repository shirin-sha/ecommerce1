import { Response } from 'express'
import { User } from '../models/User'
import { Order } from '../models/Order'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

/**
 * @route   GET /api/v1/customers
 * @desc    List customers with stats
 * @access  Private (Admin/Shop Manager)
 */
export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = DEFAULT_PAGE_SIZE.toString(),
    search,
    role,
  } = req.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = Math.min(parseInt(limit as string, 10), MAX_PAGE_SIZE)
  const skip = (pageNum - 1) * limitNum

  // Build query
  const query: any = {
    role: 'customer',
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  if (role) {
    query.role = role
  }

  // Execute query
  const [customers, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ])

  res.json({
    success: true,
    data: customers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer details + order history
 * @access  Private (Admin/Shop Manager)
 */
export const getCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const customer = await User.findById(id).select('-passwordHash -refreshTokens')
  if (!customer) {
    throw new AppError('Customer not found', 404)
  }

  // Get customer orders
  const orders = await Order.find({ customerId: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  res.json({
    success: true,
    data: {
      customer,
      orders,
    },
  })
})

/**
 * @route   PATCH /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private (Admin/Shop Manager)
 */
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const updateData = req.body

  const customer = await User.findById(id)
  if (!customer) {
    throw new AppError('Customer not found', 404)
  }

  // Don't allow role changes through this endpoint (use users endpoint)
  delete updateData.role
  delete updateData.passwordHash

  Object.assign(customer, updateData)
  await customer.save()

  res.json({
    success: true,
    data: customer,
    message: 'Customer updated successfully',
  })
})
