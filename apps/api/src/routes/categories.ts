import { Router } from 'express'
import * as categoryController from '../controllers/categoryController'
import { requireAuth, requireShopManager } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createCategorySchema, updateCategorySchema } from '@ecommerce/shared'

const router = Router()

// Public routes
router.get('/', categoryController.getCategories)
router.get('/:id', categoryController.getCategory)

// Protected routes (Admin/Shop Manager)
router.post('/', requireAuth, requireShopManager, validate(createCategorySchema), categoryController.createCategory)
router.patch('/:id', requireAuth, requireShopManager, validate(updateCategorySchema), categoryController.updateCategory)
router.delete('/:id', requireAuth, requireShopManager, categoryController.deleteCategory)

export default router
