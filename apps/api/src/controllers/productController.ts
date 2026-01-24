import { Response } from 'express'
import { Product } from '../models/Product'
import { Category } from '../models/Category'
import { Tag } from '../models/Tag'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

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

  // Status filter (default to published for public, all for admin)
  if (status) {
    query.status = status
  } else if (!req.user || req.user.role === 'customer') {
    query.status = 'published'
    query.visibility = { $in: ['visible', 'catalog', 'search'] }
  }

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

  Object.assign(product, updateData)
  await product.save()

  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully',
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
