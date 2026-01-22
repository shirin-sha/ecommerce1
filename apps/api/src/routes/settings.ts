import { Router } from 'express'
import * as settingsController from '../controllers/settingsController'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// All routes require admin authentication
router.use(requireAuth)
router.use(requireAdmin)

router.get('/', settingsController.getSettings)
router.patch('/general', settingsController.updateGeneralSettings)
router.patch('/products', settingsController.updateProductSettings)
router.patch('/inventory', settingsController.updateInventorySettings)
router.patch('/shipping', settingsController.updateShippingSettings)
router.patch('/payments', settingsController.updatePaymentSettings)
router.patch('/emails', settingsController.updateEmailSettings)
router.patch('/site-visibility', settingsController.updateSiteVisibility)
router.patch('/tracking', settingsController.updateTrackingSettings)

export default router
