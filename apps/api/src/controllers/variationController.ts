import { Response } from 'express'
import { Product } from '../models/Product'
import { Variation } from '../models/Variation'
import { AttributeTerm } from '../models/AttributeTerm'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/products/:id/variations
 * @desc    List product variations
 * @access  Public
 */
export const getVariations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  if (product.type !== 'variable') {
    throw new AppError('Product is not a variable product', 400)
  }

  const variations = await Variation.find({ productId: id }).sort({ createdAt: -1 }).lean()

  res.json({
    success: true,
    data: variations,
  })
})

/**
 * @route   POST /api/v1/products/:id/variations/generate
 * @desc    Generate variations from product attributes
 * @access  Private (Admin/Shop Manager)
 */
export const generateVariations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  if (product.type !== 'variable') {
    throw new AppError('Product is not a variable product', 400)
  }

  // Get attributes used for variations
  const variationAttributes = product.attributes.filter((attr) => attr.usedForVariations)

  if (variationAttributes.length === 0) {
    throw new AppError('No attributes configured for variations', 400)
  }

  // Get all attribute terms
  const attributeIds = variationAttributes.map((attr) => attr.attributeId)
  const allTerms = await AttributeTerm.find({ attributeId: { $in: attributeIds } })

  // Group terms by attribute
  const termsByAttribute: Record<string, any[]> = {}
  for (const term of allTerms) {
    const attrId = term.attributeId.toString()
    if (!termsByAttribute[attrId]) {
      termsByAttribute[attrId] = []
    }
    termsByAttribute[attrId].push(term)
  }

  // Generate all combinations
  const combinations: Record<string, string>[] = []

  const generateCombinations = (current: Record<string, string>, remainingAttrs: any[], index: number) => {
    if (index === remainingAttrs.length) {
      combinations.push({ ...current })
      return
    }

    const attr = remainingAttrs[index]
    const attrId = attr.attributeId.toString()
    const terms = termsByAttribute[attrId] || []

    for (const term of terms) {
      current[attr.name] = term.name
      generateCombinations(current, remainingAttrs, index + 1)
    }
  }

  generateCombinations({}, variationAttributes, 0)

  // Delete existing variations
  await Variation.deleteMany({ productId: id })

  // Create new variations
  const variations = []
  for (const combination of combinations) {
    const variation = await Variation.create({
      productId: id,
      attributeSelections: combination,
      regularPrice: product.regularPrice,
      stockStatus: product.stockStatus,
      status: 'active',
    })
    variations.push(variation)
  }

  // Update product with variation IDs
  product.variationIds = variations.map((v) => v._id as any)
  await product.save()

  res.json({
    success: true,
    data: variations,
    message: `Generated ${variations.length} variations`,
  })
})

/**
 * @route   POST /api/v1/products/:id/variations
 * @desc    Create variation manually
 * @access  Private (Admin/Shop Manager)
 */
export const createVariation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const product = await Product.findById(id)
  if (!product) {
    throw new AppError('Product not found', 404)
  }

  if (product.type !== 'variable') {
    throw new AppError('Product is not a variable product', 400)
  }

  const variation = await Variation.create({
    ...req.body,
    productId: id,
  })

  // Add to product's variationIds
  product.variationIds.push(variation._id as any)
  await product.save()

  res.status(201).json({
    success: true,
    data: variation,
    message: 'Variation created successfully',
  })
})

/**
 * @route   PATCH /api/v1/products/:id/variations/:varId
 * @desc    Update variation
 * @access  Private (Admin/Shop Manager)
 */
export const updateVariation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, varId } = req.params

  const variation = await Variation.findOne({ _id: varId, productId: id })
  if (!variation) {
    throw new AppError('Variation not found', 404)
  }

  Object.assign(variation, req.body)
  await variation.save()

  res.json({
    success: true,
    data: variation,
    message: 'Variation updated successfully',
  })
})

/**
 * @route   DELETE /api/v1/products/:id/variations/:varId
 * @desc    Delete variation
 * @access  Private (Admin/Shop Manager)
 */
export const deleteVariation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, varId } = req.params

  const variation = await Variation.findOne({ _id: varId, productId: id })
  if (!variation) {
    throw new AppError('Variation not found', 404)
  }

  await Variation.findByIdAndDelete(varId)

  // Remove from product's variationIds
  const product = await Product.findById(id)
  if (product) {
    product.variationIds = product.variationIds.filter((vid) => vid.toString() !== varId)
    await product.save()
  }

  res.json({
    success: true,
    message: 'Variation deleted successfully',
  })
})
