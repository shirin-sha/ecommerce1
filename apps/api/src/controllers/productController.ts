import { Response } from 'express'
import mongoose from 'mongoose'
import { Product } from '../models/Product'
import { Category } from '../models/Category'
import { Tag } from '../models/Tag'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

const normalizeObjectIdArray = (value: any): mongoose.Types.ObjectId[] => {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  return arr
    .map((v) => {
      // If it's already an ObjectId, keep it
      if (v instanceof mongoose.Types.ObjectId) return v

      // If it's an object with _id, use that
      if (v && typeof v === 'object' && (v as any)._id && mongoose.Types.ObjectId.isValid((v as any)._id)) {
        return new mongoose.Types.ObjectId((v as any)._id)
      }

      // If it's a string, only accept valid ObjectId strings
      if (typeof v === 'string' && mongoose.Types.ObjectId.isValid(v)) {
        return new mongoose.Types.ObjectId(v)
      }

      // Ignore invalid / temporary IDs (like "temp-...")
      return null
    })
    .filter((v): v is mongoose.Types.ObjectId => v !== null)
}

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private (Admin/Shop Manager)
 */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body || {}

  // Basic normalization to match Product model expectations
  const payload: any = {
    title: body.title,
    slug: body.slug,
    status: body.status || 'draft',
    visibility: body.visibility || 'visible',
    featured: body.featured ?? false,
    shortDescription: body.shortDescription,
    description: body.description,
    featuredImage: body.featuredImage,
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    regularPrice: typeof body.regularPrice === 'number' ? body.regularPrice : 0,
    salePrice: typeof body.salePrice === 'number' ? body.salePrice : undefined,
    type: body.type || 'simple',
    sku: body.sku,
    barcode: body.barcode,
    soldIndividually: body.soldIndividually ?? false,
    manageStock: body.manageStock ?? false,
    stockQty: typeof body.stockQty === 'number' ? body.stockQty : undefined,
    stockStatus: body.stockStatus || 'in_stock',
    lowStockThreshold:
      typeof body.lowStockThreshold === 'number' ? body.lowStockThreshold : undefined,
    weight: typeof body.weight === 'number' ? body.weight : undefined,
    dimensions: body.dimensions,
    shippingClass: body.shippingClass,
    categoryIds: normalizeObjectIdArray(body.categoryIds),
    tags: Array.isArray(body.tags)
      ? body.tags
          .map((t: any) => (typeof t === 'string' ? t : String(t)))
          .filter((t: string) => t.trim() !== '')
      : [],
    attributes: Array.isArray(body.attributes) ? body.attributes : [],
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
  }

  // Convert saleStart / saleEnd strings to Date if provided
  if (body.saleStart) {
    payload.saleStart = new Date(body.saleStart)
  }
  if (body.saleEnd) {
    payload.saleEnd = new Date(body.saleEnd)
  }

  // Handle optional publish schedule info from admin UI
  const schedule = body.publishSchedule
  if (schedule && schedule.mode === 'scheduled' && schedule.publishAt) {
    payload.publishedAt = new Date(schedule.publishAt)
  }

  const product = await Product.create(payload)

  res.status(201).json({
    success: true,
    data: product,
  })
})

/**
 * @route   PATCH /api/v1/products/:id
 * @desc    Update an existing product
 * @access  Private (Admin/Shop Manager)
 */
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const body = req.body || {}

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  // Basic normalization – same shape as create, but applied onto existing product
  product.title = body.title ?? product.title
  product.slug = body.slug ?? product.slug
  product.status = body.status ?? product.status
  product.visibility = body.visibility ?? product.visibility
  product.featured = body.featured ?? product.featured
  product.shortDescription = body.shortDescription ?? product.shortDescription
  product.description = body.description ?? product.description
  product.featuredImage = body.featuredImage ?? product.featuredImage
  product.gallery = Array.isArray(body.gallery) ? body.gallery : product.gallery
  if (typeof body.regularPrice === 'number') product.regularPrice = body.regularPrice
  if (typeof body.salePrice === 'number' || body.salePrice === null) {
    product.salePrice = body.salePrice ?? undefined
  }
  product.type = body.type ?? product.type
  product.sku = body.sku ?? product.sku
  product.barcode = body.barcode ?? product.barcode
  if (typeof body.soldIndividually === 'boolean') product.soldIndividually = body.soldIndividually
  if (typeof body.manageStock === 'boolean') product.manageStock = body.manageStock
  if (typeof body.stockQty === 'number' || body.stockQty === null) {
    product.stockQty = body.stockQty ?? undefined
  }
  product.stockStatus = body.stockStatus ?? product.stockStatus
  if (typeof body.lowStockThreshold === 'number' || body.lowStockThreshold === null) {
    product.lowStockThreshold = body.lowStockThreshold ?? undefined
  }
  if (typeof body.weight === 'number' || body.weight === null) {
    product.weight = body.weight ?? undefined
  }
  if (body.dimensions !== undefined) {
    product.dimensions = body.dimensions
  }
  product.shippingClass = body.shippingClass ?? product.shippingClass

  if (body.categoryIds !== undefined) {
    product.categoryIds = normalizeObjectIdArray(body.categoryIds)
  }
  if (body.tagIds !== undefined) {
    // Frontend no longer sends tagIds; ignore if present to avoid errors
    // product.tagIds = normalizeObjectIdArray(body.tagIds)
  }
  if (body.tags !== undefined && Array.isArray(body.tags)) {
    product.tags = body.tags
      .map((t: any) => (typeof t === 'string' ? t : String(t)))
      .filter((t: string) => t.trim() !== '')
  }
  if (Array.isArray(body.attributes)) {
    product.attributes = body.attributes
  }

  product.metaTitle = body.metaTitle ?? product.metaTitle
  product.metaDescription = body.metaDescription ?? product.metaDescription

  // Convert saleStart / saleEnd strings to Date if provided (null clears them)
  if (body.saleStart !== undefined) {
    product.saleStart = body.saleStart ? new Date(body.saleStart) : undefined
  }
  if (body.saleEnd !== undefined) {
    product.saleEnd = body.saleEnd ? new Date(body.saleEnd) : undefined
  }

  // Handle optional publish schedule info from admin UI
  const schedule = body.publishSchedule
  if (schedule && schedule.mode === 'scheduled' && schedule.publishAt) {
    product.publishedAt = new Date(schedule.publishAt)
  }

  await product.save()

  res.json({
    success: true,
    data: product,
  })
})

/**
 * @route   GET /api/v1/products
 * @desc    List/search products with filters
 * @access  Public
 */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = DEFAULT_PAGE_SIZE.toString(),
    search,
    category,
    tag,
    status,
    featured,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = Math.min(parseInt(limit as string, 10), MAX_PAGE_SIZE)
  const skip = (pageNum - 1) * limitNum

  // Build query
  const query: any = {}

  // Status filter
  // - If status is explicitly provided (and not 'all'), use it
  // - If no status or status is 'all' and user is admin/shop_manager, show all statuses (no filter)
  // - If no status or status is 'all' and user is customer or not authenticated, show only published
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'shop_manager')
    
  // Enhanced debug logging
  console.log('=== Product List Request Debug ===')
  console.log('Query params:', { status, page, limit, search })
  console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing')
  console.log('User info:', {
      hasUser: !!req.user,
    userId: req.user?.id,
    userEmail: req.user?.email,
      userRole: req.user?.role,
      isAdmin,
  })
  console.log('Status filter:', { status, statusType: typeof status, isAll: status === 'all' })
    
  if (status && status !== 'all' && status !== '') {
    // Explicit status filter provided (published, draft, or private)
    query.status = status
    console.log('Applied status filter:', status)
  } else {
    // No status filter or 'all' selected - check user role
    if (!isAdmin) {
      // For customers or unauthenticated users, only show published products
      query.status = 'published'
      query.visibility = { $in: ['visible', 'catalog', 'search'] }
      console.log('⚠️ User is NOT admin - filtering to published only')
    } else {
      console.log('✅ User is admin - showing ALL statuses (no status filter)')
    }
    // For admins/shop_managers with no status filter or 'all', don't add status filter (shows all statuses)
  }
  
  console.log('Final query:', JSON.stringify(query, null, 2))
  console.log('=== End Debug ===')

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
    ]
  }

  // Category filter
  if (category) {
    query.categoryIds = category
  }

  // Tag filter
  if (tag) {
    query.tagIds = tag
  }

  // Featured filter
  if (featured === 'true') {
    query.featured = true
  }

  // Price range
  if (minPrice || maxPrice) {
    query.regularPrice = {}
    if (minPrice) query.regularPrice.$gte = parseFloat(minPrice as string)
    if (maxPrice) query.regularPrice.$lte = parseFloat(maxPrice as string)
  }

  // Sort
  const sort: any = {}
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('categoryIds', 'name slug')
      .populate('tagIds', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ])

  // Debug: Log returned products statuses
  const statusCounts = products.reduce((acc: any, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})
  console.log('📊 Products returned:', {
    total,
    count: products.length,
    statusBreakdown: statusCounts,
    productStatuses: products.map((p: any) => ({ id: p._id, title: p.title, status: p.status })),
  })

  // Set cache-control headers to prevent browser caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  res.json({
    success: true,
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const product = await Product.findById(id)
    .populate('categoryIds', 'name slug')
    .populate('tagIds', 'name slug')
    .populate('attributes.attributeId', 'name slug')
    .populate('variationIds')

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  // Check access (admin can see all, customers only published)
  if (!req.user || req.user.role === 'customer') {
    if (product.status !== 'published' || !['visible', 'catalog', 'search'].includes(product.visibility)) {
      throw new AppError('Product not found', 404)
    }
  }

  res.json({
    success: true,
    data: product,
  })
})

/**
 * @route   GET /api/v1/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
export const getProductBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params

  const query: any = { slug }

  // Status filter for public
  if (!req.user || req.user.role === 'customer') {
    query.status = 'published'
    query.visibility = { $in: ['visible', 'catalog', 'search'] }
  }

  const product = await Product.findOne(query)
    .populate('categoryIds', 'name slug')
    .populate('tagIds', 'name slug')
    .populate('attributes.attributeId', 'name slug')
    .populate('variationIds')

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  res.json({
    success: true,
    data: product,
  })
})

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private (Admin/Shop Manager)
 */
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  await Product.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Product deleted successfully',
  })
})
