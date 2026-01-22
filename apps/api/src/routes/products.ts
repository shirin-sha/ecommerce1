import { Router } from 'express'
import * as productController from '../controllers/productController'
import * as variationController from '../controllers/variationController'
import { requireAuth, requireShopManager } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createProductSchema, updateProductSchema } from '@ecommerce/shared'

const router = Router()

// Public routes
router.get('/', productController.getProducts)
router.get('/slug/:slug', productController.getProductBySlug)
router.get('/:id', productController.getProduct)

// Protected routes (Admin/Shop Manager)
router.post('/', requireAuth, requireShopManager, validate(createProductSchema), productController.createProduct)
router.patch('/:id', requireAuth, requireShopManager, validate(updateProductSchema), productController.updateProduct)
router.delete('/:id', requireAuth, requireShopManager, productController.deleteProduct)

// Variations routes
router.get('/:id/variations', variationController.getVariations)
router.post('/:id/variations/generate', requireAuth, requireShopManager, variationController.generateVariations)
router.post('/:id/variations', requireAuth, requireShopManager, variationController.createVariation)
router.patch('/:id/variations/:varId', requireAuth, requireShopManager, variationController.updateVariation)
router.delete('/:id/variations/:varId', requireAuth, requireShopManager, variationController.deleteVariation)

export default router
