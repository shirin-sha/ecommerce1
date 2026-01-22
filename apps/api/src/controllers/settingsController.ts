import { Response } from 'express'
import { Settings } from '../models/Settings'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

/**
 * @route   GET /api/v1/settings
 * @desc    Get all settings
 * @access  Private (Admin)
 */
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  res.json({
    success: true,
    data: settings,
  })
})

/**
 * @route   PATCH /api/v1/settings/general
 * @desc    Update general settings
 * @access  Private (Admin)
 */
export const updateGeneralSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.general) {
    settings.general = { ...settings.general, ...req.body.general }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'General settings updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/products
 * @desc    Update products settings
 * @access  Private (Admin)
 */
export const updateProductSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.products) {
    settings.products = { ...settings.products, ...req.body.products }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Products settings updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/inventory
 * @desc    Update inventory settings
 * @access  Private (Admin)
 */
export const updateInventorySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.inventory) {
    settings.inventory = { ...settings.inventory, ...req.body.inventory }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Inventory settings updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/shipping
 * @desc    Update shipping settings
 * @access  Private (Admin)
 */
export const updateShippingSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.shipping) {
    settings.shipping = { ...settings.shipping, ...req.body.shipping }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Shipping settings updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/payments
 * @desc    Update payment settings
 * @access  Private (Admin)
 */
export const updatePaymentSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.payments) {
    settings.payments = { ...settings.payments, ...req.body.payments }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Payment settings updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/emails
 * @desc    Update email settings
 * @access  Private (Admin)
 */
export const updateEmailSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.emails) {
    settings.emails = { ...settings.emails, ...req.body.emails }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Email settings updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/site-visibility
 * @desc    Update site visibility
 * @access  Private (Admin)
 */
export const updateSiteVisibility = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.siteVisibility) {
    settings.siteVisibility = req.body.siteVisibility
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Site visibility updated successfully',
  })
})

/**
 * @route   PATCH /api/v1/settings/tracking
 * @desc    Update tracking settings
 * @access  Private (Admin)
 */
export const updateTrackingSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }

  if (req.body.tracking) {
    settings.tracking = { ...settings.tracking, ...req.body.tracking }
  }

  await settings.save()

  res.json({
    success: true,
    data: settings,
    message: 'Tracking settings updated successfully',
  })
})
