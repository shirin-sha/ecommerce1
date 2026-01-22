import { Response } from 'express'
import { Category } from '../models/Category'
import { Product } from '../models/Product'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants'

/**
 * @route   GET /api/v1/categories
 * @desc    List categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { parentId, search } = req.query

  const query: any = {}
  if (parentId) {
    query.parentId = parentId
  } else if (parentId === null || parentId === 'null') {
    query.parentId = null
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 }).lean()

  res.json({
    success: true,
    data: categories,
  })
})

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
export const getCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const category = await Category.findById(id)
  if (!category) {
    throw new AppError('Category not found', 404)
  }

  res.json({
    success: true,
    data: category,
  })
})

/**
 * @route   POST /api/v1/categories
 * @desc    Create category
 * @access  Private (Admin/Shop Manager)
 */
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const categoryData = req.body

  // Validate parent exists if provided
  if (categoryData.parentId) {
    const parent = await Category.findById(categoryData.parentId)
    if (!parent) {
      throw new AppError('Parent category not found', 400)
    }
  }

  const category = await Category.create(categoryData)

  res.status(201).json({
    success: true,
    data: category,
    message: 'Category created successfully',
  })
})

/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin/Shop Manager)
 */
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const updateData = req.body

  const category = await Category.findById(id)
  if (!category) {
    throw new AppError('Category not found', 404)
  }

  // Prevent circular parent reference
  if (updateData.parentId && updateData.parentId === id) {
    throw new AppError('Category cannot be its own parent', 400)
  }

  // Validate parent exists if provided
  if (updateData.parentId) {
    const parent = await Category.findById(updateData.parentId)
    if (!parent) {
      throw new AppError('Parent category not found', 400)
    }
  }

  Object.assign(category, updateData)
  await category.save()

  res.json({
    success: true,
    data: category,
    message: 'Category updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Private (Admin/Shop Manager)
 */
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const category = await Category.findById(id)
  if (!category) {
    throw new AppError('Category not found', 404)
  }

  // Check if category has children
  const children = await Category.countDocuments({ parentId: id })
  if (children > 0) {
    throw new AppError('Cannot delete category with subcategories', 400)
  }

  // Check if category has products
  const products = await Product.countDocuments({ categoryIds: id })
  if (products > 0) {
    throw new AppError('Cannot delete category with products. Remove products first.', 400)
  }

  await Category.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Category deleted successfully',
  })
})
