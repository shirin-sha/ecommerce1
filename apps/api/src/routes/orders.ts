import { Router } from 'express'
import * as orderController from '../controllers/orderController'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(requireAuth)

router.get('/', orderController.getOrders)
router.get('/:id', orderController.getOrder)
router.patch('/:id/status', requireAdmin, orderController.updateOrderStatus)
router.post('/:id/notes', requireAdmin, orderController.addOrderNote)
router.post('/:id/refund', requireAdmin, orderController.processRefund)

export default router
