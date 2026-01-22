import { Response } from 'express'
import { Attribute } from '../models/Attribute'
import { AttributeTerm } from '../models/AttributeTerm'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/attributes
 * @desc    List attributes
 * @access  Public
 */
export const getAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attributes = await Attribute.find().sort({ name: 1 }).lean()

  res.json({
    success: true,
    data: attributes,
  })
})

/**
 * @route   GET /api/v1/attributes/:id
 * @desc    Get attribute by ID
 * @access  Public
 */
export const getAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attribute = await Attribute.findById(id)
  if (!attribute) {
    throw new AppError('Attribute not found', 404)
  }

  res.json({
    success: true,
    data: attribute,
  })
})

/**
 * @route   POST /api/v1/attributes
 * @desc    Create attribute
 * @access  Private (Admin/Shop Manager)
 */
export const createAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attribute = await Attribute.create(req.body)

  res.status(201).json({
    success: true,
    data: attribute,
    message: 'Attribute created successfully',
  })
})

/**
 * @route   PATCH /api/v1/attributes/:id
 * @desc    Update attribute
 * @access  Private (Admin/Shop Manager)
 */
export const updateAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attribute = await Attribute.findById(id)
  if (!attribute) {
    throw new AppError('Attribute not found', 404)
  }

  Object.assign(attribute, req.body)
  await attribute.save()

  res.json({
    success: true,
    data: attribute,
    message: 'Attribute updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/attributes/:id
 * @desc    Delete attribute
 * @access  Private (Admin/Shop Manager)
 */
export const deleteAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attribute = await Attribute.findById(id)
  if (!attribute) {
    throw new AppError('Attribute not found', 404)
  }

  // Check if attribute has terms
  const terms = await AttributeTerm.countDocuments({ attributeId: id })
  if (terms > 0) {
    throw new AppError('Cannot delete attribute with terms. Delete terms first.', 400)
  }

  await Attribute.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Attribute deleted successfully',
  })
})

/**
 * @route   GET /api/v1/attributes/:id/terms
 * @desc    List attribute terms
 * @access  Public
 */
export const getAttributeTerms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attribute = await Attribute.findById(id)
  if (!attribute) {
    throw new AppError('Attribute not found', 404)
  }

  const terms = await AttributeTerm.find({ attributeId: id }).sort({ sortOrder: 1, name: 1 }).lean()

  res.json({
    success: true,
    data: terms,
  })
})

/**
 * @route   POST /api/v1/attributes/:id/terms
 * @desc    Create attribute term
 * @access  Private (Admin/Shop Manager)
 */
export const createAttributeTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attribute = await Attribute.findById(id)
  if (!attribute) {
    throw new AppError('Attribute not found', 404)
  }

  const term = await AttributeTerm.create({
    ...req.body,
    attributeId: id,
  })

  res.status(201).json({
    success: true,
    data: term,
    message: 'Attribute term created successfully',
  })
})

/**
 * @route   PATCH /api/v1/attributes/:id/terms/:termId
 * @desc    Update attribute term
 * @access  Private (Admin/Shop Manager)
 */
export const updateAttributeTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, termId } = req.params

  const term = await AttributeTerm.findOne({ _id: termId, attributeId: id })
  if (!term) {
    throw new AppError('Attribute term not found', 404)
  }

  Object.assign(term, req.body)
  await term.save()

  res.json({
    success: true,
    data: term,
    message: 'Attribute term updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/attributes/:id/terms/:termId
 * @desc    Delete attribute term
 * @access  Private (Admin/Shop Manager)
 */
export const deleteAttributeTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, termId } = req.params

  const term = await AttributeTerm.findOne({ _id: termId, attributeId: id })
  if (!term) {
    throw new AppError('Attribute term not found', 404)
  }

  await AttributeTerm.findByIdAndDelete(termId)

  res.json({
    success: true,
    message: 'Attribute term deleted successfully',
  })
})
