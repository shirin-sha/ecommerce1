import { Response } from 'express'
import { Product } from '../models/Product'
import { Category } from '../models/Category'
import { Tag } from '../models/Tag'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

// Helper function to transform image URLs to relative paths
// Converts absolute URLs (localhost or Vercel) to relative paths
// This makes images work on both local and Vercel
const transformImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined
  // If it's an absolute URL, extract just the path
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname // Returns /uploads/products/filename.webp
    } catch {
      return url
    }
  }
  // Already relative, return as is
  return url
}

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

  // Transform image URLs to relative paths (works on both local and Vercel)
  // Convert any absolute URLs (localhost or Vercel) to relative paths
  // Transform all product image URLs to relative paths
  products.forEach((product: any) => {
    if (product.featuredImage) {
      product.featuredImage = transformImageUrl(product.featuredImage)
    }
    if (product.gallery && Array.isArray(product.gallery)) {
      product.gallery = product.gallery.map((url: string) => transformImageUrl(url))
    }
  })

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

  // Transform image URLs to relative paths
  const productObj = product.toObject()
  if (productObj.featuredImage) {
    productObj.featuredImage = transformImageUrl(productObj.featuredImage)
  }
  if (productObj.gallery && Array.isArray(productObj.gallery)) {
    productObj.gallery = productObj.gallery.map((url: string) => transformImageUrl(url))
  }

  res.json({
    success: true,
    data: productObj,
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

  // Transform image URLs to relative paths
  const productObj = product.toObject()
  if (productObj.featuredImage) {
    productObj.featuredImage = transformImageUrl(productObj.featuredImage)
  }
  if (productObj.gallery && Array.isArray(productObj.gallery)) {
    productObj.gallery = productObj.gallery.map((url: string) => transformImageUrl(url))
  }

  res.json({
    success: true,
    data: productObj,
  })
})

/**
 * @route   POST /api/v1/products
 * @desc    Create product
 * @access  Private (Admin/Shop Manager)
 */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const productData = req.body

  // Auto-generate slug from title if not provided
  if (!productData.slug && productData.title) {
    const { slugify } = await import('@ecommerce/shared')
    let baseSlug = slugify(productData.title)
    
    // Ensure uniqueness
    let uniqueSlug = baseSlug
    let counter = 1
    let exists = await Product.countDocuments({ slug: uniqueSlug })
    
    while (exists > 0) {
      uniqueSlug = `${baseSlug}-${counter}`
      exists = await Product.countDocuments({ slug: uniqueSlug })
      counter++
    }
    
    productData.slug = uniqueSlug
  }

  // Validate categories exist
  if (productData.categoryIds && productData.categoryIds.length > 0) {
    const categories = await Category.find({ _id: { $in: productData.categoryIds } })
    if (categories.length !== productData.categoryIds.length) {
      throw new AppError('One or more categories not found', 400)
    }
  }

  // Validate tags exist
  if (productData.tagIds && productData.tagIds.length > 0) {
    const tags = await Tag.find({ _id: { $in: productData.tagIds } })
    if (tags.length !== productData.tagIds.length) {
      throw new AppError('One or more tags not found', 400)
    }
  }

  const product = await Product.create(productData)

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  })
})

/**
 * @route   PATCH /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin/Shop Manager)
 */
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const updateData = req.body

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  // Validate categories exist
  if (updateData.categoryIds && updateData.categoryIds.length > 0) {
    const categories = await Category.find({ _id: { $in: updateData.categoryIds } })
    if (categories.length !== updateData.categoryIds.length) {
      throw new AppError('One or more categories not found', 400)
    }
  }

  // Validate tags exist
  if (updateData.tagIds && updateData.tagIds.length > 0) {
    const tags = await Tag.find({ _id: { $in: updateData.tagIds } })
    if (tags.length !== updateData.tagIds.length) {
      throw new AppError('One or more tags not found', 400)
    }
  }

  // Handle empty title - don't update if empty string (keep existing title)
  // Only require title if product is being published
  if (updateData.title !== undefined) {
    if (updateData.title === '' || (typeof updateData.title === 'string' && updateData.title.trim() === '')) {
      // Empty title - only allow if product is draft, otherwise require title
      if (updateData.status && updateData.status !== 'draft') {
        throw new AppError('Product title is required when publishing', 400)
      }
      // For draft products, don't update title if empty (keep existing)
      delete updateData.title
    } else if (updateData.status && updateData.status !== 'draft' && (!updateData.title || updateData.title.trim() === '')) {
      // Publishing without title
      throw new AppError('Product title is required when publishing', 400)
    }
  }

  Object.assign(product, updateData)
  await product.save()

  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/products/:id/attributes
 * @desc    Save only product attributes (like WooCommerce save_attributes)
 * @access  Private (Admin/Shop Manager)
 */
export const saveProductAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { attributes, type } = req.body

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  // Update attributes
  if (attributes !== undefined) {
    product.attributes = attributes.map((attr: any) => ({
      attributeId: attr.attributeId,
      name: attr.name,
      values: attr.values || [],
      usedForVariations: attr.usedForVariations || false,
      visibleOnProductPage: attr.visibleOnProductPage !== false,
      position: attr.position || 0,
    }))
  }

  // Also update product type if provided
  if (type !== undefined && (type === 'simple' || type === 'variable')) {
    product.type = type
  }

  await product.save()

  res.json({
    success: true,
    data: product,
    message: 'Attributes saved successfully',
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
