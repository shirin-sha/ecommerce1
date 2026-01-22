import { Router } from 'express'
import * as tagController from '../controllers/tagController'
import { requireAuth, requireShopManager } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createTagSchema, updateTagSchema } from '@ecommerce/shared'

const router = Router()

// Public routes
router.get('/', tagController.getTags)
router.get('/:id', tagController.getTag)

// Protected routes (Admin/Shop Manager)
router.post('/', requireAuth, requireShopManager, validate(createTagSchema), tagController.createTag)
router.patch('/:id', requireAuth, requireShopManager, validate(updateTagSchema), tagController.updateTag)
router.delete('/:id', requireAuth, requireShopManager, tagController.deleteTag)

export default router
