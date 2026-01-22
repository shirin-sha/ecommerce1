import { Response } from 'express'
import { Tag } from '../models/Tag'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/tags
 * @desc    List tags
 * @access  Public
 */
export const getTags = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search } = req.query

  const query: any = {}
  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  const tags = await Tag.find(query).sort({ name: 1 }).lean()

  res.json({
    success: true,
    data: tags,
  })
})

/**
 * @route   GET /api/v1/tags/:id
 * @desc    Get tag by ID
 * @access  Public
 */
export const getTag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const tag = await Tag.findById(id)
  if (!tag) {
    throw new AppError('Tag not found', 404)
  }

  res.json({
    success: true,
    data: tag,
  })
})

/**
 * @route   POST /api/v1/tags
 * @desc    Create tag
 * @access  Private (Admin/Shop Manager)
 */
export const createTag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tag = await Tag.create(req.body)

  res.status(201).json({
    success: true,
    data: tag,
    message: 'Tag created successfully',
  })
})

/**
 * @route   PATCH /api/v1/tags/:id
 * @desc    Update tag
 * @access  Private (Admin/Shop Manager)
 */
export const updateTag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const tag = await Tag.findById(id)
  if (!tag) {
    throw new AppError('Tag not found', 404)
  }

  Object.assign(tag, req.body)
  await tag.save()

  res.json({
    success: true,
    data: tag,
    message: 'Tag updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/tags/:id
 * @desc    Delete tag
 * @access  Private (Admin/Shop Manager)
 */
export const deleteTag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const tag = await Tag.findById(id)
  if (!tag) {
    throw new AppError('Tag not found', 404)
  }

  await Tag.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Tag deleted successfully',
  })
})
