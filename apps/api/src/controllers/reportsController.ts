import { Response } from 'express'
import { Order } from '../models/Order'
import { User } from '../models/User'
import { Product } from '../models/Product'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/reports/orders
 * @desc    Get orders report
 * @access  Private (Admin/Shop Manager)
 */
export const getOrdersReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dateFrom, dateTo, groupBy = 'day' } = req.query

  const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = dateTo ? new Date(dateTo as string) : new Date()

  let dateFormat = '%Y-%m-%d'
  if (groupBy === 'month') {
    dateFormat = '%Y-%m'
  } else if (groupBy === 'year') {
    dateFormat = '%Y'
  }

  const orderStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
        shipping: { $sum: '$shippingTotal' },
        tax: { $sum: '$taxTotal' },
        discount: { $sum: '$discountTotal' },
        netRevenue: { $sum: { $subtract: ['$grandTotal', '$shippingTotal'] } },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Overall totals
  const totals = orderStats.reduce(
    (acc, stat) => ({
      orders: acc.orders + stat.orders,
      revenue: acc.revenue + stat.revenue,
      shipping: acc.shipping + stat.shipping,
      tax: acc.tax + stat.tax,
      discount: acc.discount + stat.discount,
      netRevenue: acc.netRevenue + stat.netRevenue,
    }),
    { orders: 0, revenue: 0, shipping: 0, tax: 0, discount: 0, netRevenue: 0 }
  )

  res.json({
    success: true,
    data: {
      totals,
      breakdown: orderStats,
    },
  })
})

/**
 * @route   GET /api/v1/reports/customers
 * @desc    Get customers report
 * @access  Private (Admin/Shop Manager)
 */
export const getCustomersReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dateFrom, dateTo } = req.query

  const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = dateTo ? new Date(dateTo as string) : new Date()

  // New customers in period
  const newCustomers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: startDate, $lte: endDate },
  })

  // Top customers by spend
  const topCustomers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        customerId: { $exists: true },
        status: { $nin: ['cancelled', 'failed'] },
      },
    },
    {
      $group: {
        _id: '$customerId',
        totalSpend: { $sum: '$grandTotal' },
        ordersCount: { $sum: 1 },
        avgOrderValue: { $avg: '$grandTotal' },
      },
    },
    { $sort: { totalSpend: -1 } },
    { $limit: 50 },
  ])

  // Populate customer details
  const topCustomersWithDetails = await User.populate(topCustomers, {
    path: '_id',
    select: 'name email',
  })

  // Customer acquisition by date
  const acquisitionByDate = await User.aggregate([
    {
      $match: {
        role: 'customer',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  res.json({
    success: true,
    data: {
      summary: {
        newCustomers,
      },
      topCustomers: topCustomersWithDetails,
      acquisitionByDate,
    },
  })
})

/**
 * @route   GET /api/v1/reports/stock
 * @desc    Get stock report
 * @access  Private (Admin/Shop Manager)
 */
export const getStockReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, category } = req.query

  const query: any = { status: 'published' }

  if (status === 'low_stock') {
    query.manageStock = true
    query.stockQty = { $lte: 5, $gt: 0 }
  } else if (status === 'out_of_stock') {
    query.stockStatus = 'out_of_stock'
  } else if (status === 'in_stock') {
    query.stockStatus = 'in_stock'
  }

  if (category) {
    query.categoryIds = category
  }

  const products = await Product.find(query)
    .select('title sku stockQty stockStatus regularPrice categoryIds')
    .populate('categoryIds', 'name')
    .sort({ stockQty: 1 })
    .limit(500)

  const stockSummary = {
    totalProducts: await Product.countDocuments({ status: 'published' }),
    inStock: await Product.countDocuments({ status: 'published', stockStatus: 'in_stock' }),
    lowStock: await Product.countDocuments({
      status: 'published',
      manageStock: true,
      stockQty: { $lte: 5, $gt: 0 },
    }),
    outOfStock: await Product.countDocuments({ status: 'published', stockStatus: 'out_of_stock' }),
  }

  res.json({
    success: true,
    data: {
      summary: stockSummary,
      products,
    },
  })
})
