import { Router } from 'express'
import * as analyticsController from '../controllers/analyticsController'
import { requireAuth, requireShopManager } from '../middleware/auth'

const router = Router()

// All routes require shop manager authentication
router.use(requireAuth)
router.use(requireShopManager)

router.get('/overview', analyticsController.getOverview)
router.get('/products', analyticsController.getProductAnalytics)
router.get('/categories', analyticsController.getCategoryAnalytics)
router.get('/stock', analyticsController.getStockAnalytics)

export default router
