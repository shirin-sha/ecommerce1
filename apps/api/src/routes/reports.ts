import { Router } from 'express'
import * as reportsController from '../controllers/reportsController'
import { requireAuth, requireShopManager } from '../middleware/auth'

const router = Router()

// All routes require shop manager authentication
router.use(requireAuth)
router.use(requireShopManager)

router.get('/orders', reportsController.getOrdersReport)
router.get('/customers', reportsController.getCustomersReport)
router.get('/stock', reportsController.getStockReport)

export default router
