import { Router } from 'express'
import * as customerController from '../controllers/customerController'
import { requireAuth, requireShopManager } from '../middleware/auth'

const router = Router()

// All routes require authentication and shop manager role
router.use(requireAuth)
router.use(requireShopManager)

router.get('/', customerController.getCustomers)
router.get('/:id', customerController.getCustomer)
router.patch('/:id', customerController.updateCustomer)

export default router
