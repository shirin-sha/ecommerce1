import { Response } from 'express'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/analytics/overview
 * @desc    Get analytics overview with KPIs
 * @access  Private (Admin/Shop Manager)
 */
export const getOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dateFrom, dateTo, comparePeriod } = req.query

  const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = dateTo ? new Date(dateTo as string) : new Date()

  // Calculate compare period dates
  const periodDiff = endDate.getTime() - startDate.getTime()
  const compareStartDate = new Date(startDate.getTime() - periodDiff)
  const compareEndDate = new Date(startDate.getTime())

  // Current period stats
  const currentOrders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
  })

  const currentRevenue = currentOrders.reduce((sum, order) => sum + order.grandTotal, 0)
  const currentOrdersCount = currentOrders.length
  const currentAOV = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0

  // Compare period stats (if requested)
  let compareRevenue = 0
  let compareOrdersCount = 0
  let compareAOV = 0

  if (comparePeriod === 'true') {
    const compareOrders = await Order.find({
      createdAt: { $gte: compareStartDate, $lte: compareEndDate },
    })

    compareRevenue = compareOrders.reduce((sum, order) => sum + order.grandTotal, 0)
    compareOrdersCount = compareOrders.length
    compareAOV = compareOrdersCount > 0 ? compareRevenue / compareOrdersCount : 0
  }

  // Calculate percentage changes
  const revenueChange =
    compareRevenue > 0 ? ((currentRevenue - compareRevenue) / compareRevenue) * 100 : 0
  const ordersChange =
    compareOrdersCount > 0 ? ((currentOrdersCount - compareOrdersCount) / compareOrdersCount) * 100 : 0
  const aovChange = compareAOV > 0 ? ((currentAOV - compareAOV) / compareAOV) * 100 : 0

  // Daily revenue breakdown
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  res.json({
    success: true,
    data: {
      kpis: {
        revenue: {
          current: currentRevenue,
          previous: compareRevenue,
          change: revenueChange,
        },
        orders: {
          current: currentOrdersCount,
          previous: compareOrdersCount,
          change: ordersChange,
        },
        aov: {
          current: currentAOV,
          previous: compareAOV,
          change: aovChange,
        },
      },
      dailyRevenue,
    },
  })
})

/**
 * @route   GET /api/v1/analytics/products
 * @desc    Get product analytics
 * @access  Private (Admin/Shop Manager)
 */
export const getProductAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dateFrom, dateTo } = req.query

  const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = dateTo ? new Date(dateTo as string) : new Date()

  const productStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'failed'] },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.nameSnapshot' },
        quantitySold: { $sum: '$items.qty' },
        revenue: { $sum: '$items.total' },
        ordersCount: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 50 },
  ])

  res.json({
    success: true,
    data: productStats,
  })
})

/**
 * @route   GET /api/v1/analytics/categories
 * @desc    Get category analytics
 * @access  Private (Admin/Shop Manager)
 */
export const getCategoryAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dateFrom, dateTo } = req.query

  const startDate = dateFrom ? new Date(dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = dateTo ? new Date(dateTo as string) : new Date()

  // Get all orders in the period
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled', 'failed'] },
  }).populate('items.productId')

  // Group by categories
  const categoryStats: Record<string, any> = {}

  for (const order of orders) {
    for (const item of order.items) {
      const product = await Product.findById(item.productId)
      if (product && product.categoryIds) {
        for (const categoryId of product.categoryIds) {
          const catId = categoryId.toString()
          if (!categoryStats[catId]) {
            categoryStats[catId] = {
              categoryId: catId,
              quantitySold: 0,
              revenue: 0,
              ordersCount: 0,
            }
          }
          categoryStats[catId].quantitySold += item.qty
          categoryStats[catId].revenue += item.total
          categoryStats[catId].ordersCount += 1
        }
      }
    }
  }

  const categoryArray = Object.values(categoryStats).sort((a: any, b: any) => b.revenue - a.revenue)

  res.json({
    success: true,
    data: categoryArray,
  })
})

/**
 * @route   GET /api/v1/analytics/stock
 * @desc    Get stock analytics
 * @access  Private (Admin/Shop Manager)
 */
export const getStockAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const lowStockProducts = await Product.find({
    manageStock: true,
    stockQty: { $lte: 5 },
    status: 'published',
  })
    .select('title sku stockQty stockStatus')
    .limit(100)

  const outOfStockProducts = await Product.find({
    manageStock: true,
    stockStatus: 'out_of_stock',
    status: 'published',
  })
    .select('title sku stockQty stockStatus')
    .limit(100)

  const totalProducts = await Product.countDocuments({ status: 'published' })
  const inStockCount = await Product.countDocuments({
    status: 'published',
    stockStatus: 'in_stock',
  })
  const lowStockCount = lowStockProducts.length
  const outOfStockCount = outOfStockProducts.length

  res.json({
    success: true,
    data: {
      summary: {
        total: totalProducts,
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
      lowStockProducts,
      outOfStockProducts,
    },
  })
})
