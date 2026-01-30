import { Router } from 'express'
import * as productController from '../controllers/productController'
import * as variationController from '../controllers/variationController'
import * as uploadController from '../controllers/uploadController'
import { requireAuth, requireShopManager, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createProductSchema, updateProductSchema, saveAttributesSchema } from '@ecommerce/shared'
import { upload } from '../utils/upload'

const router = Router()

// Public routes (with optional auth to detect admin users)
router.get('/', optionalAuth, productController.getProducts)
router.get('/slug/:slug', optionalAuth, productController.getProductBySlug)
router.get('/:id', optionalAuth, productController.getProduct)

// Protected routes (Admin/Shop Manager)
router.post('/', requireAuth, requireShopManager, validate(createProductSchema), productController.createProduct)
router.patch('/:id', requireAuth, requireShopManager, validate(updateProductSchema), productController.updateProduct)
router.patch('/:id/attributes', requireAuth, requireShopManager, validate(saveAttributesSchema), productController.saveProductAttributes)
router.delete('/:id', requireAuth, requireShopManager, productController.deleteProduct)

// Upload routes
router.post('/upload-image', requireAuth, requireShopManager, upload.single('image'), uploadController.uploadProductImage)

// Variations routes
router.get('/:id/variations', variationController.getVariations)
router.post('/:id/variations/generate', requireAuth, requireShopManager, variationController.generateVariations)
router.post('/:id/variations', requireAuth, requireShopManager, variationController.createVariation)
router.patch('/:id/variations/:varId', requireAuth, requireShopManager, variationController.updateVariation)
router.delete('/:id/variations/:varId', requireAuth, requireShopManager, variationController.deleteVariation)

export default router
