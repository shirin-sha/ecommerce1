import { Router } from 'express'
import * as attributeController from '../controllers/attributeController'
import { requireAuth, requireShopManager } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createAttributeSchema,
  updateAttributeSchema,
  createAttributeTermSchema,
  updateAttributeTermSchema,
} from '@ecommerce/shared'

const router = Router()

// Public routes
router.get('/', attributeController.getAttributes)
router.get('/:id', attributeController.getAttribute)
router.get('/:id/terms', attributeController.getAttributeTerms)

// Protected routes (Admin/Shop Manager)
router.post('/', requireAuth, requireShopManager, validate(createAttributeSchema), attributeController.createAttribute)
router.patch(
  '/:id',
  requireAuth,
  requireShopManager,
  validate(updateAttributeSchema),
  attributeController.updateAttribute
)
router.delete('/:id', requireAuth, requireShopManager, attributeController.deleteAttribute)

// Attribute terms
router.post(
  '/:id/terms',
  requireAuth,
  requireShopManager,
  validate(createAttributeTermSchema),
  attributeController.createAttributeTerm
)
router.patch(
  '/:id/terms/:termId',
  requireAuth,
  requireShopManager,
  validate(updateAttributeTermSchema),
  attributeController.updateAttributeTerm
)
router.delete('/:id/terms/:termId', requireAuth, requireShopManager, attributeController.deleteAttributeTerm)

export default router
